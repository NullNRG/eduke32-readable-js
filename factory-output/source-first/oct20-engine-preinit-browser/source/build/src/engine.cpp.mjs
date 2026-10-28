// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/engine.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { __cxx_global_cell_9a5f899abe816221fc68b39b } from "./palette.cpp.mjs";
import { __cxx_global_cell_f73a7c611278ae39b7b9ad95 } from "./a-c.cpp.mjs";
import { sethlinesizes } from "./a-c.cpp.mjs";


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
const powf = (a,b) => Math.fround(Math.pow(Math.fround(a), Math.fround(b)));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_28f55fc8c17e2993 = i32(3754936);
function __cxx_static_address_a8dc71d80fe6140d5943e590() {
  return __cxx_static_address_a8dc71d80fe6140d5943e590.reference || (__cxx_static_address_a8dc71d80fe6140d5943e590.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_28f55fc8c17e2993; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_610322778390b388 = i32(1144);
function __cxx_static_address_7e07e24662565feb515d2c10() {
  return __cxx_static_address_7e07e24662565feb515d2c10.reference || (__cxx_static_address_7e07e24662565feb515d2c10.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_610322778390b388; },
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

// C/C++ source: source/build/include/vec.h:9
export function __cxx_record_vec2_2150e186aab2ebda() {
  return __cxx_record_vec2_2150e186aab2ebda.type || (__cxx_record_vec2_2150e186aab2ebda.type = class __cxx_record_vec2_2150e186aab2ebda__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), new.target.prototype);
  }
  __cxx_operator_1dacbd87a6392785(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((this.x - rhs.x)), "y": i32((this.y - rhs.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  }
  __cxx_operator_729d876abe4b118e(rhs) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32(Math.imul(this.x, rhs.x)), "y": i32(Math.imul(this.y, rhs.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  }
});
}

export function __cxx_record_vec2_8ca824f0ac397ec5() {
  return __cxx_record_vec2_8ca824f0ac397ec5.type || (__cxx_record_vec2_8ca824f0ac397ec5.type = class __cxx_record_vec2_8ca824f0ac397ec5__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}}, {"__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}), new.target.prototype);
  }
  __cxx_operator_1f4b549e7f7975f3(c) {
    return Boolean(Boolean(i32((i32((i32(this.x) != i32(c.x))) | i32((i32(this.y) != i32(c.y)))))));
  }
});
}

// C/C++ source: source/build/src/engine.cpp:65
export let mapversion = i32(7);
export function __cxx_global_cell_cb2e0a258fc01cfd6ce86a21() {
  return __cxx_global_cell_cb2e0a258fc01cfd6ce86a21.reference || (__cxx_global_cell_cb2e0a258fc01cfd6ce86a21.reference = {
    __cReference: true,
    get value() { return mapversion; },
    set value(__cxx_lvalue_0) { mapversion = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:66
export let g_loadedMapVersion = i32((-1));
export function __cxx_global_cell_55f4cd3ce9872cde496d8dad() {
  return __cxx_global_cell_55f4cd3ce9872cde496d8dad.reference || (__cxx_global_cell_55f4cd3ce9872cde496d8dad.reference = {
    __cReference: true,
    get value() { return g_loadedMapVersion; },
    set value(__cxx_lvalue_0) { g_loadedMapVersion = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:71
export function oldnonpow2() {
  return i32(((g_loadedMapVersion < 10) && (!Boolean(i32((i32((cPointerElementRef(picanm, globalpicnum).value).tileflags) & i32(2)))))));
}

// C/C++ source: source/build/src/engine.cpp:80
export let globalr = ((((255) & 255)) & 255);
export function __cxx_global_cell_a248700a49a9585168c4d6fc() {
  return __cxx_global_cell_a248700a49a9585168c4d6fc.reference || (__cxx_global_cell_a248700a49a9585168c4d6fc.reference = {
    __cReference: true,
    get value() { return globalr; },
    set value(__cxx_lvalue_0) { globalr = ((__cxx_lvalue_0) & 255); }
  });
}

export let globalg = ((((255) & 255)) & 255);
export function __cxx_global_cell_23f70e7a799326383b6cae79() {
  return __cxx_global_cell_23f70e7a799326383b6cae79.reference || (__cxx_global_cell_23f70e7a799326383b6cae79.reference = {
    __cReference: true,
    get value() { return globalg; },
    set value(__cxx_lvalue_0) { globalg = ((__cxx_lvalue_0) & 255); }
  });
}

export let globalb = ((((255) & 255)) & 255);
export function __cxx_global_cell_81af557897af1f573210de4b() {
  return __cxx_global_cell_81af557897af1f573210de4b.reference || (__cxx_global_cell_81af557897af1f573210de4b.reference = {
    __cReference: true,
    get value() { return globalb; },
    set value(__cxx_lvalue_0) { globalb = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/engine.cpp:82
export let pskybits_override = (((((((-1)) << 16) >> 16)) << 16) >> 16);
export function __cxx_global_cell_5581ff39ab20a6ef0f2dd3e2() {
  return __cxx_global_cell_5581ff39ab20a6ef0f2dd3e2.reference || (__cxx_global_cell_5581ff39ab20a6ef0f2dd3e2.reference = {
    __cReference: true,
    get value() { return pskybits_override; },
    set value(__cxx_lvalue_0) { pskybits_override = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:85
export let tiletovox = new Int16Array(30720);
function __cxx_static_address_48b8b2648cff50c4ad110c51() {
  return __cxx_static_address_48b8b2648cff50c4ad110c51.reference || (__cxx_static_address_48b8b2648cff50c4ad110c51.reference = {
    __cReference: true,
    get value() { return tiletovox; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:86
export let usevoxels = i32(1);
export function __cxx_global_cell_77d5c24237b7b046074e378d() {
  return __cxx_global_cell_77d5c24237b7b046074e378d.reference || (__cxx_global_cell_77d5c24237b7b046074e378d.reference = {
    __cReference: true,
    get value() { return usevoxels; },
    set value(__cxx_lvalue_0) { usevoxels = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:90
export let g_haveVoxels = 0;
export function __cxx_global_cell_01a46c84a0b94a486211f0c8() {
  return __cxx_global_cell_01a46c84a0b94a486211f0c8.reference || (__cxx_global_cell_01a46c84a0b94a486211f0c8.reference = {
    __cReference: true,
    get value() { return g_haveVoxels; },
    set value(__cxx_lvalue_0) { g_haveVoxels = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/engine.cpp:93
export let novoxmips = i32(0);
export function __cxx_global_cell_7e42dba8ea8f9a8bc3318fdc() {
  return __cxx_global_cell_7e42dba8ea8f9a8bc3318fdc.reference || (__cxx_global_cell_7e42dba8ea8f9a8bc3318fdc.reference = {
    __cReference: true,
    get value() { return novoxmips; },
    set value(__cxx_lvalue_0) { novoxmips = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:104
export let voxlock = Array.from({ length: 2048 }, () => new Uint8Array(5));
function __cxx_static_address_c6733b0abac829a1062464dd() {
  return __cxx_static_address_c6733b0abac829a1062464dd.reference || (__cxx_static_address_c6733b0abac829a1062464dd.reference = {
    __cReference: true,
    get value() { return voxlock; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:105
export let voxscale = new Int32Array(2048);
function __cxx_static_address_6876892af2158df82d12f01f() {
  return __cxx_static_address_6876892af2158df82d12f01f.reference || (__cxx_static_address_6876892af2158df82d12f01f.reference = {
    __cReference: true,
    get value() { return voxscale; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:106
export let voxflags = new Uint8Array(2048);
function __cxx_static_address_c97e83282c4d356cd9a7c013() {
  return __cxx_static_address_c97e83282c4d356cd9a7c013.reference || (__cxx_static_address_c97e83282c4d356cd9a7c013.reference = {
    __cReference: true,
    get value() { return voxflags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:108
export let ggxinc = new Int32Array(257);
function __cxx_static_address_1a60aa0089bdaa82abc35bed() {
  return __cxx_static_address_1a60aa0089bdaa82abc35bed.reference || (__cxx_static_address_1a60aa0089bdaa82abc35bed.reference = {
    __cReference: true,
    get value() { return ggxinc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ggyinc = new Int32Array(257);
function __cxx_static_address_e44b4895e186af1c5923dc7c() {
  return __cxx_static_address_e44b4895e186af1c5923dc7c.reference || (__cxx_static_address_e44b4895e186af1c5923dc7c.reference = {
    __cReference: true,
    get value() { return ggyinc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:109
export let lowrecip = new Int32Array(1024);
function __cxx_static_address_a97991e96b9c73923af30bf9() {
  return __cxx_static_address_a97991e96b9c73923af30bf9.reference || (__cxx_static_address_a97991e96b9c73923af30bf9.reference = {
    __cReference: true,
    get value() { return lowrecip; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nytooclose = 0;
function __cxx_static_address_dbad1a3d343407d618b0e9e7() {
  return __cxx_static_address_dbad1a3d343407d618b0e9e7.reference || (__cxx_static_address_dbad1a3d343407d618b0e9e7.reference = {
    __cReference: true,
    get value() { return nytooclose; },
    set value(__cxx_lvalue_0) { nytooclose = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:110
export const nytoofar = i32((BigInt((BigInt(u64(131072)) * BigInt(16384n))) - BigInt(u64(1048576))));
function __cxx_static_address_fa5fab3638d2f4ab4b7c6740() {
  return __cxx_static_address_fa5fab3638d2f4ab4b7c6740.reference || (__cxx_static_address_fa5fab3638d2f4ab4b7c6740.reference = {
    __cReference: true,
    get value() { return nytoofar; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:111
export let distrecip = null;
function __cxx_static_address_771ef78915fc71c7a152d1a5() {
  return __cxx_static_address_771ef78915fc71c7a152d1a5.reference || (__cxx_static_address_771ef78915fc71c7a152d1a5.reference = {
    __cReference: true,
    get value() { return distrecip; },
    set value(__cxx_lvalue_0) { distrecip = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:117
export let distrecipcache = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"age": {"native": "Int32Array", "offset": 12, "size": 4}, "distrecip": {"offset": 0, "pointer": true, "size": 8}, "xdimen": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [3], {}, []);
function __cxx_static_address_7bfde19b5439c1260da1f2a3() {
  return __cxx_static_address_7bfde19b5439c1260da1f2a3.reference || (__cxx_static_address_7bfde19b5439c1260da1f2a3.reference = {
    __cReference: true,
    get value() { return distrecipcache; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:118
export let distrecipagecnt = i32(0);
function __cxx_static_address_85eb43bf48d03040f4b54b36() {
  return __cxx_static_address_85eb43bf48d03040f4b54b36.reference || (__cxx_static_address_85eb43bf48d03040f4b54b36.reference = {
    __cReference: true,
    get value() { return distrecipagecnt; },
    set value(__cxx_lvalue_0) { distrecipagecnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:120
export let lookups = null;
function __cxx_static_address_faaa894d8f96459328af7d1c() {
  return __cxx_static_address_faaa894d8f96459328af7d1c.reference || (__cxx_static_address_faaa894d8f96459328af7d1c.reference = {
    __cReference: true,
    get value() { return lookups; },
    set value(__cxx_lvalue_0) { lookups = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:121
export let beforedrawrooms = i32(1);
function __cxx_static_address_d145d20dfddd2f283e2b1349() {
  return __cxx_static_address_d145d20dfddd2f283e2b1349.reference || (__cxx_static_address_d145d20dfddd2f283e2b1349.reference = {
    __cReference: true,
    get value() { return beforedrawrooms; },
    set value(__cxx_lvalue_0) { beforedrawrooms = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:123
export let benchmarkScreenshot = i32(0);
export function __cxx_global_cell_38f0f26c8a0f77e2834be49e() {
  return __cxx_global_cell_38f0f26c8a0f77e2834be49e.reference || (__cxx_global_cell_38f0f26c8a0f77e2834be49e.reference = {
    __cReference: true,
    get value() { return benchmarkScreenshot; },
    set value(__cxx_lvalue_0) { benchmarkScreenshot = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:125
export let oxdimen = i32((-1));
function __cxx_static_address_e173003857febd280b59233f() {
  return __cxx_static_address_e173003857febd280b59233f.reference || (__cxx_static_address_e173003857febd280b59233f.reference = {
    __cReference: true,
    get value() { return oxdimen; },
    set value(__cxx_lvalue_0) { oxdimen = i32(__cxx_lvalue_0); }
  });
}

export let oviewingrange = i32((-1));
function __cxx_static_address_2b8c40034bcea70c222db70e() {
  return __cxx_static_address_2b8c40034bcea70c222db70e.reference || (__cxx_static_address_2b8c40034bcea70c222db70e.reference = {
    __cReference: true,
    get value() { return oviewingrange; },
    set value(__cxx_lvalue_0) { oviewingrange = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:126
export let oxyaspect = i32((-1));
export function __cxx_global_cell_1b985dff60433db520d1c28e() {
  return __cxx_global_cell_1b985dff60433db520d1c28e.reference || (__cxx_global_cell_1b985dff60433db520d1c28e.reference = {
    __cReference: true,
    get value() { return oxyaspect; },
    set value(__cxx_lvalue_0) { oxyaspect = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:129
export let r_usenewaspect = i32(1);
export function __cxx_global_cell_1719e7bd91d790092d913225() {
  return __cxx_global_cell_1719e7bd91d790092d913225.reference || (__cxx_global_cell_1719e7bd91d790092d913225.reference = {
    __cReference: true,
    get value() { return r_usenewaspect; },
    set value(__cxx_lvalue_0) { r_usenewaspect = i32(__cxx_lvalue_0); }
  });
}

export let newaspect_enable = i32(0);
export function __cxx_global_cell_86f16538d5c8fb71ab0764a7() {
  return __cxx_global_cell_86f16538d5c8fb71ab0764a7.reference || (__cxx_global_cell_86f16538d5c8fb71ab0764a7.reference = {
    __cReference: true,
    get value() { return newaspect_enable; },
    set value(__cxx_lvalue_0) { newaspect_enable = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:130
export let r_screenxy = u32(0);
export function __cxx_global_cell_585083e70b316eace630e342() {
  return __cxx_global_cell_585083e70b316eace630e342.reference || (__cxx_global_cell_585083e70b316eace630e342.reference = {
    __cReference: true,
    get value() { return r_screenxy; },
    set value(__cxx_lvalue_0) { r_screenxy = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:132
export let r_rotatespriteinterp = i32(1);
export function __cxx_global_cell_839b6dd579d4126718a101c3() {
  return __cxx_global_cell_839b6dd579d4126718a101c3.reference || (__cxx_global_cell_839b6dd579d4126718a101c3.reference = {
    __cReference: true,
    get value() { return r_rotatespriteinterp; },
    set value(__cxx_lvalue_0) { r_rotatespriteinterp = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:133
export let r_fpgrouscan = i32(1);
export function __cxx_global_cell_d33e7d272649317fa29cc706() {
  return __cxx_global_cell_d33e7d272649317fa29cc706.reference || (__cxx_global_cell_d33e7d272649317fa29cc706.reference = {
    __cReference: true,
    get value() { return r_fpgrouscan; },
    set value(__cxx_lvalue_0) { r_fpgrouscan = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:134
export let r_displayindex = i32(0);
export function __cxx_global_cell_a69b3d47547d48eac82bcf95() {
  return __cxx_global_cell_a69b3d47547d48eac82bcf95.reference || (__cxx_global_cell_a69b3d47547d48eac82bcf95.reference = {
    __cReference: true,
    get value() { return r_displayindex; },
    set value(__cxx_lvalue_0) { r_displayindex = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:135
export let r_borderless = i32(2);
export function __cxx_global_cell_67da6fc124c3ab1d5da4a606() {
  return __cxx_global_cell_67da6fc124c3ab1d5da4a606.reference || (__cxx_global_cell_67da6fc124c3ab1d5da4a606.reference = {
    __cReference: true,
    get value() { return r_borderless; },
    set value(__cxx_lvalue_0) { r_borderless = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:136
export let r_windowpositioning = i32(1);
export function __cxx_global_cell_186a56702bd0331093afe212() {
  return __cxx_global_cell_186a56702bd0331093afe212.reference || (__cxx_global_cell_186a56702bd0331093afe212.reference = {
    __cReference: true,
    get value() { return r_windowpositioning; },
    set value(__cxx_lvalue_0) { r_windowpositioning = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:137
export let globalflags = 0;
export function __cxx_global_cell_687ad03e56ad49d91da7ede0() {
  return __cxx_global_cell_687ad03e56ad49d91da7ede0.reference || (__cxx_global_cell_687ad03e56ad49d91da7ede0.reference = {
    __cReference: true,
    get value() { return globalflags; },
    set value(__cxx_lvalue_0) { globalflags = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:139
export let g_videoGamma = Math.fround(Math.fround(1));
export function __cxx_global_cell_92f6ec0c3a993b574f308abb() {
  return __cxx_global_cell_92f6ec0c3a993b574f308abb.reference || (__cxx_global_cell_92f6ec0c3a993b574f308abb.reference = {
    __cReference: true,
    get value() { return g_videoGamma; },
    set value(__cxx_lvalue_0) { g_videoGamma = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:140
export let g_videoContrast = Math.fround(Math.fround(1));
export function __cxx_global_cell_eb7ec64efb5dec6e758a65c7() {
  return __cxx_global_cell_eb7ec64efb5dec6e758a65c7.reference || (__cxx_global_cell_eb7ec64efb5dec6e758a65c7.reference = {
    __cReference: true,
    get value() { return g_videoContrast; },
    set value(__cxx_lvalue_0) { g_videoContrast = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:141
export let g_videoSaturation = Math.fround(Math.fround(1));
export function __cxx_global_cell_a6f1e8c839618189cf2ebd7a() {
  return __cxx_global_cell_a6f1e8c839618189cf2ebd7a.reference || (__cxx_global_cell_a6f1e8c839618189cf2ebd7a.reference = {
    __cReference: true,
    get value() { return g_videoSaturation; },
    set value(__cxx_lvalue_0) { g_videoSaturation = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:144
export let globalpolytype = 0;
function __cxx_static_address_b440f0668e6471433fea5140() {
  return __cxx_static_address_b440f0668e6471433fea5140.reference || (__cxx_static_address_b440f0668e6471433fea5140.reference = {
    __cReference: true,
    get value() { return globalpolytype; },
    set value(__cxx_lvalue_0) { globalpolytype = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/engine.cpp:145
export let dotp1 = null;
function __cxx_static_address_c45848d776e78e3ad15aa19e() {
  return __cxx_static_address_c45848d776e78e3ad15aa19e.reference || (__cxx_static_address_c45848d776e78e3ad15aa19e.reference = {
    __cReference: true,
    get value() { return dotp1; },
    set value(__cxx_lvalue_0) { dotp1 = __cxx_lvalue_0; }
  });
}

export let dotp2 = null;
function __cxx_static_address_f680dc34f3f16b7605bd2076() {
  return __cxx_static_address_f680dc34f3f16b7605bd2076.reference || (__cxx_static_address_f680dc34f3f16b7605bd2076.reference = {
    __cReference: true,
    get value() { return dotp2; },
    set value(__cxx_lvalue_0) { dotp2 = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:147
export let tempbuf = new Int8Array(16384);
function __cxx_static_address_ed12f328f5ec16a2a0117bdd() {
  return __cxx_static_address_ed12f328f5ec16a2a0117bdd.reference || (__cxx_static_address_ed12f328f5ec16a2a0117bdd.reference = {
    __cReference: true,
    get value() { return tempbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:153
export let ebpbak = 0;
export function __cxx_global_cell_25026ffa5b07a8851193a64a() {
  return __cxx_global_cell_25026ffa5b07a8851193a64a.reference || (__cxx_global_cell_25026ffa5b07a8851193a64a.reference = {
    __cReference: true,
    get value() { return ebpbak; },
    set value(__cxx_lvalue_0) { ebpbak = i32(__cxx_lvalue_0); }
  });
}

export let espbak = 0;
export function __cxx_global_cell_3ec01ada27550b8525913d32() {
  return __cxx_global_cell_3ec01ada27550b8525913d32.reference || (__cxx_global_cell_3ec01ada27550b8525913d32.reference = {
    __cReference: true,
    get value() { return espbak; },
    set value(__cxx_lvalue_0) { espbak = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:154
export let reciptable = new Int32Array(2048);
function __cxx_static_address_0ec43ab5d952dbdf2efccab4() {
  return __cxx_static_address_0ec43ab5d952dbdf2efccab4.reference || (__cxx_static_address_0ec43ab5d952dbdf2efccab4.reference = {
    __cReference: true,
    get value() { return reciptable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let fpuasm = 0;
export function __cxx_global_cell_b9787af6aae3563f7d4f5bd3() {
  return __cxx_global_cell_b9787af6aae3563f7d4f5bd3.reference || (__cxx_global_cell_b9787af6aae3563f7d4f5bd3.reference = {
    __cReference: true,
    get value() { return fpuasm; },
    set value(__cxx_lvalue_0) { fpuasm = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:155
export let asm1 = 0n;
export function __cxx_global_cell_82092c85dd1ef591b7bfad4d() {
  return __cxx_global_cell_82092c85dd1ef591b7bfad4d.reference || (__cxx_global_cell_82092c85dd1ef591b7bfad4d.reference = {
    __cReference: true,
    get value() { return asm1; },
    set value(__cxx_lvalue_0) { asm1 = i64(__cxx_lvalue_0); }
  });
}

export let asm2 = 0n;
export function __cxx_global_cell_895032355ce4415fcae21c5a() {
  return __cxx_global_cell_895032355ce4415fcae21c5a.reference || (__cxx_global_cell_895032355ce4415fcae21c5a.reference = {
    __cReference: true,
    get value() { return asm2; },
    set value(__cxx_lvalue_0) { asm2 = i64(__cxx_lvalue_0); }
  });
}

export let asm3 = 0n;
export function __cxx_global_cell_18730c9a0e44ac303abc65ca() {
  return __cxx_global_cell_18730c9a0e44ac303abc65ca.reference || (__cxx_global_cell_18730c9a0e44ac303abc65ca.reference = {
    __cReference: true,
    get value() { return asm3; },
    set value(__cxx_lvalue_0) { asm3 = i64(__cxx_lvalue_0); }
  });
}

export let asm4 = 0n;
export function __cxx_global_cell_0344b4b1b7e3fa404649dc96() {
  return __cxx_global_cell_0344b4b1b7e3fa404649dc96.reference || (__cxx_global_cell_0344b4b1b7e3fa404649dc96.reference = {
    __cReference: true,
    get value() { return asm4; },
    set value(__cxx_lvalue_0) { asm4 = i64(__cxx_lvalue_0); }
  });
}

export let palookupoffse = new BigInt64Array(4);
function __cxx_static_address_25cd94df3f77100fd3b6a84b() {
  return __cxx_static_address_25cd94df3f77100fd3b6a84b.reference || (__cxx_static_address_25cd94df3f77100fd3b6a84b.reference = {
    __cReference: true,
    get value() { return palookupoffse; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:156
export let vplce = new Uint32Array(4);
function __cxx_static_address_7c3aeae1f42613fbf900a054() {
  return __cxx_static_address_7c3aeae1f42613fbf900a054.reference || (__cxx_static_address_7c3aeae1f42613fbf900a054.reference = {
    __cReference: true,
    get value() { return vplce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:157
export let vince = new Int32Array(4);
function __cxx_static_address_539c049e78a459cb3f7a3a99() {
  return __cxx_static_address_539c049e78a459cb3f7a3a99.reference || (__cxx_static_address_539c049e78a459cb3f7a3a99.reference = {
    __cReference: true,
    get value() { return vince; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:158
export let bufplce = new BigInt64Array(4);
function __cxx_static_address_0487fd7703c1b557a49acd7c() {
  return __cxx_static_address_0487fd7703c1b557a49acd7c.reference || (__cxx_static_address_0487fd7703c1b557a49acd7c.reference = {
    __cReference: true,
    get value() { return bufplce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:159
export let globaltilesizy = 0;
export function __cxx_global_cell_0dfc66b4b4d22501236ea95d() {
  return __cxx_global_cell_0dfc66b4b4d22501236ea95d.reference || (__cxx_global_cell_0dfc66b4b4d22501236ea95d.reference = {
    __cReference: true,
    get value() { return globaltilesizy; },
    set value(__cxx_lvalue_0) { globaltilesizy = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:160
export let globalx1 = 0;
export function __cxx_global_cell_b77149ba49860aa16abd90a9() {
  return __cxx_global_cell_b77149ba49860aa16abd90a9.reference || (__cxx_global_cell_b77149ba49860aa16abd90a9.reference = {
    __cReference: true,
    get value() { return globalx1; },
    set value(__cxx_lvalue_0) { globalx1 = i32(__cxx_lvalue_0); }
  });
}

export let globaly2 = 0;
export function __cxx_global_cell_b5d36e09cbdb238b45ee0604() {
  return __cxx_global_cell_b5d36e09cbdb238b45ee0604.reference || (__cxx_global_cell_b5d36e09cbdb238b45ee0604.reference = {
    __cReference: true,
    get value() { return globaly2; },
    set value(__cxx_lvalue_0) { globaly2 = i32(__cxx_lvalue_0); }
  });
}

export let globalx3 = 0;
export function __cxx_global_cell_17e326d906bfd20495e4467e() {
  return __cxx_global_cell_17e326d906bfd20495e4467e.reference || (__cxx_global_cell_17e326d906bfd20495e4467e.reference = {
    __cReference: true,
    get value() { return globalx3; },
    set value(__cxx_lvalue_0) { globalx3 = i32(__cxx_lvalue_0); }
  });
}

export let globaly3 = 0;
export function __cxx_global_cell_b7e0057dd4e0a0e8decb5847() {
  return __cxx_global_cell_b7e0057dd4e0a0e8decb5847.reference || (__cxx_global_cell_b7e0057dd4e0a0e8decb5847.reference = {
    __cReference: true,
    get value() { return globaly3; },
    set value(__cxx_lvalue_0) { globaly3 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:165
export let sloptable = new Int32Array(32768);
function __cxx_static_address_7f3f1b9bd65224fe5caae170() {
  return __cxx_static_address_7f3f1b9bd65224fe5caae170.reference || (__cxx_static_address_7f3f1b9bd65224fe5caae170.reference = {
    __cReference: true,
    get value() { return sloptable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:167
export let slopalookup = new BigInt64Array(16384);
function __cxx_static_address_d1743bdc820efd27b6986917() {
  return __cxx_static_address_d1743bdc820efd27b6986917.reference || (__cxx_static_address_d1743bdc820efd27b6986917.reference = {
    __cReference: true,
    get value() { return slopalookup; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:169
export let no_radarang2 = i32(0);
function __cxx_static_address_1d913d82db9b7837e1cf9241() {
  return __cxx_static_address_1d913d82db9b7837e1cf9241.reference || (__cxx_static_address_1d913d82db9b7837e1cf9241.reference = {
    __cReference: true,
    get value() { return no_radarang2; },
    set value(__cxx_lvalue_0) { no_radarang2 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:170
export let radarang = new Int16Array(1280);
function __cxx_static_address_e88929426cec0931cc919f9b() {
  return __cxx_static_address_e88929426cec0931cc919f9b.reference || (__cxx_static_address_e88929426cec0931cc919f9b.reference = {
    __cReference: true,
    get value() { return radarang; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:171
export let qradarang = new Int32Array(10240);
function __cxx_static_address_a9ceb7efa2316dcfdf6d9a99() {
  return __cxx_static_address_a9ceb7efa2316dcfdf6d9a99.reference || (__cxx_static_address_a9ceb7efa2316dcfdf6d9a99.reference = {
    __cReference: true,
    get value() { return qradarang; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let radarang2 = null;
function __cxx_static_address_79c096bc46ac26f0340ef029() {
  return __cxx_static_address_79c096bc46ac26f0340ef029.reference || (__cxx_static_address_79c096bc46ac26f0340ef029.reference = {
    __cReference: true,
    get value() { return radarang2; },
    set value(__cxx_lvalue_0) { radarang2 = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:172
export const pow2char_ = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_5ffdc3867c2e73b1b37968b5() {
  return __cxx_static_address_5ffdc3867c2e73b1b37968b5.reference || (__cxx_static_address_5ffdc3867c2e73b1b37968b5.reference = {
    __cReference: true,
    get value() { return pow2char_; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:174
export let sqrtable = new Uint16Array(4096);
function __cxx_static_address_ca883e45cca4e5a5d1a8c002() {
  return __cxx_static_address_ca883e45cca4e5a5d1a8c002.reference || (__cxx_static_address_ca883e45cca4e5a5d1a8c002.reference = {
    __cReference: true,
    get value() { return sqrtable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let shlookup = new Uint16Array(4352);
function __cxx_static_address_4c2f4a049931d7e85ed7415c() {
  return __cxx_static_address_4c2f4a049931d7e85ed7415c.reference || (__cxx_static_address_4c2f4a049931d7e85ed7415c.reference = {
    __cReference: true,
    get value() { return shlookup; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let sqrtable_old = new Uint16Array(2048);
function __cxx_static_address_e7bec4799189fe9d0325e249() {
  return __cxx_static_address_e7bec4799189fe9d0325e249.reference || (__cxx_static_address_e7bec4799189fe9d0325e249.reference = {
    __cReference: true,
    get value() { return sqrtable_old; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:176
export let britable = Array.from({ length: 16 }, () => new Uint8Array(256));
function __cxx_static_address_7d402f8927eb74d92a1f393e() {
  return __cxx_static_address_7d402f8927eb74d92a1f393e.reference || (__cxx_static_address_7d402f8927eb74d92a1f393e.reference = {
    __cReference: true,
    get value() { return britable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:180
export let kensmessage = new Uint8Array(128);
function __cxx_static_address_a0cf17e5040f768fecaa0eed() {
  return __cxx_static_address_a0cf17e5040f768fecaa0eed.reference || (__cxx_static_address_a0cf17e5040f768fecaa0eed.reference = {
    __cReference: true,
    get value() { return kensmessage; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:181
export let engineerrstr = Uint8Array.from([78, 111, 32, 101, 114, 114, 111, 114, 0]);
export function __cxx_global_cell_e51112961ed1d98dff606e68() {
  return __cxx_global_cell_e51112961ed1d98dff606e68.reference || (__cxx_global_cell_e51112961ed1d98dff606e68.reference = {
    __cReference: true,
    get value() { return engineerrstr; },
    set value(__cxx_lvalue_0) { engineerrstr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:183
export let showfirstwall = i32(0);
export function __cxx_global_cell_1c9437d4fabcfa69169d72c3() {
  return __cxx_global_cell_1c9437d4fabcfa69169d72c3.reference || (__cxx_global_cell_1c9437d4fabcfa69169d72c3.reference = {
    __cReference: true,
    get value() { return showfirstwall; },
    set value(__cxx_lvalue_0) { showfirstwall = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:184
export let showheightindicators = i32(1);
export function __cxx_global_cell_3be22aa3dcdac8b3e93cd3d9() {
  return __cxx_global_cell_3be22aa3dcdac8b3e93cd3d9.reference || (__cxx_global_cell_3be22aa3dcdac8b3e93cd3d9.reference = {
    __cReference: true,
    get value() { return showheightindicators; },
    set value(__cxx_lvalue_0) { showheightindicators = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:185
export let circlewall = i32((-1));
export function __cxx_global_cell_dbd314a0c8319a7b84603c9b() {
  return __cxx_global_cell_dbd314a0c8319a7b84603c9b.reference || (__cxx_global_cell_dbd314a0c8319a7b84603c9b.reference = {
    __cReference: true,
    get value() { return circlewall; },
    set value(__cxx_lvalue_0) { circlewall = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:191
export let editstatus = ((((((0) << 16) >> 16)) << 16) >> 16);
export function __cxx_global_cell_3361b43cd89bac1a415bdcb9() {
  return __cxx_global_cell_3361b43cd89bac1a415bdcb9.reference || (__cxx_global_cell_3361b43cd89bac1a415bdcb9.reference = {
    __cReference: true,
    get value() { return editstatus; },
    set value(__cxx_lvalue_0) { editstatus = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:192
export let global100horiz = 0;
function __cxx_static_address_8089555d741cac8580da0a1e() {
  return __cxx_static_address_8089555d741cac8580da0a1e.reference || (__cxx_static_address_8089555d741cac8580da0a1e.reference = {
    __cReference: true,
    get value() { return global100horiz; },
    set value(__cxx_lvalue_0) { global100horiz = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:195
export let enginecompatibilitymode = i32(2147483647);
export function __cxx_global_cell_bb20f7f3674f33a33d515ebc() {
  return __cxx_global_cell_bb20f7f3674f33a33d515ebc.reference || (__cxx_global_cell_bb20f7f3674f33a33d515ebc.reference = {
    __cReference: true,
    get value() { return enginecompatibilitymode; },
    set value(__cxx_lvalue_0) { enginecompatibilitymode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:281
export let globalht = null;
function __cxx_static_address_3cd677b99cb94a25f3d9ed02() {
  return __cxx_static_address_3cd677b99cb94a25f3d9ed02.reference || (__cxx_static_address_3cd677b99cb94a25f3d9ed02.reference = {
    __cReference: true,
    get value() { return globalht; },
    set value(__cxx_lvalue_0) { globalht = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:283
export let reachablesectors = null;
function __cxx_static_address_896db579dcea810a995205f6() {
  return __cxx_static_address_896db579dcea810a995205f6.reference || (__cxx_static_address_896db579dcea810a995205f6.reference = {
    __cReference: true,
    get value() { return reachablesectors; },
    set value(__cxx_lvalue_0) { reachablesectors = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:284
export let wallsect = new Int16Array(16384);
function __cxx_static_address_d64c6d80cff7d653f1895e25() {
  return __cxx_static_address_d64c6d80cff7d653f1895e25.reference || (__cxx_static_address_d64c6d80cff7d653f1895e25.reference = {
    __cReference: true,
    get value() { return wallsect; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:286
export function initcrc16() {
  let i;
  let j;
  let k;
  let a;
  for ((j = i32(0)); (j < 256); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    for ((((i = i32(7)), (k = i32((j << 8)))), (a = i32(0))); (i >= 0); (((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; })), (k = i32((i32((k << 1)) & 65535))))) {
      if (Boolean(i32((i32((k ^ a)) & 32768)))) {
        (a = i32((i32((i32((a << 1)) & 65535)) ^ 4129)));
      } else {
        (a = i32((i32((a << 1)) & 65535)));
      }
    }
    ((cDeref(cPointerOffset(crctab16, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((a & 65535)));
  }
}

// C/C++ source: source/build/src/engine.cpp:333
export let numgraysects = i32(0);
export function __cxx_global_cell_ff2772a0123ef46ba7fdaf5b() {
  return __cxx_global_cell_ff2772a0123ef46ba7fdaf5b.reference || (__cxx_global_cell_ff2772a0123ef46ba7fdaf5b.reference = {
    __cReference: true,
    get value() { return numgraysects; },
    set value(__cxx_lvalue_0) { numgraysects = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:334
export let graysectbitmap = new Uint8Array(512);
function __cxx_static_address_2bac4785b7206a30ed80679b() {
  return __cxx_static_address_2bac4785b7206a30ed80679b.reference || (__cxx_static_address_2bac4785b7206a30ed80679b.reference = {
    __cReference: true,
    get value() { return graysectbitmap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:335
export let graywallbitmap = new Uint8Array(2048);
function __cxx_static_address_6ebb10f87db6e46d7c837830() {
  return __cxx_static_address_6ebb10f87db6e46d7c837830.reference || (__cxx_static_address_6ebb10f87db6e46d7c837830.reference = {
    __cReference: true,
    get value() { return graywallbitmap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:336
export let autogray = i32(0);
export function __cxx_global_cell_79ae1e2577864c4c74a4536f() {
  return __cxx_global_cell_79ae1e2577864c4c74a4536f.reference || (__cxx_global_cell_79ae1e2577864c4c74a4536f.reference = {
    __cReference: true,
    get value() { return autogray; },
    set value(__cxx_lvalue_0) { autogray = i32(__cxx_lvalue_0); }
  });
}

export let showinnergray = i32(1);
export function __cxx_global_cell_513040affb50dad26a7507e7() {
  return __cxx_global_cell_513040affb50dad26a7507e7.reference || (__cxx_global_cell_513040affb50dad26a7507e7.reference = {
    __cReference: true,
    get value() { return showinnergray; },
    set value(__cxx_lvalue_0) { showinnergray = i32(__cxx_lvalue_0); }
  });
}

export let showgraysectors = i32(1);
export function __cxx_global_cell_c150b54ee1b7c3eac4b7f1ab() {
  return __cxx_global_cell_c150b54ee1b7c3eac4b7f1ab.reference || (__cxx_global_cell_c150b54ee1b7c3eac4b7f1ab.reference = {
    __cReference: true,
    get value() { return showgraysectors; },
    set value(__cxx_lvalue_0) { showgraysectors = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:348
export function get_alwaysshowgray() {
  return i32((Boolean(showinnergray) || (!(((cDeref(cPointerOffset(editorzrange, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == i32(((-2147483647) - 1))) && ((cDeref(cPointerOffset(editorzrange, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == 2147483647)))));
}

// C/C++ source: source/build/src/engine.cpp:353
export function get_skipgraysectors() {
  return i32(((Boolean(numgraysects) && (!Boolean(showgraysectors))) && (!(((cDeref(cPointerOffset(editorzrange, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == i32(((-2147483647) - 1))) && ((cDeref(cPointerOffset(editorzrange, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == 2147483647)))));
}

// C/C++ source: source/build/src/engine.cpp:358
export function yax_updategrays(posze) {
  let i;
  let j;
  let mingoodz = i32(2147483647);
  const __cxx_lvalue_0 = cRef(() => mingoodz, __cxx_lvalue_4 => { mingoodz = i32(__cxx_lvalue_4); });
  let maxgoodz = i32(((-2147483647) - 1));
  const __cxx_lvalue_1 = cRef(() => maxgoodz, __cxx_lvalue_5 => { maxgoodz = i32(__cxx_lvalue_5); });
  cByteMemory.memset(graysectbitmap, 0, 512);
  cByteMemory.memset(graywallbitmap, 0, 2048);
  for ((i = i32(0)); (i < i32(numsectors)); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    let keep = i32(true);
    let cb;
    const __cxx_lvalue_2 = cRef(() => cb, __cxx_lvalue_8 => { cb = (((__cxx_lvalue_8) << 16) >> 16); });
    let fb;
    const __cxx_lvalue_3 = cRef(() => fb, __cxx_lvalue_9 => { fb = (((__cxx_lvalue_9) << 16) >> 16); });
    yax_getbunches__header_dab3f1f07637((((i) << 16) >> 16), __cxx_lvalue_2, __cxx_lvalue_3);
    (keep = i32((((i32(cb) < 0) || ((cPointerElementRef(sector, i).value).ceilingz < posze)) && ((i32(fb) < 0) || (posze <= (cPointerElementRef(sector, i).value).floorz)))));
    if (((Boolean(autogray) && ((i32(cb) >= 0) || (i32(fb) >= 0))) && (((cPointerElementRef(sector, i).value).ceilingz <= posze) && (posze <= (cPointerElementRef(sector, i).value).floorz)))) {
      (mingoodz = i32((min__template_774131ccff66371d(__cxx_lvalue_0, cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingz"))).value));
      (maxgoodz = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_1, cObjectFieldRef((cPointerElementRef(sector, i).value), "floorz"))).value));
    }
    (keep = i32((keep & i32((((cPointerElementRef(sector, i).value).ceilingz >= (cDeref(cPointerOffset(editorzrange, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) && ((cPointerElementRef(sector, i).value).floorz <= (cDeref(cPointerOffset(editorzrange, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))));
    if ((!Boolean(keep))) {
      bitmap_set__header_3ddae889b678(graysectbitmap, i);
    }
  }
  if ((Boolean(autogray) && (mingoodz <= maxgoodz))) {
    for ((i = i32(0)); (i < i32(numsectors)); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
      if ((!((mingoodz <= (cPointerElementRef(sector, i).value).ceilingz) && ((cPointerElementRef(sector, i).value).floorz <= maxgoodz)))) {
        bitmap_set__header_3ddae889b678(graysectbitmap, i);
      }
    }
  }
  (numgraysects = i32(0));
  for ((i = i32(0)); (i < i32(numsectors)); ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => i, __cxx_lvalue_13 => { i = __cxx_lvalue_13; }))) {
    if (bitmap_test__header_955f0b2ebc45(graysectbitmap, i)) {
      ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(__cxx_global_cell_ff2772a0123ef46ba7fdaf5b());
      for ((j = i32((cPointerElementRef(sector, i).value).wallptr)); (j < i32((i32((cPointerElementRef(sector, i).value).wallptr) + i32((cPointerElementRef(sector, i).value).wallnum)))); ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = i32((previous + 1)); __cxx_lvalue_15.value = next; return previous; })(cRef(() => j, __cxx_lvalue_16 => { j = __cxx_lvalue_16; }))) {
        bitmap_set__header_3ddae889b678(graywallbitmap, j);
      }
    }
  }
}

// C/C++ source: source/build/src/engine.cpp:423
export let g_nodraw = i32(0);
export function __cxx_global_cell_bca995f44e11705f1e25a500() {
  return __cxx_global_cell_bca995f44e11705f1e25a500.reference || (__cxx_global_cell_bca995f44e11705f1e25a500.reference = {
    __cReference: true,
    get value() { return g_nodraw; },
    set value(__cxx_lvalue_0) { g_nodraw = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:424
export let scansector_retfast = i32(0);
export function __cxx_global_cell_99da9ae092f975be5c931076() {
  return __cxx_global_cell_99da9ae092f975be5c931076.reference || (__cxx_global_cell_99da9ae092f975be5c931076.reference = {
    __cReference: true,
    get value() { return scansector_retfast; },
    set value(__cxx_lvalue_0) { scansector_retfast = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:425
export let scansector_collectsprites = i32(1);
export function __cxx_global_cell_97f50e0ecee5a63408160028() {
  return __cxx_global_cell_97f50e0ecee5a63408160028.reference || (__cxx_global_cell_97f50e0ecee5a63408160028.reference = {
    __cReference: true,
    get value() { return scansector_collectsprites; },
    set value(__cxx_lvalue_0) { scansector_collectsprites = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:426
export let yax_globalcf = i32((-1));
export function __cxx_global_cell_8c24f6cd9de093fd196d5dd7() {
  return __cxx_global_cell_8c24f6cd9de093fd196d5dd7.reference || (__cxx_global_cell_8c24f6cd9de093fd196d5dd7.reference = {
    __cReference: true,
    get value() { return yax_globalcf; },
    set value(__cxx_lvalue_0) { yax_globalcf = i32(__cxx_lvalue_0); }
  });
}

export let yax_nomaskpass = i32(0);
export function __cxx_global_cell_b967223302fe3c34e2a71860() {
  return __cxx_global_cell_b967223302fe3c34e2a71860.reference || (__cxx_global_cell_b967223302fe3c34e2a71860.reference = {
    __cReference: true,
    get value() { return yax_nomaskpass; },
    set value(__cxx_lvalue_0) { yax_nomaskpass = i32(__cxx_lvalue_0); }
  });
}

export let yax_nomaskdidit = 0;
export function __cxx_global_cell_0b65540d4ae56d317d478f3e() {
  return __cxx_global_cell_0b65540d4ae56d317d478f3e.reference || (__cxx_global_cell_0b65540d4ae56d317d478f3e.reference = {
    __cReference: true,
    get value() { return yax_nomaskdidit; },
    set value(__cxx_lvalue_0) { yax_nomaskdidit = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:427
export let r_tror_nomaskpass = i32(1);
export function __cxx_global_cell_8afc3f1714c50fd848123c08() {
  return __cxx_global_cell_8afc3f1714c50fd848123c08.reference || (__cxx_global_cell_8afc3f1714c50fd848123c08.reference = {
    __cReference: true,
    get value() { return r_tror_nomaskpass; },
    set value(__cxx_lvalue_0) { r_tror_nomaskpass = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:428
export let yax_globallev = i32(8);
export function __cxx_global_cell_037058065a0bd0356792c8e6() {
  return __cxx_global_cell_037058065a0bd0356792c8e6.reference || (__cxx_global_cell_037058065a0bd0356792c8e6.reference = {
    __cReference: true,
    get value() { return yax_globallev; },
    set value(__cxx_lvalue_0) { yax_globallev = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:429
export let yax_globalbunch = i32((-1));
export function __cxx_global_cell_3cf81ba309123d77364eacb4() {
  return __cxx_global_cell_3cf81ba309123d77364eacb4.reference || (__cxx_global_cell_3cf81ba309123d77364eacb4.reference = {
    __cReference: true,
    get value() { return yax_globalbunch; },
    set value(__cxx_lvalue_0) { yax_globalbunch = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:430
export let yax_polymostclearzbuffer = i32(1);
export function __cxx_global_cell_db65dbb9c23304a26e8153c7() {
  return __cxx_global_cell_db65dbb9c23304a26e8153c7.reference || (__cxx_global_cell_db65dbb9c23304a26e8153c7.reference = {
    __cReference: true,
    get value() { return yax_polymostclearzbuffer; },
    set value(__cxx_lvalue_0) { yax_polymostclearzbuffer = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:437
export let yax_spritesortcnt = new Int16Array(17);
function __cxx_static_address_869e607d726731e928787277() {
  return __cxx_static_address_869e607d726731e928787277.reference || (__cxx_static_address_869e607d726731e928787277.reference = {
    __cReference: true,
    get value() { return yax_spritesortcnt; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:438
export let yax_tsprite = Array.from({ length: 17 }, () => new Uint16Array(4096));
function __cxx_static_address_1fdde1859899a75bdce05d96() {
  return __cxx_static_address_1fdde1859899a75bdce05d96.reference || (__cxx_static_address_1fdde1859899a75bdce05d96.reference = {
    __cReference: true,
    get value() { return yax_tsprite; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:439
export let yax_tsprfrombunch = Array.from({ length: 17 }, () => new Uint8Array(4096));
function __cxx_static_address_6470f9c98b209c001ff345a3() {
  return __cxx_static_address_6470f9c98b209c001ff345a3.reference || (__cxx_static_address_6470f9c98b209c001ff345a3.reference = {
    __cReference: true,
    get value() { return yax_tsprfrombunch; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:440
export let yax_updown = Array.from({ length: 4096 }, () => new Int16Array(2));
function __cxx_static_address_dc155f0a32dda1658282becf() {
  return __cxx_static_address_dc155f0a32dda1658282becf.reference || (__cxx_static_address_dc155f0a32dda1658282becf.reference = {
    __cReference: true,
    get value() { return yax_updown; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:441
export let yax_layershift = Array.from({ length: 17 }, () => new Int16Array(4096));
function __cxx_static_address_1724ffcaa6916c44078b8f65() {
  return __cxx_static_address_1724ffcaa6916c44078b8f65.reference || (__cxx_static_address_1724ffcaa6916c44078b8f65.reference = {
    __cReference: true,
    get value() { return yax_layershift; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:444
export let yax_gotsector = new Uint8Array(512);
function __cxx_static_address_9a6b695a8044387d4cfa6f03() {
  return __cxx_static_address_9a6b695a8044387d4cfa6f03.reference || (__cxx_static_address_9a6b695a8044387d4cfa6f03.reference = {
    __cReference: true,
    get value() { return yax_gotsector; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:448
export let yax_bunchnum = Array.from({ length: 4096 }, () => new Int16Array(2));
function __cxx_static_address_040da59159aad353de878cc7() {
  return __cxx_static_address_040da59159aad353de878cc7.reference || (__cxx_static_address_040da59159aad353de878cc7.reference = {
    __cReference: true,
    get value() { return yax_bunchnum; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:449
export let yax_nextwall = Array.from({ length: 16384 }, () => new Int16Array(2));
function __cxx_static_address_121c239f57995c708dcfb62f() {
  return __cxx_static_address_121c239f57995c708dcfb62f.reference || (__cxx_static_address_121c239f57995c708dcfb62f.reference = {
    __cReference: true,
    get value() { return yax_nextwall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:451
export function yax_islockededge(line, cf) {
  return i32((!(!Boolean(i32((i32((cPointerElementRef(wall, line).value).cstat) & i32((1 << i32((10 + cf))))))))));
}

// C/C++ source: source/build/src/engine.cpp:460
export function yax_getbunch(i, cf) {
  if ((i32(editstatus) == 0)) {
    return ((((cPointerElementRef(yax_bunchnum, i).value)[cf]) << 16) >> 16);
  }
  return (((((((Boolean(i32((i32((cDeref(cPointerOffset(cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingstat"), i32(cf), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 1024))) ? i32((cDeref(cPointerOffset(cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingxpanning"), i32(Math.imul(8, i32(cf))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) : (-1))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/engine.cpp:482
export function yax_setbunch(i, cf, bunchnum) {
  if ((i32(editstatus) == 0)) {
    ((cPointerElementRef(yax_bunchnum, i).value)[cf] = (((bunchnum) << 16) >> 16));
    return;
  }
  if ((i32(bunchnum) < 0)) {
    if ((i32(bunchnum) > (-3))) {
      for (let ynw, j = i64((cPointerElementRef(sector, i).value).wallptr); (j < i64(i32((i32((cPointerElementRef(sector, i).value).wallptr) + i32((cPointerElementRef(sector, i).value).wallnum))))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
        (ynw = i64(yax_getnextwall((((j) << 16) >> 16), cf)));
        if ((ynw >= i64(0))) {
          if ((i32(bunchnum) > (-2))) {
            yax_setnextwall((((ynw) << 16) >> 16), ((((!Boolean(cf))) << 16) >> 16), ((((-1)) << 16) >> 16));
          }
          yax_setnextwall((((j) << 16) >> 16), cf, ((((-1)) << 16) >> 16));
        }
      }
    }
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = (((__cxx_lvalue_2.value & (~1024))) & 65535)))(cDeref(cPointerOffset(cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingstat"), i32(cf), Uint16Array.BYTES_PER_ELEMENT), Uint16Array));
    return;
  }
  ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = (((__cxx_lvalue_3.value | 1024)) & 65535)))(cDeref(cPointerOffset(cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingstat"), i32(cf), Uint16Array.BYTES_PER_ELEMENT), Uint16Array));
  ((cDeref(cPointerOffset(cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingxpanning"), i32(Math.imul(8, i32(cf))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((bunchnum) & 255)) & 255));
}

// C/C++ source: source/build/src/engine.cpp:528
export function yax_setbunches(i, cb, fb) {
  yax_setbunch(i, (((0) << 16) >> 16), cb);
  yax_setbunch(i, (((1) << 16) >> 16), fb);
}

// C/C++ source: source/build/src/engine.cpp:536
export function yax_getnextwall(wal, cf) {
  if ((i32(editstatus) == 0)) {
    return ((((cPointerElementRef(yax_nextwall, wal).value)[cf]) << 16) >> 16);
  }
  return (((((((Boolean(yax_islockededge(i32(wal), i32(cf))) ? i32((cDeref(cTypedPointer(cPointerOffset(cObjectFieldRef((cPointerElementRef(wall, wal).value), "lotag"), i32(Math.imul(2, i32(cf))), Int16Array.BYTES_PER_ELEMENT), Int16Array), Int16Array).value)) : (-1))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/engine.cpp:545
export function yax_setnextwall(wal, cf, thenextwall) {
  if ((i32(editstatus) == 0)) {
    ((cPointerElementRef(yax_nextwall, wal).value)[cf] = (((thenextwall) << 16) >> 16));
    return;
  }
  if ((i32(thenextwall) >= 0)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((1 << i32((10 + i32(cf))))))) & 65535)))(cObjectFieldRef((cPointerElementRef(wall, wal).value), "cstat"));
    ((cDeref(cTypedPointer(cPointerOffset(cObjectFieldRef((cPointerElementRef(wall, wal).value), "lotag"), i32(Math.imul(2, i32(cf))), Int16Array.BYTES_PER_ELEMENT), Int16Array), Int16Array).value) = (((thenextwall) << 16) >> 16));
  } else {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = (((__cxx_lvalue_1.value & (~i32((1 << i32((10 + i32(cf)))))))) & 65535)))(cObjectFieldRef((cPointerElementRef(wall, wal).value), "cstat"));
    ((cDeref(cTypedPointer(cPointerOffset(cObjectFieldRef((cPointerElementRef(wall, wal).value), "lotag"), i32(Math.imul(2, i32(cf))), Int16Array.BYTES_PER_ELEMENT), Int16Array), Int16Array).value) = ((((((((i32(cf) == 0) ? 0 : (-1))) << 16) >> 16)) << 16) >> 16));
  }
}

// C/C++ source: source/build/src/engine.cpp:568
export function yax_vnextsec(line, cf) {
  let ynw = (((yax_getnextwall(line, cf)) << 16) >> 16);
  return ((((((((i32(ynw) < 0) ? (-1) : i32((cPointerElementRef(wall, ynw).value).nextsector))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/engine.cpp:579
export function yax_update(resetstat) {
  let i;
  let j;
  let oeditstatus = i32(editstatus);
  let cb;
  let fb;
  if ((resetstat != 2)) {
    (numyaxbunches = i32(0));
  }
  for ((i = i32(0)); (i < 4096); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (((resetstat != 2) || (i >= i32(numsectors)))) {
      ((cPointerElementRef(yax_bunchnum, i).value)[0] = (((((cPointerElementRef(yax_bunchnum, i).value)[1] = (((((((-1)) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
    }
    ((cPointerElementRef(nextsectbunch, 0).value)[i] = (((((cPointerElementRef(nextsectbunch, 1).value)[i] = (((((((-1)) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  }
  cByteMemory.memset(yax_updown, (-1), 16384);
  for ((i = i32(0)); (i < 256); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    ((cPointerElementRef(headsectbunch, 0).value)[i] = (((((cPointerElementRef(headsectbunch, 1).value)[i] = (((((((-1)) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
  }
  for ((i = i32(0)); (i < 16384); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    if (((resetstat != 2) || (i >= i32(numwalls)))) {
      ((cPointerElementRef(yax_nextwall, i).value)[0] = (((((cPointerElementRef(yax_nextwall, i).value)[1] = (((((((-1)) << 16) >> 16)) << 16) >> 16))) << 16) >> 16));
    }
  }
  if ((resetstat == 1)) {
    return;
  }
  (editstatus = (((((((resetstat == 0)) << 16) >> 16)) << 16) >> 16));
  if ((resetstat == 0)) {
    let havebunch = cTypedPointer(tempbuf, Uint8Array);
    let bunchmap = cPointerOffset(havebunch, i32((i32((256 + 7)) >> 3)), Uint8Array.BYTES_PER_ELEMENT);
    let dasub = i32(0);
    cByteMemory.memset(havebunch, 0, u64(i32((i32((256 + 7)) >> 3))));
    for ((i = i32(0)); (i < i32(numsectors)); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
      yax_getbunches__header_dab3f1f07637((((i) << 16) >> 16), cRef(() => cb, __cxx_lvalue_8 => { cb = __cxx_lvalue_8; }), cRef(() => fb, __cxx_lvalue_9 => { fb = __cxx_lvalue_9; }));
      if ((i32(cb) >= 0)) {
        bitmap_set__header_3ddae889b678(havebunch, i32(cb));
      }
      if ((i32(fb) >= 0)) {
        bitmap_set__header_3ddae889b678(havebunch, i32(fb));
      }
    }
    for ((i = i32(0)); (i < 256); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
      if ((!bitmap_test__header_955f0b2ebc45(havebunch, i))) {
        ((cDeref(cPointerOffset(bunchmap, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((255) & 255)) & 255));
        ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous + 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => dasub, __cxx_lvalue_13 => { dasub = __cxx_lvalue_13; }));
        continue;
      }
      ((cDeref(cPointerOffset(bunchmap, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((i32((i - dasub))) & 255)) & 255));
    }
    for ((i = i32(0)); (i < i32(numsectors)); ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = i32((previous + 1)); __cxx_lvalue_14.value = next; return previous; })(cRef(() => i, __cxx_lvalue_15 => { i = __cxx_lvalue_15; }))) {
      yax_getbunches__header_dab3f1f07637((((i) << 16) >> 16), cRef(() => cb, __cxx_lvalue_16 => { cb = __cxx_lvalue_16; }), cRef(() => fb, __cxx_lvalue_17 => { fb = __cxx_lvalue_17; }));
      if ((i32(cb) >= 0)) {
        yax_setbunch((((i) << 16) >> 16), (((0) << 16) >> 16), ((((cDeref(cPointerOffset(bunchmap, cb, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 16) >> 16));
      }
      if ((i32(fb) >= 0)) {
        yax_setbunch((((i) << 16) >> 16), (((1) << 16) >> 16), ((((cDeref(cPointerOffset(bunchmap, fb, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 16) >> 16));
      }
    }
  }
  for ((i = i32((i32(numsectors) - 1))); (i >= 0); ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous - 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => i, __cxx_lvalue_19 => { i = __cxx_lvalue_19; }))) {
    yax_getbunches__header_dab3f1f07637((((i) << 16) >> 16), cRef(() => cb, __cxx_lvalue_20 => { cb = __cxx_lvalue_20; }), cRef(() => fb, __cxx_lvalue_21 => { fb = __cxx_lvalue_21; }));
    if ((resetstat == 0)) {
      ((cPointerElementRef(yax_bunchnum, i).value)[0] = (((cb) << 16) >> 16));
      ((cPointerElementRef(yax_bunchnum, i).value)[1] = (((fb) << 16) >> 16));
    }
    if ((i32(cb) >= 0)) {
      if ((resetstat == 0)) {
        for ((j = i32((cPointerElementRef(sector, i).value).wallptr)); (j < i32((i32((cPointerElementRef(sector, i).value).wallptr) + i32((cPointerElementRef(sector, i).value).wallnum)))); ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = i32((previous + 1)); __cxx_lvalue_22.value = next; return previous; })(cRef(() => j, __cxx_lvalue_23 => { j = __cxx_lvalue_23; }))) {
          if (Boolean(yax_islockededge(j, 0))) {
            ((cPointerElementRef(yax_nextwall, j).value)[0] = ((((cDeref(cTypedPointer(cPointerOffset(cObjectFieldRef((cPointerElementRef(wall, j).value), "lotag"), i32(Math.imul(2, 0)), Int16Array.BYTES_PER_ELEMENT), Int16Array), Int16Array).value)) << 16) >> 16));
            if ((oeditstatus == 0)) {
              ((cDeref(cTypedPointer(cPointerOffset(cObjectFieldRef((cPointerElementRef(wall, j).value), "lotag"), i32(Math.imul(2, 0)), Int16Array.BYTES_PER_ELEMENT), Int16Array), Int16Array).value) = ((((((0) << 16) >> 16)) << 16) >> 16));
            }
          }
        }
      }
      if ((i32((cPointerElementRef(headsectbunch, 0).value)[cb]) == (-1))) {
        ((cPointerElementRef(headsectbunch, 0).value)[cb] = ((((((i) << 16) >> 16)) << 16) >> 16));
        if ((resetstat == 0)) {
          ((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = i32((previous + 1)); __cxx_lvalue_24.value = next; return previous; })(__cxx_global_cell_65a1b3b3dadd66a019af6c35());
        }
      } else {
        let tmpsect = i32((cPointerElementRef(headsectbunch, 0).value)[cb]);
        ((cPointerElementRef(headsectbunch, 0).value)[cb] = ((((((i) << 16) >> 16)) << 16) >> 16));
        ((cPointerElementRef(nextsectbunch, 0).value)[i] = ((((((tmpsect) << 16) >> 16)) << 16) >> 16));
      }
    }
    if ((i32(fb) >= 0)) {
      if ((resetstat == 0)) {
        for ((j = i32((cPointerElementRef(sector, i).value).wallptr)); (j < i32((i32((cPointerElementRef(sector, i).value).wallptr) + i32((cPointerElementRef(sector, i).value).wallnum)))); ((__cxx_lvalue_25) => { const previous = __cxx_lvalue_25.value; const next = i32((previous + 1)); __cxx_lvalue_25.value = next; return previous; })(cRef(() => j, __cxx_lvalue_26 => { j = __cxx_lvalue_26; }))) {
          if (Boolean(yax_islockededge(j, 1))) {
            ((cPointerElementRef(yax_nextwall, j).value)[1] = ((((cDeref(cTypedPointer(cPointerOffset(cObjectFieldRef((cPointerElementRef(wall, j).value), "lotag"), i32(Math.imul(2, 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array), Int16Array).value)) << 16) >> 16));
            if ((oeditstatus == 0)) {
              ((cDeref(cTypedPointer(cPointerOffset(cObjectFieldRef((cPointerElementRef(wall, j).value), "lotag"), i32(Math.imul(2, 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
            }
          }
        }
      }
      if ((i32((cPointerElementRef(headsectbunch, 1).value)[fb]) == (-1))) {
        ((cPointerElementRef(headsectbunch, 1).value)[fb] = ((((((i) << 16) >> 16)) << 16) >> 16));
      } else {
        let tmpsect = i32((cPointerElementRef(headsectbunch, 1).value)[fb]);
        ((cPointerElementRef(headsectbunch, 1).value)[fb] = ((((((i) << 16) >> 16)) << 16) >> 16));
        ((cPointerElementRef(nextsectbunch, 1).value)[i] = ((((((tmpsect) << 16) >> 16)) << 16) >> 16));
      }
    }
  }
  (editstatus = ((((((oeditstatus) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:735
export function yax_getneighborsect(x, y, sectnum, cf) {
  if (((!Boolean(editstatus)) && (inside(x, y, (cPointerElementRef(yax_updown, sectnum).value)[(!Boolean(cf))]) == 1))) {
    return i32((cPointerElementRef(yax_updown, sectnum).value)[(!Boolean(cf))]);
  }
  let bunchnum = (((yax_getbunch((((sectnum) << 16) >> 16), (((cf) << 16) >> 16))) << 16) >> 16);
  if ((i32(bunchnum) < 0)) {
    return i32((-1));
  }
  for (let i = i64((cPointerElementRef(headsectbunch, (!Boolean(cf))).value)[bunchnum]); (i != i64((-1))); (i = i64((cPointerElementRef(nextsectbunch, (!Boolean(cf))).value)[i]))) {
    if ((inside(x, y, (((i) << 16) >> 16)) == 1)) {
      ((cPointerElementRef(yax_updown, i).value)[cf] = ((((((sectnum) << 16) >> 16)) << 16) >> 16));
      ((cPointerElementRef(yax_updown, sectnum).value)[(!Boolean(cf))] = ((((((i) << 16) >> 16)) << 16) >> 16));
      return i32(i);
    }
  }
  return i32((-1));
}

// C/C++ source: source/build/src/engine.cpp:758
export let bunches = Array.from({ length: 2 }, () => new Int16Array(256));
function __cxx_static_address_d9e273b556c7a8d984653b8e() {
  return __cxx_static_address_d9e273b556c7a8d984653b8e.reference || (__cxx_static_address_d9e273b556c7a8d984653b8e.reference = {
    __cReference: true,
    get value() { return bunches; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:760
export let bunchsec = new Int16Array(256);
function __cxx_static_address_f777bb45771eb3d4fe5a7c2b() {
  return __cxx_static_address_f777bb45771eb3d4fe5a7c2b.reference || (__cxx_static_address_f777bb45771eb3d4fe5a7c2b.reference = {
    __cReference: true,
    get value() { return bunchsec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let bunchdist = new Int16Array(256);
function __cxx_static_address_da28bd9cbd572226c258c92f() {
  return __cxx_static_address_da28bd9cbd572226c258c92f.reference || (__cxx_static_address_da28bd9cbd572226c258c92f.reference = {
    __cReference: true,
    get value() { return bunchdist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:762
export let ymostallocsize = i32(0);
function __cxx_static_address_eb60f20ba7afbcf39b95243f() {
  return __cxx_static_address_eb60f20ba7afbcf39b95243f.reference || (__cxx_static_address_eb60f20ba7afbcf39b95243f.reference = {
    __cReference: true,
    get value() { return ymostallocsize; },
    set value(__cxx_lvalue_0) { ymostallocsize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:763
export let yumost = null;
function __cxx_static_address_2148fd6834343ed3c93bd0f1() {
  return __cxx_static_address_2148fd6834343ed3c93bd0f1.reference || (__cxx_static_address_2148fd6834343ed3c93bd0f1.reference = {
    __cReference: true,
    get value() { return yumost; },
    set value(__cxx_lvalue_0) { yumost = __cxx_lvalue_0; }
  });
}

export let ydmost = null;
function __cxx_static_address_e005868bfa744aadf515ec8d() {
  return __cxx_static_address_e005868bfa744aadf515ec8d.reference || (__cxx_static_address_e005868bfa744aadf515ec8d.reference = {
    __cReference: true,
    get value() { return ydmost; },
    set value(__cxx_lvalue_0) { ydmost = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:764
export let haveymost = new Uint8Array(32);
function __cxx_static_address_cd642a119658ca0e20ebb53d() {
  return __cxx_static_address_cd642a119658ca0e20ebb53d.reference || (__cxx_static_address_cd642a119658ca0e20ebb53d.reference = {
    __cReference: true,
    get value() { return haveymost; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:826
export function yax_cmpbunches(b1, b2) {
  return i32((i32((cDeref(cPointerOffset(bunchdist, B_UNBUF16__header_7bb30a873fc5(b2), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) - i32((cDeref(cPointerOffset(bunchdist, B_UNBUF16__header_7bb30a873fc5(b1), Int16Array.BYTES_PER_ELEMENT), Int16Array).value))));
}

// C/C++ source: source/build/src/engine.cpp:832
let __static_yax_tweakpicnums_opicnum = Array.from({ length: 2 }, () => new Int16Array(4096));
export function yax_tweakpicnums(bunchnum, cf, restore) {
  let i;
  let dastat;

  for ((i = i32((cPointerElementRef(headsectbunch, cf).value)[bunchnum])); (i != (-1)); (i = i32((cPointerElementRef(nextsectbunch, cf).value)[i]))) {
    (dastat = i32((i32((cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, i).value), "floorstat") : cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingstat")), Uint16Array).value)) & i32((128 + 256)))));
    if (((dastat == 0) || ((restore == 1) && Boolean(i32((i32((cPointerElementRef(__static_yax_tweakpicnums_opicnum, cf).value)[i]) & 32768)))))) {
      if ((!Boolean(restore))) {
        ((cPointerElementRef(__static_yax_tweakpicnums_opicnum, cf).value)[i] = ((((cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, i).value), "floorpicnum") : cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingpicnum")), Int16Array).value)) << 16) >> 16));
        if ((Boolean(editstatus) && Boolean(showinvisibility))) {
          ((cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, i).value), "floorpicnum") : cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingpicnum")), Int16Array).value) = ((((((i32((30720 - 1))) << 16) >> 16)) << 16) >> 16));
        } else {
          ((cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, i).value), "floorpicnum") : cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingpicnum")), Int16Array).value) = ((((((13) << 16) >> 16)) << 16) >> 16));
        }
      } else {
        ((cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, i).value), "floorpicnum") : cObjectFieldRef((cPointerElementRef(sector, i).value), "ceilingpicnum")), Int16Array).value) = ((((cPointerElementRef(__static_yax_tweakpicnums_opicnum, cf).value)[i]) << 16) >> 16));
      }
    }
  }
}

// C/C++ source: source/build/src/engine.cpp:887
export function yax_copytsprites() {
  let i;
  let spritenum;
  let gotthrough;
  let sectnum;
  let sortcnt = i32((cDeref(cPointerOffset(yax_spritesortcnt, yax_globallev, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let spr;
  for ((i = i32(0)); (i < sortcnt); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (spritenum = i32((cPointerElementRef(yax_tsprite, yax_globallev).value)[i]));
    (gotthrough = i32((spritenum & i32((16384 | i32((16384 << 1)))))));
    (spritenum = i32((spritenum & i32((16384 - 1)))));
    (spr = cRecordPointer(cPointerOffset(sprite, spritenum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}));
    (sectnum = i32(cRecordObject(spr).sectnum));
    if ((gotthrough == i32((16384 | i32((16384 << 1)))))) {
      if ((yax_globalbunch != i32((cPointerElementRef(yax_tsprfrombunch, yax_globallev).value)[i]))) {
        continue;
      }
    } else {
      let cf = i32((-1));
      if ((gotthrough == 16384)) {
        (cf = i32(0));
      } else {
        if ((gotthrough == i32((16384 << 1)))) {
          (cf = i32(1));
        }
      }
      if ((cf != (-1))) {
        for (let k = i32(0); ((k < i32((cPointerElementRef(yax_layershift, yax_globallev).value)[i])) && (sectnum >= 0)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => k, __cxx_lvalue_3 => { k = __cxx_lvalue_3; }))) {
          (sectnum = i32(yax_getneighborsect(cRecordObject(spr).__cxx_anonymous_0.__cxx_anonymous_0.x, cRecordObject(spr).__cxx_anonymous_0.__cxx_anonymous_0.y, sectnum, cf)));
        }
        if ((sectnum < 0)) {
          continue;
        }
      }
    }
    if ((spritesortcnt >= 4096)) {
      break;
    }
    let tsp = renderAddTSpriteFromSprite__header_d17fe8582af7(((spritenum) & 65535));
    (cRecordObject(tsp).sectnum = ((((((sectnum) << 16) >> 16)) << 16) >> 16));
  }
}

// C/C++ source: source/build/src/engine.cpp:1282
export function setslope(sectnum, cf, slope) {
  if ((i32(slope) == 0)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & (~2))) & 65535)))(cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "floorstat") : cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "ceilingstat")), Uint16Array));
    ((cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "floorheinum") : cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "ceilingheinum")), Int16Array).value) = ((((((0) << 16) >> 16)) << 16) >> 16));
  } else {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = (((__cxx_lvalue_1.value | 2)) & 65535)))(cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "floorstat") : cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "ceilingstat")), Uint16Array));
    ((cDeref((Boolean(cf) ? cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "floorheinum") : cObjectFieldRef((cPointerElementRef(sector, sectnum).value), "ceilingheinum")), Int16Array).value) = (((slope) << 16) >> 16));
  }
}

// C/C++ source: source/build/src/engine.cpp:1299
export function getscore(w1c, w1f, w2c, w2f) {
  const __cxx_lvalue_0 = cRef(() => w1c, __cxx_lvalue_4 => { w1c = i32(__cxx_lvalue_4); });
  const __cxx_lvalue_1 = cRef(() => w1f, __cxx_lvalue_5 => { w1f = i32(__cxx_lvalue_5); });
  const __cxx_lvalue_2 = cRef(() => w2c, __cxx_lvalue_6 => { w2c = i32(__cxx_lvalue_6); });
  const __cxx_lvalue_3 = cRef(() => w2f, __cxx_lvalue_7 => { w2f = i32(__cxx_lvalue_7); });
  if ((w1c > w1f)) {
    swap__header_d9629fc219ee(__cxx_lvalue_0, __cxx_lvalue_1);
  }
  if ((w2c > w2f)) {
    swap__header_d9629fc219ee(__cxx_lvalue_2, __cxx_lvalue_3);
  }
  let maxceil = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, __cxx_lvalue_2)).value);
  let minflor = i32((min__template_774131ccff66371d(__cxx_lvalue_1, __cxx_lvalue_3)).value);
  return i32((minflor - maxceil));
}

// C/C++ source: source/build/src/engine.cpp:1314
export let chsecptr_onextwall = null;
export function __cxx_global_cell_28f960d82b466c468df65b74() {
  return __cxx_global_cell_28f960d82b466c468df65b74.reference || (__cxx_global_cell_28f960d82b466c468df65b74.reference = {
    __cReference: true,
    get value() { return chsecptr_onextwall; },
    set value(__cxx_lvalue_0) { chsecptr_onextwall = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1457
export let xb1 = new Int32Array(8192);
function __cxx_static_address_ae2583eb7b4ed8e1fb2ed37d() {
  return __cxx_static_address_ae2583eb7b4ed8e1fb2ed37d.reference || (__cxx_static_address_ae2583eb7b4ed8e1fb2ed37d.reference = {
    __cReference: true,
    get value() { return xb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1458
export let yb1 = new Int32Array(8192);
function __cxx_static_address_a83ad9c0013256eb32a910f9() {
  return __cxx_static_address_a83ad9c0013256eb32a910f9.reference || (__cxx_static_address_a83ad9c0013256eb32a910f9.reference = {
    __cReference: true,
    get value() { return yb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let xb2 = new Int32Array(8192);
function __cxx_static_address_201027d9659e1e7a6d85c028() {
  return __cxx_static_address_201027d9659e1e7a6d85c028.reference || (__cxx_static_address_201027d9659e1e7a6d85c028.reference = {
    __cReference: true,
    get value() { return xb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let yb2 = new Int32Array(8192);
function __cxx_static_address_e0194add7de57bbb76f68ab6() {
  return __cxx_static_address_e0194add7de57bbb76f68ab6.reference || (__cxx_static_address_e0194add7de57bbb76f68ab6.reference = {
    __cReference: true,
    get value() { return yb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1459
export let rx1 = new Int32Array(8192);
function __cxx_static_address_c93687d584e00436f230d033() {
  return __cxx_static_address_c93687d584e00436f230d033.reference || (__cxx_static_address_c93687d584e00436f230d033.reference = {
    __cReference: true,
    get value() { return rx1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ry1 = new Int32Array(8192);
function __cxx_static_address_8bcadd5010e754d31715e468() {
  return __cxx_static_address_8bcadd5010e754d31715e468.reference || (__cxx_static_address_8bcadd5010e754d31715e468.reference = {
    __cReference: true,
    get value() { return ry1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1460
export let rx2 = new Int32Array(8192);
function __cxx_static_address_068adba1b736e12efe7afe91() {
  return __cxx_static_address_068adba1b736e12efe7afe91.reference || (__cxx_static_address_068adba1b736e12efe7afe91.reference = {
    __cReference: true,
    get value() { return rx2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ry2 = new Int32Array(8192);
function __cxx_static_address_b2919153503f62f1786d1698() {
  return __cxx_static_address_b2919153503f62f1786d1698.reference || (__cxx_static_address_b2919153503f62f1786d1698.reference = {
    __cReference: true,
    get value() { return ry2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1461
export let bunchp2 = new Int16Array(8192);
function __cxx_static_address_3f96f910ee908f9ded44776c() {
  return __cxx_static_address_3f96f910ee908f9ded44776c.reference || (__cxx_static_address_3f96f910ee908f9ded44776c.reference = {
    __cReference: true,
    get value() { return bunchp2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let thesector = new Int16Array(8192);
function __cxx_static_address_cdda2d516482bf73a5b92a85() {
  return __cxx_static_address_cdda2d516482bf73a5b92a85.reference || (__cxx_static_address_cdda2d516482bf73a5b92a85.reference = {
    __cReference: true,
    get value() { return thesector; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1463
export let bunchfirst = new Int16Array(8192);
function __cxx_static_address_a8d18705369901454442c5b4() {
  return __cxx_static_address_a8d18705369901454442c5b4.reference || (__cxx_static_address_a8d18705369901454442c5b4.reference = {
    __cReference: true,
    get value() { return bunchfirst; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_32235a946cc19e2b = i32(2147483647);
function __cxx_static_address_3c2c5a661c6985e6b425a380() {
  return __cxx_static_address_3c2c5a661c6985e6b425a380.reference || (__cxx_static_address_3c2c5a661c6985e6b425a380.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_32235a946cc19e2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_a04c37a358353344 = i32(2147483648);
function __cxx_static_address_1345a30057ec38eec16047fe() {
  return __cxx_static_address_1345a30057ec38eec16047fe.reference || (__cxx_static_address_1345a30057ec38eec16047fe.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_a04c37a358353344; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_dbf3fe7dac04ab33 = i32(2147483648);
function __cxx_static_address_b5344abab7afff409ac7f23d() {
  return __cxx_static_address_b5344abab7afff409ac7f23d.reference || (__cxx_static_address_b5344abab7afff409ac7f23d.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_dbf3fe7dac04ab33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_1ff90da45b33318d = i32(65536);
function __cxx_static_address_aec2ff4e73ed9e90e00de2fa() {
  return __cxx_static_address_aec2ff4e73ed9e90e00de2fa.reference || (__cxx_static_address_aec2ff4e73ed9e90e00de2fa.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_1ff90da45b33318d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_32abdaf38138b574 = i32(32768);
function __cxx_static_address_f6df65ae690133f2bd0233f2() {
  return __cxx_static_address_f6df65ae690133f2bd0233f2.reference || (__cxx_static_address_f6df65ae690133f2bd0233f2.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_32abdaf38138b574; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_08ad66003e737fed = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_d94e28e5336e004684b25bab() {
  return __cxx_static_address_d94e28e5336e004684b25bab.reference || (__cxx_static_address_d94e28e5336e004684b25bab.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_08ad66003e737fed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/random.h:19
export let randomseed = 0;
export function __cxx_global_cell_cff3db0365d00ccd4662087c() {
  return __cxx_global_cell_cff3db0365d00ccd4662087c.reference || (__cxx_global_cell_cff3db0365d00ccd4662087c.reference = {
    __cReference: true,
    get value() { return randomseed; },
    set value(__cxx_lvalue_0) { randomseed = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/random.h:20
export let wrandomseed = u32(1);
export function __cxx_global_cell_c51fcdf4111f2095a57e764d() {
  return __cxx_global_cell_c51fcdf4111f2095a57e764d.reference || (__cxx_global_cell_c51fcdf4111f2095a57e764d.reference = {
    __cReference: true,
    get value() { return wrandomseed; },
    set value(__cxx_lvalue_0) { wrandomseed = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:595
export let guniqhudid = 0;
export function __cxx_global_cell_c7f67e27827c40ee873f6392() {
  return __cxx_global_cell_c7f67e27827c40ee873f6392.reference || (__cxx_global_cell_c7f67e27827c40ee873f6392.reference = {
    __cReference: true,
    get value() { return guniqhudid; },
    set value(__cxx_lvalue_0) { guniqhudid = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:596
export let spritesortcnt = 0;
export function __cxx_global_cell_138b3585b71dcf40bb04bbf8() {
  return __cxx_global_cell_138b3585b71dcf40bb04bbf8.reference || (__cxx_global_cell_138b3585b71dcf40bb04bbf8.reference = {
    __cReference: true,
    get value() { return spritesortcnt; },
    set value(__cxx_lvalue_0) { spritesortcnt = i32(__cxx_lvalue_0); }
  });
}

export let maskwallcnt = 0;
export function __cxx_global_cell_ef67f04433f41be3caf2391d() {
  return __cxx_global_cell_ef67f04433f41be3caf2391d.reference || (__cxx_global_cell_ef67f04433f41be3caf2391d.reference = {
    __cReference: true,
    get value() { return maskwallcnt; },
    set value(__cxx_lvalue_0) { maskwallcnt = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/include/build.h:760
export let wx1 = 0;
export function __cxx_global_cell_5d3f7e3c255e1e4d3dba7fa2() {
  return __cxx_global_cell_5d3f7e3c255e1e4d3dba7fa2.reference || (__cxx_global_cell_5d3f7e3c255e1e4d3dba7fa2.reference = {
    __cReference: true,
    get value() { return wx1; },
    set value(__cxx_lvalue_0) { wx1 = i32(__cxx_lvalue_0); }
  });
}

export let wy1 = 0;
export function __cxx_global_cell_94e67cd1b6471a084977e82f() {
  return __cxx_global_cell_94e67cd1b6471a084977e82f.reference || (__cxx_global_cell_94e67cd1b6471a084977e82f.reference = {
    __cReference: true,
    get value() { return wy1; },
    set value(__cxx_lvalue_0) { wy1 = i32(__cxx_lvalue_0); }
  });
}

export let wx2 = 0;
export function __cxx_global_cell_73872b378ae600f82ef1585d() {
  return __cxx_global_cell_73872b378ae600f82ef1585d.reference || (__cxx_global_cell_73872b378ae600f82ef1585d.reference = {
    __cReference: true,
    get value() { return wx2; },
    set value(__cxx_lvalue_0) { wx2 = i32(__cxx_lvalue_0); }
  });
}

export let wy2 = 0;
export function __cxx_global_cell_8513acc4c7b23588d79953c0() {
  return __cxx_global_cell_8513acc4c7b23588d79953c0.reference || (__cxx_global_cell_8513acc4c7b23588d79953c0.reference = {
    __cReference: true,
    get value() { return wy2; },
    set value(__cxx_lvalue_0) { wy2 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:761
export let xdim = 0;
export function __cxx_global_cell_22f848239c12c0d9f2b6f9e3() {
  return __cxx_global_cell_22f848239c12c0d9f2b6f9e3.reference || (__cxx_global_cell_22f848239c12c0d9f2b6f9e3.reference = {
    __cReference: true,
    get value() { return xdim; },
    set value(__cxx_lvalue_0) { xdim = i32(__cxx_lvalue_0); }
  });
}

export let ydim = 0;
export function __cxx_global_cell_ce636929c03d679219ea2982() {
  return __cxx_global_cell_ce636929c03d679219ea2982.reference || (__cxx_global_cell_ce636929c03d679219ea2982.reference = {
    __cReference: true,
    get value() { return ydim; },
    set value(__cxx_lvalue_0) { ydim = i32(__cxx_lvalue_0); }
  });
}

export let numpages = 0;
export function __cxx_global_cell_e7587e075f0e1bcf83dd9001() {
  return __cxx_global_cell_e7587e075f0e1bcf83dd9001.reference || (__cxx_global_cell_e7587e075f0e1bcf83dd9001.reference = {
    __cReference: true,
    get value() { return numpages; },
    set value(__cxx_lvalue_0) { numpages = i32(__cxx_lvalue_0); }
  });
}

export let upscalefactor = 0;
export function __cxx_global_cell_46fbe924187022a575efe0a8() {
  return __cxx_global_cell_46fbe924187022a575efe0a8.reference || (__cxx_global_cell_46fbe924187022a575efe0a8.reference = {
    __cReference: true,
    get value() { return upscalefactor; },
    set value(__cxx_lvalue_0) { upscalefactor = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:762
export let yxaspect = 0;
export function __cxx_global_cell_9de9945f48c8bc47d005b6f8() {
  return __cxx_global_cell_9de9945f48c8bc47d005b6f8.reference || (__cxx_global_cell_9de9945f48c8bc47d005b6f8.reference = {
    __cReference: true,
    get value() { return yxaspect; },
    set value(__cxx_lvalue_0) { yxaspect = i32(__cxx_lvalue_0); }
  });
}

export let viewingrange = 0;
export function __cxx_global_cell_c84014786923d3572b20a599() {
  return __cxx_global_cell_c84014786923d3572b20a599.reference || (__cxx_global_cell_c84014786923d3572b20a599.reference = {
    __cReference: true,
    get value() { return viewingrange; },
    set value(__cxx_lvalue_0) { viewingrange = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:766
export let rotatesprite_y_offset = 0;
export function __cxx_global_cell_f6c55103bb34c1bae0a56530() {
  return __cxx_global_cell_f6c55103bb34c1bae0a56530.reference || (__cxx_global_cell_f6c55103bb34c1bae0a56530.reference = {
    __cReference: true,
    get value() { return rotatesprite_y_offset; },
    set value(__cxx_lvalue_0) { rotatesprite_y_offset = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:767
export let rotatesprite_yxaspect = 0;
export function __cxx_global_cell_1eb1cfb64d199abe24ad949b() {
  return __cxx_global_cell_1eb1cfb64d199abe24ad949b.reference || (__cxx_global_cell_1eb1cfb64d199abe24ad949b.reference = {
    __cReference: true,
    get value() { return rotatesprite_yxaspect; },
    set value(__cxx_lvalue_0) { rotatesprite_yxaspect = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:774
export let validmodecnt = 0;
export function __cxx_global_cell_959ecb0f89b58217d69a30a7() {
  return __cxx_global_cell_959ecb0f89b58217d69a30a7.reference || (__cxx_global_cell_959ecb0f89b58217d69a30a7.reference = {
    __cReference: true,
    get value() { return validmodecnt; },
    set value(__cxx_lvalue_0) { validmodecnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:784
export let numyaxbunches = 0;
export function __cxx_global_cell_65a1b3b3dadd66a019af6c35() {
  return __cxx_global_cell_65a1b3b3dadd66a019af6c35.reference || (__cxx_global_cell_65a1b3b3dadd66a019af6c35.reference = {
    __cReference: true,
    get value() { return numyaxbunches; },
    set value(__cxx_lvalue_0) { numyaxbunches = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:797
export let Numsprites = 0;
export function __cxx_global_cell_4e6f24ae9c3dade74700992b() {
  return __cxx_global_cell_4e6f24ae9c3dade74700992b.reference || (__cxx_global_cell_4e6f24ae9c3dade74700992b.reference = {
    __cReference: true,
    get value() { return Numsprites; },
    set value(__cxx_lvalue_0) { Numsprites = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:798
export let numsectors = 0;
export function __cxx_global_cell_0d84c36af55f8d659082f1bb() {
  return __cxx_global_cell_0d84c36af55f8d659082f1bb.reference || (__cxx_global_cell_0d84c36af55f8d659082f1bb.reference = {
    __cReference: true,
    get value() { return numsectors; },
    set value(__cxx_lvalue_0) { numsectors = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let numwalls = 0;
export function __cxx_global_cell_9fbed4c78bef6ce8bf955682() {
  return __cxx_global_cell_9fbed4c78bef6ce8bf955682.reference || (__cxx_global_cell_9fbed4c78bef6ce8bf955682.reference = {
    __cReference: true,
    get value() { return numwalls; },
    set value(__cxx_lvalue_0) { numwalls = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/include/build.h:799
export let display_mirror = 0;
export function __cxx_global_cell_27361f8c1fd7174d309e19f2() {
  return __cxx_global_cell_27361f8c1fd7174d309e19f2.reference || (__cxx_global_cell_27361f8c1fd7174d309e19f2.reference = {
    __cReference: true,
    get value() { return display_mirror; },
    set value(__cxx_lvalue_0) { display_mirror = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:804
export let rotatespritesmoothratio = 0;
export function __cxx_global_cell_08ed94ef856e4813ce5fe775() {
  return __cxx_global_cell_08ed94ef856e4813ce5fe775.reference || (__cxx_global_cell_08ed94ef856e4813ce5fe775.reference = {
    __cReference: true,
    get value() { return rotatespritesmoothratio; },
    set value(__cxx_lvalue_0) { rotatespritesmoothratio = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:805
export let numframes = 0;
export function __cxx_global_cell_40ab01100c3cafbb5bf1052e() {
  return __cxx_global_cell_40ab01100c3cafbb5bf1052e.reference || (__cxx_global_cell_40ab01100c3cafbb5bf1052e.reference = {
    __cReference: true,
    get value() { return numframes; },
    set value(__cxx_lvalue_0) { numframes = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:809
export let numshades = 0;
export function __cxx_global_cell_14c13a42eb4ff2885eee0cc2() {
  return __cxx_global_cell_14c13a42eb4ff2885eee0cc2.reference || (__cxx_global_cell_14c13a42eb4ff2885eee0cc2.reference = {
    __cReference: true,
    get value() { return numshades; },
    set value(__cxx_lvalue_0) { numshades = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/include/build.h:812
export let paletteloaded = 0;
export function __cxx_global_cell_2ecdb66f06cb14d421e278fc() {
  return __cxx_global_cell_2ecdb66f06cb14d421e278fc.reference || (__cxx_global_cell_2ecdb66f06cb14d421e278fc.reference = {
    __cReference: true,
    get value() { return paletteloaded; },
    set value(__cxx_lvalue_0) { paletteloaded = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/include/build.h:814
export let whitecol = 0;
export function __cxx_global_cell_741c460e893f5c54c47c5ab5() {
  return __cxx_global_cell_741c460e893f5c54c47c5ab5.reference || (__cxx_global_cell_741c460e893f5c54c47c5ab5.reference = {
    __cReference: true,
    get value() { return whitecol; },
    set value(__cxx_lvalue_0) { whitecol = ((__cxx_lvalue_0) & 255); }
  });
}

export let redcol = 0;
export function __cxx_global_cell_3cf6aa8792595191f9ca195d() {
  return __cxx_global_cell_3cf6aa8792595191f9ca195d.reference || (__cxx_global_cell_3cf6aa8792595191f9ca195d.reference = {
    __cReference: true,
    get value() { return redcol; },
    set value(__cxx_lvalue_0) { redcol = ((__cxx_lvalue_0) & 255); }
  });
}

export let blackcol = 0;
export function __cxx_global_cell_e493776e01f353d2a6806578() {
  return __cxx_global_cell_e493776e01f353d2a6806578.reference || (__cxx_global_cell_e493776e01f353d2a6806578.reference = {
    __cReference: true,
    get value() { return blackcol; },
    set value(__cxx_lvalue_0) { blackcol = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/include/build.h:816
export let maxspritesonscreen = 0;
export function __cxx_global_cell_4723a60d88a1aa0814b17967() {
  return __cxx_global_cell_4723a60d88a1aa0814b17967.reference || (__cxx_global_cell_4723a60d88a1aa0814b17967.reference = {
    __cReference: true,
    get value() { return maxspritesonscreen; },
    set value(__cxx_lvalue_0) { maxspritesonscreen = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:824
export let showinvisibility = 0;
export function __cxx_global_cell_897ba5cfd83783a7343a70d6() {
  return __cxx_global_cell_897ba5cfd83783a7343a70d6.reference || (__cxx_global_cell_897ba5cfd83783a7343a70d6.reference = {
    __cReference: true,
    get value() { return showinvisibility; },
    set value(__cxx_lvalue_0) { showinvisibility = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/include/build.h:825
export let g_visibility = 0;
export function __cxx_global_cell_e22c3a838bd598f964b2aab0() {
  return __cxx_global_cell_e22c3a838bd598f964b2aab0.reference || (__cxx_global_cell_e22c3a838bd598f964b2aab0.reference = {
    __cReference: true,
    get value() { return g_visibility; },
    set value(__cxx_lvalue_0) { g_visibility = i32(__cxx_lvalue_0); }
  });
}

export let parallaxvisibility = 0;
export function __cxx_global_cell_35e882b8c9a8046f9e92164d() {
  return __cxx_global_cell_35e882b8c9a8046f9e92164d.reference || (__cxx_global_cell_35e882b8c9a8046f9e92164d.reference = {
    __cReference: true,
    get value() { return parallaxvisibility; },
    set value(__cxx_lvalue_0) { parallaxvisibility = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:826
export let g_rotatespriteNoWidescreen = 0;
export function __cxx_global_cell_7dc6e906fd58688c90792303() {
  return __cxx_global_cell_7dc6e906fd58688c90792303.reference || (__cxx_global_cell_7dc6e906fd58688c90792303.reference = {
    __cReference: true,
    get value() { return g_rotatespriteNoWidescreen; },
    set value(__cxx_lvalue_0) { g_rotatespriteNoWidescreen = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:830
export let numalphatabs = 0;
export function __cxx_global_cell_98d4df84d94f4e1b0e9e0c4b() {
  return __cxx_global_cell_98d4df84d94f4e1b0e9e0c4b.reference || (__cxx_global_cell_98d4df84d94f4e1b0e9e0c4b.reference = {
    __cReference: true,
    get value() { return numalphatabs; },
    set value(__cxx_lvalue_0) { numalphatabs = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/include/build.h:856
export let g_pskyidx = 0;
export function __cxx_global_cell_c55d5c171c5137818b672aba() {
  return __cxx_global_cell_c55d5c171c5137818b672aba.reference || (__cxx_global_cell_c55d5c171c5137818b672aba.reference = {
    __cReference: true,
    get value() { return g_pskyidx; },
    set value(__cxx_lvalue_0) { g_pskyidx = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:858
export let pskynummultis = 0;
export function __cxx_global_cell_657da161243aac44db0e415b() {
  return __cxx_global_cell_657da161243aac44db0e415b.reference || (__cxx_global_cell_657da161243aac44db0e415b.reference = {
    __cReference: true,
    get value() { return pskynummultis; },
    set value(__cxx_lvalue_0) { pskynummultis = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:876
export let parallaxtype = 0;
export function __cxx_global_cell_a55dffbc5cd0f1b3f7bccd1e() {
  return __cxx_global_cell_a55dffbc5cd0f1b3f7bccd1e.reference || (__cxx_global_cell_a55dffbc5cd0f1b3f7bccd1e.reference = {
    __cReference: true,
    get value() { return parallaxtype; },
    set value(__cxx_lvalue_0) { parallaxtype = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/include/build.h:877
export let parallaxyoffs_override = 0;
export function __cxx_global_cell_3c62113020c8788be6f213d9() {
  return __cxx_global_cell_3c62113020c8788be6f213d9.reference || (__cxx_global_cell_3c62113020c8788be6f213d9.reference = {
    __cReference: true,
    get value() { return parallaxyoffs_override; },
    set value(__cxx_lvalue_0) { parallaxyoffs_override = i32(__cxx_lvalue_0); }
  });
}

export let parallaxyscale_override = 0;
export function __cxx_global_cell_f4f0304cc5aba4a89983581e() {
  return __cxx_global_cell_f4f0304cc5aba4a89983581e.reference || (__cxx_global_cell_f4f0304cc5aba4a89983581e.reference = {
    __cReference: true,
    get value() { return parallaxyscale_override; },
    set value(__cxx_lvalue_0) { parallaxyscale_override = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:883
export let tailspritefree = 0;
export function __cxx_global_cell_a53297299ceed099141e8628() {
  return __cxx_global_cell_a53297299ceed099141e8628.reference || (__cxx_global_cell_a53297299ceed099141e8628.reference = {
    __cReference: true,
    get value() { return tailspritefree; },
    set value(__cxx_lvalue_0) { tailspritefree = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/include/build.h:975
export let g_windowPosValid = false;
export function __cxx_global_cell_e262794d9997adc8dcfb5b2d() {
  return __cxx_global_cell_e262794d9997adc8dcfb5b2d.reference || (__cxx_global_cell_e262794d9997adc8dcfb5b2d.reference = {
    __cReference: true,
    get value() { return g_windowPosValid; },
    set value(__cxx_lvalue_0) { g_windowPosValid = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:989
export let automapping = 0;
export function __cxx_global_cell_c1c0a03508c5080698c5ec5d() {
  return __cxx_global_cell_c1c0a03508c5080698c5ec5d.reference || (__cxx_global_cell_c1c0a03508c5080698c5ec5d.reference = {
    __cReference: true,
    get value() { return automapping; },
    set value(__cxx_lvalue_0) { automapping = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:1065
export let globalpicnum = 0;
export function __cxx_global_cell_5b9f2cfa1814cbe47a8a5958() {
  return __cxx_global_cell_5b9f2cfa1814cbe47a8a5958.reference || (__cxx_global_cell_5b9f2cfa1814cbe47a8a5958.reference = {
    __cReference: true,
    get value() { return globalpicnum; },
    set value(__cxx_lvalue_0) { globalpicnum = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/include/build.h:1608
export let nextvoxid = 0;
export function __cxx_global_cell_a729c98a85231190f038ffde() {
  return __cxx_global_cell_a729c98a85231190f038ffde.reference || (__cxx_global_cell_a729c98a85231190f038ffde.reference = {
    __cReference: true,
    get value() { return nextvoxid; },
    set value(__cxx_lvalue_0) { nextvoxid = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/hightile.h:14
export let globalnoeffect = 0;
export function __cxx_global_cell_2a6cfa64fa913b83240764d5() {
  return __cxx_global_cell_2a6cfa64fa913b83240764d5.reference || (__cxx_global_cell_2a6cfa64fa913b83240764d5.reference = {
    __cReference: true,
    get value() { return globalnoeffect; },
    set value(__cxx_lvalue_0) { globalnoeffect = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/vec.h:48
export function __cxx_record_vec4_6f720c065427e7b3() {
  return __cxx_record_vec4_6f720c065427e7b3.type || (__cxx_record_vec4_6f720c065427e7b3.type = class __cxx_record_vec4_6f720c065427e7b3__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"a": {"native": "Int32Array", "offset": 12, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}, "w": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 16, "union": true}, "offset": 0}}, "overlaps": true, "prototype": "__cxx_record_vec4_6f720c065427e7b3", "size": 16, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec4_6f720c065427e7b3": () => __cxx_record_vec4_6f720c065427e7b3().prototype}), new.target.prototype);
  }
  __cxx_operator_f7d6883bde11ad63(c) {
    return Boolean(Boolean(i32((i32((i32((i32((this.__cxx_anonymous_0.__cxx_anonymous_0.x != c.__cxx_anonymous_0.__cxx_anonymous_0.x)) | i32((this.__cxx_anonymous_0.__cxx_anonymous_0.y != c.__cxx_anonymous_0.__cxx_anonymous_0.y)))) | i32((this.__cxx_anonymous_0.__cxx_anonymous_0.z != c.__cxx_anonymous_0.__cxx_anonymous_0.z)))) | i32((this.__cxx_anonymous_0.__cxx_anonymous_0.a != c.__cxx_anonymous_0.__cxx_anonymous_0.a))))));
  }
});
}

export let bunchlast = new Int16Array(8192);
function __cxx_static_address_823ec9f6496e42729a158f62() {
  return __cxx_static_address_823ec9f6496e42729a158f62.reference || (__cxx_static_address_823ec9f6496e42729a158f62.reference = {
    __cReference: true,
    get value() { return bunchlast; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1465
export let nodesperline = 0;
function __cxx_static_address_504ad5559007d6f33ec65ccc() {
  return __cxx_static_address_504ad5559007d6f33ec65ccc.reference || (__cxx_static_address_504ad5559007d6f33ec65ccc.reference = {
    __cReference: true,
    get value() { return nodesperline; },
    set value(__cxx_lvalue_0) { nodesperline = i32(__cxx_lvalue_0); }
  });
}

export let ysavecnt = 0;
function __cxx_static_address_1489693e4d227075879c91f9() {
  return __cxx_static_address_1489693e4d227075879c91f9.reference || (__cxx_static_address_1489693e4d227075879c91f9.reference = {
    __cReference: true,
    get value() { return ysavecnt; },
    set value(__cxx_lvalue_0) { ysavecnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1466
export let smost = null;
function __cxx_static_address_17ebf087dc87d0c7c2704242() {
  return __cxx_static_address_17ebf087dc87d0c7c2704242.reference || (__cxx_static_address_17ebf087dc87d0c7c2704242.reference = {
    __cReference: true,
    get value() { return smost; },
    set value(__cxx_lvalue_0) { smost = __cxx_lvalue_0; }
  });
}

export let umost = null;
function __cxx_static_address_cda2119587abc71704501e74() {
  return __cxx_static_address_cda2119587abc71704501e74.reference || (__cxx_static_address_cda2119587abc71704501e74.reference = {
    __cReference: true,
    get value() { return umost; },
    set value(__cxx_lvalue_0) { umost = __cxx_lvalue_0; }
  });
}

export let dmost = null;
function __cxx_static_address_8eaacff0c38c7a01c1b3d98a() {
  return __cxx_static_address_8eaacff0c38c7a01c1b3d98a.reference || (__cxx_static_address_8eaacff0c38c7a01c1b3d98a.reference = {
    __cReference: true,
    get value() { return dmost; },
    set value(__cxx_lvalue_0) { dmost = __cxx_lvalue_0; }
  });
}

export let bakumost = null;
function __cxx_static_address_23bb7f67ca630bc65b4c93bd() {
  return __cxx_static_address_23bb7f67ca630bc65b4c93bd.reference || (__cxx_static_address_23bb7f67ca630bc65b4c93bd.reference = {
    __cReference: true,
    get value() { return bakumost; },
    set value(__cxx_lvalue_0) { bakumost = __cxx_lvalue_0; }
  });
}

export let bakdmost = null;
function __cxx_static_address_d3e9e18f891884c6c96f52fe() {
  return __cxx_static_address_d3e9e18f891884c6c96f52fe.reference || (__cxx_static_address_d3e9e18f891884c6c96f52fe.reference = {
    __cReference: true,
    get value() { return bakdmost; },
    set value(__cxx_lvalue_0) { bakdmost = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1467
export let uplc = null;
function __cxx_static_address_80245ff0670b238fddf41674() {
  return __cxx_static_address_80245ff0670b238fddf41674.reference || (__cxx_static_address_80245ff0670b238fddf41674.reference = {
    __cReference: true,
    get value() { return uplc; },
    set value(__cxx_lvalue_0) { uplc = __cxx_lvalue_0; }
  });
}

export let dplc = null;
function __cxx_static_address_030dea20292b8ccfb253f2f2() {
  return __cxx_static_address_030dea20292b8ccfb253f2f2.reference || (__cxx_static_address_030dea20292b8ccfb253f2f2.reference = {
    __cReference: true,
    get value() { return dplc; },
    set value(__cxx_lvalue_0) { dplc = __cxx_lvalue_0; }
  });
}

export let uwall = null;
function __cxx_static_address_8fac817ec1046bcc9af9d807() {
  return __cxx_static_address_8fac817ec1046bcc9af9d807.reference || (__cxx_static_address_8fac817ec1046bcc9af9d807.reference = {
    __cReference: true,
    get value() { return uwall; },
    set value(__cxx_lvalue_0) { uwall = __cxx_lvalue_0; }
  });
}

export let dwall = null;
function __cxx_static_address_06af83b949965f384726a5d5() {
  return __cxx_static_address_06af83b949965f384726a5d5.reference || (__cxx_static_address_06af83b949965f384726a5d5.reference = {
    __cReference: true,
    get value() { return dwall; },
    set value(__cxx_lvalue_0) { dwall = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1468
export let swplc = null;
function __cxx_static_address_14183efcf620ecfb8850097d() {
  return __cxx_static_address_14183efcf620ecfb8850097d.reference || (__cxx_static_address_14183efcf620ecfb8850097d.reference = {
    __cReference: true,
    get value() { return swplc; },
    set value(__cxx_lvalue_0) { swplc = __cxx_lvalue_0; }
  });
}

export let lplc = null;
function __cxx_static_address_01c16f662f9d8ebf17e1b4d9() {
  return __cxx_static_address_01c16f662f9d8ebf17e1b4d9.reference || (__cxx_static_address_01c16f662f9d8ebf17e1b4d9.reference = {
    __cReference: true,
    get value() { return lplc; },
    set value(__cxx_lvalue_0) { lplc = __cxx_lvalue_0; }
  });
}

export let swall = null;
function __cxx_static_address_096acb25228b09dae41dc959() {
  return __cxx_static_address_096acb25228b09dae41dc959.reference || (__cxx_static_address_096acb25228b09dae41dc959.reference = {
    __cReference: true,
    get value() { return swall; },
    set value(__cxx_lvalue_0) { swall = __cxx_lvalue_0; }
  });
}

export let lwall = null;
function __cxx_static_address_60e94246258c1e5f501cf23e() {
  return __cxx_static_address_60e94246258c1e5f501cf23e.reference || (__cxx_static_address_60e94246258c1e5f501cf23e.reference = {
    __cReference: true,
    get value() { return lwall; },
    set value(__cxx_lvalue_0) { lwall = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1470
export let swallf = null;
function __cxx_static_address_efae0614594f44eeb6e58297() {
  return __cxx_static_address_efae0614594f44eeb6e58297.reference || (__cxx_static_address_efae0614594f44eeb6e58297.reference = {
    __cReference: true,
    get value() { return swallf; },
    set value(__cxx_lvalue_0) { swallf = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1473
export let mirrorBuffer = null;
export function __cxx_global_cell_96cc27380f17556df4ccc300() {
  return __cxx_global_cell_96cc27380f17556df4ccc300.reference || (__cxx_global_cell_96cc27380f17556df4ccc300.reference = {
    __cReference: true,
    get value() { return mirrorBuffer; },
    set value(__cxx_lvalue_0) { mirrorBuffer = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1475
export let smostcnt = 0;
function __cxx_static_address_83633d59cfaed491e970ff60() {
  return __cxx_static_address_83633d59cfaed491e970ff60.reference || (__cxx_static_address_83633d59cfaed491e970ff60.reference = {
    __cReference: true,
    get value() { return smostcnt; },
    set value(__cxx_lvalue_0) { smostcnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1476
export let smoststart = new Int32Array(8192);
function __cxx_static_address_ca852d2155586e819921bf0e() {
  return __cxx_static_address_ca852d2155586e819921bf0e.reference || (__cxx_static_address_ca852d2155586e819921bf0e.reference = {
    __cReference: true,
    get value() { return smoststart; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1477
export let smostwalltype = new Uint8Array(8192);
function __cxx_static_address_785665e0d8217a62addbe810() {
  return __cxx_static_address_785665e0d8217a62addbe810.reference || (__cxx_static_address_785665e0d8217a62addbe810.reference = {
    __cReference: true,
    get value() { return smostwalltype; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1478
export let smostwall = new Int32Array(8192);
function __cxx_static_address_e7a5dadddee3611ff8989412() {
  return __cxx_static_address_e7a5dadddee3611ff8989412.reference || (__cxx_static_address_e7a5dadddee3611ff8989412.reference = {
    __cReference: true,
    get value() { return smostwall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let smostwallcnt = i32((-1));
function __cxx_static_address_ad12f2e61fed2248b6963840() {
  return __cxx_static_address_ad12f2e61fed2248b6963840.reference || (__cxx_static_address_ad12f2e61fed2248b6963840.reference = {
    __cReference: true,
    get value() { return smostwallcnt; },
    set value(__cxx_lvalue_0) { smostwallcnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1480
export let spritesxyz = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, [4097], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_b2b774b10bf43814140ce817() {
  return __cxx_static_address_b2b774b10bf43814140ce817.reference || (__cxx_static_address_b2b774b10bf43814140ce817.reference = {
    __cReference: true,
    get value() { return spritesxyz; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1482
export let xdimen = i32((-1));
export function __cxx_global_cell_1bb1070901d1e89087ee9441() {
  return __cxx_global_cell_1bb1070901d1e89087ee9441.reference || (__cxx_global_cell_1bb1070901d1e89087ee9441.reference = {
    __cReference: true,
    get value() { return xdimen; },
    set value(__cxx_lvalue_0) { xdimen = i32(__cxx_lvalue_0); }
  });
}

export let xdimenrecip = 0;
export function __cxx_global_cell_dee358e91a1a7f2a6d37a5a5() {
  return __cxx_global_cell_dee358e91a1a7f2a6d37a5a5.reference || (__cxx_global_cell_dee358e91a1a7f2a6d37a5a5.reference = {
    __cReference: true,
    get value() { return xdimenrecip; },
    set value(__cxx_lvalue_0) { xdimenrecip = i32(__cxx_lvalue_0); }
  });
}

export let halfxdimen = 0;
export function __cxx_global_cell_7f82f1ce39a55e3695e486ff() {
  return __cxx_global_cell_7f82f1ce39a55e3695e486ff.reference || (__cxx_global_cell_7f82f1ce39a55e3695e486ff.reference = {
    __cReference: true,
    get value() { return halfxdimen; },
    set value(__cxx_lvalue_0) { halfxdimen = i32(__cxx_lvalue_0); }
  });
}

export let xdimenscale = 0;
export function __cxx_global_cell_c52bd54e6d33290c61ff7d56() {
  return __cxx_global_cell_c52bd54e6d33290c61ff7d56.reference || (__cxx_global_cell_c52bd54e6d33290c61ff7d56.reference = {
    __cReference: true,
    get value() { return xdimenscale; },
    set value(__cxx_lvalue_0) { xdimenscale = i32(__cxx_lvalue_0); }
  });
}

export let xdimscale = 0;
export function __cxx_global_cell_8237672c9966884eda00f429() {
  return __cxx_global_cell_8237672c9966884eda00f429.reference || (__cxx_global_cell_8237672c9966884eda00f429.reference = {
    __cReference: true,
    get value() { return xdimscale; },
    set value(__cxx_lvalue_0) { xdimscale = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1483
export let fxdimen = Math.fround((-Math.fround(1)));
export function __cxx_global_cell_c332faf0c44a2245574f00c2() {
  return __cxx_global_cell_c332faf0c44a2245574f00c2.reference || (__cxx_global_cell_c332faf0c44a2245574f00c2.reference = {
    __cReference: true,
    get value() { return fxdimen; },
    set value(__cxx_lvalue_0) { fxdimen = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1484
export let ydimen = 0;
export function __cxx_global_cell_6314158c901ae0222f46040e() {
  return __cxx_global_cell_6314158c901ae0222f46040e.reference || (__cxx_global_cell_6314158c901ae0222f46040e.reference = {
    __cReference: true,
    get value() { return ydimen; },
    set value(__cxx_lvalue_0) { ydimen = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1485
export let frameoffset = 0n;
export function __cxx_global_cell_f986176c2358743bd466872f() {
  return __cxx_global_cell_f986176c2358743bd466872f.reference || (__cxx_global_cell_f986176c2358743bd466872f.reference = {
    __cReference: true,
    get value() { return frameoffset; },
    set value(__cxx_lvalue_0) { frameoffset = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1487
export let nrx1 = new Int32Array(8);
function __cxx_static_address_1a44dd855d748a769c54b4ca() {
  return __cxx_static_address_1a44dd855d748a769c54b4ca.reference || (__cxx_static_address_1a44dd855d748a769c54b4ca.reference = {
    __cReference: true,
    get value() { return nrx1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nry1 = new Int32Array(8);
function __cxx_static_address_24fe196549dea24f2ab5b180() {
  return __cxx_static_address_24fe196549dea24f2ab5b180.reference || (__cxx_static_address_24fe196549dea24f2ab5b180.reference = {
    __cReference: true,
    get value() { return nry1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nrx2 = new Int32Array(8);
function __cxx_static_address_05b543f6f295efb4339475f0() {
  return __cxx_static_address_05b543f6f295efb4339475f0.reference || (__cxx_static_address_05b543f6f295efb4339475f0.reference = {
    __cReference: true,
    get value() { return nrx2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nry2 = new Int32Array(8);
function __cxx_static_address_2ed8ccc57174f9413796b22f() {
  return __cxx_static_address_2ed8ccc57174f9413796b22f.reference || (__cxx_static_address_2ed8ccc57174f9413796b22f.reference = {
    __cReference: true,
    get value() { return nry2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1489
export let rxi = new Int32Array(8);
function __cxx_static_address_de371a254293adbd04e12362() {
  return __cxx_static_address_de371a254293adbd04e12362.reference || (__cxx_static_address_de371a254293adbd04e12362.reference = {
    __cReference: true,
    get value() { return rxi; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ryi = new Int32Array(8);
function __cxx_static_address_59c3767643b47572db989fd3() {
  return __cxx_static_address_59c3767643b47572db989fd3.reference || (__cxx_static_address_59c3767643b47572db989fd3.reference = {
    __cReference: true,
    get value() { return ryi; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1490
export let rzi = new Int32Array(8);
function __cxx_static_address_58a85746d70aa4e5707bab2e() {
  return __cxx_static_address_58a85746d70aa4e5707bab2e.reference || (__cxx_static_address_58a85746d70aa4e5707bab2e.reference = {
    __cReference: true,
    get value() { return rzi; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let rxi2 = new Int32Array(8);
function __cxx_static_address_1415ea54e5c6f940788b90e6() {
  return __cxx_static_address_1415ea54e5c6f940788b90e6.reference || (__cxx_static_address_1415ea54e5c6f940788b90e6.reference = {
    __cReference: true,
    get value() { return rxi2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ryi2 = new Int32Array(8);
function __cxx_static_address_049caae2838f96aad7b07473() {
  return __cxx_static_address_049caae2838f96aad7b07473.reference || (__cxx_static_address_049caae2838f96aad7b07473.reference = {
    __cReference: true,
    get value() { return ryi2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let rzi2 = new Int32Array(8);
function __cxx_static_address_f148b3f9de71d63a6143576d() {
  return __cxx_static_address_f148b3f9de71d63a6143576d.reference || (__cxx_static_address_f148b3f9de71d63a6143576d.reference = {
    __cReference: true,
    get value() { return rzi2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1491
export let xsi = new Int32Array(8);
function __cxx_static_address_df740e53b07a57e6ded21d47() {
  return __cxx_static_address_df740e53b07a57e6ded21d47.reference || (__cxx_static_address_df740e53b07a57e6ded21d47.reference = {
    __cReference: true,
    get value() { return xsi; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ysi = new Int32Array(8);
function __cxx_static_address_dfd6c16c042094bdf175dc19() {
  return __cxx_static_address_dfd6c16c042094bdf175dc19.reference || (__cxx_static_address_dfd6c16c042094bdf175dc19.reference = {
    __cReference: true,
    get value() { return ysi; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let horizycent = 0;
function __cxx_static_address_e991bfcab826047ea36d44dc() {
  return __cxx_static_address_e991bfcab826047ea36d44dc.reference || (__cxx_static_address_e991bfcab826047ea36d44dc.reference = {
    __cReference: true,
    get value() { return horizycent; },
    set value(__cxx_lvalue_0) { horizycent = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1492
export let horizlookup = 0;
function __cxx_static_address_6ef572a4d918a9b697b4e317() {
  return __cxx_static_address_6ef572a4d918a9b697b4e317.reference || (__cxx_static_address_6ef572a4d918a9b697b4e317.reference = {
    __cReference: true,
    get value() { return horizlookup; },
    set value(__cxx_lvalue_0) { horizlookup = __cxx_lvalue_0; }
  });
}

export let horizlookup2 = 0;
function __cxx_static_address_ef565da95f0d7e5345f8f6f7() {
  return __cxx_static_address_ef565da95f0d7e5345f8f6f7.reference || (__cxx_static_address_ef565da95f0d7e5345f8f6f7.reference = {
    __cReference: true,
    get value() { return horizlookup2; },
    set value(__cxx_lvalue_0) { horizlookup2 = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1494
export let globalposx = 0;
export function __cxx_global_cell_e2e7e2e78c13d070a54f6acf() {
  return __cxx_global_cell_e2e7e2e78c13d070a54f6acf.reference || (__cxx_global_cell_e2e7e2e78c13d070a54f6acf.reference = {
    __cReference: true,
    get value() { return globalposx; },
    set value(__cxx_lvalue_0) { globalposx = i32(__cxx_lvalue_0); }
  });
}

export let globalposy = 0;
export function __cxx_global_cell_d8d658bfa3384159b7740692() {
  return __cxx_global_cell_d8d658bfa3384159b7740692.reference || (__cxx_global_cell_d8d658bfa3384159b7740692.reference = {
    __cReference: true,
    get value() { return globalposy; },
    set value(__cxx_lvalue_0) { globalposy = i32(__cxx_lvalue_0); }
  });
}

export let globalposz = 0;
export function __cxx_global_cell_88f83be237d62d6a2ea45595() {
  return __cxx_global_cell_88f83be237d62d6a2ea45595.reference || (__cxx_global_cell_88f83be237d62d6a2ea45595.reference = {
    __cReference: true,
    get value() { return globalposz; },
    set value(__cxx_lvalue_0) { globalposz = i32(__cxx_lvalue_0); }
  });
}

export let globalhoriz = 0;
export function __cxx_global_cell_5f80e6bd487cb5ba980fe5b1() {
  return __cxx_global_cell_5f80e6bd487cb5ba980fe5b1.reference || (__cxx_global_cell_5f80e6bd487cb5ba980fe5b1.reference = {
    __cReference: true,
    get value() { return globalhoriz; },
    set value(__cxx_lvalue_0) { globalhoriz = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1495
export let qglobalhoriz = 0;
export function __cxx_global_cell_e1c66c2b2a33b1b7ec4cd0fd() {
  return __cxx_global_cell_e1c66c2b2a33b1b7ec4cd0fd.reference || (__cxx_global_cell_e1c66c2b2a33b1b7ec4cd0fd.reference = {
    __cReference: true,
    get value() { return qglobalhoriz; },
    set value(__cxx_lvalue_0) { qglobalhoriz = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1496
export let fglobalposx = 0;
export function __cxx_global_cell_5dca29e734234c42c8a19a5d() {
  return __cxx_global_cell_5dca29e734234c42c8a19a5d.reference || (__cxx_global_cell_5dca29e734234c42c8a19a5d.reference = {
    __cReference: true,
    get value() { return fglobalposx; },
    set value(__cxx_lvalue_0) { fglobalposx = Math.fround(__cxx_lvalue_0); }
  });
}

export let fglobalposy = 0;
export function __cxx_global_cell_1a8fcfa99f53245406636ec4() {
  return __cxx_global_cell_1a8fcfa99f53245406636ec4.reference || (__cxx_global_cell_1a8fcfa99f53245406636ec4.reference = {
    __cReference: true,
    get value() { return fglobalposy; },
    set value(__cxx_lvalue_0) { fglobalposy = Math.fround(__cxx_lvalue_0); }
  });
}

export let fglobalposz = 0;
export function __cxx_global_cell_2c59d83c7865966be0051eb9() {
  return __cxx_global_cell_2c59d83c7865966be0051eb9.reference || (__cxx_global_cell_2c59d83c7865966be0051eb9.reference = {
    __cReference: true,
    get value() { return fglobalposz; },
    set value(__cxx_lvalue_0) { fglobalposz = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1497
export let globalang = 0;
export function __cxx_global_cell_11389f8841553d21f8fe902e() {
  return __cxx_global_cell_11389f8841553d21f8fe902e.reference || (__cxx_global_cell_11389f8841553d21f8fe902e.reference = {
    __cReference: true,
    get value() { return globalang; },
    set value(__cxx_lvalue_0) { globalang = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let globalcursectnum = 0;
export function __cxx_global_cell_4b2cfd21f94290e7fd5d4039() {
  return __cxx_global_cell_4b2cfd21f94290e7fd5d4039.reference || (__cxx_global_cell_4b2cfd21f94290e7fd5d4039.reference = {
    __cReference: true,
    get value() { return globalcursectnum; },
    set value(__cxx_lvalue_0) { globalcursectnum = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1498
export let qglobalang = 0;
export function __cxx_global_cell_64649f97ae3084a695c7ad0e() {
  return __cxx_global_cell_64649f97ae3084a695c7ad0e.reference || (__cxx_global_cell_64649f97ae3084a695c7ad0e.reference = {
    __cReference: true,
    get value() { return qglobalang; },
    set value(__cxx_lvalue_0) { qglobalang = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1499
export let globalpal = 0;
export function __cxx_global_cell_d3e2cd8ae72fbf8d494238da() {
  return __cxx_global_cell_d3e2cd8ae72fbf8d494238da.reference || (__cxx_global_cell_d3e2cd8ae72fbf8d494238da.reference = {
    __cReference: true,
    get value() { return globalpal; },
    set value(__cxx_lvalue_0) { globalpal = i32(__cxx_lvalue_0); }
  });
}

export let cosglobalang = 0;
export function __cxx_global_cell_c783b9980ebf92aa7eec38a8() {
  return __cxx_global_cell_c783b9980ebf92aa7eec38a8.reference || (__cxx_global_cell_c783b9980ebf92aa7eec38a8.reference = {
    __cReference: true,
    get value() { return cosglobalang; },
    set value(__cxx_lvalue_0) { cosglobalang = i32(__cxx_lvalue_0); }
  });
}

export let singlobalang = 0;
export function __cxx_global_cell_08064e67275a42c22a5bb4ad() {
  return __cxx_global_cell_08064e67275a42c22a5bb4ad.reference || (__cxx_global_cell_08064e67275a42c22a5bb4ad.reference = {
    __cReference: true,
    get value() { return singlobalang; },
    set value(__cxx_lvalue_0) { singlobalang = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1500
export let cosviewingrangeglobalang = 0;
export function __cxx_global_cell_8f2b0f863536eea3001e26a8() {
  return __cxx_global_cell_8f2b0f863536eea3001e26a8.reference || (__cxx_global_cell_8f2b0f863536eea3001e26a8.reference = {
    __cReference: true,
    get value() { return cosviewingrangeglobalang; },
    set value(__cxx_lvalue_0) { cosviewingrangeglobalang = i32(__cxx_lvalue_0); }
  });
}

export let sinviewingrangeglobalang = 0;
export function __cxx_global_cell_d2e028be33820ccc16211022() {
  return __cxx_global_cell_d2e028be33820ccc16211022.reference || (__cxx_global_cell_d2e028be33820ccc16211022.reference = {
    __cReference: true,
    get value() { return sinviewingrangeglobalang; },
    set value(__cxx_lvalue_0) { sinviewingrangeglobalang = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1501
export let globaluclip = 0;
function __cxx_static_address_7baa579a03792f1f476c1022() {
  return __cxx_static_address_7baa579a03792f1f476c1022.reference || (__cxx_static_address_7baa579a03792f1f476c1022.reference = {
    __cReference: true,
    get value() { return globaluclip; },
    set value(__cxx_lvalue_0) { globaluclip = i32(__cxx_lvalue_0); }
  });
}

export let globaldclip = 0;
function __cxx_static_address_b7fff70fb07beccc2312e8cc() {
  return __cxx_static_address_b7fff70fb07beccc2312e8cc.reference || (__cxx_static_address_b7fff70fb07beccc2312e8cc.reference = {
    __cReference: true,
    get value() { return globaldclip; },
    set value(__cxx_lvalue_0) { globaldclip = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1502
export let globvis = 0;
export function __cxx_global_cell_513c3e0e39a75ced4b6afb73() {
  return __cxx_global_cell_513c3e0e39a75ced4b6afb73.reference || (__cxx_global_cell_513c3e0e39a75ced4b6afb73.reference = {
    __cReference: true,
    get value() { return globvis; },
    set value(__cxx_lvalue_0) { globvis = i32(__cxx_lvalue_0); }
  });
}

export let globalvisibility = 0;
export function __cxx_global_cell_51e80e31d85b4fcc19a38e9d() {
  return __cxx_global_cell_51e80e31d85b4fcc19a38e9d.reference || (__cxx_global_cell_51e80e31d85b4fcc19a38e9d.reference = {
    __cReference: true,
    get value() { return globalvisibility; },
    set value(__cxx_lvalue_0) { globalvisibility = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1503
export let globalhisibility = 0;
export function __cxx_global_cell_ef33eb533071cecccbae278f() {
  return __cxx_global_cell_ef33eb533071cecccbae278f.reference || (__cxx_global_cell_ef33eb533071cecccbae278f.reference = {
    __cReference: true,
    get value() { return globalhisibility; },
    set value(__cxx_lvalue_0) { globalhisibility = i32(__cxx_lvalue_0); }
  });
}

export let globalpisibility = 0;
export function __cxx_global_cell_79cf4e6ca1e92593fb1fc9be() {
  return __cxx_global_cell_79cf4e6ca1e92593fb1fc9be.reference || (__cxx_global_cell_79cf4e6ca1e92593fb1fc9be.reference = {
    __cReference: true,
    get value() { return globalpisibility; },
    set value(__cxx_lvalue_0) { globalpisibility = i32(__cxx_lvalue_0); }
  });
}

export let globalcisibility = 0;
export function __cxx_global_cell_1fc5736efed0ee886cdb6ab1() {
  return __cxx_global_cell_1fc5736efed0ee886cdb6ab1.reference || (__cxx_global_cell_1fc5736efed0ee886cdb6ab1.reference = {
    __cReference: true,
    get value() { return globalcisibility; },
    set value(__cxx_lvalue_0) { globalcisibility = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1509
export let xyaspect = 0;
export function __cxx_global_cell_04e37a4474feb35e339a7e25() {
  return __cxx_global_cell_04e37a4474feb35e339a7e25.reference || (__cxx_global_cell_04e37a4474feb35e339a7e25.reference = {
    __cReference: true,
    get value() { return xyaspect; },
    set value(__cxx_lvalue_0) { xyaspect = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1510
export let viewingrangerecip = 0;
function __cxx_static_address_ad1b18ed8e716c2860429776() {
  return __cxx_static_address_ad1b18ed8e716c2860429776.reference || (__cxx_static_address_ad1b18ed8e716c2860429776.reference = {
    __cReference: true,
    get value() { return viewingrangerecip; },
    set value(__cxx_lvalue_0) { viewingrangerecip = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1512
export let globalxshift = 0;
function __cxx_static_address_d4e58eacc400ef5a62c6ac04() {
  return __cxx_static_address_d4e58eacc400ef5a62c6ac04.reference || (__cxx_static_address_d4e58eacc400ef5a62c6ac04.reference = {
    __cReference: true,
    get value() { return globalxshift; },
    set value(__cxx_lvalue_0) { globalxshift = (((__cxx_lvalue_0) << 24) >> 24); }
  });
}

export let globalyshift = 0;
function __cxx_static_address_2b3b1cb0a6563f9d3d2b7e01() {
  return __cxx_static_address_2b3b1cb0a6563f9d3d2b7e01.reference || (__cxx_static_address_2b3b1cb0a6563f9d3d2b7e01.reference = {
    __cReference: true,
    get value() { return globalyshift; },
    set value(__cxx_lvalue_0) { globalyshift = (((__cxx_lvalue_0) << 24) >> 24); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1513
export let globalxpanning = 0;
function __cxx_static_address_46290cd4da2a2c088d3036e0() {
  return __cxx_static_address_46290cd4da2a2c088d3036e0.reference || (__cxx_static_address_46290cd4da2a2c088d3036e0.reference = {
    __cReference: true,
    get value() { return globalxpanning; },
    set value(__cxx_lvalue_0) { globalxpanning = i32(__cxx_lvalue_0); }
  });
}

export let globalypanning = 0;
function __cxx_static_address_8b13efd5797e3d6d05ae2368() {
  return __cxx_static_address_8b13efd5797e3d6d05ae2368.reference || (__cxx_static_address_8b13efd5797e3d6d05ae2368.reference = {
    __cReference: true,
    get value() { return globalypanning; },
    set value(__cxx_lvalue_0) { globalypanning = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1514
export let globalshade = 0;
export function __cxx_global_cell_f14ae80b266ffc07f1d273f0() {
  return __cxx_global_cell_f14ae80b266ffc07f1d273f0.reference || (__cxx_global_cell_f14ae80b266ffc07f1d273f0.reference = {
    __cReference: true,
    get value() { return globalshade; },
    set value(__cxx_lvalue_0) { globalshade = i32(__cxx_lvalue_0); }
  });
}

export let globalorientation = 0;
export function __cxx_global_cell_ea54eab8067004e04507e160() {
  return __cxx_global_cell_ea54eab8067004e04507e160.reference || (__cxx_global_cell_ea54eab8067004e04507e160.reference = {
    __cReference: true,
    get value() { return globalorientation; },
    set value(__cxx_lvalue_0) { globalorientation = i32(__cxx_lvalue_0); }
  });
}

export let globalclipdist = 0;
export function __cxx_global_cell_72a3e5978bae92f510bbc380() {
  return __cxx_global_cell_72a3e5978bae92f510bbc380.reference || (__cxx_global_cell_72a3e5978bae92f510bbc380.reference = {
    __cReference: true,
    get value() { return globalclipdist; },
    set value(__cxx_lvalue_0) { globalclipdist = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1515
export let globalshiftval = 0;
function __cxx_static_address_38582e647526ec6d09e0ef21() {
  return __cxx_static_address_38582e647526ec6d09e0ef21.reference || (__cxx_static_address_38582e647526ec6d09e0ef21.reference = {
    __cReference: true,
    get value() { return globalshiftval; },
    set value(__cxx_lvalue_0) { globalshiftval = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1517
export let globalzd = 0n;
function __cxx_static_address_9a862ac1fb19b2104af89911() {
  return __cxx_static_address_9a862ac1fb19b2104af89911.reference || (__cxx_static_address_9a862ac1fb19b2104af89911.reference = {
    __cReference: true,
    get value() { return globalzd; },
    set value(__cxx_lvalue_0) { globalzd = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1521
export let globalyscale = 0;
function __cxx_static_address_47c32b851c625392bd2e81b5() {
  return __cxx_static_address_47c32b851c625392bd2e81b5.reference || (__cxx_static_address_47c32b851c625392bd2e81b5.reference = {
    __cReference: true,
    get value() { return globalyscale; },
    set value(__cxx_lvalue_0) { globalyscale = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1522
export let globalxspan = 0;
function __cxx_static_address_416e9fc55b99267b9a2f168b() {
  return __cxx_static_address_416e9fc55b99267b9a2f168b.reference || (__cxx_static_address_416e9fc55b99267b9a2f168b.reference = {
    __cReference: true,
    get value() { return globalxspan; },
    set value(__cxx_lvalue_0) { globalxspan = i32(__cxx_lvalue_0); }
  });
}

export let globalyspan = 0;
function __cxx_static_address_9da1ffa0025fc4af6f670f7d() {
  return __cxx_static_address_9da1ffa0025fc4af6f670f7d.reference || (__cxx_static_address_9da1ffa0025fc4af6f670f7d.reference = {
    __cReference: true,
    get value() { return globalyspan; },
    set value(__cxx_lvalue_0) { globalyspan = i32(__cxx_lvalue_0); }
  });
}

export let globalispow2 = i32(1);
function __cxx_static_address_0b13edc0bffc01cd59b43a07() {
  return __cxx_static_address_0b13edc0bffc01cd59b43a07.reference || (__cxx_static_address_0b13edc0bffc01cd59b43a07.reference = {
    __cReference: true,
    get value() { return globalispow2; },
    set value(__cxx_lvalue_0) { globalispow2 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1523
export let globalbufplc = 0n;
function __cxx_static_address_0cf6e9bb12665e66ac7150db() {
  return __cxx_static_address_0cf6e9bb12665e66ac7150db.reference || (__cxx_static_address_0cf6e9bb12665e66ac7150db.reference = {
    __cReference: true,
    get value() { return globalbufplc; },
    set value(__cxx_lvalue_0) { globalbufplc = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1525
export let globaly1 = 0;
function __cxx_static_address_2f438a259b3cd48139522696() {
  return __cxx_static_address_2f438a259b3cd48139522696.reference || (__cxx_static_address_2f438a259b3cd48139522696.reference = {
    __cReference: true,
    get value() { return globaly1; },
    set value(__cxx_lvalue_0) { globaly1 = i32(__cxx_lvalue_0); }
  });
}

export let globalx2 = 0;
function __cxx_static_address_2e3bafd8d861dd53117316e5() {
  return __cxx_static_address_2e3bafd8d861dd53117316e5.reference || (__cxx_static_address_2e3bafd8d861dd53117316e5.reference = {
    __cReference: true,
    get value() { return globalx2; },
    set value(__cxx_lvalue_0) { globalx2 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1527
export let sectorborder = new Int16Array(256);
function __cxx_static_address_ee54d5f33be115b460e38d27() {
  return __cxx_static_address_ee54d5f33be115b460e38d27.reference || (__cxx_static_address_ee54d5f33be115b460e38d27.reference = {
    __cReference: true,
    get value() { return sectorborder; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1528
export let ydim16 = 0;
export function __cxx_global_cell_0ba1704deb2d0c84177d6fd9() {
  return __cxx_global_cell_0ba1704deb2d0c84177d6fd9.reference || (__cxx_global_cell_0ba1704deb2d0c84177d6fd9.reference = {
    __cReference: true,
    get value() { return ydim16; },
    set value(__cxx_lvalue_0) { ydim16 = i32(__cxx_lvalue_0); }
  });
}

export let qsetmode = i32(0);
export function __cxx_global_cell_6fba320e7d23de23519fe332() {
  return __cxx_global_cell_6fba320e7d23de23519fe332.reference || (__cxx_global_cell_6fba320e7d23de23519fe332.reference = {
    __cReference: true,
    get value() { return qsetmode; },
    set value(__cxx_lvalue_0) { qsetmode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1529
export let pointhighlight = (((((((-1)) << 16) >> 16)) << 16) >> 16);
export function __cxx_global_cell_0972c2ab00fc82a0e5bce288() {
  return __cxx_global_cell_0972c2ab00fc82a0e5bce288.reference || (__cxx_global_cell_0972c2ab00fc82a0e5bce288.reference = {
    __cReference: true,
    get value() { return pointhighlight; },
    set value(__cxx_lvalue_0) { pointhighlight = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let linehighlight = (((((((-1)) << 16) >> 16)) << 16) >> 16);
export function __cxx_global_cell_422f2fbf66cdfa734fd66a68() {
  return __cxx_global_cell_422f2fbf66cdfa734fd66a68.reference || (__cxx_global_cell_422f2fbf66cdfa734fd66a68.reference = {
    __cReference: true,
    get value() { return linehighlight; },
    set value(__cxx_lvalue_0) { linehighlight = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let sectorhighlight = (((((((-1)) << 16) >> 16)) << 16) >> 16);
export function __cxx_global_cell_b4ff498842e2196a4975d35e() {
  return __cxx_global_cell_b4ff498842e2196a4975d35e.reference || (__cxx_global_cell_b4ff498842e2196a4975d35e.reference = {
    __cReference: true,
    get value() { return sectorhighlight; },
    set value(__cxx_lvalue_0) { sectorhighlight = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let highlightcnt = ((((((0) << 16) >> 16)) << 16) >> 16);
export function __cxx_global_cell_2d245383a6df30f5c99d1939() {
  return __cxx_global_cell_2d245383a6df30f5c99d1939.reference || (__cxx_global_cell_2d245383a6df30f5c99d1939.reference = {
    __cReference: true,
    get value() { return highlightcnt; },
    set value(__cxx_lvalue_0) { highlightcnt = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1530
export let lastx = null;
function __cxx_static_address_ada883e80594d1c803381375() {
  return __cxx_static_address_ada883e80594d1c803381375.reference || (__cxx_static_address_ada883e80594d1c803381375.reference = {
    __cReference: true,
    get value() { return lastx; },
    set value(__cxx_lvalue_0) { lastx = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:1532
export let halfxdim16 = 0;
export function __cxx_global_cell_1f251a6d70a45c654081cf38() {
  return __cxx_global_cell_1f251a6d70a45c654081cf38.reference || (__cxx_global_cell_1f251a6d70a45c654081cf38.reference = {
    __cReference: true,
    get value() { return halfxdim16; },
    set value(__cxx_lvalue_0) { halfxdim16 = i32(__cxx_lvalue_0); }
  });
}

export let midydim16 = 0;
export function __cxx_global_cell_5eb12bcb5dada82061cfcbd7() {
  return __cxx_global_cell_5eb12bcb5dada82061cfcbd7.reference || (__cxx_global_cell_5eb12bcb5dada82061cfcbd7.reference = {
    __cReference: true,
    get value() { return midydim16; },
    set value(__cxx_lvalue_0) { midydim16 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1545
export let permfifo = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"a": {"native": "Int16Array", "offset": 12, "size": 2}, "cx1": {"native": "Int32Array", "offset": 24, "size": 4}, "cx2": {"native": "Int32Array", "offset": 32, "size": 4}, "cy1": {"native": "Int32Array", "offset": 28, "size": 4}, "cy2": {"native": "Int32Array", "offset": 36, "size": 4}, "daalpha": {"native": "Uint8Array", "offset": 19, "size": 1}, "dablend": {"native": "Uint8Array", "offset": 20, "size": 1}, "dapalnum": {"native": "Uint8Array", "offset": 17, "size": 1}, "dashade": {"native": "Int8Array", "offset": 16, "size": 1}, "dastat": {"native": "Uint8Array", "offset": 18, "size": 1}, "pagesleft": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sx": {"native": "Int32Array", "offset": 0, "size": 4}, "sy": {"native": "Int32Array", "offset": 4, "size": 4}, "uniqid": {"native": "Int32Array", "offset": 40, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 44, "union": false}, [512], {}, []);
function __cxx_static_address_9b66aeebdf33b31818556224() {
  return __cxx_static_address_9b66aeebdf33b31818556224.reference || (__cxx_static_address_9b66aeebdf33b31818556224.reference = {
    __cReference: true,
    get value() { return permfifo; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1546
export let permhead = i32(0);
function __cxx_static_address_69e961035c9e18cb70ebe65d() {
  return __cxx_static_address_69e961035c9e18cb70ebe65d.reference || (__cxx_static_address_69e961035c9e18cb70ebe65d.reference = {
    __cReference: true,
    get value() { return permhead; },
    set value(__cxx_lvalue_0) { permhead = i32(__cxx_lvalue_0); }
  });
}

export let permtail = i32(0);
function __cxx_static_address_0a00e930e9d0eddd619065a1() {
  return __cxx_static_address_0a00e930e9d0eddd619065a1.reference || (__cxx_static_address_0a00e930e9d0eddd619065a1.reference = {
    __cReference: true,
    get value() { return permtail; },
    set value(__cxx_lvalue_0) { permtail = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1549
export let numscans = 0;
export function __cxx_global_cell_06d6a31cd434f505d6050036() {
  return __cxx_global_cell_06d6a31cd434f505d6050036.reference || (__cxx_global_cell_06d6a31cd434f505d6050036.reference = {
    __cReference: true,
    get value() { return numscans; },
    set value(__cxx_lvalue_0) { numscans = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let numbunches = 0;
export function __cxx_global_cell_8fca8d596f33dd54caae1045() {
  return __cxx_global_cell_8fca8d596f33dd54caae1045.reference || (__cxx_global_cell_8fca8d596f33dd54caae1045.reference = {
    __cReference: true,
    get value() { return numbunches; },
    set value(__cxx_lvalue_0) { numbunches = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1550
export let numhits = 0;
function __cxx_static_address_f8cd5c27ed55874dfd97cf99() {
  return __cxx_static_address_f8cd5c27ed55874dfd97cf99.reference || (__cxx_static_address_f8cd5c27ed55874dfd97cf99.reference = {
    __cReference: true,
    get value() { return numhits; },
    set value(__cxx_lvalue_0) { numhits = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1552
export let vgapal16 = (() => { const items = new Uint8Array(1024); items.set([((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((170) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((170) & 255), ((0) & 255), ((0) & 255), ((170) & 255), ((170) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((170) & 255), ((0) & 255), ((170) & 255), ((0) & 255), ((170) & 255), ((0) & 255), ((0) & 255), ((85) & 255), ((170) & 255), ((0) & 255), ((170) & 255), ((170) & 255), ((170) & 255), ((0) & 255), ((85) & 255), ((85) & 255), ((85) & 255), ((0) & 255), ((255) & 255), ((85) & 255), ((85) & 255), ((0) & 255), ((85) & 255), ((255) & 255), ((85) & 255), ((0) & 255), ((255) & 255), ((255) & 255), ((85) & 255), ((0) & 255), ((85) & 255), ((85) & 255), ((255) & 255), ((0) & 255), ((255) & 255), ((85) & 255), ((255) & 255), ((0) & 255), ((85) & 255), ((255) & 255), ((255) & 255), ((0) & 255), ((255) & 255), ((255) & 255), ((255) & 255), ((0) & 255)]); return items; })();
function __cxx_static_address_7c0191ef07fa8ad395a09d42() {
  return __cxx_static_address_7c0191ef07fa8ad395a09d42.reference || (__cxx_static_address_7c0191ef07fa8ad395a09d42.reference = {
    __cReference: true,
    get value() { return vgapal16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1572
export let searchit = 0;
export function __cxx_global_cell_13fe4c65d8939cebedb650dd() {
  return __cxx_global_cell_13fe4c65d8939cebedb650dd.reference || (__cxx_global_cell_13fe4c65d8939cebedb650dd.reference = {
    __cReference: true,
    get value() { return searchit; },
    set value(__cxx_lvalue_0) { searchit = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1573
export let searchx = i32((-1));
export function __cxx_global_cell_853c2f0031b3fbadbddd90e9() {
  return __cxx_global_cell_853c2f0031b3fbadbddd90e9.reference || (__cxx_global_cell_853c2f0031b3fbadbddd90e9.reference = {
    __cReference: true,
    get value() { return searchx; },
    set value(__cxx_lvalue_0) { searchx = i32(__cxx_lvalue_0); }
  });
}

export let searchy = 0;
export function __cxx_global_cell_66460e3d31d56a66ad1ade0c() {
  return __cxx_global_cell_66460e3d31d56a66ad1ade0c.reference || (__cxx_global_cell_66460e3d31d56a66ad1ade0c.reference = {
    __cReference: true,
    get value() { return searchy; },
    set value(__cxx_lvalue_0) { searchy = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1574
export let searchsector = 0;
export function __cxx_global_cell_eb7f66098f65c0ae5a9b5a5a() {
  return __cxx_global_cell_eb7f66098f65c0ae5a9b5a5a.reference || (__cxx_global_cell_eb7f66098f65c0ae5a9b5a5a.reference = {
    __cReference: true,
    get value() { return searchsector; },
    set value(__cxx_lvalue_0) { searchsector = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let searchwall = 0;
export function __cxx_global_cell_3b04054f5b5c111d2e7c3124() {
  return __cxx_global_cell_3b04054f5b5c111d2e7c3124.reference || (__cxx_global_cell_3b04054f5b5c111d2e7c3124.reference = {
    __cReference: true,
    get value() { return searchwall; },
    set value(__cxx_lvalue_0) { searchwall = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let searchstat = 0;
export function __cxx_global_cell_ae84628ac59743286e72f468() {
  return __cxx_global_cell_ae84628ac59743286e72f468.reference || (__cxx_global_cell_ae84628ac59743286e72f468.reference = {
    __cReference: true,
    get value() { return searchstat; },
    set value(__cxx_lvalue_0) { searchstat = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1583
export let searchbottomwall = 0;
export function __cxx_global_cell_88812decd85addca772bef18() {
  return __cxx_global_cell_88812decd85addca772bef18.reference || (__cxx_global_cell_88812decd85addca772bef18.reference = {
    __cReference: true,
    get value() { return searchbottomwall; },
    set value(__cxx_lvalue_0) { searchbottomwall = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

export let searchisbottom = 0;
export function __cxx_global_cell_f61d3e4e57e19b57ad740e14() {
  return __cxx_global_cell_f61d3e4e57e19b57ad740e14.reference || (__cxx_global_cell_f61d3e4e57e19b57ad740e14.reference = {
    __cReference: true,
    get value() { return searchisbottom; },
    set value(__cxx_lvalue_0) { searchisbottom = (((__cxx_lvalue_0) << 16) >> 16); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1585
export let inpreparemirror = ((((0) & 255)) & 255);
export function __cxx_global_cell_9541123d8c6d2c52896ac26a() {
  return __cxx_global_cell_9541123d8c6d2c52896ac26a.reference || (__cxx_global_cell_9541123d8c6d2c52896ac26a.reference = {
    __cReference: true,
    get value() { return inpreparemirror; },
    set value(__cxx_lvalue_0) { inpreparemirror = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1586
export let mirrorsx1 = 0;
function __cxx_static_address_cd328c22c3d578eee0f9b68d() {
  return __cxx_static_address_cd328c22c3d578eee0f9b68d.reference || (__cxx_static_address_cd328c22c3d578eee0f9b68d.reference = {
    __cReference: true,
    get value() { return mirrorsx1; },
    set value(__cxx_lvalue_0) { mirrorsx1 = i32(__cxx_lvalue_0); }
  });
}

export let mirrorsy1 = 0;
function __cxx_static_address_7942d4824cd70176426002a4() {
  return __cxx_static_address_7942d4824cd70176426002a4.reference || (__cxx_static_address_7942d4824cd70176426002a4.reference = {
    __cReference: true,
    get value() { return mirrorsy1; },
    set value(__cxx_lvalue_0) { mirrorsy1 = i32(__cxx_lvalue_0); }
  });
}

export let mirrorsx2 = 0;
function __cxx_static_address_868462cfdb733aea09ebd7ed() {
  return __cxx_static_address_868462cfdb733aea09ebd7ed.reference || (__cxx_static_address_868462cfdb733aea09ebd7ed.reference = {
    __cReference: true,
    get value() { return mirrorsx2; },
    set value(__cxx_lvalue_0) { mirrorsx2 = i32(__cxx_lvalue_0); }
  });
}

export let mirrorsy2 = 0;
function __cxx_static_address_07eb31fe62a97eaa361e2bed() {
  return __cxx_static_address_07eb31fe62a97eaa361e2bed.reference || (__cxx_static_address_07eb31fe62a97eaa361e2bed.reference = {
    __cReference: true,
    get value() { return mirrorsy2; },
    set value(__cxx_lvalue_0) { mirrorsy2 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1590
export let setviewcnt = i32(0);
function __cxx_static_address_81959cfc27b74166013f3949() {
  return __cxx_static_address_81959cfc27b74166013f3949.reference || (__cxx_static_address_81959cfc27b74166013f3949.reference = {
    __cReference: true,
    get value() { return setviewcnt; },
    set value(__cxx_lvalue_0) { setviewcnt = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1591
export let bakframeplace = new BigInt64Array(4);
function __cxx_static_address_bc0710a7f482cec1fa7adb40() {
  return __cxx_static_address_bc0710a7f482cec1fa7adb40.reference || (__cxx_static_address_bc0710a7f482cec1fa7adb40.reference = {
    __cReference: true,
    get value() { return bakframeplace; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1592
export let bakxsiz = new Int32Array(4);
function __cxx_static_address_a9914059c8eef8e8ca55539e() {
  return __cxx_static_address_a9914059c8eef8e8ca55539e.reference || (__cxx_static_address_a9914059c8eef8e8ca55539e.reference = {
    __cReference: true,
    get value() { return bakxsiz; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let bakysiz = new Int32Array(4);
function __cxx_static_address_9b71414557c59aee76d026e5() {
  return __cxx_static_address_9b71414557c59aee76d026e5.reference || (__cxx_static_address_9b71414557c59aee76d026e5.reference = {
    __cReference: true,
    get value() { return bakysiz; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1593
export let bakwindowxy1 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, [4], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_4001f699703940c33f6108c3() {
  return __cxx_static_address_4001f699703940c33f6108c3.reference || (__cxx_static_address_4001f699703940c33f6108c3.reference = {
    __cReference: true,
    get value() { return bakwindowxy1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let bakwindowxy2 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, [4], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_ad8e368d94f7eb874509a387() {
  return __cxx_static_address_ad8e368d94f7eb874509a387.reference || (__cxx_static_address_ad8e368d94f7eb874509a387.reference = {
    __cReference: true,
    get value() { return bakwindowxy2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1597
export let baktile = 0;
function __cxx_static_address_72f8763c3cf6b1d2b6ec8cca() {
  return __cxx_static_address_72f8763c3cf6b1d2b6ec8cca.reference || (__cxx_static_address_72f8763c3cf6b1d2b6ec8cca.reference = {
    __cReference: true,
    get value() { return baktile; },
    set value(__cxx_lvalue_0) { baktile = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1602
export let apptitle = (() => { const bytes = new Uint8Array(256); bytes.set([66, 117, 105, 108, 100, 32, 69, 110, 103, 105, 110, 101]); return bytes; })();
function __cxx_static_address_8251b520cee0f6fc5c8e10c0() {
  return __cxx_static_address_8251b520cee0f6fc5c8e10c0.reference || (__cxx_static_address_8251b520cee0f6fc5c8e10c0.reference = {
    __cReference: true,
    get value() { return apptitle; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1702
export function get_rel_coords(x, y) {
  return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": dmulscale6__header_3ffb9a5d0a39(y, cosglobalang, (-x), singlobalang), "y": dmulscale6__header_3ffb9a5d0a39(x, cosviewingrangeglobalang, y, sinviewingrangeglobalang)}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
}

// C/C++ source: source/build/src/engine.cpp:1782
let __static_findUnusedTile_lastUnusedTile = i32((i32((30720 - 256)) - 1));
export function findUnusedTile() {

  for (; (__static_findUnusedTile_lastUnusedTile >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => __static_findUnusedTile_lastUnusedTile, __cxx_lvalue_1 => { __static_findUnusedTile_lastUnusedTile = __cxx_lvalue_1; }))) {
    if (((i32((i32((cPointerElementRef(tilesiz, __static_findUnusedTile_lastUnusedTile).value).x) | i32((cPointerElementRef(tilesiz, __static_findUnusedTile_lastUnusedTile).value).y))) == 0) && (!Boolean((cDeref(cPointerOffset(waloff, __static_findUnusedTile_lastUnusedTile, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value))))) {
      return i32(__static_findUnusedTile_lastUnusedTile);
    }
  }
  return i32((-1));
}

// C/C++ source: source/build/src/engine.cpp:1985
export function tweak_tsizes(tsiz) {
  if (((cDeref(cPointerOffset(pow2long__header_global_b6a453f05dcc1c29, i32((i32((cDeref(cPointerOffset(picsiz, globalpicnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 15)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == i32(cRecordObject(tsiz).x))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((((previous - 1)) << 16) >> 16); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(cRecordObject(tsiz), "x"));
  } else {
    (cRecordObject(tsiz).x = (((((((-i32(cRecordObject(tsiz).x))) << 16) >> 16)) << 16) >> 16));
  }
  if (((cDeref(cPointerOffset(pow2long__header_global_b6a453f05dcc1c29, i32((i32((cDeref(cPointerOffset(picsiz, globalpicnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 4)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == i32(cRecordObject(tsiz).y))) {
    (cRecordObject(tsiz).y = ((((((i32((i32((cDeref(cPointerOffset(picsiz, globalpicnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 4))) << 16) >> 16)) << 16) >> 16));
  } else {
    (cRecordObject(tsiz).y = (((((((-i32(cRecordObject(tsiz).y))) << 16) >> 16)) << 16) >> 16));
  }
}

// C/C++ source: source/build/src/engine.cpp:1998
export function calc_bufplc(bufplc, lw, tsiz) {
  let i = i32((lw + globalxpanning));
  {
    if ((i32(tsiz.x) < 0)) {
      (i = i32((u32(i) % u32((-i32(tsiz.x))))));
    } else {
      (i = i32((i & i32(tsiz.x))));
    }
  }
  if ((i32(tsiz.y) < 0)) {
    (i = i32(Math.imul(i, (-i32(tsiz.y)))));
  } else {
    (i = i32((i << i32(tsiz.y))));
  }
  ((cDeref(bufplc, BigInt64Array).value) = i64((BigInt((globalht ? cRecordObject(globalht).ptr : (cDeref(cPointerOffset(waloff, globalpicnum, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value))) + BigInt(i64(i)))));
}

// C/C++ source: source/build/src/engine.cpp:2022
export function calc_vplcinc_wall(vplc, vinc, sw, y1v) {
  ((cDeref(vinc, Int32Array).value) = i32((BigInt(sw) * BigInt(i64(globalyscale)))));
  ((cDeref(vplc, Uint32Array).value) = u32((BigInt(globalzd) + BigInt(i64(u32(Math.imul(u32((cDeref(vinc, Int32Array).value)), u32(i32((i32((y1v - globalhoriz)) + 1))))))))));
}

// C/C++ source: source/build/src/engine.cpp:2040
export let drawing_sprite = i32(0);
function __cxx_static_address_8ef7c98c27354f6f1ce8191f() {
  return __cxx_static_address_8ef7c98c27354f6f1ce8191f.reference || (__cxx_static_address_8ef7c98c27354f6f1ce8191f.reference = {
    __cReference: true,
    get value() { return drawing_sprite; },
    set value(__cxx_lvalue_0) { drawing_sprite = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:2223
export function wallfront(l1, l2) {
  let l1vect = cCopyAggregate((cPointerElementRef(wall, (cDeref(cPointerOffset(thewall, l1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value).__cxx_anonymous_0.xy, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
  let l1p2vect = cCopyAggregate((cPointerElementRef(wall, (cPointerElementRef(wall, (cDeref(cPointerOffset(thewall, l1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value).point2).value).__cxx_anonymous_0.xy, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
  let l2vect = cCopyAggregate((cPointerElementRef(wall, (cDeref(cPointerOffset(thewall, l2, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value).__cxx_anonymous_0.xy, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
  let l2p2vect = cCopyAggregate((cPointerElementRef(wall, (cPointerElementRef(wall, (cDeref(cPointerOffset(thewall, l2, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value).point2).value).__cxx_anonymous_0.xy, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
  let d = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((l1p2vect.x - l1vect.x)), "y": i32((l1p2vect.y - l1vect.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  let t1 = i32(dmulscale2__header_4687fd622afb(i32((l2vect.x - l1vect.x)), d.y, (-d.x), i32((l2vect.y - l1vect.y))));
  let t2 = i32(dmulscale2__header_4687fd622afb(i32((l2p2vect.x - l1vect.x)), d.y, (-d.x), i32((l2p2vect.y - l1vect.y))));
  if ((t1 == 0)) {
    if ((t2 == 0)) {
      return i32((-1));
    }
    (t1 = i32(t2));
  }
  if ((t2 == 0)) {
    (t2 = i32(t1));
  }
  if ((i32((t1 ^ t2)) >= 0)) {
    return i32((i32((dmulscale2__header_4687fd622afb(i32((globalposx - l1vect.x)), d.y, (-d.x), i32((globalposy - l1vect.y))) ^ t1)) >= 0));
  }
  (d.x = i32((l2p2vect.x - l2vect.x)));
  (d.y = i32((l2p2vect.y - l2vect.y)));
  (t1 = i32(dmulscale2__header_4687fd622afb(i32((l1vect.x - l2vect.x)), d.y, (-d.x), i32((l1vect.y - l2vect.y)))));
  (t2 = i32(dmulscale2__header_4687fd622afb(i32((l1p2vect.x - l2vect.x)), d.y, (-d.x), i32((l1p2vect.y - l2vect.y)))));
  if ((t1 == 0)) {
    if ((t2 == 0)) {
      return i32((-1));
    }
    (t1 = i32(t2));
  }
  if ((t2 == 0)) {
    (t2 = i32(t1));
  }
  if ((i32((t1 ^ t2)) >= 0)) {
    return i32((i32((dmulscale2__header_4687fd622afb(i32((globalposx - l2vect.x)), d.y, (-d.x), i32((globalposy - l2vect.y))) ^ t1)) < 0));
  }
  return i32((-2));
}

// C/C++ source: source/build/src/engine.cpp:2257
export function spritewallfront(s, w) {
  let wal = cRecordPointer(cPointerOffset(wall, w, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  let wal2 = cRecordPointer(cPointerOffset(wall, cRecordObject(wal).point2, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  let v = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.x, "y": cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.y}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  return i32((dmulscale32__header_a06d61cce60b(i32((cRecordObject(wal2).__cxx_anonymous_0.__cxx_anonymous_0.x - v.x)), i32((cRecordObject(s).__cxx_anonymous_0.__cxx_anonymous_0.y - v.y)), (-i32((cRecordObject(s).__cxx_anonymous_0.__cxx_anonymous_0.x - v.x))), i32((cRecordObject(wal2).__cxx_anonymous_0.__cxx_anonymous_0.y - v.y))) >= 0));
}

// C/C++ source: source/build/src/engine.cpp:2321
export function bunchfront(b1, b2) {
  let b1f = i32((cDeref(cPointerOffset(bunchfirst, b1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let x1b1 = i32((cDeref(cPointerOffset(xb1, b1f, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  let x2b2 = i32(((cDeref(cPointerOffset(xb2, (cDeref(cPointerOffset(bunchlast, b2, Int16Array.BYTES_PER_ELEMENT), Int16Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 1));
  if ((x1b1 >= x2b2)) {
    return i32((-1));
  }
  let b2f = i32((cDeref(cPointerOffset(bunchfirst, b2, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let x1b2 = i32((cDeref(cPointerOffset(xb1, b2f, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  let x2b1 = i32(((cDeref(cPointerOffset(xb2, (cDeref(cPointerOffset(bunchlast, b1, Int16Array.BYTES_PER_ELEMENT), Int16Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + 1));
  if ((x1b2 >= x2b1)) {
    return i32((-1));
  }
  if ((x1b1 >= x1b2)) {
    for (; ((cDeref(cPointerOffset(xb2, b2f, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < x1b1); (b2f = i32((cDeref(cPointerOffset(bunchp2, b2f, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) {

    }
    return i32(wallfront(b1f, b2f));
  }
  for (; ((cDeref(cPointerOffset(xb2, b1f, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) < x1b2); (b1f = i32((cDeref(cPointerOffset(bunchp2, b1f, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) {

  }
  return i32(wallfront(b1f, b2f));
}

// C/C++ source: source/build/src/engine.cpp:2484
export function animateoffs(tilenum) {
  let animnum = i32((cPointerElementRef(picanm, tilenum).value).num);
  if ((animnum <= 0)) {
    return i32(0);
  }
  let i = i32((i32(totalclocklock.__cxx_conversion_d67101e1f7110e32()) >> i32((i32((cPointerElementRef(picanm, tilenum).value).sf) & i32(15)))));
  let offs = i32(0);
  switch (i32((i32((cPointerElementRef(picanm, tilenum).value).sf) & i32(192)))) {
    case i32(64): {
      let k = i32((i % i32((animnum << 1))));
      (offs = i32(((k < animnum) ? k : i32((i32((animnum << 1)) - k)))));
    }
    break;
    case i32(128): {
      (offs = i32((i % i32((animnum + 1)))));
    }
    break;
    case i32(192): {
      (offs = i32((-(i % i32((animnum + 1))))));
    }
    break;
  }
  return i32(offs);
}

// C/C++ source: source/build/src/engine.cpp:2536
export function mulscale16z(a, d) {
  return (BigInt((BigInt(i64(a)) * BigInt(i64(d)))) >> BigInt(16));
}

// C/C++ source: source/build/src/engine.cpp:2541
export function mulscale20z(a, d) {
  return (BigInt((BigInt(i64(a)) * BigInt(i64(d)))) >> BigInt(20));
}

// C/C++ source: source/build/src/engine.cpp:2546
export function dmulscale24z(a, d, S, D) {
  return (BigInt((BigInt((BigInt(i64(a)) * BigInt(i64(d)))) + BigInt((BigInt(i64(S)) * BigInt(i64(D)))))) >> BigInt(24));
}

// C/C++ source: source/build/src/engine.cpp:2785
export function calc_globalshifts() {
  (globalxshift = ((((((i32((8 - i32((i32((cDeref(cPointerOffset(picsiz, globalpicnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 15))))) << 24) >> 24)) << 24) >> 24));
  (globalyshift = ((((((i32((8 - i32((i32((cDeref(cPointerOffset(picsiz, globalpicnum, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 4))))) << 24) >> 24)) << 24) >> 24));
  if (Boolean(i32((globalorientation & 8)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((((previous + 1)) << 24) >> 24); __cxx_lvalue_0.value = next; return previous; })(__cxx_static_address_d4e58eacc400ef5a62c6ac04());
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = ((((previous + 1)) << 24) >> 24); __cxx_lvalue_1.value = next; return previous; })(__cxx_static_address_2b3b1cb0a6563f9d3d2b7e01());
  }
}

// C/C++ source: source/build/src/engine.cpp:3402
export function nonpow2_mhline(bufplc, bx, cntup16, by, p) {
  let ch;
  let buf = cTypedPointer(bufplc, Uint8Array);
  let pal = cTypedPointer(asm3, Uint8Array);
  let xmul = u32(globalxspan);
  let ymul = u32(globalyspan);
  let yspan = u32(globalyspan);
  let xinc = i32(asm1);
  let yinc = i32(asm2);
  for ((cntup16 = i32((cntup16 >> 16))); (cntup16 > 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cntup16, __cxx_lvalue_1 => { cntup16 = __cxx_lvalue_1; }))) {
    (ch = (((cDeref(cPointerOffset(buf, u32((u32(Math.imul(u32(mulscale31__header_a8faf60e26f6(i32((bx >>> 1)), i32(xmul))), yspan)) + u32(mulscale31__header_a8faf60e26f6(i32((by >>> 1)), i32(ymul))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(p, Uint8Array).value) = (((cDeref(cPointerOffset(pal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (bx = u32((Number(bx) + Number(u32(xinc)))));
    (by = u32((Number(by) + Number(u32(yinc)))));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; }));
  }
}

// C/C++ source: source/build/src/engine.cpp:3426
export function nonpow2_thline(bufplc, bx, cntup16, by, p) {
  let ch;
  let buf = cTypedPointer(bufplc, Uint8Array);
  let pal = cTypedPointer(asm3, Uint8Array);
  let trans = (cPointerElementRef(blendtable, __cxx_global_cell_9a5f899abe816221fc68b39b().value).value);
  let xmul = u32(globalxspan);
  let ymul = u32(globalyspan);
  let yspan = u32(globalyspan);
  let xinc = i32(asm1);
  let yinc = i32(asm2);
  if (Boolean(i32((globalorientation & 512)))) {
    for ((cntup16 = i32((cntup16 >> 16))); (cntup16 > 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cntup16, __cxx_lvalue_1 => { cntup16 = __cxx_lvalue_1; }))) {
      (ch = (((cDeref(cPointerOffset(buf, u32((u32(Math.imul(u32(mulscale31__header_a8faf60e26f6(i32((bx >>> 1)), i32(xmul))), yspan)) + u32(mulscale31__header_a8faf60e26f6(i32((by >>> 1)), i32(ymul))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(p, Uint8Array).value) = (((cDeref(cPointerOffset(trans, i32((i32((cDeref(p, Uint8Array).value)) | i32((i32((cDeref(cPointerOffset(pal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (bx = u32((Number(bx) + Number(u32(xinc)))));
      (by = u32((Number(by) + Number(u32(yinc)))));
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; }));
    }
  } else {
    for ((cntup16 = i32((cntup16 >> 16))); (cntup16 > 0); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => cntup16, __cxx_lvalue_5 => { cntup16 = __cxx_lvalue_5; }))) {
      (ch = (((cDeref(cPointerOffset(buf, u32((u32(Math.imul(u32(mulscale31__header_a8faf60e26f6(i32((bx >>> 1)), i32(xmul))), yspan)) + u32(mulscale31__header_a8faf60e26f6(i32((by >>> 1)), i32(ymul))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(p, Uint8Array).value) = (((cDeref(cPointerOffset(trans, i32((i32((i32((cDeref(p, Uint8Array).value)) << 8)) | i32((cDeref(cPointerOffset(pal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (bx = u32((Number(bx) + Number(u32(xinc)))));
      (by = u32((Number(by) + Number(u32(yinc)))));
      ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(cRef(() => p, __cxx_lvalue_7 => { p = __cxx_lvalue_7; }));
    }
  }
}

// C/C++ source: source/build/src/engine.cpp:3543
export let gglogx = 0;
function __cxx_static_address_90cff107ec86bc9e027227e3() {
  return __cxx_static_address_90cff107ec86bc9e027227e3.reference || (__cxx_static_address_90cff107ec86bc9e027227e3.reference = {
    __cReference: true,
    get value() { return gglogx; },
    set value(__cxx_lvalue_0) { gglogx = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:3543
export let gglogy = 0;
function __cxx_static_address_81fa3bf4abda47a1a60bfafd() {
  return __cxx_static_address_81fa3bf4abda47a1a60bfafd.reference || (__cxx_static_address_81fa3bf4abda47a1a60bfafd.reference = {
    __cReference: true,
    get value() { return gglogy; },
    set value(__cxx_lvalue_0) { gglogy = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:3543
export let ggpinc = 0;
function __cxx_static_address_a4e3b612802a2fb9b41ac028() {
  return __cxx_static_address_a4e3b612802a2fb9b41ac028.reference || (__cxx_static_address_a4e3b612802a2fb9b41ac028.reference = {
    __cReference: true,
    get value() { return ggpinc; },
    set value(__cxx_lvalue_0) { ggpinc = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:3544
export let ggbuf = null;
function __cxx_static_address_c0676dc261c4b4bcfb09e277() {
  return __cxx_static_address_c0676dc261c4b4bcfb09e277.reference || (__cxx_static_address_c0676dc261c4b4bcfb09e277.reference = {
    __cReference: true,
    get value() { return ggbuf; },
    set value(__cxx_lvalue_0) { ggbuf = __cxx_lvalue_0; }
  });
}

export let ggpal = null;
function __cxx_static_address_8875afa67461fab657e882ab() {
  return __cxx_static_address_8875afa67461fab657e882ab.reference || (__cxx_static_address_8875afa67461fab657e882ab.reference = {
    __cReference: true,
    get value() { return ggpal; },
    set value(__cxx_lvalue_0) { ggpal = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/engine.cpp:3550
export function setupslopevlin_alsotrans(logylogx, bufplc, pinc) {
  sethlinesizes(i32((logylogx & 255)), i32((logylogx >> 8)), bufplc);
  (__cxx_global_cell_f73a7c611278ae39b7b9ad95().value = i32(pinc));
  (gglogx = i32((logylogx & 255)));
  (gglogy = i32((logylogx >> 8)));
  (ggbuf = cTypedPointer(bufplc, Uint8Array));
  (ggpinc = i32(pinc));
  (ggpal = cPointerOffset((cPointerElementRef(palookup, globalpal).value), getpalookupsh__header_1bc310a9a306(0), Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/src/engine.cpp:3564
export function tslopevlin(p, slopalptr, cnt, bx, by) {
  let buf = ggbuf;
  let trans = (cPointerElementRef(blendtable, 0).value);
  let bzinc = i32((BigInt(asm1) >> BigInt(3)));
  let pinc = i32(ggpinc);
  let transmode = i32((globalorientation & 128));
  let xtou = u32(globalx3);
  let ytov = u32(globaly3);
  let logx = i32(gglogx);
  let logy = i32(gglogy);
  let bz = i32(asm3);
  do {
    let i = i32((cDeref(cPointerOffset(sloptable, i32((i32((bz >> 6)) + i32((32768 >> 1)))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
    (bz = i32((Number(bz) + Number(bzinc))));
    let u = u32((u32(bx) + u32(Math.imul(xtou, u32(i)))));
    let v = u32((u32(by) + u32(Math.imul(ytov, u32(i)))));
    let ch = (((((cDeref(cPointerOffset(buf, u32((u32(((u >>> i32((32 - logx))) << logy)) + (v >>> i32((32 - logy))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)) & 255);
    if ((i32(ch) != 255)) {
      (ch = (((cDeref(cTypedPointer((BigInt((cDeref(cPointerOffset(slopalptr, 0, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) + BigInt(i64(ch))), Uint8Array), Uint8Array).value)) & 255));
      ((cDeref(p, Uint8Array).value) = (((((cDeref(cPointerOffset(trans, (Boolean(transmode) ? i32((i32((cDeref(p, Uint8Array).value)) | i32((i32(ch) << 8)))) : i32((i32((i32((cDeref(p, Uint8Array).value)) << 8)) | i32(ch)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)) & 255));
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, -1, BigInt64Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => slopalptr, __cxx_lvalue_1 => { slopalptr = __cxx_lvalue_1; }));
    (p = cPointerOffset(p, pinc, Uint8Array.BYTES_PER_ELEMENT));
  } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_3 => { cnt = __cxx_lvalue_3; }))));
}

// C/C++ source: source/build/src/engine.cpp:3595
export function mslopevlin(p, slopalptr, cnt, bx, by) {
  let buf = ggbuf;
  let bzinc = i32((BigInt(asm1) >> BigInt(3)));
  let pinc = i32(ggpinc);
  let xtou = u32(globalx3);
  let ytov = u32(globaly3);
  let logx = i32(gglogx);
  let logy = i32(gglogy);
  let bz = i32(asm3);
  do {
    let i = i32((cDeref(cPointerOffset(sloptable, i32((i32((bz >> 6)) + i32((32768 >> 1)))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
    (bz = i32((Number(bz) + Number(bzinc))));
    let u = u32((u32(bx) + u32(Math.imul(xtou, u32(i)))));
    let v = u32((u32(by) + u32(Math.imul(ytov, u32(i)))));
    let ch = (((((cDeref(cPointerOffset(buf, u32((u32(((u >>> i32((32 - logx))) << logy)) + (v >>> i32((32 - logy))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)) & 255);
    if ((i32(ch) != 255)) {
      ((cDeref(p, Uint8Array).value) = (((cDeref(cTypedPointer((BigInt((cDeref(cPointerOffset(slopalptr, 0, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) + BigInt(i64(ch))), Uint8Array), Uint8Array).value)) & 255));
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, -1, BigInt64Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => slopalptr, __cxx_lvalue_1 => { slopalptr = __cxx_lvalue_1; }));
    (p = cPointerOffset(p, pinc, Uint8Array.BYTES_PER_ELEMENT));
  } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_3 => { cnt = __cxx_lvalue_3; }))));
}

// C/C++ source: source/build/src/engine.cpp:3625
export const pow2invfloat = new Float32Array([Math.fround((Math.fround(1) / Math.fround(i32((1 << 0))))), Math.fround((Math.fround(1) / Math.fround(i32((1 << 1))))), Math.fround((Math.fround(1) / Math.fround(i32((1 << 2))))), Math.fround((Math.fround(1) / Math.fround(i32((1 << 3))))), Math.fround((Math.fround(1) / Math.fround(i32((1 << 4))))), Math.fround((Math.fround(1) / Math.fround(i32((1 << 5))))), Math.fround((Math.fround(1) / Math.fround(i32((1 << 6))))), Math.fround((Math.fround(1) / Math.fround(i32((1 << 7)))))]);
function __cxx_static_address_868592f603b3b55596974c04() {
  return __cxx_static_address_868592f603b3b55596974c04.reference || (__cxx_static_address_868592f603b3b55596974c04.reference = {
    __cReference: true,
    get value() { return pow2invfloat; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:4455
export function should_clip_cwall(x1, x2) {
  let x;
  if ((yax_globallev <= 8)) {
    return i32(1);
  }
  for ((x = i32(x1)); (x <= x2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; }))) {
    if (((i32((cDeref(cPointerOffset(dwall, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) < i32((cDeref(cPointerOffset(dmost, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))) || (i32((cDeref(cPointerOffset(uplc, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) < i32((cDeref(cPointerOffset(dmost, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))))) {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/engine.cpp:4470
export function should_clip_fwall(x1, x2) {
  let x;
  if ((yax_globallev >= 8)) {
    return i32(1);
  }
  for ((x = i32(x1)); (x <= x2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; }))) {
    if (((i32((cDeref(cPointerOffset(uwall, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > i32((cDeref(cPointerOffset(umost, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))) || (i32((cDeref(cPointerOffset(dplc, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) > i32((cDeref(cPointerOffset(umost, x, Int16Array.BYTES_PER_ELEMENT), Int16Array).value))))) {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/engine.cpp:5472
export function mulscale_triple30(a, b, c) {
  return i32((BigInt((BigInt((BigInt(i64(a)) * BigInt(i64(b)))) * BigInt(i64(c)))) >> BigInt(30)));
}

// C/C++ source: source/build/src/engine.cpp:8461
export function msqrtasm(c) {
  let a = u32(1073741824n);
  let b = u32(536870912n);
  do {
    if ((c >= a)) {
      (c = u32((Number(c) - Number(a))));
      (a = u32((Number(a) + Number(u32(Math.imul(b, u32(4)))))));
    }
    (a = u32((Number(a) - Number(b))));
    (a = u32((a >> 1)));
    (b = u32((b >> 2)));
  } while (Boolean(b));
  if ((c >= a)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => a, __cxx_lvalue_1 => { a = __cxx_lvalue_1; }));
  }
  return u32((a >>> 1));
}

// C/C++ source: source/build/src/engine.cpp:8631
export function calcbritable() {
  let i;
  let j;
  let a;
  let b;
  for ((i = i32(0)); (i < 16); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (a = Math.fround(Math.fround((Math.fround(8) / Math.fround((Math.fround(Math.fround(i)) + Math.fround(8)))))));
    (b = Math.fround(Math.fround((Math.fround(255) / powf(Math.fround(255), a)))));
    for ((j = i32(0)); (j < 256); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => j, __cxx_lvalue_3 => { j = __cxx_lvalue_3; }))) {
      ((cPointerElementRef(britable, i).value)[j] = ((((((((Math.fround((powf(Math.fround(Math.fround(j)), a) * b))) & 255)) & 255)) & 255)) & 255));
    }
  }
}

// C/C++ source: source/build/src/engine.cpp:8721
export function do_insertsprite_at_headofsect(spritenum, sectnum) {
  let ohead = ((((cDeref(cPointerOffset(headspritesect, sectnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) << 16) >> 16);
  ((cDeref(cPointerOffset(prevspritesect, spritenum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(nextspritesect, spritenum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((ohead) << 16) >> 16));
  if ((i32(ohead) >= 0)) {
    ((cDeref(cPointerOffset(prevspritesect, ohead, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((spritenum) << 16) >> 16));
  }
  ((cDeref(cPointerOffset(headspritesect, sectnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((spritenum) << 16) >> 16));
  ((cPointerElementRef(sprite, spritenum).value).sectnum = (((sectnum) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:8735
export function do_deletespritesect(deleteme) {
  let sectnum = i32((cPointerElementRef(sprite, deleteme).value).sectnum);
  let prev = i32((cDeref(cPointerOffset(prevspritesect, deleteme, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let next = i32((cDeref(cPointerOffset(nextspritesect, deleteme, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  if ((i32((cDeref(cPointerOffset(headspritesect, sectnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) == i32(deleteme))) {
    ((cDeref(cPointerOffset(headspritesect, sectnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((next) << 16) >> 16)) << 16) >> 16));
  }
  if ((prev >= 0)) {
    ((cDeref(cPointerOffset(nextspritesect, prev, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((next) << 16) >> 16)) << 16) >> 16));
  }
  if ((next >= 0)) {
    ((cDeref(cPointerOffset(prevspritesect, next, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((prev) << 16) >> 16)) << 16) >> 16));
  }
}

// C/C++ source: source/build/src/engine.cpp:8752
export function do_insertsprite_at_headofstat(spritenum, statnum) {
  let ohead = ((((cDeref(cPointerOffset(headspritestat, statnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) << 16) >> 16);
  ((cDeref(cPointerOffset(prevspritestat, spritenum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(nextspritestat, spritenum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((ohead) << 16) >> 16));
  if ((i32(ohead) >= 0)) {
    ((cDeref(cPointerOffset(prevspritestat, ohead, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((spritenum) << 16) >> 16));
  }
  ((cDeref(cPointerOffset(headspritestat, statnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((spritenum) << 16) >> 16));
  ((cPointerElementRef(sprite, spritenum).value).statnum = (((statnum) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:8766
export function insertspritestat(statnum) {
  if (((i32(statnum) >= 1024) || (i32((cDeref(cPointerOffset(headspritestat, 1024, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) == (-1)))) {
    return i32((-1));
  }
  let blanktouse = ((((cDeref(cPointerOffset(headspritestat, 1024, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) << 16) >> 16);
  ((cDeref(cPointerOffset(headspritestat, 1024, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((cDeref(cPointerOffset(nextspritestat, blanktouse, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) << 16) >> 16));
  if ((i32((cDeref(cPointerOffset(headspritestat, 1024, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) >= 0)) {
    ((cDeref(cPointerOffset(prevspritestat, (cDeref(cPointerOffset(headspritestat, 1024, Int16Array.BYTES_PER_ELEMENT), Int16Array).value), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  } else {
    if ((enginecompatibilitymode == i32(2147483647))) {
      (tailspritefree = (((((((-1)) << 16) >> 16)) << 16) >> 16));
    }
  }
  do_insertsprite_at_headofstat(blanktouse, statnum);
  return i32(blanktouse);
}

// C/C++ source: source/build/src/engine.cpp:8787
export function do_deletespritestat(deleteme) {
  let sectnum = i32((cPointerElementRef(sprite, deleteme).value).statnum);
  let prev = i32((cDeref(cPointerOffset(prevspritestat, deleteme, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let next = i32((cDeref(cPointerOffset(nextspritestat, deleteme, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  if ((i32((cDeref(cPointerOffset(headspritestat, sectnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) == i32(deleteme))) {
    ((cDeref(cPointerOffset(headspritestat, sectnum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((next) << 16) >> 16)) << 16) >> 16));
  }
  if ((prev >= 0)) {
    ((cDeref(cPointerOffset(nextspritestat, prev, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((next) << 16) >> 16)) << 16) >> 16));
  }
  if ((next >= 0)) {
    ((cDeref(cPointerOffset(prevspritestat, next, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((prev) << 16) >> 16)) << 16) >> 16));
  }
}

// C/C++ source: source/build/src/engine.cpp:8805
export function insertsprite(sectnum, statnum) {
  let newspritenum = i32(insertspritestat(statnum));
  if ((newspritenum >= 0)) {
    (u32(sectnum) < u32(4096));
    do_insertsprite_at_headofsect((((newspritenum) << 16) >> 16), sectnum);
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_4e6f24ae9c3dade74700992b());
  }
  return i32(newspritenum);
}

// C/C++ source: source/build/src/engine.cpp:8825
export function deletesprite(spritenum) {
  (i32((i32((cPointerElementRef(sprite, spritenum).value).statnum) == 1024)) == i32((i32((cPointerElementRef(sprite, spritenum).value).sectnum) == 4096)));
  if ((i32((cPointerElementRef(sprite, spritenum).value).statnum) == 1024)) {
    return i32((-1));
  }
  do_deletespritestat(spritenum);
  do_deletespritesect(spritenum);
  ((cPointerElementRef(sprite, spritenum).value).sectnum = ((((((4096) << 16) >> 16)) << 16) >> 16));
  if ((enginecompatibilitymode != i32(2147483647))) {
    do_insertsprite_at_headofstat(spritenum, (((1024) << 16) >> 16));
  } else {
    ((cDeref(cPointerOffset(prevspritestat, spritenum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((tailspritefree) << 16) >> 16));
    ((cDeref(cPointerOffset(nextspritestat, spritenum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
    if ((i32(tailspritefree) >= 0)) {
      ((cDeref(cPointerOffset(nextspritestat, tailspritefree, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((spritenum) << 16) >> 16));
    } else {
      ((cDeref(cPointerOffset(headspritestat, 1024, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((spritenum) << 16) >> 16));
    }
    ((cPointerElementRef(sprite, spritenum).value).statnum = ((((((1024) << 16) >> 16)) << 16) >> 16));
    (tailspritefree = (((spritenum) << 16) >> 16));
  }
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_4e6f24ae9c3dade74700992b());
  return i32(0);
}

// C/C++ source: source/build/src/engine.cpp:8863
export function changespritesect(spritenum, newsectnum) {
  if ((((i32(newsectnum) < 0) || (i32(newsectnum) > 4096)) || (i32((cPointerElementRef(sprite, spritenum).value).sectnum) == 4096))) {
    return i32((-1));
  }
  if ((i32((cPointerElementRef(sprite, spritenum).value).sectnum) == i32(newsectnum))) {
    return i32(0);
  }
  do_deletespritesect(spritenum);
  do_insertsprite_at_headofsect(spritenum, newsectnum);
  return i32(0);
}

// C/C++ source: source/build/src/engine.cpp:8881
export function changespritestat(spritenum, newstatnum) {
  if ((((i32(newstatnum) < 0) || (i32(newstatnum) > 1024)) || (i32((cPointerElementRef(sprite, spritenum).value).statnum) == 1024))) {
    return i32((-1));
  }
  if ((i32((cPointerElementRef(sprite, spritenum).value).statnum) == i32(newstatnum))) {
    return i32(0);
  }
  do_deletespritestat(spritenum);
  do_insertsprite_at_headofstat(spritenum, newstatnum);
  return i32(0);
}

// C/C++ source: source/build/src/engine.cpp:9149
export let preinitcalled = i32(0);
function __cxx_static_address_5127bf7d54074c32ac833da9() {
  return __cxx_static_address_5127bf7d54074c32ac833da9.reference || (__cxx_static_address_5127bf7d54074c32ac833da9.reference = {
    __cReference: true,
    get value() { return preinitcalled; },
    set value(__cxx_lvalue_0) { preinitcalled = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9152
export let spriteext_s = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"tspr": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "alpha": {"native": "Float32Array", "offset": 8, "size": 4}, "filler": {"length": 12, "native": "Uint8Array", "offset": 52, "size": 12}, "flags": {"native": "Uint16Array", "offset": 12, "size": 2}, "mdangoff": {"native": "Int16Array", "offset": 20, "size": 2}, "mdanimcur": {"native": "Int16Array", "offset": 14, "size": 2}, "mdanimtims": {"native": "Uint32Array", "offset": 16, "size": 4}, "mdpitch": {"native": "Int16Array", "offset": 24, "size": 2}, "mdpivot_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 28}, "mdposition_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 40}, "mdroll": {"native": "Int16Array", "offset": 26, "size": 2}, "xpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 64, "union": false}, [16640], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_3c22db54197c50244e570b3b() {
  return __cxx_static_address_3c22db54197c50244e570b3b.reference || (__cxx_static_address_3c22db54197c50244e570b3b.reference = {
    __cReference: true,
    get value() { return spriteext_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9153
export let spritesmooth_s = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"mdcurframe": {"native": "Int16Array", "offset": 4, "size": 2}, "mdoldframe": {"native": "Int16Array", "offset": 6, "size": 2}, "mdsmooth": {"native": "Int16Array", "offset": 8, "size": 2}, "smoothduration": {"native": "Float32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 10, "union": false}, [16640], {}, []);
function __cxx_static_address_9ff199cc86599d9f1f9e95e3() {
  return __cxx_static_address_9ff199cc86599d9f1f9e95e3.reference || (__cxx_static_address_9ff199cc86599d9f1f9e95e3.reference = {
    __cReference: true,
    get value() { return spritesmooth_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9154
export let sector_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"ceilingheinum": {"native": "Int16Array", "offset": 18, "size": 2}, "ceilingpal": {"native": "Uint8Array", "offset": 21, "size": 1}, "ceilingpicnum": {"native": "Int16Array", "offset": 16, "size": 2}, "ceilingshade": {"native": "Int8Array", "offset": 20, "size": 1}, "ceilingstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "ceilingxpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ceilingypanning": {"native": "Uint8Array", "offset": 23, "size": 1}, "ceilingz": {"native": "Int32Array", "offset": 4, "size": 4}, "extra": {"native": "Int16Array", "offset": 38, "size": 2}, "floorheinum": {"native": "Int16Array", "offset": 26, "size": 2}, "floorpal": {"native": "Uint8Array", "offset": 29, "size": 1}, "floorpicnum": {"native": "Int16Array", "offset": 24, "size": 2}, "floorshade": {"native": "Int8Array", "offset": 28, "size": 1}, "floorstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "floorxpanning": {"native": "Uint8Array", "offset": 30, "size": 1}, "floorypanning": {"native": "Uint8Array", "offset": 31, "size": 1}, "floorz": {"native": "Int32Array", "offset": 8, "size": 4}, "fogpal": {"native": "Uint8Array", "offset": 33, "size": 1}, "hitag": {"native": "Int16Array", "offset": 36, "size": 2}, "lotag": {"native": "Int16Array", "offset": 34, "size": 2}, "visibility": {"native": "Uint8Array", "offset": 32, "size": 1}, "wallnum": {"native": "Int16Array", "offset": 2, "size": 2}, "wallptr": {"native": "Int16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 40, "union": false}, [4098], {}, []);
function __cxx_static_address_57a7edf2c0691b02e77503ed() {
  return __cxx_static_address_57a7edf2c0691b02e77503ed.reference || (__cxx_static_address_57a7edf2c0691b02e77503ed.reference = {
    __cReference: true,
    get value() { return sector_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9155
export let wall_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, [16896], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, []);
function __cxx_static_address_def18c5f2ddd780b4e9aae03() {
  return __cxx_static_address_def18c5f2ddd780b4e9aae03.reference || (__cxx_static_address_def18c5f2ddd780b4e9aae03.reference = {
    __cReference: true,
    get value() { return wall_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9157
export let wallext_s = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"blend": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 1, "union": false}, [16384], {}, []);
function __cxx_static_address_8a7d8d4292bcc0ae39450c8f() {
  return __cxx_static_address_8a7d8d4292bcc0ae39450c8f.reference || (__cxx_static_address_8a7d8d4292bcc0ae39450c8f.reference = {
    __cReference: true,
    get value() { return wallext_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9159
export let sprite_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, [16384], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}, []);
function __cxx_static_address_16c293837f97979c8bb0839d() {
  return __cxx_static_address_16c293837f97979c8bb0839d.reference || (__cxx_static_address_16c293837f97979c8bb0839d.reference = {
    __cReference: true,
    get value() { return sprite_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9160
export let tsprite_s = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, [4096], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}, []);
function __cxx_static_address_6ab8e02ef92e8b99e5120115() {
  return __cxx_static_address_6ab8e02ef92e8b99e5120115.reference || (__cxx_static_address_6ab8e02ef92e8b99e5120115.reference = {
    __cReference: true,
    get value() { return tsprite_s; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:9358
export function initspritelists() {
  let i;
  for ((i = i32(0)); (i < 4096); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset(headspritesect, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  }
  ((cDeref(cPointerOffset(headspritesect, 4096, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((0) << 16) >> 16)) << 16) >> 16));
  for ((i = i32(0)); (i < 16384); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    ((cDeref(cPointerOffset(prevspritesect, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i - 1))) << 16) >> 16)) << 16) >> 16));
    ((cDeref(cPointerOffset(nextspritesect, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i + 1))) << 16) >> 16)) << 16) >> 16));
    ((cPointerElementRef(sprite, i).value).sectnum = ((((((4096) << 16) >> 16)) << 16) >> 16));
  }
  ((cDeref(cPointerOffset(prevspritesect, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(nextspritesect, i32((16384 - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  for ((i = i32(0)); (i < 1024); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    ((cDeref(cPointerOffset(headspritestat, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  }
  ((cDeref(cPointerOffset(headspritestat, 1024, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((0) << 16) >> 16)) << 16) >> 16));
  for ((i = i32(0)); (i < 16384); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    ((cDeref(cPointerOffset(prevspritestat, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i - 1))) << 16) >> 16)) << 16) >> 16));
    ((cDeref(cPointerOffset(nextspritestat, i, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = ((((((i32((i + 1))) << 16) >> 16)) << 16) >> 16));
    ((cPointerElementRef(sprite, i).value).statnum = ((((((1024) << 16) >> 16)) << 16) >> 16));
  }
  ((cDeref(cPointerOffset(prevspritestat, 0, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  ((cDeref(cPointerOffset(nextspritestat, i32((16384 - 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  (tailspritefree = ((((((i32((16384 - 1))) << 16) >> 16)) << 16) >> 16));
  (Numsprites = i32(0));
}

// C/C++ source: source/build/src/engine.cpp:9772
export function equation(x1, y1, x2, y2) {
  let f = Math.fround(Math.fround((x2 - x1)));
  if ((f == Math.fround(0))) {
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"a": {"native": "Float32Array", "offset": 0, "size": 4}, "b": {"native": "Float32Array", "offset": 4, "size": 4}, "c": {"native": "Float32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, {"a": Math.fround(1), "b": Math.fround(0), "c": (-x1)}, null, {});
  } else {
    let ff = Math.fround(Math.fround((Math.fround((y2 - y1)) / f)));
    return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"a": {"native": "Float32Array", "offset": 0, "size": 4}, "b": {"native": "Float32Array", "offset": 4, "size": 4}, "c": {"native": "Float32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, {"a": ff, "b": Math.fround((-1)), "c": Math.fround((y1 - Math.fround((ff * x1))))}, null, {});
  }
}

// C/C++ source: source/build/src/engine.cpp:9866
export function sameside(eq, p1, p2) {
  let sign1 = Math.fround(Math.fround((Math.fround((Math.fround((cRecordObject(eq).a * cRecordObject(p1).x)) + Math.fround((cRecordObject(eq).b * cRecordObject(p1).y)))) + cRecordObject(eq).c)));
  let sign2 = Math.fround(Math.fround((Math.fround((Math.fround((cRecordObject(eq).a * cRecordObject(p2).x)) + Math.fround((cRecordObject(eq).b * cRecordObject(p2).y)))) + cRecordObject(eq).c)));
  return Boolean((Math.fround((sign1 * sign2)) > Math.fround(0)));
}

// C/C++ source: source/build/src/engine.cpp:9985
export function PolymostPrepareMasks() {

}

// C/C++ source: source/build/src/engine.cpp:10009
export function PolymostDrawMasks(numSprites) {

}

// C/C++ source: source/build/src/engine.cpp:10085
export function DrawDebugSpriteMarkers() {

}

// C/C++ source: source/build/src/engine.cpp:10118
export function GetCenterPoint(tspr) {
  switch (i32((i32(cRecordObject(tspr).cstat) & i32(48)))) {
    case i32(16): {
      return cCopyAggregate(get_wallspr_center__header_a959641b90ef(tspr), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
    }
    case i32(32): {
      return cCopyAggregate(get_floorspr_center__header_7edd9651e893(tspr, false), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
    }
    case i32(48): {
      return cCopyAggregate(get_floorspr_center__header_7edd9651e893(tspr, true), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
    }
    case i32(0): {
      return cCopyAggregate(cRecordObject(tspr).__cxx_anonymous_0.xy, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
    }
  }
  __builtin_unreachable();
}

// C/C++ source: source/build/src/engine.cpp:10774
export function have_maptext() {
  return i32((mapversion >= 10));
}

// C/C++ source: source/build/src/engine.cpp:10818
export function getreachabilitybitmapsegmentsize() {
  return u64(i32((i32((i32(numsectors) + 7)) >> 3)));
}

// C/C++ source: source/build/src/engine.cpp:10823
export function getreachabilitybitmapsize() {
  return u64((BigInt(u64(numsectors)) * BigInt(getreachabilitybitmapsegmentsize())));
}

// C/C++ source: source/build/src/engine.cpp:10828
export function getreachabilitybitmap(sectnum) {
  return cTypedPointer(cPointerOffset(reachablesectors, (BigInt(u64(sectnum)) * BigInt(getreachabilitybitmapsegmentsize())), Uint8Array.BYTES_PER_ELEMENT), Uint8Array);
}

// C/C++ source: source/build/src/engine.cpp:11021
export function remove_sprite(i) {
  cByteMemory.memset(cPointerOffset(sprite, i, 44), 0, 44);
  ((cPointerElementRef(sprite, i).value).statnum = ((((((1024) << 16) >> 16)) << 16) >> 16));
  ((cPointerElementRef(sprite, i).value).sectnum = ((((((4096) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:11589
export function get_mapversion() {
  if ((numyaxbunches > 0)) {
    return i32(9);
  }
  if ((((i32(numsectors) > 1024) || (i32(numwalls) > 8192)) || (Numsprites > 4096))) {
    return i32(8);
  }
  return i32(7);
}

// C/C++ source: source/build/src/engine.cpp:12125
export let voxpal = new Uint8Array(768);
function __cxx_static_address_59580c71e1d2f044a406c25d() {
  return __cxx_static_address_59580c71e1d2f044a406c25d.reference || (__cxx_static_address_59580c71e1d2f044a406c25d.reference = {
    __cReference: true,
    get value() { return voxpal; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:12126
export let maxvoxcol = 0;
export function __cxx_global_cell_ba80300438aabbb362bcb96a() {
  return __cxx_global_cell_ba80300438aabbb362bcb96a.reference || (__cxx_global_cell_ba80300438aabbb362bcb96a.reference = {
    __cReference: true,
    get value() { return maxvoxcol; },
    set value(__cxx_lvalue_0) { maxvoxcol = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/engine.cpp:12128
export function getVoxelColorMap(davoxptr, bitmap) {
  cByteMemory.memset(bitmap, (-1), u64(i32((i32((256 + 7)) >> 3))));
  (maxvoxcol = ((((0) & 255)) & 255));
  let longptr = cTypedPointer(davoxptr, Int32Array);
  let xsiz = i32(B_PASS32__header_62f2ccfacebc((cDeref(cPointerOffset(longptr, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  let ysiz = i32(B_PASS32__header_62f2ccfacebc((cDeref(cPointerOffset(longptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  (davoxptr = cPointerOffset(davoxptr, i32((6 << 2)), Uint8Array.BYTES_PER_ELEMENT));
  (longptr = cTypedPointer(davoxptr, Int32Array));
  let xyvoxoffs = i32((i32((xsiz + 1)) << 2));
  for (let x = i32(0); (x < xsiz); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; }))) {
    let slabxoffs = i64(cPointerOffset(davoxptr, B_PASS32__header_62f2ccfacebc((cDeref(cPointerOffset(longptr, x, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)), Uint8Array.BYTES_PER_ELEMENT));
    let shortptr = cTypedPointer(cPointerOffset(davoxptr, i32((i32((i32(Math.imul(x, i32((ysiz + 1)))) << 1)) + xyvoxoffs)), Uint8Array.BYTES_PER_ELEMENT), Int16Array);
    for (let y = i32(0); (y < ysiz); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => y, __cxx_lvalue_3 => { y = __cxx_lvalue_3; }))) {
      let voxptr = cTypedPointer((BigInt(i64(B_PASS16__header_b0a656a2f158((cDeref(cPointerOffset(shortptr, y, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) + BigInt(slabxoffs)), Uint8Array);
      let voxend = cTypedPointer((BigInt(i64(B_PASS16__header_b0a656a2f158((cDeref(cPointerOffset(shortptr, i32((y + 1)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)))) + BigInt(slabxoffs)), Uint8Array);
      for (; cPointerCompare(voxptr, voxend, "<"); (voxptr = cPointerOffset(voxptr, i32((i32((cDeref(cPointerOffset(voxptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 3)), Uint8Array.BYTES_PER_ELEMENT))) {
        let zleng = (((((cDeref(cPointerOffset(voxptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)) & 255);
        let offs = ((((0) & 255)) & 255);
        do {
          let coloridx = (((((cDeref(cPointerOffset(voxptr, i32((3 + i32(offs))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)) & 255);
          if ((i32(coloridx) > i32(maxvoxcol))) {
            (maxvoxcol = ((coloridx) & 255));
          }
          bitmap_clear__header_4ac52a79d043(bitmap, i32(coloridx));
          ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = (((previous + 1)) & 255); __cxx_lvalue_4.value = next; return previous; })(cRef(() => offs, __cxx_lvalue_5 => { offs = __cxx_lvalue_5; }));
        } while (Boolean(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = (((previous - 1)) & 255); __cxx_lvalue_6.value = next; return next; })(cRef(() => zleng, __cxx_lvalue_7 => { zleng = __cxx_lvalue_7; }))));
      }
    }
  }
}

// C/C++ source: source/build/src/engine.cpp:12301
export function vox_clearid(voxindex) {
  if ((u32(voxindex) >= u32(2048))) {
    return;
  }
  for (let j = i64(0); (j < i64(5)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return next; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    ((cPointerElementRef(voxlock, voxindex).value)[j] = ((((1) & 255)) & 255));
    ((cPointerElementRef(voxoff, voxindex).value)[j] = i64(0));
  }
  ((cDeref(cPointerOffset(voxscale, voxindex, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(65536));
  ((cDeref(cPointerOffset(voxflags, voxindex, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
}

// C/C++ source: source/build/src/engine.cpp:12327
export function vox_undefine(tile) {
  vox_clearid(i32((cDeref(cPointerOffset(tiletovox, tile, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)));
  ((cDeref(cPointerOffset(tiletovox, tile, Int16Array.BYTES_PER_ELEMENT), Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:12338
export function inside_19950829(x, y, sectnum) {
  if (((i32(sectnum) >= 0) && (i32(sectnum) < i32(numsectors)))) {
    let cnt = i32(0);
    let wal = cRecordPointer(cPointerOffset(wall, (cPointerElementRef(sector, sectnum).value).wallptr, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
    let wallsleft = i32((cPointerElementRef(sector, sectnum).value).wallnum);
    do {
      let v1 = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.x - x)), "y": i32((cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.y - y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
      let wal2 = cRecordObject(cRecordPointer(cPointerOffset(wall, cRecordObject(wal).point2, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}));
      let v2 = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((wal2.__cxx_anonymous_0.__cxx_anonymous_0.x - x)), "y": i32((wal2.__cxx_anonymous_0.__cxx_anonymous_0.y - y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
      if ((i32((v1.y ^ v2.y)) < 0)) {
        (cnt = i32((cnt ^ ((i32((v1.x ^ v2.x)) < 0) ? i32((i32((i32(Math.imul(v1.x, v2.y)) < i32(Math.imul(v2.x, v1.y)))) ^ i32((v1.y < v2.y)))) : i32((v1.x >= 0))))));
      }
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_0.value = next; return previous; })(cRef(() => wal, __cxx_lvalue_1 => { wal = __cxx_lvalue_1; }));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => wallsleft, __cxx_lvalue_3 => { wallsleft = __cxx_lvalue_3; }))));
    return i32(cnt);
  }
  return i32((-1));
}

// C/C++ source: source/build/src/engine.cpp:12365
export function inside_compat(x, y, sectnum) {
  if (((i32(sectnum) >= 0) && (i32(sectnum) < i32(numsectors)))) {
    let cnt = u32(0);
    let wal = cRecordPointer(cPointerOffset(wall, (cPointerElementRef(sector, sectnum).value).wallptr, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
    let wallsleft = i32((cPointerElementRef(sector, sectnum).value).wallnum);
    do {
      let v1 = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.x - x)), "y": i32((cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.y - y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
      let wal2 = cRecordObject(cRecordPointer(cPointerOffset(wall, cRecordObject(wal).point2, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}));
      let v2 = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((wal2.__cxx_anonymous_0.__cxx_anonymous_0.x - x)), "y": i32((wal2.__cxx_anonymous_0.__cxx_anonymous_0.y - y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
      if ((i32((v1.y ^ v2.y)) < 0)) {
        (cnt = u32((cnt ^ u32(((i32((v1.x ^ v2.x)) >= 0) ? v1.x : i32((i32((i32(Math.imul(v1.x, v2.y)) - i32(Math.imul(v2.x, v1.y)))) ^ v2.y)))))));
      }
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_0.value = next; return previous; })(cRef(() => wal, __cxx_lvalue_1 => { wal = __cxx_lvalue_1; }));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => wallsleft, __cxx_lvalue_3 => { wallsleft = __cxx_lvalue_3; }))));
    return i32((cnt >>> 31));
  }
  return i32((-1));
}

// C/C++ source: source/build/src/engine.cpp:12400
export function inside(x, y, sectnum) {
  switch (enginecompatibilitymode) {
    case i32(2147483647): {
      if ((u32(sectnum) < u32(numsectors))) {
        let cnt1 = u32(0);
        let cnt2 = u32(0);
        let wal = cRecordPointer(cPointerOffset(wall, (cPointerElementRef(sector, sectnum).value).wallptr, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
        let wallsleft = i32((cPointerElementRef(sector, sectnum).value).wallnum);
        do {
          let v1 = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.x - x)), "y": i32((cRecordObject(wal).__cxx_anonymous_0.__cxx_anonymous_0.y - y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
          let wal2 = cRecordObject(cRecordPointer(cPointerOffset(wall, cRecordObject(wal).point2, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}));
          let v2 = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((wal2.__cxx_anonymous_0.__cxx_anonymous_0.x - x)), "y": i32((wal2.__cxx_anonymous_0.__cxx_anonymous_0.y - y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
          if (((i32((v1.x | v1.y)) == 0) || (i32((v2.x | v2.y)) == 0))) {
            return i32(1);
          }
          if ((i32((v1.y ^ v2.y)) < 0)) {
            (cnt1 = u32((cnt1 ^ u32(((i32((v1.x ^ v2.x)) >= 0) ? v1.x : i32((i32((i32(Math.imul(v1.x, v2.y)) - i32(Math.imul(v2.x, v1.y)))) ^ v2.y)))))));
          }
          ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(v1, "y"));
          ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous - 1)); __cxx_lvalue_1.value = next; return previous; })(cObjectFieldRef(v2, "y"));
          if ((i32((v1.y ^ v2.y)) < 0)) {
            ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return previous; })(cObjectFieldRef(v1, "x"));
            ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous - 1)); __cxx_lvalue_3.value = next; return previous; })(cObjectFieldRef(v2, "x"));
            (cnt2 = u32((cnt2 ^ u32(((i32((v1.x ^ v2.x)) >= 0) ? v1.x : i32((i32((i32(Math.imul(v1.x, v2.y)) - i32(Math.imul(v2.x, v1.y)))) ^ v2.y)))))));
          }
          ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_4.value = next; return previous; })(cRef(() => wal, __cxx_lvalue_5 => { wal = __cxx_lvalue_5; }));
        } while (Boolean(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous - 1)); __cxx_lvalue_6.value = next; return next; })(cRef(() => wallsleft, __cxx_lvalue_7 => { wallsleft = __cxx_lvalue_7; }))));
        return i32((u32((cnt1 | cnt2)) >>> 31));
      }
    }
    return i32((-1));
    case i32(19950829): {
      return i32(inside_19950829(x, y, sectnum));
    }
    default: {
      return i32(inside_compat(x, y, sectnum));
    }
  }
}

// C/C++ source: source/build/src/engine.cpp:12543
export function spriteheightofsptr(spr, height, alsotileyofs) {
  let hei;
  let zofs = i32(0);
  let picnum = i32(cRecordObject(spr).picnum);
  let yrepeat = i32(cRecordObject(spr).yrepeat);
  (hei = i32((i32(Math.imul(i32((cPointerElementRef(tilesiz, picnum).value).y), yrepeat)) << 2)));
  if (cPointerCompare(height, null, "!=")) {
    ((cDeref(height, Int32Array).value) = i32(hei));
  }
  if (Boolean(i32((i32(cRecordObject(spr).cstat) & 128)))) {
    (zofs = i32((hei >> 1)));
  }
  if (Boolean(alsotileyofs)) {
    (zofs = i32((Number(zofs) - Number(i32((i32(Math.imul(i32((cPointerElementRef(picanm, picnum).value).yofs), yrepeat)) << 2))))));
  }
  return i32(zofs);
}

// C/C++ source: source/build/src/engine.cpp:12606
export function nextsectorneighborz(sectnum, refz, topbottom, direction) {
  let nextz = i32(((i32(direction) == 1) ? 2147483647 : i32(((-2147483647) - 1))));
  let sectortouse = i32((-1));
  let wal = cRecordPointer(cPointerOffset(wall, (cPointerElementRef(sector, sectnum).value).wallptr, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  let i = i32((cPointerElementRef(sector, sectnum).value).wallnum);
  do {
    let ns = i32(cRecordObject(wal).nextsector);
    if ((ns >= 0)) {
      let testz = i32(((i32(topbottom) == 1) ? (cPointerElementRef(sector, ns).value).floorz : (cPointerElementRef(sector, ns).value).ceilingz));
      let update = i32(((i32(direction) == 1) ? ((nextz > testz) && (testz > refz)) : ((nextz < testz) && (testz < refz))));
      if (Boolean(update)) {
        (nextz = i32(testz));
        (sectortouse = i32(ns));
      }
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_0.value = next; return previous; })(cRef(() => wal, __cxx_lvalue_1 => { wal = __cxx_lvalue_1; }));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }));
  } while ((i != 0));
  return i32(sectortouse);
}

// C/C++ source: source/build/src/engine.cpp:13182
export function lastwall(point) {
  if (((i32(point) > 0) && (i32((cPointerElementRef(wall, i32((i32(point) - 1))).value).point2) == i32(point)))) {
    return i32((i32(point) - 1));
  }
  let i = i32(point);
  let cnt = i32(numwalls);
  do {
    let j = i32((cPointerElementRef(wall, i).value).point2);
    if ((j == i32(point))) {
      (point = ((((((i) << 16) >> 16)) << 16) >> 16));
      break;
    }
    (i = i32(j));
  } while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))));
  return i32(point);
}

// C/C++ source: source/build/src/engine.cpp:13276
export let updatesectorneighborlist = new Int16Array(4096);
function __cxx_static_address_7b29b3b55e904f85c87ef8bb() {
  return __cxx_static_address_7b29b3b55e904f85c87ef8bb.reference || (__cxx_static_address_7b29b3b55e904f85c87ef8bb.reference = {
    __cReference: true,
    get value() { return updatesectorneighborlist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:13277
export let updatesectorneighbormap = new Uint8Array(512);
function __cxx_static_address_d9a3936ca53fe8868034984e() {
  return __cxx_static_address_d9a3936ca53fe8868034984e.reference || (__cxx_static_address_d9a3936ca53fe8868034984e.reference = {
    __cReference: true,
    get value() { return updatesectorneighbormap; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:13279
export function updatesector_compat(x, y, sectnum) {
  if (Boolean(inside_p__header_6c2c67bc1240(x, y, i32((cDeref(sectnum, Int16Array).value))))) {
    return;
  }
  if ((u32((cDeref(sectnum, Int16Array).value)) < u32(numsectors))) {
    let wal = cRecordPointer(cPointerOffset(wall, (cPointerElementRef(sector, (cDeref(sectnum, Int16Array).value)).value).wallptr, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
    let wallsleft = i32((cPointerElementRef(sector, (cDeref(sectnum, Int16Array).value)).value).wallnum);
    do {
      let next = i32(cRecordObject(wal).nextsector);
      if (Boolean(inside_p__header_6c2c67bc1240(x, y, next))) {
        do {
          ((cDeref(sectnum, Int16Array).value) = ((((((next) << 16) >> 16)) << 16) >> 16));
          return;
        } while (Boolean(0));
      }
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_0.value = next; return previous; })(cRef(() => wal, __cxx_lvalue_1 => { wal = __cxx_lvalue_1; }));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => wallsleft, __cxx_lvalue_3 => { wallsleft = __cxx_lvalue_3; }))));
  }
  for (let i = i32((i32(numsectors) - 1)); (i >= 0); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    if (Boolean(inside_p__header_6c2c67bc1240(x, y, i))) {
      do {
        ((cDeref(sectnum, Int16Array).value) = ((((((i) << 16) >> 16)) << 16) >> 16));
        return;
      } while (Boolean(0));
    }
  }
  ((cDeref(sectnum, Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:13308
export function updatesector_tryremaining(x, y, sectnum) {
  let sect = ((((((((i32((cDeref(sectnum, Int16Array).value)) == (-1)) ? i32((i32(numsectors) >> 1)) : i32((cDeref(sectnum, Int16Array).value)))) << 16) >> 16)) << 16) >> 16);
  const __cxx_lvalue_0 = cRef(() => sect, __cxx_lvalue_1 => { sect = (((__cxx_lvalue_1) << 16) >> 16); });
  let trycnt = i32((max__template_b1cfaf2244c73238(((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(i32((i32(numsectors) - i32(sect)))), ((__cxx_lvalue_3) => cRef(() => __cxx_lvalue_3, () => { throw new TypeError("const C++ reference write"); }))(i32(sect)))).value);
  if (Boolean(inside_exclude_p__header_0eb2a5f7bb44(x, y, i32(sect), updatesectorneighbormap))) {
    do {
      ((cDeref(sectnum, Int16Array).value) = (((sect) << 16) >> 16));
      return;
    } while (Boolean(0));
  }
  let highsect = (((sect) << 16) >> 16);
  let lowsect = (((sect) << 16) >> 16);
  do {
    if (((i32(highsect) < i32((i32(numsectors) - 1))) && Boolean(inside_exclude_p__header_0eb2a5f7bb44(x, y, i32(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_4.value = next; return next; })(cRef(() => highsect, __cxx_lvalue_5 => { highsect = __cxx_lvalue_5; }))), updatesectorneighbormap)))) {
      do {
        ((cDeref(sectnum, Int16Array).value) = (((highsect) << 16) >> 16));
        return;
      } while (Boolean(0));
    }
    if (((i32(lowsect) > 0) && Boolean(inside_exclude_p__header_0eb2a5f7bb44(x, y, i32(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = ((((previous - 1)) << 16) >> 16); __cxx_lvalue_6.value = next; return next; })(cRef(() => lowsect, __cxx_lvalue_7 => { lowsect = __cxx_lvalue_7; }))), updatesectorneighbormap)))) {
      do {
        ((cDeref(sectnum, Int16Array).value) = (((lowsect) << 16) >> 16));
        return;
      } while (Boolean(0));
    }
  } while (Boolean(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous - 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => trycnt, __cxx_lvalue_9 => { trycnt = __cxx_lvalue_9; }))));
  ((cDeref(sectnum, Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:13374
export function updatesectorexclude(x, y, sectnum, excludesectbitmap) {
  if (Boolean(inside_exclude_p__header_0eb2a5f7bb44(x, y, i32((cDeref(sectnum, Int16Array).value)), excludesectbitmap))) {
    return;
  }
  if (((i32((cDeref(sectnum, Int16Array).value)) >= 0) && (i32((cDeref(sectnum, Int16Array).value)) < i32(numsectors)))) {
    let wal = cRecordPointer(cPointerOffset(wall, (cPointerElementRef(sector, (cDeref(sectnum, Int16Array).value)).value).wallptr, 32), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
    let wallsleft = i32((cPointerElementRef(sector, (cDeref(sectnum, Int16Array).value)).value).wallnum);
    do {
      let next = i32(cRecordObject(wal).nextsector);
      if (Boolean(inside_exclude_p__header_0eb2a5f7bb44(x, y, next, excludesectbitmap))) {
        do {
          ((cDeref(sectnum, Int16Array).value) = ((((((next) << 16) >> 16)) << 16) >> 16));
          return;
        } while (Boolean(0));
      }
      ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, 32); __cxx_lvalue_1.value = next; return previous; })(cRef(() => wal, __cxx_lvalue_2 => { wal = __cxx_lvalue_2; }));
    } while (Boolean(((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous - 1)); __cxx_lvalue_3.value = next; return next; })(cRef(() => wallsleft, __cxx_lvalue_4 => { wallsleft = __cxx_lvalue_4; }))));
  }
  let sect = ((((((((i32((cDeref(sectnum, Int16Array).value)) == (-1)) ? i32((i32(numsectors) >> 1)) : i32((cDeref(sectnum, Int16Array).value)))) << 16) >> 16)) << 16) >> 16);
  const __cxx_lvalue_0 = cRef(() => sect, __cxx_lvalue_5 => { sect = (((__cxx_lvalue_5) << 16) >> 16); });
  let trycnt = i32((max__template_b1cfaf2244c73238(((__cxx_lvalue_6) => cRef(() => __cxx_lvalue_6, () => { throw new TypeError("const C++ reference write"); }))(i32((i32(numsectors) - i32(sect)))), ((__cxx_lvalue_7) => cRef(() => __cxx_lvalue_7, () => { throw new TypeError("const C++ reference write"); }))(i32(sect)))).value);
  let highsect = (((sect) << 16) >> 16);
  let lowsect = (((sect) << 16) >> 16);
  do {
    if (((i32(highsect) < i32((i32(numsectors) - 1))) && Boolean(inside_exclude_p__header_0eb2a5f7bb44(x, y, i32(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_8.value = next; return next; })(cRef(() => highsect, __cxx_lvalue_9 => { highsect = __cxx_lvalue_9; }))), excludesectbitmap)))) {
      do {
        ((cDeref(sectnum, Int16Array).value) = (((highsect) << 16) >> 16));
        return;
      } while (Boolean(0));
    }
    if (((i32(lowsect) > 0) && Boolean(inside_exclude_p__header_0eb2a5f7bb44(x, y, i32(((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = ((((previous - 1)) << 16) >> 16); __cxx_lvalue_10.value = next; return next; })(cRef(() => lowsect, __cxx_lvalue_11 => { lowsect = __cxx_lvalue_11; }))), excludesectbitmap)))) {
      do {
        ((cDeref(sectnum, Int16Array).value) = (((lowsect) << 16) >> 16));
        return;
      } while (Boolean(0));
    }
  } while (Boolean(((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous - 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => trycnt, __cxx_lvalue_13 => { trycnt = __cxx_lvalue_13; }))));
  ((cDeref(sectnum, Int16Array).value) = (((((((-1)) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:13629
export function rotatepoint(pivot, p, daang, p2) {
  let dacos = i32((cDeref(cPointerOffset(sintable, i32((i32((i32(daang) + 2560)) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let dasin = i32((cDeref(cPointerOffset(sintable, i32((i32((i32(daang) + 2048)) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) - Number(pivot.x)))))(cObjectFieldRef(p, "x"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) - Number(pivot.y)))))(cObjectFieldRef(p, "y"));
  cAssignAggregate(cRecordObject(p2), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((dmulscale14__header_de5cc9315a24(p.x, dacos, (-p.y), dasin) + pivot.x)), "y": i32((dmulscale14__header_de5cc9315a24(p.y, dacos, p.x, dasin) + pivot.y))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
}

// C/C++ source: source/build/src/engine.cpp:13715
export let setaspect_new_use_dimen = i32(0);
export function __cxx_global_cell_9fb8f07246a7e914e0b9d5d8() {
  return __cxx_global_cell_9fb8f07246a7e914e0b9d5d8.reference || (__cxx_global_cell_9fb8f07246a7e914e0b9d5d8.reference = {
    __cReference: true,
    get value() { return setaspect_new_use_dimen; },
    set value(__cxx_lvalue_0) { setaspect_new_use_dimen = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:13815
export function renderFlushPerms() {
  (permhead = i32((permtail = i32(0))));
}

// C/C++ source: source/build/src/engine.cpp:14071
export function squarerotatetile(tilenume) {
  let siz = i32((cPointerElementRef(tilesiz, tilenume).value).x);
  if ((siz != i32((cPointerElementRef(tilesiz, tilenume).value).y))) {
    return;
  }
  let ptr1;
  let ptr2;
  for (let i = i64(i32((siz - 1))), j; (i >= i64(3)); (i = i64((BigInt(i) - BigInt(i64(4)))))) {
    (ptr2 = (ptr1 = cTypedPointer((BigInt((cDeref(cPointerOffset(waloff, tilenume, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) + BigInt((BigInt(i) * BigInt(i64(i32((siz + 1))))))), Uint8Array)));
    swap__header_34fe25370a47(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return next; })(cRef(() => ptr1, __cxx_lvalue_1 => { ptr1 = __cxx_lvalue_1; })), (ptr2 = cPointerOffset(ptr2, -(siz), Uint8Array.BYTES_PER_ELEMENT)));
    for ((j = i64((BigInt((BigInt(i) >> BigInt(1))) - BigInt(i64(1))))); (j >= i64(0)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => j, __cxx_lvalue_3 => { j = __cxx_lvalue_3; }))) {
      swapchar2__header_fd0bf6906f7c((ptr1 = cPointerOffset(ptr1, -(2), Uint8Array.BYTES_PER_ELEMENT)), (ptr2 = cPointerOffset(ptr2, -(i32((siz << 1))), Uint8Array.BYTES_PER_ELEMENT)), siz);
    }
    (ptr2 = (ptr1 = cTypedPointer((BigInt((cDeref(cPointerOffset(waloff, tilenume, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) + BigInt((BigInt((BigInt(i) - BigInt(i64(1)))) * BigInt(i64(i32((siz + 1))))))), Uint8Array)));
    for ((j = i64((BigInt((BigInt((BigInt(i) - BigInt(i64(1)))) >> BigInt(1))) - BigInt(i64(1))))); (j >= i64(0)); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i64((previous - 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => j, __cxx_lvalue_5 => { j = __cxx_lvalue_5; }))) {
      swapchar2__header_fd0bf6906f7c((ptr1 = cPointerOffset(ptr1, -(2), Uint8Array.BYTES_PER_ELEMENT)), (ptr2 = cPointerOffset(ptr2, -(i32((siz << 1))), Uint8Array.BYTES_PER_ELEMENT)), siz);
    }
    (ptr2 = (ptr1 = cTypedPointer((BigInt((cDeref(cPointerOffset(waloff, tilenume, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) + BigInt((BigInt((BigInt(i) - BigInt(i64(2)))) * BigInt(i64(i32((siz + 1))))))), Uint8Array)));
    swap__header_34fe25370a47(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return next; })(cRef(() => ptr1, __cxx_lvalue_7 => { ptr1 = __cxx_lvalue_7; })), (ptr2 = cPointerOffset(ptr2, -(siz), Uint8Array.BYTES_PER_ELEMENT)));
    for ((j = i64((BigInt((BigInt((BigInt(i) - BigInt(i64(2)))) >> BigInt(1))) - BigInt(i64(1))))); (j >= i64(0)); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i64((previous - 1n)); __cxx_lvalue_8.value = next; return next; })(cRef(() => j, __cxx_lvalue_9 => { j = __cxx_lvalue_9; }))) {
      swapchar2__header_fd0bf6906f7c((ptr1 = cPointerOffset(ptr1, -(2), Uint8Array.BYTES_PER_ELEMENT)), (ptr2 = cPointerOffset(ptr2, -(i32((siz << 1))), Uint8Array.BYTES_PER_ELEMENT)), siz);
    }
    (ptr2 = (ptr1 = cTypedPointer((BigInt((cDeref(cPointerOffset(waloff, tilenume, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) + BigInt((BigInt((BigInt(i) - BigInt(i64(3)))) * BigInt(i64(i32((siz + 1))))))), Uint8Array)));
    for ((j = i64((BigInt((BigInt((BigInt(i) - BigInt(i64(3)))) >> BigInt(1))) - BigInt(i64(1))))); (j >= i64(0)); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i64((previous - 1n)); __cxx_lvalue_10.value = next; return next; })(cRef(() => j, __cxx_lvalue_11 => { j = __cxx_lvalue_11; }))) {
      swapchar2__header_fd0bf6906f7c((ptr1 = cPointerOffset(ptr1, -(2), Uint8Array.BYTES_PER_ELEMENT)), (ptr2 = cPointerOffset(ptr2, -(i32((siz << 1))), Uint8Array.BYTES_PER_ELEMENT)), siz);
    }
  }
}

// C/C++ source: source/build/src/engine.cpp:14201
export function sectorofwall_internal(wallNum) {
  let gap = i64(i32((i32(numsectors) >> 1)));
  let sectNum = i64(gap);
  while ((gap > i64(1))) {
    (gap = i64((BigInt(gap) >> BigInt(1))));
    let n = i64((!(!(i32((cPointerElementRef(sector, sectNum).value).wallptr) < i32(wallNum)))));
    (sectNum = i64((BigInt(sectNum) + BigInt((BigInt((BigInt(n) ^ BigInt((BigInt(n) - BigInt(i64(1)))))) * BigInt(gap))))));
  }
  while ((i32((cPointerElementRef(sector, sectNum).value).wallptr) > i32(wallNum))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => sectNum, __cxx_lvalue_1 => { sectNum = __cxx_lvalue_1; }));
  }
  while ((i32((i32((cPointerElementRef(sector, sectNum).value).wallptr) + i32((cPointerElementRef(sector, sectNum).value).wallnum))) <= i32(wallNum))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous + 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => sectNum, __cxx_lvalue_3 => { sectNum = __cxx_lvalue_3; }));
  }
  return i32(sectNum);
}

// C/C++ source: source/build/src/engine.cpp:14217
export function sectorofwall(wallNum) {
  if ((u32(wallNum) >= u32(numwalls))) {
    return i32((-1));
  }
  if ((!Boolean(editstatus))) {
    return i32((cDeref(cPointerOffset(wallsect, wallNum, Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  }
  let w = i64((cPointerElementRef(wall, wallNum).value).nextwall);
  return i32(((u32(w) < u32(numwalls)) ? i32((cPointerElementRef(wall, w).value).nextsector) : sectorofwall_internal(wallNum)));
}

// C/C++ source: source/build/src/engine.cpp:14230
export function sectorofwall_noquick(wallNum) {
  if ((u32(wallNum) >= u32(numwalls))) {
    return i32((-1));
  }
  return i32(sectorofwall_internal(wallNum));
}

// C/C++ source: source/build/src/engine.cpp:14429
export function loopnumofsector(sectnum, wallnum) {
  let numloops = i32(0);
  let startwall = i32((cPointerElementRef(sector, sectnum).value).wallptr);
  let endwall = i32((startwall + i32((cPointerElementRef(sector, sectnum).value).wallnum)));
  for (let i = i64(startwall); (i < i64(endwall)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((i == i64(wallnum))) {
      return i32(numloops);
    }
    if ((i64((cPointerElementRef(wall, i).value).point2) < i)) {
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => numloops, __cxx_lvalue_3 => { numloops = __cxx_lvalue_3; }));
    }
  }
  return i32((-1));
}

// C/C++ source: source/build/src/engine.cpp:14624
export function printext_checkypos(ypos, yminptr, ymaxptr) {
  let ymin = i32(0);
  let ymax = i32(7);
  if ((ypos < 0)) {

  } else {
    if ((i32((ypos + 7)) >= ydim)) {
      (ymax = i32((i32((ydim - ypos)) - 1)));
      if ((ymax < 0)) {
        return i32(1);
      }
    }
  }
  ((cDeref(yminptr, Int32Array).value) = i32(ymin));
  ((cDeref(ymaxptr, Int32Array).value) = i32(ymax));
  return i32(0);
}

// C/C++ source: source/build/src/engine.cpp:14963
export function videoSetRenderMode(renderer) {
  (renderer = i32(renderer));
  return i32(0);
}

// C/C++ source: source/build/src/engine.cpp:15045
export function tileInvalidate(tilenume, pal, how) {
  (tilenume = (((tilenume) << 16) >> 16));
  (pal = i32(pal));
  (how = i32(how));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_712730224f5e2862 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_3dbbd23dc4df226e70c52d7b() {
  return __cxx_static_address_3dbbd23dc4df226e70c52d7b.reference || (__cxx_static_address_3dbbd23dc4df226e70c52d7b.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_712730224f5e2862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_888d589830207b0c = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, [25], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 800, "y": 600}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 640, "y": 480}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 640, "y": 400}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 512, "y": 384}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 480, "y": 360}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 400, "y": 300}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 320, "y": 240}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 320, "y": 200}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": 0, "y": 0}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype})]);
function __cxx_static_address_fd65d4b724bbcc3d05b8d51e() {
  return __cxx_static_address_fd65d4b724bbcc3d05b8d51e.reference || (__cxx_static_address_fd65d4b724bbcc3d05b8d51e.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_888d589830207b0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_7ad58865f6844c02 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_fde2415709d1c0fee5bc85db() {
  return __cxx_static_address_fde2415709d1c0fee5bc85db.reference || (__cxx_static_address_fde2415709d1c0fee5bc85db.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_7ad58865f6844c02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_d5c97c353cbd7658 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_460eb2df901ea15c1593e21a() {
  return __cxx_static_address_460eb2df901ea15c1593e21a.reference || (__cxx_static_address_460eb2df901ea15c1593e21a.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_d5c97c353cbd7658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:613
export let spriteext = null;
export function __cxx_global_cell_e6d5c05c99c236717ba2a685() {
  return __cxx_global_cell_e6d5c05c99c236717ba2a685.reference || (__cxx_global_cell_e6d5c05c99c236717ba2a685.reference = {
    __cReference: true,
    get value() { return spriteext; },
    set value(__cxx_lvalue_0) { spriteext = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:614
export let spritesmooth = null;
export function __cxx_global_cell_2487f0a2e0979a5d48ff1cd7() {
  return __cxx_global_cell_2487f0a2e0979a5d48ff1cd7.reference || (__cxx_global_cell_2487f0a2e0979a5d48ff1cd7.reference = {
    __cReference: true,
    get value() { return spritesmooth; },
    set value(__cxx_lvalue_0) { spritesmooth = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:616
export let wallext = null;
export function __cxx_global_cell_64b1dd24a985c284baf44a16() {
  return __cxx_global_cell_64b1dd24a985c284baf44a16.reference || (__cxx_global_cell_64b1dd24a985c284baf44a16.reference = {
    __cReference: true,
    get value() { return wallext; },
    set value(__cxx_lvalue_0) { wallext = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:619
export let sector = null;
export function __cxx_global_cell_9d5d7fcf3aa35a4809f92551() {
  return __cxx_global_cell_9d5d7fcf3aa35a4809f92551.reference || (__cxx_global_cell_9d5d7fcf3aa35a4809f92551.reference = {
    __cReference: true,
    get value() { return sector; },
    set value(__cxx_lvalue_0) { sector = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:620
export let wall = null;
export function __cxx_global_cell_4d8aaa64f68587b18e27604c() {
  return __cxx_global_cell_4d8aaa64f68587b18e27604c.reference || (__cxx_global_cell_4d8aaa64f68587b18e27604c.reference = {
    __cReference: true,
    get value() { return wall; },
    set value(__cxx_lvalue_0) { wall = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:621
export let sprite = null;
export function __cxx_global_cell_4a046e33ecf7aced9bfd0007() {
  return __cxx_global_cell_4a046e33ecf7aced9bfd0007.reference || (__cxx_global_cell_4a046e33ecf7aced9bfd0007.reference = {
    __cReference: true,
    get value() { return sprite; },
    set value(__cxx_lvalue_0) { sprite = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:622
export let tsprite = null;
export function __cxx_global_cell_4f8c0a98fe113810db905f6a() {
  return __cxx_global_cell_4f8c0a98fe113810db905f6a.reference || (__cxx_global_cell_4f8c0a98fe113810db905f6a.reference = {
    __cReference: true,
    get value() { return tsprite; },
    set value(__cxx_lvalue_0) { tsprite = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:756
export let maskwall = new Int16Array(8192);
function __cxx_static_address_f796fde0a5b9ab675ed5cfb0() {
  return __cxx_static_address_f796fde0a5b9ab675ed5cfb0.reference || (__cxx_static_address_f796fde0a5b9ab675ed5cfb0.reference = {
    __cReference: true,
    get value() { return maskwall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:757
export let thewall = new Int16Array(8192);
function __cxx_static_address_cdfdf62d7992b2723a1827e5() {
  return __cxx_static_address_cdfdf62d7992b2723a1827e5.reference || (__cxx_static_address_cdfdf62d7992b2723a1827e5.reference = {
    __cReference: true,
    get value() { return thewall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:758
export let tspriteptr = cPointerArray(4097);
function __cxx_static_address_3d0f2303842a2a4a3ffe6ff2() {
  return __cxx_static_address_3d0f2303842a2a4a3ffe6ff2.reference || (__cxx_static_address_3d0f2303842a2a4a3ffe6ff2.reference = {
    __cReference: true,
    get value() { return tspriteptr; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:764
export let ylookup = null;
export function __cxx_global_cell_6ef139bca6611fb821515c5d() {
  return __cxx_global_cell_6ef139bca6611fb821515c5d.reference || (__cxx_global_cell_6ef139bca6611fb821515c5d.reference = {
    __cReference: true,
    get value() { return ylookup; },
    set value(__cxx_lvalue_0) { ylookup = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:782
export let validmode = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [256], {}, []);
function __cxx_static_address_4b14ccc07f5897412fe4fb03() {
  return __cxx_static_address_4b14ccc07f5897412fe4fb03.reference || (__cxx_static_address_4b14ccc07f5897412fe4fb03.reference = {
    __cReference: true,
    get value() { return validmode; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:794
export let headsectbunch = Array.from({ length: 2 }, () => new Int16Array(256));
function __cxx_static_address_b123f67b3377367933d153cd() {
  return __cxx_static_address_b123f67b3377367933d153cd.reference || (__cxx_static_address_b123f67b3377367933d153cd.reference = {
    __cReference: true,
    get value() { return headsectbunch; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nextsectbunch = Array.from({ length: 2 }, () => new Int16Array(4096));
function __cxx_static_address_ef36a0eab6e4d937c8e1acfd() {
  return __cxx_static_address_ef36a0eab6e4d937c8e1acfd.reference || (__cxx_static_address_ef36a0eab6e4d937c8e1acfd.reference = {
    __cReference: true,
    get value() { return nextsectbunch; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:802
export let totalclock = (ClockTicks()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_37d96f0d18da4d1ab96cf9c5() {
  return __cxx_global_cell_37d96f0d18da4d1ab96cf9c5.reference || (__cxx_global_cell_37d96f0d18da4d1ab96cf9c5.reference = {
    __cReference: true,
    get value() { return totalclock; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

export let totalclocklock = (ClockTicks()).__cxx_construct_3fdb0b4b21c3726c();
export function __cxx_global_cell_64c52629d0a5e3511310f13a() {
  return __cxx_global_cell_64c52629d0a5e3511310f13a.reference || (__cxx_global_cell_64c52629d0a5e3511310f13a.reference = {
    __cReference: true,
    get value() { return totalclocklock; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/include/build.h:806
export let sintable = new Int16Array(2048);
function __cxx_static_address_0f4af5e331f3d6687653609f() {
  return __cxx_static_address_0f4af5e331f3d6687653609f.reference || (__cxx_static_address_0f4af5e331f3d6687653609f.reference = {
    __cReference: true,
    get value() { return sintable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:808
export let palette = new Uint8Array(768);
function __cxx_static_address_44c1b2ae791d18c588326bf3() {
  return __cxx_static_address_44c1b2ae791d18c588326bf3.reference || (__cxx_static_address_44c1b2ae791d18c588326bf3.reference = {
    __cReference: true,
    get value() { return palette; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:810
export let palookup = cPointerArray(256);
function __cxx_static_address_4d925d4fe6f4e6b56c3ba3d6() {
  return __cxx_static_address_4d925d4fe6f4e6b56c3ba3d6.reference || (__cxx_static_address_4d925d4fe6f4e6b56c3ba3d6.reference = {
    __cReference: true,
    get value() { return palookup; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:813
export let blendtable = cPointerArray(256);
function __cxx_static_address_0749037db73a1741e9d53a96() {
  return __cxx_static_address_0749037db73a1741e9d53a96.reference || (__cxx_static_address_0749037db73a1741e9d53a96.reference = {
    __cReference: true,
    get value() { return blendtable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:832
export let windowxy1 = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
export function __cxx_global_cell_221fd34161be9be2eedf7faf() {
  return __cxx_global_cell_221fd34161be9be2eedf7faf.reference || (__cxx_global_cell_221fd34161be9be2eedf7faf.reference = {
    __cReference: true,
    get value() { return windowxy1; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

export let windowxy2 = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
export function __cxx_global_cell_46c79554e27038ae817b7d39() {
  return __cxx_global_cell_46c79554e27038ae817b7d39.reference || (__cxx_global_cell_46c79554e27038ae817b7d39.reference = {
    __cReference: true,
    get value() { return windowxy2; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/include/build.h:833
export let startumost = null;
export function __cxx_global_cell_26d4b87c2e0d474be07ce565() {
  return __cxx_global_cell_26d4b87c2e0d474be07ce565.reference || (__cxx_global_cell_26d4b87c2e0d474be07ce565.reference = {
    __cReference: true,
    get value() { return startumost; },
    set value(__cxx_lvalue_0) { startumost = __cxx_lvalue_0; }
  });
}

export let startdmost = null;
export function __cxx_global_cell_3be09651661a7974b1bb1434() {
  return __cxx_global_cell_3be09651661a7974b1bb1434.reference || (__cxx_global_cell_3be09651661a7974b1bb1434.reference = {
    __cReference: true,
    get value() { return startdmost; },
    set value(__cxx_lvalue_0) { startdmost = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:859
export let multipsky = null;
export function __cxx_global_cell_9a1da9581bb10e12e9507dd9() {
  return __cxx_global_cell_9a1da9581bb10e12e9507dd9.reference || (__cxx_global_cell_9a1da9581bb10e12e9507dd9.reference = {
    __cReference: true,
    get value() { return multipsky; },
    set value(__cxx_lvalue_0) { multipsky = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:861
export let multipskytile = null;
export function __cxx_global_cell_dad5bc86f245af7b0202a36f() {
  return __cxx_global_cell_dad5bc86f245af7b0202a36f.reference || (__cxx_global_cell_dad5bc86f245af7b0202a36f.reference = {
    __cReference: true,
    get value() { return multipskytile; },
    set value(__cxx_lvalue_0) { multipskytile = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:885
export let headspritesect = new Int16Array(4097);
function __cxx_static_address_02d3bb93c5155e39a3abe52c() {
  return __cxx_static_address_02d3bb93c5155e39a3abe52c.reference || (__cxx_static_address_02d3bb93c5155e39a3abe52c.reference = {
    __cReference: true,
    get value() { return headspritesect; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let headspritestat = new Int16Array(1025);
function __cxx_static_address_0565b0c9d14ce82badb48654() {
  return __cxx_static_address_0565b0c9d14ce82badb48654.reference || (__cxx_static_address_0565b0c9d14ce82badb48654.reference = {
    __cReference: true,
    get value() { return headspritestat; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:886
export let prevspritesect = new Int16Array(16384);
function __cxx_static_address_b0d720018c6794d33845bd3d() {
  return __cxx_static_address_b0d720018c6794d33845bd3d.reference || (__cxx_static_address_b0d720018c6794d33845bd3d.reference = {
    __cReference: true,
    get value() { return prevspritesect; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let prevspritestat = new Int16Array(16384);
function __cxx_static_address_c782fef718323f883a4e80c4() {
  return __cxx_static_address_c782fef718323f883a4e80c4.reference || (__cxx_static_address_c782fef718323f883a4e80c4.reference = {
    __cReference: true,
    get value() { return prevspritestat; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:887
export let nextspritesect = new Int16Array(16384);
function __cxx_static_address_fe66b93a0b8aed691153774d() {
  return __cxx_static_address_fe66b93a0b8aed691153774d.reference || (__cxx_static_address_fe66b93a0b8aed691153774d.reference = {
    __cReference: true,
    get value() { return nextspritesect; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let nextspritestat = new Int16Array(16384);
function __cxx_static_address_44ccaf6aa6f83c291437c43e() {
  return __cxx_static_address_44ccaf6aa6f83c291437c43e.reference || (__cxx_static_address_44ccaf6aa6f83c291437c43e.reference = {
    __cReference: true,
    get value() { return nextspritestat; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:889
export let tilesiz = cByteRecordNDArray({"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, [30720], {"__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}, []);
function __cxx_static_address_bc1cefc03b8dd29076df5854() {
  return __cxx_static_address_bc1cefc03b8dd29076df5854.reference || (__cxx_static_address_bc1cefc03b8dd29076df5854.reference = {
    __cReference: true,
    get value() { return tilesiz; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:891
export let picsiz = new Uint8Array(30720);
function __cxx_static_address_cb2bd74aeb3e1dcff0fa9a75() {
  return __cxx_static_address_cb2bd74aeb3e1dcff0fa9a75.reference || (__cxx_static_address_cb2bd74aeb3e1dcff0fa9a75.reference = {
    __cReference: true,
    get value() { return picsiz; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:892
export let walock = new Uint8Array(30720);
function __cxx_static_address_26780e0e98d55750fa4e5078() {
  return __cxx_static_address_26780e0e98d55750fa4e5078.reference || (__cxx_static_address_26780e0e98d55750fa4e5078.reference = {
    __cReference: true,
    get value() { return walock; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_b6a453f05dcc1c29 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_ed697d33e67d0fca05900cf2() {
  return __cxx_static_address_ed697d33e67d0fca05900cf2.reference || (__cxx_static_address_ed697d33e67d0fca05900cf2.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_b6a453f05dcc1c29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_c101361bfcafcb7a = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_139fef308da9f7d9172eeae1() {
  return __cxx_static_address_139fef308da9f7d9172eeae1.reference || (__cxx_static_address_139fef308da9f7d9172eeae1.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_c101361bfcafcb7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_75549ea18b6b413d = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_9954c89d202d38322327deeb() {
  return __cxx_static_address_9954c89d202d38322327deeb.reference || (__cxx_static_address_9954c89d202d38322327deeb.reference = {
    __cReference: true,
    get value() { return pow264__header_global_75549ea18b6b413d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:969
export let picanm = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"num": {"native": "Uint8Array", "offset": 0, "size": 1}, "sf": {"native": "Uint8Array", "offset": 3, "size": 1}, "tileflags": {"native": "Uint8Array", "offset": 4, "size": 1}, "xofs": {"native": "Int8Array", "offset": 1, "size": 1}, "yofs": {"native": "Int8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 5, "union": false}, [30720], {}, []);
function __cxx_static_address_8bafdd98e89c90d8c59c4443() {
  return __cxx_static_address_8bafdd98e89c90d8c59c4443.reference || (__cxx_static_address_8bafdd98e89c90d8c59c4443.reference = {
    __cReference: true,
    get value() { return picanm; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:971
export let rottile = cByteRecordNDArray({"align": 2, "arrayAlign": 1, "fields": {"newtile": {"native": "Int16Array", "offset": 0, "size": 2}, "owner": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, [30720], {}, []);
function __cxx_static_address_024bb7a231b291109284e278() {
  return __cxx_static_address_024bb7a231b291109284e278.reference || (__cxx_static_address_024bb7a231b291109284e278.reference = {
    __cReference: true,
    get value() { return rottile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:972
export let waloff = new BigInt64Array(30720);
function __cxx_static_address_1b3b58d47afa61ecff9f5bf3() {
  return __cxx_static_address_1b3b58d47afa61ecff9f5bf3.reference || (__cxx_static_address_1b3b58d47afa61ecff9f5bf3.reference = {
    __cReference: true,
    get value() { return waloff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:974
export let g_windowPos = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
export function __cxx_global_cell_b9268bcd54dec167c4a7cf60() {
  return __cxx_global_cell_b9268bcd54dec167c4a7cf60.reference || (__cxx_global_cell_b9268bcd54dec167c4a7cf60.reference = {
    __cReference: true,
    get value() { return g_windowPos; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/include/build.h:990
export let show2dsector = new Uint8Array(512);
function __cxx_static_address_767f0be26424ba7efe0e3ea8() {
  return __cxx_static_address_767f0be26424ba7efe0e3ea8.reference || (__cxx_static_address_767f0be26424ba7efe0e3ea8.reference = {
    __cReference: true,
    get value() { return show2dsector; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:991
export let show2dwall = new Uint8Array(2048);
function __cxx_static_address_e02c109872bf16cc3ae4bb74() {
  return __cxx_static_address_e02c109872bf16cc3ae4bb74.reference || (__cxx_static_address_e02c109872bf16cc3ae4bb74.reference = {
    __cReference: true,
    get value() { return show2dwall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:992
export let show2dsprite = new Uint8Array(2048);
function __cxx_static_address_ef7b906da4857e22d709ccc2() {
  return __cxx_static_address_ef7b906da4857e22d709ccc2.reference || (__cxx_static_address_ef7b906da4857e22d709ccc2.reference = {
    __cReference: true,
    get value() { return show2dsprite; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1001
export let classicht = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"lock": {"native": "Uint8Array", "offset": 12, "size": 1}, "ptr": {"native": "BigInt64Array", "offset": 0, "size": 8}, "upscale": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 8}}, "overlaps": false, "size": 16, "union": false}, [30720], {"__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}, []);
function __cxx_static_address_1869fd5e5f1fc977245c3361() {
  return __cxx_static_address_1869fd5e5f1fc977245c3361.reference || (__cxx_static_address_1869fd5e5f1fc977245c3361.reference = {
    __cReference: true,
    get value() { return classicht; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1011
export let gotpic = new Uint8Array(3840);
function __cxx_static_address_20b03641be78ca35615254cc() {
  return __cxx_static_address_20b03641be78ca35615254cc.reference || (__cxx_static_address_20b03641be78ca35615254cc.reference = {
    __cReference: true,
    get value() { return gotpic; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1012
export let gotsector = new Uint8Array(512);
function __cxx_static_address_732719b470ff470128baa7fd() {
  return __cxx_static_address_732719b470ff470128baa7fd.reference || (__cxx_static_address_732719b470ff470128baa7fd.reference = {
    __cReference: true,
    get value() { return gotsector; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1014
export let editorcolors = new Uint8Array(256);
function __cxx_static_address_c9909d3fc49f89690c2279b8() {
  return __cxx_static_address_c9909d3fc49f89690c2279b8.reference || (__cxx_static_address_c9909d3fc49f89690c2279b8.reference = {
    __cReference: true,
    get value() { return editorcolors; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1015
export let editorcolorsdef = new Uint8Array(256);
function __cxx_static_address_8aaf9efee2f22a8af0387ef6() {
  return __cxx_static_address_8aaf9efee2f22a8af0387ef6.reference || (__cxx_static_address_8aaf9efee2f22a8af0387ef6.reference = {
    __cReference: true,
    get value() { return editorcolorsdef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1017
export let faketile = new Uint8Array(3840);
function __cxx_static_address_f69aa7b489f25efcebcd630a() {
  return __cxx_static_address_f69aa7b489f25efcebcd630a.reference || (__cxx_static_address_f69aa7b489f25efcebcd630a.reference = {
    __cReference: true,
    get value() { return faketile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1018
export let faketiledata = cPointerArray(30720);
function __cxx_static_address_7815c38b4df1f3d8c8d94b9d() {
  return __cxx_static_address_7815c38b4df1f3d8c8d94b9d.reference || (__cxx_static_address_7815c38b4df1f3d8c8d94b9d.reference = {
    __cReference: true,
    get value() { return faketiledata; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1019
export let faketilesize = new Int32Array(30720);
function __cxx_static_address_d3b74cd6571a0840683b0490() {
  return __cxx_static_address_d3b74cd6571a0840683b0490.reference || (__cxx_static_address_d3b74cd6571a0840683b0490.reference = {
    __cReference: true,
    get value() { return faketilesize; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1021
export let tilefilenum = new Uint8Array(30720);
function __cxx_static_address_951a4971131a6030212d7f39() {
  return __cxx_static_address_951a4971131a6030212d7f39.reference || (__cxx_static_address_951a4971131a6030212d7f39.reference = {
    __cReference: true,
    get value() { return tilefilenum; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1023
export let spritecol2d = Array.from({ length: 30720 }, () => new Uint8Array(2));
function __cxx_static_address_5f309759bd327222df5be6ea() {
  return __cxx_static_address_5f309759bd327222df5be6ea.reference || (__cxx_static_address_5f309759bd327222df5be6ea.reference = {
    __cReference: true,
    get value() { return spritecol2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1024
export let tilecols = new Uint8Array(30720);
function __cxx_static_address_8d4e3f1d97e2ec7e43f9fe02() {
  return __cxx_static_address_8d4e3f1d97e2ec7e43f9fe02.reference || (__cxx_static_address_8d4e3f1d97e2ec7e43f9fe02.reference = {
    __cReference: true,
    get value() { return tilecols; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1026
export let editwall = new Uint8Array(2048);
function __cxx_static_address_368c16ee0312fbb95c7376dd() {
  return __cxx_static_address_368c16ee0312fbb95c7376dd.reference || (__cxx_static_address_368c16ee0312fbb95c7376dd.reference = {
    __cReference: true,
    get value() { return editwall; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1061
export let h_xsize = new Uint16Array(30720);
function __cxx_static_address_51db86b449923c6a178707a3() {
  return __cxx_static_address_51db86b449923c6a178707a3.reference || (__cxx_static_address_51db86b449923c6a178707a3.reference = {
    __cReference: true,
    get value() { return h_xsize; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let h_ysize = new Uint16Array(30720);
function __cxx_static_address_b3bdc10fbae55d1c25914454() {
  return __cxx_static_address_b3bdc10fbae55d1c25914454.reference || (__cxx_static_address_b3bdc10fbae55d1c25914454.reference = {
    __cReference: true,
    get value() { return h_ysize; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1062
export let h_xoffs = new Int8Array(30720);
function __cxx_static_address_db0a54e531bf7f4c864bf59c() {
  return __cxx_static_address_db0a54e531bf7f4c864bf59c.reference || (__cxx_static_address_db0a54e531bf7f4c864bf59c.reference = {
    __cReference: true,
    get value() { return h_xoffs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let h_yoffs = new Int8Array(30720);
function __cxx_static_address_88a9bf77f2c8bfaf5bbdb1e7() {
  return __cxx_static_address_88a9bf77f2c8bfaf5bbdb1e7.reference || (__cxx_static_address_88a9bf77f2c8bfaf5bbdb1e7.reference = {
    __cReference: true,
    get value() { return h_yoffs; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1064
export let globalpalwritten = null;
export function __cxx_global_cell_094ba97ebf4fa8da86d8ce6f() {
  return __cxx_global_cell_094ba97ebf4fa8da86d8ce6f.reference || (__cxx_global_cell_094ba97ebf4fa8da86d8ce6f.reference = {
    __cReference: true,
    get value() { return globalpalwritten; },
    set value(__cxx_lvalue_0) { globalpalwritten = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/build.h:1077
export let editorzrange = new Int32Array(2);
function __cxx_static_address_083eda42739ae4f7f5b61227() {
  return __cxx_static_address_083eda42739ae4f7f5b61227.reference || (__cxx_static_address_083eda42739ae4f7f5b61227.reference = {
    __cReference: true,
    get value() { return editorzrange; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1102
export let crctab16 = new Int32Array(256);
function __cxx_static_address_681d91e9d37d37453c2dd947() {
  return __cxx_static_address_681d91e9d37d37453c2dd947.reference || (__cxx_static_address_681d91e9d37d37453c2dd947.reference = {
    __cReference: true,
    get value() { return crctab16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:1609
export let voxoff = Array.from({ length: 2048 }, () => new BigInt64Array(5));
function __cxx_static_address_8adaa217bbe7f947b0c16dde() {
  return __cxx_static_address_8adaa217bbe7f947b0c16dde.reference || (__cxx_static_address_8adaa217bbe7f947b0c16dde.reference = {
    __cReference: true,
    get value() { return voxoff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/engine.cpp:1450
export function xfree__header_196f14a5f8eb(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function clamp__header_d0f16d9fb1b6(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/build/src/engine.cpp:192
export function yax_getbunches__header_dab3f1f07637(i, cb, fb) {
  ((cDeref(cb, Int16Array).value) = (((yax_getbunch(i, (((0) << 16) >> 16))) << 16) >> 16));
  ((cDeref(fb, Int16Array).value) = (((yax_getbunch(i, (((1) << 16) >> 16))) << 16) >> 16));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function bitmap_set__header_3ddae889b678(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_712730224f5e2862, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function bitmap_test__header_955f0b2ebc45(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_712730224f5e2862, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_712730224f5e2862, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: source/build/src/engine.cpp:1035
export function B_UNBUF16__header_7bb30a873fc5(buf) {
  return (((cDeref(cTypedPointer(buf, Uint16Array), Uint16Array).value)) & 65535);
}

// C/C++ source: source/build/src/engine.cpp:728
export function renderAddTSpriteFromSprite__header_d17fe8582af7(spritenum) {
  return renderMakeTSpriteFromSprite__header_34b2a77e58ce(cPointerOffset(tsprite, ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_138b3585b71dcf40bb04bbf8()), 44), spritenum);
}

// C/C++ source: source/build/src/engine.cpp:1079
export function videoGetRenderMode__header_54b2a5f525a6() {
  return i32(0);
}

export function bitmap_test__header_a5cdcb94d80d(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_712730224f5e2862, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_712730224f5e2862, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function swap__header_d9629fc219ee(a, b) {
  let t = i32((cDeref(a, Int32Array).value));
  ((cDeref(a, Int32Array).value) = i32((cDeref(b, Int32Array).value)));
  ((cDeref(b, Int32Array).value) = i32(t));
}

// C/C++ source: source/build/src/engine.cpp:1505
export function spriteheightofs__header_8e49a2bc7855(i, height, alsotileyofs) {
  return i32(spriteheightofsptr(cRecordPointer(cPointerOffset(sprite, i, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype}), height, alsotileyofs));
}

export function dmulscale6__header_3ffb9a5d0a39(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((6) & 255)) & 255)))));
}

export function bitmap_set__header_029e06cde64d(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_712730224f5e2862, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function ARRAY_SIZE__header_eb1dc12ec43c(arg0) {
  return u64(256n);
}

// C/C++ source: source/build/src/engine.cpp:263
export function yax_isislandwall__header_0ed122867acc(line, cf) {
  return i32((i32(yax_vnextsec((((line) << 16) >> 16), (((cf) << 16) >> 16))) >= 0));
}

export function mulscale5__header_a9c8933cfeb1(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((5) & 255)) & 255)))));
}

export function dmulscale32__header_a06d61cce60b(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((32) & 255)) & 255)))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_5f5393344013bb3a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_f609c7b01b7889e2(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/src/engine.cpp:322
export function setgotpic__header_28317d6431de(tilenume) {
  if ((i32((cDeref(cPointerOffset(walock, tilenume, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) < i32(200))) {
    ((cDeref(cPointerOffset(walock, tilenume, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((199) & 255)) & 255));
  }
  bitmap_set__header_029e06cde64d(gotpic, tilenume);
}

// C/C++ source: source/build/src/engine.cpp:244
export function getpalookupsh__header_1bc310a9a306(davis) {
  return i32((getpalookup__header_9e0e2706a9a3(davis, globalshade) << 8));
}

export function mulscale16__header_2ad7f18331e0(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((16) & 255)) & 255)))));
}

export function dmulscale2__header_4687fd622afb(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((2) & 255)) & 255)))));
}

export function mulscale6__header_5635a24338fa(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((6) & 255)) & 255)))));
}

export function mulscale22__header_42530064526a(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((22) & 255)) & 255)))));
}

export function mulscale2__header_140bec1d36ae(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((2) & 255)) & 255)))));
}

export function mulscale11__header_67f3f756c259(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((11) & 255)) & 255)))));
}

export function mulscale19__header_ac0120e047ad(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((19) & 255)) & 255)))));
}

export function mulscale21__header_1eccb132e47c(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((21) & 255)) & 255)))));
}

export function mulscale18__header_2e5aab2cbe66(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((18) & 255)) & 255)))));
}

export function clamp__header_8da804c99317(__cxx_in, min, max) {
  return (((((i32(__cxx_in) <= i32(((((((min) << 16) >> 16)) << 16) >> 16))) ? ((((((min) << 16) >> 16)) << 16) >> 16) : ((i32(__cxx_in) >= i32(((((((max) << 16) >> 16)) << 16) >> 16))) ? ((((((max) << 16) >> 16)) << 16) >> 16) : __cxx_in))) << 16) >> 16);
}

export function mulscale30__header_5f7e383a1e2c(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((30) & 255)) & 255)))));
}

// C/C++ source: source/build/src/engine.cpp:138
export function nsqrtasm__header_2324c22cfe44(a) {
  let c = (((cDeref(cPointerOffset(shlookup, (Boolean(u32((a & 4278190080))) ? u32(((a >>> 24) + u32(4096))) : (a >>> 12)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)) & 65535);
  (a = u32((a >> i32((i32(c) & 255)))));
  return i32((u32((u32((a & 4294901760)) | u32((cDeref(cPointerOffset(sqrtable, a, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value)))) >>> i32((i32((i32(c) & 65280)) >> 8))));
}

// C/C++ source: source/build/src/engine.cpp:1391
export function uhypsq__header_5727bece84fb(dx, dy) {
  return u32((u32(Math.imul(u32(dx), u32(dx))) + u32(Math.imul(u32(dy), u32(dy)))));
}

export function mulscale15__header_dc9d6d1d3568(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((15) & 255)) & 255)))));
}

export function mulscale20__header_c4282e210e65(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((20) & 255)) & 255)))));
}

export function tileUpdatePicnum__header_73f463eb462e(tileptr, obj) {
  const tile = cDeref(tileptr, Int16Array);
  if (Boolean(i32((i32((cPointerElementRef(picanm, tile.value).value).sf) & i32(192))))) {
    (tile.value = ((((tile.value + animateoffs(i32(tile.value)))) << 16) >> 16));
  }
  if ((((i32((obj & 16384)) == 16384) && Boolean(i32((globalorientation & i32(4096))))) && (i32((cPointerElementRef(rottile, tile.value).value).newtile) != (-1)))) {
    (tile.value = ((((cPointerElementRef(rottile, tile.value).value).newtile) << 16) >> 16));
  }
}

export function mulscale4__header_d996771b657e(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((4) & 255)) & 255)))));
}

export function dmulscale14__header_de5cc9315a24(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((14) & 255)) & 255)))));
}

export function mulscale10__header_45d6136c31a4(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((10) & 255)) & 255)))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_16d592da45d1e47f(__a, __b) {
  if ((i32(__b.value) < i32(__a.value))) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_cabf12978d41a12c(__a, __b) {
  if ((i32(__a.value) < i32(__b.value))) {
    return __b;
  }
  return __a;
}

export function mulscale31__header_a8faf60e26f6(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((31) & 255)) & 255)))));
}

export function mulscale24__header_b2d0fd89216d(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((24) & 255)) & 255)))));
}

export function mulscale27__header_a07635317506(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((27) & 255)) & 255)))));
}

export function dmulscale17__header_9bcb39a8638a(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((17) & 255)) & 255)))));
}

export function dmulscale25__header_a6fd0cf72991(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((25) & 255)) & 255)))));
}

export function mulscale14__header_b233ab7c2031(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((14) & 255)) & 255)))));
}

export function dmulscale16__header_3b05ae8142b5(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((16) & 255)) & 255)))));
}

export function mulscale12__header_4015a101abee(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((12) & 255)) & 255)))));
}

export function dmulscale9__header_09a25d91be44(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((9) & 255)) & 255)))));
}

export function mulscale28__header_75ea132a7023(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((28) & 255)) & 255)))));
}

// C/C++ source: source/build/src/engine.cpp:332
export function getpsky__header_97569e722ad5(picnum, dapyscale, dapskybits, dapyoffs, daptileyscale) {
  let psky = cPointerOffset(multipsky, getpskyidx__header_e608a775435f(picnum), 32);
  if (dapskybits) {
    ((cDeref(dapskybits, Int32Array).value) = i32(((i32(pskybits_override) == (-1)) ? i32(cRecordObject(psky).lognumtiles) : i32(pskybits_override))));
  }
  if (dapyscale) {
    ((cDeref(dapyscale, Int32Array).value) = i32(((parallaxyscale_override == 0) ? cRecordObject(psky).horizfrac : parallaxyscale_override)));
  }
  if (dapyoffs) {
    ((cDeref(dapyoffs, Int32Array).value) = i32((cRecordObject(psky).yoffs + parallaxyoffs_override)));
  }
  if (daptileyscale) {
    ((cDeref(daptileyscale, Int32Array).value) = i32(cRecordObject(psky).yscale));
  }
  return cRecordObject(psky).tileofs;
}

export function mulscale7__header_28d9d5a5d03b(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((7) & 255)) & 255)))));
}

export function mulscale8__header_34d78e8ed7b8(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((8) & 255)) & 255)))));
}

export function B_PASS32__header_62f2ccfacebc(x) {
  return i32(x);
}

export function dmulscale10__header_7f2947fb0277(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((10) & 255)) & 255)))));
}

export function dmulscale18__header_12af30603bc7(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((18) & 255)) & 255)))));
}

// C/C++ source: source/build/src/engine.cpp:328
export function ksgn__header_6f4a2c55100d(a) {
  return i32((i32((a > 0)) - i32((a < 0))));
}

export function B_PASS16__header_b0a656a2f158(x) {
  return (((x) << 16) >> 16);
}

export function clamp__header_972e781d1069(__cxx_in, min, max) {
  return i64(((__cxx_in <= i64(min)) ? i64(min) : ((__cxx_in >= i64(max)) ? i64(max) : __cxx_in)));
}

export function mulscale32__header_7f4f7cd9fc70(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((32) & 255)) & 255)))));
}

// C/C++ source: source/build/src/engine.cpp:332
export function mulscale__header_25763d8f4ac3(eax, edx, ecx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((ecx) & 255)) & 255)))));
}

// C/C++ source: source/build/src/engine.cpp:229
export function bad_tspr__header_1d627620a587(tspr) {
  return i32(((i32(cRecordObject(tspr).owner) < 0) || (u32(cRecordObject(tspr).picnum) >= u32(30720))));
}

// C/C++ source: source/build/src/engine.cpp:1797
export function tspriteGetSlope__header_68db8d154bd9(tspr) {
  if ((i32((i32(cRecordObject(tspr).cstat) & i32(48))) != i32(48))) {
    return ((((((0) << 16) >> 16)) << 16) >> 16);
  }
  return ((((((i32((i32(((((cRecordObject(tspr).xoffset) & 255)) & 255)) + i32((i32(((((cRecordObject(tspr).yoffset) & 255)) & 255)) << 8))))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/engine.cpp:1816
export function tspriteGetZOfSlope__header_0ebea63573a3(tspr, dax, day) {
  let heinum = (((tspriteGetSlope__header_68db8d154bd9(tspr)) << 16) >> 16);
  if ((i32(heinum) == 0)) {
    return i32(cRecordObject(tspr).__cxx_anonymous_0.__cxx_anonymous_0.z);
  }
  let j = i32(dmulscale4__header_98cfd5b283cb(i32((cDeref(cPointerOffset(sintable, i32((i32((i32(cRecordObject(tspr).ang) + 1024)) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), i32((day - cRecordObject(tspr).__cxx_anonymous_0.__cxx_anonymous_0.y)), (-i32((cDeref(cPointerOffset(sintable, i32((i32((i32(cRecordObject(tspr).ang) + 512)) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value))), i32((dax - cRecordObject(tspr).__cxx_anonymous_0.__cxx_anonymous_0.x))));
  return i32((cRecordObject(tspr).__cxx_anonymous_0.__cxx_anonymous_0.z + mulscale18__header_2e5aab2cbe66(i32(heinum), j)));
}

export function dmulscale20__header_24eaa227d6cb(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((20) & 255)) & 255)))));
}

export function dmulscale8__header_30990f859ae7(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((8) & 255)) & 255)))));
}

export function NEGATE_ON_CONDITION__header_2f9aae09d992(value, condition) {
  let invert = i32((!(!condition)));
  return i32((i32((value ^ (-invert))) + invert));
}

// C/C++ source: source/build/src/engine.cpp:239
export function getpalookup__header_9e0e2706a9a3(davis, dashade) {
  return i32((min__template_774131ccff66371d(max__template_b1cfaf2244c73238(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(i32((dashade + i32((davis >> 8))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(0)), ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(i32((i32(numshades) - 1))))).value);
}

export function mulscale1__header_46cf257f6a73(eax, edx) {
  return i32((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) >> BigInt(i32(((((1) & 255)) & 255)))));
}

export function ARRAY_SIZE__header_0ca2c0fefe7c(arg0) {
  return u64(10240n);
}

// C/C++ source: source/build/src/engine.cpp:47
export function fix16_from_float__header_9014b8844600(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_1ff90da45b33318d))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/build/src/engine.cpp:1451
export function xaligned_free__header_3c2bcb0a9ae6(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/engine.cpp:42
export function fix16_to_int__header_d5d1e3ae7024(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_32abdaf38138b574 : (-fix16_half__header_global_32abdaf38138b574)))) / fix16_one__header_global_1ff90da45b33318d));
}

// C/C++ source: source/build/src/engine.cpp:43
export function fix16_to_float__header_dc75c8949808(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_08ad66003e737fed)));
}

// C/C++ source: source/build/src/engine.cpp:348
export function set_globalpos__header_2dabc92af8b0(x, y, z) {
  ((globalposx = i32(x)), (fglobalposx = Math.fround(Math.fround(Math.fround(x)))));
  ((globalposy = i32(y)), (fglobalposy = Math.fround(Math.fround(Math.fround(y)))));
  ((globalposz = i32(z)), (fglobalposz = Math.fround(Math.fround(Math.fround(z)))));
}

// C/C++ source: source/build/src/engine.cpp:46
export function fix16_from_int__header_080657abf896(a) {
  return i32(Math.imul(a, fix16_one__header_global_1ff90da45b33318d));
}

export function swap__header_b3d07767a73a(a, b) {
  let t = (cPointerElementRef(a, 0).value);
  ((cPointerElementRef(a, 0).value) = (cPointerElementRef(b, 0).value));
  ((cPointerElementRef(b, 0).value) = t);
}

// C/C++ source: source/build/src/engine.cpp:390
export function get_wallspr_center__header_a959641b90ef(ptr) {
  let spr = cRecordPointer(ptr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype});
  (i32((i32(cRecordObject(spr).cstat) & i32(48))) == i32(16));
  let dims = cCopyAggregate(get_wallspr_dims__header_c0e6ee5eca43(spr), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"dax": {"native": "Int32Array", "offset": 0, "size": 4}, "day": {"native": "Int32Array", "offset": 4, "size": 4}, "tilesizx": {"native": "Int32Array", "offset": 8, "size": 4}, "xoff": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 16, "union": false}});
  let k = i32(dims.xoff);
  return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((cRecordObject(spr).__cxx_anonymous_0.__cxx_anonymous_0.x - mulscale16__header_2ad7f18331e0(dims.dax, k))), "y": i32((cRecordObject(spr).__cxx_anonymous_0.__cxx_anonymous_0.y - mulscale16__header_2ad7f18331e0(dims.day, k)))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
}

// C/C++ source: source/build/src/engine.cpp:454
export function get_floorspr_center__header_7edd9651e893(ptr, sloped) {
  let spr = cRecordPointer(ptr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype});
  (i32((i32(cRecordObject(spr).cstat) & i32(48))) == i32((sloped ? 48 : 32)));
  let dims = cCopyAggregate(get_floorspr_dims__header_cf267038c604(spr, sloped), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"adjofs": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 24}, "cosang": {"native": "Int32Array", "offset": 0, "size": 4}, "repeat": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 16}, "sinang": {"native": "Int32Array", "offset": 4, "size": 4}, "span": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 8}}, "overlaps": false, "size": 32, "union": false}});
  let cosang = i32(dims.cosang);
  let sinang = i32(dims.sinang);
  let center = cCopyAggregate(dims.adjofs.__cxx_operator_729d876abe4b118e(cCopyAggregate(dims.repeat, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}})), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}});
  let dx = i32(dmulscale16__header_3b05ae8142b5(sinang, center.x, cosang, center.y));
  let dy = i32(dmulscale16__header_3b05ae8142b5(sinang, center.y, (-cosang), center.x));
  return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((cRecordObject(spr).__cxx_anonymous_0.__cxx_anonymous_0.x + dx)), "y": i32((cRecordObject(spr).__cxx_anonymous_0.__cxx_anonymous_0.y + dy))}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
}

// C/C++ source: source/build/src/engine.cpp:403
export function get_wallspr_points__header_fe63d0e57f1b(ptr, x1, x2, y1, y2) {
  let dims = cCopyAggregate(get_wallspr_dims__header_c0e6ee5eca43(cRecordPointer(ptr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype})), {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"dax": {"native": "Int32Array", "offset": 0, "size": 4}, "day": {"native": "Int32Array", "offset": 4, "size": 4}, "tilesizx": {"native": "Int32Array", "offset": 8, "size": 4}, "xoff": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 16, "union": false}});
  let dax = i32(dims.dax);
  let day = i32(dims.day);
  let l = i32(dims.tilesizx);
  let k = i32((i32((l >> 1)) + dims.xoff));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) - Number(mulscale16__header_2ad7f18331e0(dax, k))))))(cDeref(x1, Int32Array));
  ((cDeref(x2, Int32Array).value) = i32(((cDeref(x1, Int32Array).value) + mulscale16__header_2ad7f18331e0(dax, l))));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) - Number(mulscale16__header_2ad7f18331e0(day, k))))))(cDeref(y1, Int32Array));
  ((cDeref(y2, Int32Array).value) = i32(((cDeref(y1, Int32Array).value) + mulscale16__header_2ad7f18331e0(day, l))));
}

export function dmulscale1__header_6595639393de(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((1) & 255)) & 255)))));
}

// C/C++ source: source/build/src/engine.cpp:147
export function getclipmask__header_25a26495e020(a, b, c, d) {
  (d = i32((i32((i32((i32((i32((a < 0)) << 3)) + i32((i32((b < 0)) << 2)))) + i32((i32((c < 0)) << 1)))) + i32((d < 0)))));
  return i32((i32((i32((d << 4)) ^ 240)) | d));
}

export function dmulscale28__header_1e2e1572434b(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((28) & 255)) & 255)))));
}

export function swap__header_2a28141e0e7c(a, b) {
  let t = ((((cDeref(a, Int16Array).value)) << 16) >> 16);
  ((cDeref(a, Int16Array).value) = ((((cDeref(b, Int16Array).value)) << 16) >> 16));
  ((cDeref(b, Int16Array).value) = (((t) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:746
export function spriteGetSlope__header_76c1a567cae3(spritenum) {
  let spr = cRecordPointer(cPointerOffset(sprite, spritenum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype});
  let cstat = ((((i32((i32(cRecordObject(spr).cstat) & i32(48)))) & 65535)) & 65535);
  if ((i32(cstat) != i32(48))) {
    return ((((((0) << 16) >> 16)) << 16) >> 16);
  }
  return ((((((i32((i32(((((cRecordObject(spr).xoffset) & 255)) & 255)) + i32((i32(((((cRecordObject(spr).yoffset) & 255)) & 255)) << 8))))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/build/src/engine.cpp:1300
export function getcrc16__header_6717f56e8526(buffer, bufleng, crc) {
  for (let i = i32(0); (i < bufleng); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (crc = i32((i32((i32((crc << 8)) & 65535)) ^ (cDeref(cPointerOffset(crctab16, i32((i32((i32((i32(((((crc) & 65535)) & 65535)) >> 8)) & 65535)) ^ i32((cDeref(cPointerOffset(cTypedPointer(buffer, Uint8Array), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  }
  return ((((((i32((crc & 65535))) & 65535)) & 65535)) & 65535);
}

export function B_PASS16__header_cd4096824faf(x) {
  return ((x) & 65535);
}

// C/C++ source: source/build/src/engine.cpp:100
export function convertv5sectv6__header_a5905cc8a6e5(from, to) {
  (cRecordObject(to).wallptr = ((cRecordObject(from).wallptr) & 65535));
  (cRecordObject(to).wallnum = ((cRecordObject(from).wallnum) & 65535));
  (cRecordObject(to).ceilingpicnum = (((cRecordObject(from).ceilingpicnum) << 16) >> 16));
  (cRecordObject(to).floorpicnum = (((cRecordObject(from).floorpicnum) << 16) >> 16));
  (cRecordObject(to).ceilingheinum = (((cRecordObject(from).ceilingheinum) << 16) >> 16));
  (cRecordObject(to).floorheinum = (((cRecordObject(from).floorheinum) << 16) >> 16));
  (cRecordObject(to).ceilingz = i32(cRecordObject(from).ceilingz));
  (cRecordObject(to).floorz = i32(cRecordObject(from).floorz));
  (cRecordObject(to).ceilingshade = (((cRecordObject(from).ceilingshade) << 24) >> 24));
  (cRecordObject(to).floorshade = (((cRecordObject(from).floorshade) << 24) >> 24));
  (cRecordObject(to).ceilingxpanning = ((cRecordObject(from).ceilingxpanning) & 255));
  (cRecordObject(to).floorxpanning = ((cRecordObject(from).floorxpanning) & 255));
  (cRecordObject(to).ceilingypanning = ((cRecordObject(from).ceilingypanning) & 255));
  (cRecordObject(to).floorypanning = ((cRecordObject(from).floorypanning) & 255));
  (cRecordObject(to).ceilingstat = ((cRecordObject(from).ceilingstat) & 255));
  (cRecordObject(to).floorstat = ((cRecordObject(from).floorstat) & 255));
  (cRecordObject(to).ceilingpal = ((cRecordObject(from).ceilingpal) & 255));
  (cRecordObject(to).floorpal = ((cRecordObject(from).floorpal) & 255));
  (cRecordObject(to).visibility = ((cRecordObject(from).visibility) & 255));
  (cRecordObject(to).lotag = (((cRecordObject(from).lotag) << 16) >> 16));
  (cRecordObject(to).hitag = (((cRecordObject(from).hitag) << 16) >> 16));
  (cRecordObject(to).extra = (((cRecordObject(from).extra) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:180
export function convertv6sectv7__header_b5deb5fa14b3(from, to) {
  (cRecordObject(to).ceilingz = i32(cRecordObject(from).ceilingz));
  (cRecordObject(to).floorz = i32(cRecordObject(from).floorz));
  (cRecordObject(to).wallptr = ((((((cRecordObject(from).wallptr) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(to).wallnum = ((((((cRecordObject(from).wallnum) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(to).ceilingpicnum = (((cRecordObject(from).ceilingpicnum) << 16) >> 16));
  (cRecordObject(to).ceilingheinum = (((((((max__template_b1cfaf2244c73238(min__template_774131ccff66371d(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(i32((i32(cRecordObject(from).ceilingheinum) << 5))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(32767)), ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))((-32768)))).value) << 16) >> 16)) << 16) >> 16));
  if ((i32((i32(cRecordObject(from).ceilingstat) & 2)) == 0)) {
    (cRecordObject(to).ceilingheinum = ((((((0) << 16) >> 16)) << 16) >> 16));
  }
  (cRecordObject(to).ceilingshade = (((cRecordObject(from).ceilingshade) << 24) >> 24));
  (cRecordObject(to).ceilingpal = ((((cRecordObject(from).ceilingpal) & 255)) & 255));
  (cRecordObject(to).ceilingxpanning = ((((cRecordObject(from).ceilingxpanning) & 255)) & 255));
  (cRecordObject(to).ceilingypanning = ((((cRecordObject(from).ceilingypanning) & 255)) & 255));
  (cRecordObject(to).floorpicnum = (((cRecordObject(from).floorpicnum) << 16) >> 16));
  (cRecordObject(to).floorheinum = (((((((max__template_b1cfaf2244c73238(min__template_774131ccff66371d(((__cxx_lvalue_3) => cRef(() => __cxx_lvalue_3, () => { throw new TypeError("const C++ reference write"); }))(i32((i32(cRecordObject(from).floorheinum) << 5))), ((__cxx_lvalue_4) => cRef(() => __cxx_lvalue_4, () => { throw new TypeError("const C++ reference write"); }))(32767)), ((__cxx_lvalue_5) => cRef(() => __cxx_lvalue_5, () => { throw new TypeError("const C++ reference write"); }))((-32768)))).value) << 16) >> 16)) << 16) >> 16));
  if ((i32((i32(cRecordObject(from).floorstat) & 2)) == 0)) {
    (cRecordObject(to).floorheinum = ((((((0) << 16) >> 16)) << 16) >> 16));
  }
  (cRecordObject(to).floorshade = (((cRecordObject(from).floorshade) << 24) >> 24));
  (cRecordObject(to).floorpal = ((((cRecordObject(from).floorpal) & 255)) & 255));
  (cRecordObject(to).floorxpanning = ((((cRecordObject(from).floorxpanning) & 255)) & 255));
  (cRecordObject(to).floorypanning = ((((cRecordObject(from).floorypanning) & 255)) & 255));
  (cRecordObject(to).ceilingstat = ((((cRecordObject(from).ceilingstat) & 65535)) & 65535));
  (cRecordObject(to).floorstat = ((((cRecordObject(from).floorstat) & 65535)) & 65535));
  (cRecordObject(to).visibility = ((((cRecordObject(from).visibility) & 255)) & 255));
  (cRecordObject(to).fogpal = ((((0) & 255)) & 255));
  (cRecordObject(to).lotag = (((cRecordObject(from).lotag) << 16) >> 16));
  (cRecordObject(to).hitag = (((cRecordObject(from).hitag) << 16) >> 16));
  (cRecordObject(to).extra = (((cRecordObject(from).extra) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:126
export function convertv5wallv6__header_035b580f4f9f(from, to, i) {
  (cRecordObject(to).x = i32(cRecordObject(from).x));
  (cRecordObject(to).y = i32(cRecordObject(from).y));
  (cRecordObject(to).point2 = (((cRecordObject(from).point2) << 16) >> 16));
  (cRecordObject(to).nextsector = (((cRecordObject(from).nextsector1) << 16) >> 16));
  (cRecordObject(to).nextwall = (((cRecordObject(from).nextwall1) << 16) >> 16));
  (cRecordObject(to).picnum = (((cRecordObject(from).picnum) << 16) >> 16));
  (cRecordObject(to).overpicnum = (((cRecordObject(from).overpicnum) << 16) >> 16));
  (cRecordObject(to).shade = (((cRecordObject(from).shade) << 24) >> 24));
  (cRecordObject(to).pal = (((((cPointerElementRef(sector, sectorofwallv5__header_a79e4b70ad66(((((((i) << 16) >> 16)) << 16) >> 16))).value).floorpal) & 255)) & 255));
  (cRecordObject(to).cstat = (((cRecordObject(from).cstat) << 16) >> 16));
  (cRecordObject(to).xrepeat = ((cRecordObject(from).xrepeat) & 255));
  (cRecordObject(to).yrepeat = ((cRecordObject(from).yrepeat) & 255));
  (cRecordObject(to).xpanning = ((cRecordObject(from).xpanning) & 255));
  (cRecordObject(to).ypanning = ((cRecordObject(from).ypanning) & 255));
  (cRecordObject(to).lotag = (((cRecordObject(from).lotag) << 16) >> 16));
  (cRecordObject(to).hitag = (((cRecordObject(from).hitag) << 16) >> 16));
  (cRecordObject(to).extra = (((cRecordObject(from).extra) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:212
export function convertv6wallv7__header_74aaf7309edb(from, to) {
  (cRecordObject(to).__cxx_anonymous_0.__cxx_anonymous_0.x = i32(cRecordObject(from).x));
  (cRecordObject(to).__cxx_anonymous_0.__cxx_anonymous_0.y = i32(cRecordObject(from).y));
  (cRecordObject(to).point2 = (((cRecordObject(from).point2) << 16) >> 16));
  (cRecordObject(to).nextwall = (((cRecordObject(from).nextwall) << 16) >> 16));
  (cRecordObject(to).nextsector = (((cRecordObject(from).nextsector) << 16) >> 16));
  (cRecordObject(to).cstat = ((((cRecordObject(from).cstat) & 65535)) & 65535));
  (cRecordObject(to).picnum = (((cRecordObject(from).picnum) << 16) >> 16));
  (cRecordObject(to).overpicnum = (((cRecordObject(from).overpicnum) << 16) >> 16));
  (cRecordObject(to).shade = (((cRecordObject(from).shade) << 24) >> 24));
  (cRecordObject(to).pal = ((((cRecordObject(from).pal) & 255)) & 255));
  (cRecordObject(to).xrepeat = ((((cRecordObject(from).xrepeat) & 255)) & 255));
  (cRecordObject(to).yrepeat = ((((cRecordObject(from).yrepeat) & 255)) & 255));
  (cRecordObject(to).xpanning = ((((cRecordObject(from).xpanning) & 255)) & 255));
  (cRecordObject(to).ypanning = ((((cRecordObject(from).ypanning) & 255)) & 255));
  (cRecordObject(to).lotag = (((cRecordObject(from).lotag) << 16) >> 16));
  (cRecordObject(to).hitag = (((cRecordObject(from).hitag) << 16) >> 16));
  (cRecordObject(to).extra = (((cRecordObject(from).extra) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:147
export function convertv5sprv6__header_7ffd8234a739(from, to) {
  let j;
  (cRecordObject(to).x = i32(cRecordObject(from).x));
  (cRecordObject(to).y = i32(cRecordObject(from).y));
  (cRecordObject(to).z = i32(cRecordObject(from).z));
  (cRecordObject(to).cstat = ((((((cRecordObject(from).cstat) << 16) >> 16)) << 16) >> 16));
  (cRecordObject(to).shade = (((cRecordObject(from).shade) << 24) >> 24));
  (j = (((cRecordObject(from).sectnum) << 16) >> 16));
  if ((i32((i32((cPointerElementRef(sector, j).value).ceilingstat) & 1)) > 0)) {
    (cRecordObject(to).pal = (((((cPointerElementRef(sector, j).value).ceilingpal) & 255)) & 255));
  } else {
    (cRecordObject(to).pal = (((((cPointerElementRef(sector, j).value).floorpal) & 255)) & 255));
  }
  (cRecordObject(to).clipdist = ((((32) & 255)) & 255));
  (cRecordObject(to).xrepeat = ((cRecordObject(from).xrepeat) & 255));
  (cRecordObject(to).yrepeat = ((cRecordObject(from).yrepeat) & 255));
  (cRecordObject(to).xoffset = ((((((0) << 24) >> 24)) << 24) >> 24));
  (cRecordObject(to).yoffset = ((((((0) << 24) >> 24)) << 24) >> 24));
  (cRecordObject(to).picnum = (((cRecordObject(from).picnum) << 16) >> 16));
  (cRecordObject(to).ang = (((cRecordObject(from).ang) << 16) >> 16));
  (cRecordObject(to).xvel = (((cRecordObject(from).xvel) << 16) >> 16));
  (cRecordObject(to).yvel = (((cRecordObject(from).yvel) << 16) >> 16));
  (cRecordObject(to).zvel = (((cRecordObject(from).zvel) << 16) >> 16));
  (cRecordObject(to).owner = (((cRecordObject(from).owner) << 16) >> 16));
  (cRecordObject(to).sectnum = (((cRecordObject(from).sectnum) << 16) >> 16));
  (cRecordObject(to).statnum = (((cRecordObject(from).statnum) << 16) >> 16));
  (cRecordObject(to).lotag = (((cRecordObject(from).lotag) << 16) >> 16));
  (cRecordObject(to).hitag = (((cRecordObject(from).hitag) << 16) >> 16));
  (cRecordObject(to).extra = (((cRecordObject(from).extra) << 16) >> 16));
}

// C/C++ source: source/build/src/engine.cpp:236
export function convertv6sprv7__header_0875eb7128dd(from, to) {
  (cRecordObject(to).__cxx_anonymous_0.__cxx_anonymous_0.x = i32(cRecordObject(from).x));
  (cRecordObject(to).__cxx_anonymous_0.__cxx_anonymous_0.y = i32(cRecordObject(from).y));
  (cRecordObject(to).__cxx_anonymous_0.__cxx_anonymous_0.z = i32(cRecordObject(from).z));
  (cRecordObject(to).cstat = ((((cRecordObject(from).cstat) & 65535)) & 65535));
  (cRecordObject(to).picnum = (((cRecordObject(from).picnum) << 16) >> 16));
  (cRecordObject(to).shade = (((cRecordObject(from).shade) << 24) >> 24));
  (cRecordObject(to).pal = ((((cRecordObject(from).pal) & 255)) & 255));
  (cRecordObject(to).clipdist = ((((cRecordObject(from).clipdist) & 255)) & 255));
  (cRecordObject(to).blend = ((((0) & 255)) & 255));
  (cRecordObject(to).xrepeat = ((((cRecordObject(from).xrepeat) & 255)) & 255));
  (cRecordObject(to).yrepeat = ((((cRecordObject(from).yrepeat) & 255)) & 255));
  (cRecordObject(to).xoffset = (((cRecordObject(from).xoffset) << 24) >> 24));
  (cRecordObject(to).yoffset = (((cRecordObject(from).yoffset) << 24) >> 24));
  (cRecordObject(to).sectnum = (((cRecordObject(from).sectnum) << 16) >> 16));
  (cRecordObject(to).statnum = (((cRecordObject(from).statnum) << 16) >> 16));
  (cRecordObject(to).ang = (((cRecordObject(from).ang) << 16) >> 16));
  (cRecordObject(to).owner = (((cRecordObject(from).owner) << 16) >> 16));
  (cRecordObject(to).__cxx_anonymous_15.__cxx_anonymous_0.xvel = (((cRecordObject(from).xvel) << 16) >> 16));
  (cRecordObject(to).__cxx_anonymous_15.__cxx_anonymous_0.yvel = (((cRecordObject(from).yvel) << 16) >> 16));
  (cRecordObject(to).__cxx_anonymous_15.__cxx_anonymous_0.zvel = (((cRecordObject(from).zvel) << 16) >> 16));
  (cRecordObject(to).lotag = (((cRecordObject(from).lotag) << 16) >> 16));
  (cRecordObject(to).hitag = (((cRecordObject(from).hitag) << 16) >> 16));
  (cRecordObject(to).extra = (((cRecordObject(from).extra) << 16) >> 16));
}

export function ARRAY_SIZE__header_3fb05a303daa(arg0) {
  return u64(22n);
}

export function bitmap_clear__header_4ac52a79d043(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & (~i32((cDeref(cPointerOffset(pow2char__header_global_712730224f5e2862, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function SILENCE_UNUSED__header_5a02d0661e03(arg0, arg1, arg2) {

}

export function SILENCE_UNUSED__header_8685d1f62898(arg0, arg1, arg2) {

}

// C/C++ source: source/build/src/engine.cpp:1705
export function inside_p__header_6c2c67bc1240(x, y, sectnum) {
  return i32(((u32(sectnum) < u32(4096)) && (inside(x, y, (((sectnum) << 16) >> 16)) == 1)));
}

// C/C++ source: source/build/src/engine.cpp:1710
export function inside_exclude_p__header_0eb2a5f7bb44(x, y, sectnum, excludesectbitmap) {
  return i32((((u32(sectnum) < u32(4096)) && (!bitmap_test__header_955f0b2ebc45(excludesectbitmap, sectnum))) && Boolean(inside_p__header_6c2c67bc1240(x, y, sectnum))));
}

export function swap__header_34fe25370a47(a, b) {
  let t = (((cDeref(a, Uint8Array).value)) & 255);
  ((cDeref(a, Uint8Array).value) = (((cDeref(b, Uint8Array).value)) & 255));
  ((cDeref(b, Uint8Array).value) = ((t) & 255));
}

// C/C++ source: source/build/src/engine.cpp:301
export function swapchar2__header_fd0bf6906f7c(a, b, s) {
  swap__header_34fe25370a47(cTypedPointer(a, Uint8Array), cTypedPointer(b, Uint8Array));
  swap__header_34fe25370a47(cPointerOffset(cTypedPointer(a, Uint8Array), 1, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(cTypedPointer(b, Uint8Array), s, Uint8Array.BYTES_PER_ELEMENT));
}

export function dmulscale3__header_aa88439571c0(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((3) & 255)) & 255)))));
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/src/engine.cpp:700
export function renderMakeTSpriteFromSprite__header_34b2a77e58ce(tspr, spritenum) {
  let spr = cRecordPointer(cPointerOffset(sprite, spritenum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype, "__cxx_record_vec2_8ca824f0ac397ec5": () => __cxx_record_vec2_8ca824f0ac397ec5().prototype});
  cAssignAggregate(cRecordObject(tspr).__cxx_anonymous_0.xyz, cRecordObject(spr).__cxx_anonymous_0.xyz, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}});
  (cRecordObject(tspr).cstat = ((cRecordObject(spr).cstat) & 65535));
  (cRecordObject(tspr).picnum = (((cRecordObject(spr).picnum) << 16) >> 16));
  (cRecordObject(tspr).shade = (((cRecordObject(spr).shade) << 24) >> 24));
  (cRecordObject(tspr).pal = ((cRecordObject(spr).pal) & 255));
  (cRecordObject(tspr).blend = ((cRecordObject(spr).blend) & 255));
  (cRecordObject(tspr).xrepeat = ((cRecordObject(spr).xrepeat) & 255));
  (cRecordObject(tspr).yrepeat = ((cRecordObject(spr).yrepeat) & 255));
  (cRecordObject(tspr).xoffset = (((cRecordObject(spr).xoffset) << 24) >> 24));
  (cRecordObject(tspr).yoffset = (((cRecordObject(spr).yoffset) << 24) >> 24));
  (cRecordObject(tspr).sectnum = (((cRecordObject(spr).sectnum) << 16) >> 16));
  (cRecordObject(tspr).statnum = (((cRecordObject(spr).statnum) << 16) >> 16));
  (cRecordObject(tspr).ang = (((cRecordObject(spr).ang) << 16) >> 16));
  cAssignAggregate(cRecordObject(tspr).__cxx_anonymous_15.vel, cRecordObject(spr).__cxx_anonymous_15.vel, {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "prototype": "__cxx_record_vec2_8ca824f0ac397ec5", "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}});
  (cRecordObject(tspr).lotag = (((cRecordObject(spr).lotag) << 16) >> 16));
  (cRecordObject(tspr).hitag = (((cRecordObject(spr).hitag) << 16) >> 16));
  (cRecordObject(tspr).extra = (((cRecordObject(spr).extra) << 16) >> 16));
  (cRecordObject(tspr).clipdist = ((((0) & 255)) & 255));
  (cRecordObject(tspr).owner = ((((((spritenum) << 16) >> 16)) << 16) >> 16));
  return tspr;
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/src/engine.cpp:863
export function getpskyidx__header_e608a775435f(picnum) {
  let j;
  for ((j = i32((pskynummultis - 1))); (j > 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    if ((picnum == (cDeref(cPointerOffset(multipskytile, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      break;
    }
  }
  return i32(j);
}

export function dmulscale4__header_98cfd5b283cb(eax, edx, esi, edi) {
  return i32((BigInt((BigInt((BigInt(i64(eax)) * BigInt(i64(edx)))) + BigInt((BigInt(i64(esi)) * BigInt(i64(edi)))))) >> BigInt(i32(((((4) & 255)) & 255)))));
}

// C/C++ source: source/build/include/smmalloc.h:849
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}

// C/C++ source: source/build/src/engine.cpp:375
export function get_wallspr_dims__header_c0e6ee5eca43(spr) {
  let tilenum = i32(cRecordObject(spr).picnum);
  let ang = i32(cRecordObject(spr).ang);
  let xrepeat = i32(cRecordObject(spr).xrepeat);
  let xoff = i32((i32((cPointerElementRef(picanm, tilenum).value).xofs) + i32(cRecordObject(spr).xoffset)));
  if (Boolean(i32((i32(cRecordObject(spr).cstat) & 4)))) {
    (xoff = i32((-xoff)));
  }
  let dax = i32(Math.imul(i32((cDeref(cPointerOffset(sintable, i32((ang & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), xrepeat));
  let day = i32(Math.imul(i32((cDeref(cPointerOffset(sintable, i32((i32((ang + 1536)) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value)), xrepeat));
  return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"dax": {"native": "Int32Array", "offset": 0, "size": 4}, "day": {"native": "Int32Array", "offset": 4, "size": 4}, "tilesizx": {"native": "Int32Array", "offset": 8, "size": 4}, "xoff": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"dax": dax, "day": day, "tilesizx": i32((cPointerElementRef(tilesiz, tilenum).value).x), "xoff": xoff}, null, {});
}

// C/C++ source: source/build/src/engine.cpp:427
export function get_floorspr_dims__header_cf267038c604(spr, sloped) {
  let tilenum = i32(cRecordObject(spr).picnum);
  let cosang = i32((cDeref(cPointerOffset(sintable, i32((i32((i32(cRecordObject(spr).ang) + 512)) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let sinang = i32((cDeref(cPointerOffset(sintable, i32((i32(cRecordObject(spr).ang) & 2047)), Int16Array.BYTES_PER_ELEMENT), Int16Array).value));
  let span = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((cPointerElementRef(tilesiz, tilenum).value).x), "y": i32((cPointerElementRef(tilesiz, tilenum).value).y)}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  let repeat = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32(cRecordObject(spr).xrepeat), "y": i32(cRecordObject(spr).yrepeat)}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  let adjofs = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, {"x": i32((cPointerElementRef(picanm, tilenum).value).xofs), "y": i32((cPointerElementRef(picanm, tilenum).value).yofs)}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
  if ((!sloped)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(i32(cRecordObject(spr).xoffset))))))(cObjectFieldRef(adjofs, "x"));
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(i32(cRecordObject(spr).yoffset))))))(cObjectFieldRef(adjofs, "y"));
  }
  if (Boolean(i32((i32(cRecordObject(spr).cstat) & 4)))) {
    (adjofs.x = i32((-adjofs.x)));
  }
  if (Boolean(i32((i32(cRecordObject(spr).cstat) & 8)))) {
    (adjofs.y = i32((-adjofs.y)));
  }
  return cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"adjofs": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 24}, "cosang": {"native": "Int32Array", "offset": 0, "size": 4}, "repeat": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 16}, "sinang": {"native": "Int32Array", "offset": 4, "size": 4}, "span": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, "offset": 8}}, "overlaps": false, "size": 32, "union": false}, {"cosang": cosang, "sinang": sinang, "span": cCopyAggregate(span, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}), "repeat": cCopyAggregate(repeat, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}), "adjofs": cCopyAggregate(adjofs, {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}})}, null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
}

// C/C++ source: source/build/src/engine.cpp:82
export function sectorofwallv5__header_a79e4b70ad66(theline) {
  let i;
  let startwall;
  let endwall;
  let sucksect;
  (sucksect = (((((((-1)) << 16) >> 16)) << 16) >> 16));
  for ((i = ((((((0) << 16) >> 16)) << 16) >> 16)); (i32(i) < i32(numsectors)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = ((((previous + 1)) << 16) >> 16); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (startwall = ((((cPointerElementRef(sector, i).value).wallptr) << 16) >> 16));
    (endwall = ((((((i32((i32((i32(startwall) + i32((cPointerElementRef(sector, i).value).wallnum))) - 1))) << 16) >> 16)) << 16) >> 16));
    if (((i32(theline) >= i32(startwall)) && (i32(theline) <= i32(endwall)))) {
      (sucksect = (((i) << 16) >> 16));
      break;
    }
  }
  return (((sucksect) << 16) >> 16);
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
