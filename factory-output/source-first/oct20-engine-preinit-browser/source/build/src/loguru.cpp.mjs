// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/loguru.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { _xfree } from "./compat.cpp.mjs";
import { closelog } from "../../../browser-abi/libc_provider.mjs";
import { fclose } from "../../../browser-abi/libc_provider.mjs";
import { fflush } from "../../../browser-abi/libc_provider.mjs";
import { fprintf } from "../../../browser-abi/libc_provider.mjs";
import { free } from "../../../browser-abi/libc_provider.mjs";
import { getpid } from "../../../browser-abi/libc_provider.mjs";
import { kill } from "../../../browser-abi/libc_provider.mjs";
import { pthread_key_create } from "../../../browser-abi/libc_provider.mjs";
import { sigaction } from "../../../browser-abi/libc_provider.mjs";
import { sigemptyset } from "../../../browser-abi/libc_provider.mjs";
import { syslog } from "../../../browser-abi/libc_provider.mjs";
import { write } from "../../../browser-abi/libc_provider.mjs";


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
  if(!Number.isSafeInteger(count)||count<0||count>1000000||
      (typeof values!=='function'&&(!Array.isArray(values)||values.length>count)))
    throw new RangeError('Invalid original pointer-array extent');
  const bytes=storage||new Uint8Array(count*8);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*8||bytes.byteOffset%8)
    throw new TypeError('Pointer array backing store differs from original LP64 extent');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),slots=new Array(count).fill(null);
  // Original static pointer relocations can refer to storage exported by a
  // cyclic ES module. Allocate slots now, resolve their proven addresses on
  // first access, before either slot operations or a raw byte copy can see them.
  let pending=values,initializing=false;
  const initialize=()=>{
    if(pending===null)return;
    if(initializing)throw new TypeError('Recursive static pointer-array initialization');
    initializing=true;
    try{
      const initial=typeof pending==='function'?pending():pending;
      if(!Array.isArray(initial)||initial.length>count)throw new TypeError('Invalid static pointer-array relocation list');
      const encoded=initial.map(value=>cByteRecordPointers.encode(value));
      for(let i=0;i<encoded.length;i++)view.setBigUint64(i*8,encoded[i],true);
      pending=null;
    }finally{initializing=false;}
  };
  const allocationView=new DataView(bytes.buffer);
  const allocationKey=Symbol.for('source-first.pointer-array-allocations/1');
  const allocations=globalThis[allocationKey]||(globalThis[allocationKey]=new WeakMap());
  allocations.set(bytes.buffer,{lower:0,upper:bytes.buffer.byteLength,
    read:offset=>{initialize();return cByteRecordPointers.decode(allocationView.getBigUint64(offset,true));},
    write:(offset,value)=>{initialize();allocationView.setBigUint64(offset,cByteRecordPointers.encode(value),true);}});
  Object.defineProperty(slots,Symbol.for('source-first.clang-byte-record-array/1'),{get(){initialize();return bytes;}});
  Object.defineProperty(slots,Symbol.for('source-first.clang-pointer-array/1'),{value:true});
  const indexOf=key=>typeof key==='string'&&/^(0|[1-9][0-9]*)$/.test(key)?Number(key):-1;
  const result=new Proxy(slots,{
    get(target,key,receiver){const i=indexOf(key);if(i>=0){if(i>=count)throw new RangeError('C pointer-array read exceeds extent');initialize();return cByteRecordPointers.decode(view.getBigUint64(i*8,true));}return Reflect.get(target,key,receiver);},
    set(target,key,value,receiver){const i=indexOf(key);if(i>=0){if(i>=count)throw new RangeError('C pointer-array write exceeds extent');initialize();view.setBigUint64(i*8,cByteRecordPointers.encode(value),true);return true;}if(key==='length')throw new TypeError('Cannot resize original C pointer array');return Reflect.set(target,key,value,receiver);}
  });
  if(typeof values!=='function')initialize();
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
export const fix16_rad_to_deg_mult__header_global_282ce0adf0d95848 = i32(3754936);
function __cxx_static_address_91f18229edb3464bc9531c6c() {
  return __cxx_static_address_91f18229edb3464bc9531c6c.reference || (__cxx_static_address_91f18229edb3464bc9531c6c.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_282ce0adf0d95848; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_6a18ef319da228ee = i32(1144);
function __cxx_static_address_451d272ee9d531e4146337ab() {
  return __cxx_static_address_451d272ee9d531e4146337ab.reference || (__cxx_static_address_451d272ee9d531e4146337ab.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_6a18ef319da228ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/loguru.hpp:362
export function Message() {
  return Message.type || (Message.type = class Message__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 8, "pointer": true, "size": 8}, "indentation": {"offset": 32, "pointer": true, "size": 8}, "line": {"native": "Uint32Array", "offset": 16, "size": 4}, "message": {"offset": 48, "pointer": true, "size": 8}, "preamble": {"offset": 24, "pointer": true, "size": 8}, "prefix": {"offset": 40, "pointer": true, "size": 8}, "verbosity": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 56, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/build/include/loguru.hpp:415
export function SignalOptions() {
  return SignalOptions.type || (SignalOptions.type = class SignalOptions__implementation {
  constructor() {
    this.unsafe_signal_handler = Boolean(true);
    this.sigabrt = Boolean(true);
    this.sigbus = Boolean(true);
    this.sigfpe = Boolean(true);
    this.sigill = Boolean(true);
    this.sigint = Boolean(true);
    this.sigsegv = Boolean(true);
    this.sigterm = Boolean(true);
  }
  static none() {
    let options = new (SignalOptions())();
    (options.unsafe_signal_handler = Boolean(false));
    (options.sigabrt = Boolean(false));
    (options.sigbus = Boolean(false));
    (options.sigfpe = Boolean(false));
    (options.sigill = Boolean(false));
    (options.sigint = Boolean(false));
    (options.sigsegv = Boolean(false));
    (options.sigterm = Boolean(false));
    return cCopyTrivialClass(options, SignalOptions(), ["unsafe_signal_handler", "sigabrt", "sigbus", "sigfpe", "sigill", "sigint", "sigsegv", "sigterm"]);
  }
});
}

// C/C++ source: source/build/src/loguru.cpp:223
export class __cxx_record_lock_guard_77d8107e860593b5 {
  constructor(__m) {
    this._M_device = __m;
    this._M_device.lock();
  }
  __cxx_destruct_2a82ab6007d7407b() {
    this._M_device.unlock();
  }
}

// C/C++ source: source/build/src/loguru.cpp:192
export let g_stderr_verbosity = i32(0);
export function __cxx_global_cell_15062f896ae6daef493e80a9() {
  return __cxx_global_cell_15062f896ae6daef493e80a9.reference || (__cxx_global_cell_15062f896ae6daef493e80a9.reference = {
    __cReference: true,
    get value() { return g_stderr_verbosity; },
    set value(__cxx_lvalue_0) { g_stderr_verbosity = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:193
export let g_colorlogtostderr = Boolean(true);
export function __cxx_global_cell_83ac05a775fc238217d71b43() {
  return __cxx_global_cell_83ac05a775fc238217d71b43.reference || (__cxx_global_cell_83ac05a775fc238217d71b43.reference = {
    __cReference: true,
    get value() { return g_colorlogtostderr; },
    set value(__cxx_lvalue_0) { g_colorlogtostderr = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:194
export let g_flush_interval_ms = u32(0);
export function __cxx_global_cell_4f91480770cfeac205d9012e() {
  return __cxx_global_cell_4f91480770cfeac205d9012e.reference || (__cxx_global_cell_4f91480770cfeac205d9012e.reference = {
    __cReference: true,
    get value() { return g_flush_interval_ms; },
    set value(__cxx_lvalue_0) { g_flush_interval_ms = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:195
export let g_preamble_header = Boolean(true);
export function __cxx_global_cell_06818c162ca5ad62ba9a49b1() {
  return __cxx_global_cell_06818c162ca5ad62ba9a49b1.reference || (__cxx_global_cell_06818c162ca5ad62ba9a49b1.reference = {
    __cReference: true,
    get value() { return g_preamble_header; },
    set value(__cxx_lvalue_0) { g_preamble_header = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:196
export let g_preamble = Boolean(true);
export function __cxx_global_cell_3be9ae24fea3bbbd86d36249() {
  return __cxx_global_cell_3be9ae24fea3bbbd86d36249.reference || (__cxx_global_cell_3be9ae24fea3bbbd86d36249.reference = {
    __cReference: true,
    get value() { return g_preamble; },
    set value(__cxx_lvalue_0) { g_preamble = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:198
export let g_internal_verbosity = i32(0);
export function __cxx_global_cell_6ae22b562a1c743fe6747a32() {
  return __cxx_global_cell_6ae22b562a1c743fe6747a32.reference || (__cxx_global_cell_6ae22b562a1c743fe6747a32.reference = {
    __cReference: true,
    get value() { return g_internal_verbosity; },
    set value(__cxx_lvalue_0) { g_internal_verbosity = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:201
export let g_preamble_date = Boolean(true);
export function __cxx_global_cell_0d343758629a1d853a55220a() {
  return __cxx_global_cell_0d343758629a1d853a55220a.reference || (__cxx_global_cell_0d343758629a1d853a55220a.reference = {
    __cReference: true,
    get value() { return g_preamble_date; },
    set value(__cxx_lvalue_0) { g_preamble_date = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:202
export let g_preamble_time = Boolean(true);
export function __cxx_global_cell_8173c9d12256b11184cd5f88() {
  return __cxx_global_cell_8173c9d12256b11184cd5f88.reference || (__cxx_global_cell_8173c9d12256b11184cd5f88.reference = {
    __cReference: true,
    get value() { return g_preamble_time; },
    set value(__cxx_lvalue_0) { g_preamble_time = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:203
export let g_preamble_uptime = Boolean(true);
export function __cxx_global_cell_b07a060db3d233453e3c4ee5() {
  return __cxx_global_cell_b07a060db3d233453e3c4ee5.reference || (__cxx_global_cell_b07a060db3d233453e3c4ee5.reference = {
    __cReference: true,
    get value() { return g_preamble_uptime; },
    set value(__cxx_lvalue_0) { g_preamble_uptime = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:204
export let g_preamble_thread = Boolean(true);
export function __cxx_global_cell_b007c826410038f1f970fadb() {
  return __cxx_global_cell_b007c826410038f1f970fadb.reference || (__cxx_global_cell_b007c826410038f1f970fadb.reference = {
    __cReference: true,
    get value() { return g_preamble_thread; },
    set value(__cxx_lvalue_0) { g_preamble_thread = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:205
export let g_preamble_file = Boolean(true);
export function __cxx_global_cell_1061fa7e3aba1d21e19c2d5d() {
  return __cxx_global_cell_1061fa7e3aba1d21e19c2d5d.reference || (__cxx_global_cell_1061fa7e3aba1d21e19c2d5d.reference = {
    __cReference: true,
    get value() { return g_preamble_file; },
    set value(__cxx_lvalue_0) { g_preamble_file = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:206
export let g_preamble_verbose = Boolean(true);
export function __cxx_global_cell_c670ac6feccd94338c3669ea() {
  return __cxx_global_cell_c670ac6feccd94338c3669ea.reference || (__cxx_global_cell_c670ac6feccd94338c3669ea.reference = {
    __cReference: true,
    get value() { return g_preamble_verbose; },
    set value(__cxx_lvalue_0) { g_preamble_verbose = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:207
export let g_preamble_pipe = Boolean(true);
export function __cxx_global_cell_a9bd698c24d1f2676e241d7f() {
  return __cxx_global_cell_a9bd698c24d1f2676e241d7f.reference || (__cxx_global_cell_a9bd698c24d1f2676e241d7f.reference = {
    __cReference: true,
    get value() { return g_preamble_pipe; },
    set value(__cxx_lvalue_0) { g_preamble_pipe = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:210
export let s_max_out_verbosity = i32(-9);
function __cxx_static_address_f4928d8d17572e35a08071db() {
  return __cxx_static_address_f4928d8d17572e35a08071db.reference || (__cxx_static_address_f4928d8d17572e35a08071db.reference = {
    __cReference: true,
    get value() { return s_max_out_verbosity; },
    set value(__cxx_lvalue_0) { s_max_out_verbosity = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:213
export let s_current_dir = new Uint8Array(4096);
function __cxx_static_address_3d121a1c520d04c5e23072e8() {
  return __cxx_static_address_3d121a1c520d04c5e23072e8.reference || (__cxx_static_address_3d121a1c520d04c5e23072e8.reference = {
    __cReference: true,
    get value() { return s_current_dir; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_9f3c5b40a0cac834 = i32(2147483647);
function __cxx_static_address_6dd34daa5cb4213df530bad2() {
  return __cxx_static_address_6dd34daa5cb4213df530bad2.reference || (__cxx_static_address_6dd34daa5cb4213df530bad2.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_9f3c5b40a0cac834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_d943b227d3ffd20a = i32(2147483648);
function __cxx_static_address_a3b2ae17138f7cfe4072a86f() {
  return __cxx_static_address_a3b2ae17138f7cfe4072a86f.reference || (__cxx_static_address_a3b2ae17138f7cfe4072a86f.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_d943b227d3ffd20a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_4fae870e665b6c59 = i32(2147483648);
function __cxx_static_address_f972e04fc579078bc20e2b5f() {
  return __cxx_static_address_f972e04fc579078bc20e2b5f.reference || (__cxx_static_address_f972e04fc579078bc20e2b5f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_4fae870e665b6c59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_d338e202861c92bd = i32(65536);
function __cxx_static_address_af826a931116ca179e097391() {
  return __cxx_static_address_af826a931116ca179e097391.reference || (__cxx_static_address_af826a931116ca179e097391.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_d338e202861c92bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_085108be3fa67d10 = i32(32768);
function __cxx_static_address_6a87c1f241f82d32e196463d() {
  return __cxx_static_address_6a87c1f241f82d32e196463d.reference || (__cxx_static_address_6a87c1f241f82d32e196463d.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_085108be3fa67d10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_f8954c0c6af5bd14 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_a2c1c81ff1ca56149228c79b() {
  return __cxx_static_address_a2c1c81ff1ca56149228c79b.reference || (__cxx_static_address_a2c1c81ff1ca56149228c79b.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_f8954c0c6af5bd14; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:215
export let s_fatal_handler = null;
function __cxx_static_address_1f8c08a04196bef1cc7600f7() {
  return __cxx_static_address_1f8c08a04196bef1cc7600f7.reference || (__cxx_static_address_1f8c08a04196bef1cc7600f7.reference = {
    __cReference: true,
    get value() { return s_fatal_handler; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:216
export let s_verbosity_to_name_callback = null;
function __cxx_static_address_6deac720c7a67ba87c5f50a9() {
  return __cxx_static_address_6deac720c7a67ba87c5f50a9.reference || (__cxx_static_address_6deac720c7a67ba87c5f50a9.reference = {
    __cReference: true,
    get value() { return s_verbosity_to_name_callback; },
    set value(__cxx_lvalue_0) { s_verbosity_to_name_callback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/loguru.cpp:217
export let s_name_to_verbosity_callback = null;
function __cxx_static_address_ee49ae5b48d658e7fb2afe30() {
  return __cxx_static_address_ee49ae5b48d658e7fb2afe30.reference || (__cxx_static_address_ee49ae5b48d658e7fb2afe30.reference = {
    __cReference: true,
    get value() { return s_name_to_verbosity_callback; },
    set value(__cxx_lvalue_0) { s_name_to_verbosity_callback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/loguru.cpp:219
export let s_strip_file_path = Boolean(true);
function __cxx_static_address_93423d6a0270e718ae9e9d45() {
  return __cxx_static_address_93423d6a0270e718ae9e9d45.reference || (__cxx_static_address_93423d6a0270e718ae9e9d45.reference = {
    __cReference: true,
    get value() { return s_strip_file_path; },
    set value(__cxx_lvalue_0) { s_strip_file_path = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:223
export let s_flush_thread = null;
function __cxx_static_address_f0e2f31f474c8296062abe91() {
  return __cxx_static_address_f0e2f31f474c8296062abe91.reference || (__cxx_static_address_f0e2f31f474c8296062abe91.reference = {
    __cReference: true,
    get value() { return s_flush_thread; },
    set value(__cxx_lvalue_0) { s_flush_thread = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/loguru.cpp:224
export let s_needs_flushing = Boolean(false);
function __cxx_static_address_dfd3e09a4ce49c198e62b839() {
  return __cxx_static_address_dfd3e09a4ce49c198e62b839.reference || (__cxx_static_address_dfd3e09a4ce49c198e62b839.reference = {
    __cReference: true,
    get value() { return s_needs_flushing; },
    set value(__cxx_lvalue_0) { s_needs_flushing = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:226
export let s_signal_options = cCopyTrivialClass(SignalOptions().none(), SignalOptions(), ["unsafe_signal_handler", "sigabrt", "sigbus", "sigfpe", "sigill", "sigint", "sigsegv", "sigterm"]);
function __cxx_static_address_61b4a5f01eaf91485c364d23() {
  return __cxx_static_address_61b4a5f01eaf91485c364d23.reference || (__cxx_static_address_61b4a5f01eaf91485c364d23.reference = {
    __cReference: true,
    get value() { return s_signal_options; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:306
export function to_file(user_data) {
  return cRecordPointer(user_data, {"align": 8, "arrayAlign": 1, "fields": {"_IO_backup_base": {"offset": 80, "pointer": true, "size": 8}, "_IO_buf_base": {"offset": 56, "pointer": true, "size": 8}, "_IO_buf_end": {"offset": 64, "pointer": true, "size": 8}, "_IO_read_base": {"offset": 24, "pointer": true, "size": 8}, "_IO_read_end": {"offset": 16, "pointer": true, "size": 8}, "_IO_read_ptr": {"offset": 8, "pointer": true, "size": 8}, "_IO_save_base": {"offset": 72, "pointer": true, "size": 8}, "_IO_save_end": {"offset": 88, "pointer": true, "size": 8}, "_IO_write_base": {"offset": 32, "pointer": true, "size": 8}, "_IO_write_end": {"offset": 48, "pointer": true, "size": 8}, "_IO_write_ptr": {"offset": 40, "pointer": true, "size": 8}, "__pad5": {"native": "BigUint64Array", "offset": 184, "size": 8}, "_chain": {"offset": 104, "pointer": true, "size": 8}, "_codecvt": {"offset": 152, "pointer": true, "size": 8}, "_cur_column": {"native": "Uint16Array", "offset": 128, "size": 2}, "_fileno": {"native": "Int32Array", "offset": 112, "size": 4}, "_flags": {"native": "Int32Array", "offset": 0, "size": 4}, "_flags2": {"native": "Int32Array", "offset": 116, "size": 4}, "_freeres_buf": {"offset": 176, "pointer": true, "size": 8}, "_freeres_list": {"offset": 168, "pointer": true, "size": 8}, "_lock": {"offset": 136, "pointer": true, "size": 8}, "_markers": {"offset": 96, "pointer": true, "size": 8}, "_mode": {"native": "Int32Array", "offset": 192, "size": 4}, "_offset": {"native": "BigInt64Array", "offset": 144, "size": 8}, "_old_offset": {"native": "BigInt64Array", "offset": 120, "size": 8}, "_shortbuf": {"length": 1, "native": "Uint8Array", "offset": 131, "size": 1}, "_unused2": {"length": 20, "native": "Uint8Array", "offset": 196, "size": 20}, "_vtable_offset": {"native": "Int8Array", "offset": 130, "size": 1}, "_wide_data": {"offset": 160, "pointer": true, "size": 8}}, "overlaps": false, "size": 216, "union": false}, {});
}

// C/C++ source: source/build/src/loguru.cpp:309
const __cxx_literal_9723bf2068a02a003856 = Uint8Array.from([37, 115, 37, 115, 37, 115, 37, 115, 10, 0]);
export function file_log(user_data, message) {
  let file = to_file(user_data);
  fprintf(file, __cxx_literal_9723bf2068a02a003856, message.preamble, message.indentation, message.prefix, message.message);
  if ((g_flush_interval_ms == u32(0))) {
    fflush(file);
  }
}

// C/C++ source: source/build/src/loguru.cpp:338
export function file_close(user_data) {
  let file = to_file(user_data);
  if (file) {
    fclose(file);
  }
}

// C/C++ source: source/build/src/loguru.cpp:349
export function file_flush(user_data) {
  let file = to_file(user_data);
  fflush(file);
}

// C/C++ source: source/build/src/loguru.cpp:392
const __cxx_literal_b24ce0eba35ae9e24b10 = Uint8Array.from([37, 115, 37, 115, 37, 115, 0]);
export function syslog_log(arg0, message) {
  let level;
  if ((message.verbosity < i32(-3))) {
    (level = i32(1));
  } else {
    switch (message.verbosity) {
      case i32(-3): {
        (level = i32(2));
      }
      break;
      case i32(-2): {
        (level = i32(3));
      }
      break;
      case i32(-1): {
        (level = i32(4));
      }
      break;
      case i32(0): {
        (level = i32(5));
      }
      break;
      case i32(1): {
        (level = i32(6));
      }
      break;
      default: {
        (level = i32(7));
      }
      break;
    }
  }
  syslog(level, __cxx_literal_b24ce0eba35ae9e24b10, message.indentation, message.prefix, message.message);
}

// C/C++ source: source/build/src/loguru.cpp:419
export function syslog_close(arg0) {
  closelog();
}

// C/C++ source: source/build/src/loguru.cpp:424
export function syslog_flush(arg0) {

}

// C/C++ source: source/build/src/loguru.cpp:483
let __static_indentation_buff = (() => { const bytes = new Uint8Array(401); bytes.set([46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32, 46, 32, 32, 32]); return bytes; })();
let __static_indentation_INDENTATION_WIDTH = u64(4);
let __static_indentation_NUM_INDENTATIONS = u64((BigInt((BigInt(401) - BigInt(u64(1)))) / BigInt(__static_indentation_INDENTATION_WIDTH)));
export function indentation(depth) {
  const __cxx_lvalue_0 = cRef(() => depth, __cxx_lvalue_3 => { depth = u32(__cxx_lvalue_3); });



  (depth = u32((min__template_c5ffcfb092321e6b(__cxx_lvalue_0, ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(u32(__static_indentation_NUM_INDENTATIONS)))).value));
  return cPointerOffset(__static_indentation_buff, (BigInt(__static_indentation_INDENTATION_WIDTH) * BigInt((BigInt(__static_indentation_NUM_INDENTATIONS) - BigInt(u64(depth))))), Uint8Array.BYTES_PER_ELEMENT);
}

// C/C++ source: source/build/src/loguru.cpp:553
export function filename(path) {
  for (let ptr = path; Boolean((cDeref(ptr, Uint8Array).value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return next; })(cRef(() => ptr, __cxx_lvalue_1 => { ptr = __cxx_lvalue_1; }))) {
    if (((i32((cDeref(ptr, Uint8Array).value)) == i32(47)) || (i32((cDeref(ptr, Uint8Array).value)) == i32(92)))) {
      (path = cPointerOffset(ptr, 1, Uint8Array.BYTES_PER_ELEMENT));
    }
  }
  return path;
}

// C/C++ source: source/build/src/loguru.cpp:574
export function write_hex_digit(out, num) {
  ;
  if ((num < 10)) {
    out.push_back(((((u32((u32(48) + num))) & 255)) & 255));
  } else {
    out.push_back(((((u32((u32((u32(65) + num)) - u32(10)))) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/loguru.cpp:581
export function write_hex_byte(out, n) {
  write_hex_digit(out, u32(i32((i32(n) >> 4))));
  write_hex_digit(out, u32(i32((i32(n) & 15))));
}

// C/C++ source: source/build/src/loguru.cpp:753
export function current_dir() {
  return s_current_dir;
}

// C/C++ source: source/build/src/loguru.cpp:949
export function set_fatal_handler(handler) {
  (s_fatal_handler = handler);
}

// C/C++ source: source/build/src/loguru.cpp:954
export function get_fatal_handler() {
  return s_fatal_handler;
}

// C/C++ source: source/build/src/loguru.cpp:959
export function set_verbosity_to_name_callback(callback) {
  (s_verbosity_to_name_callback = callback);
}

// C/C++ source: source/build/src/loguru.cpp:964
export function set_name_to_verbosity_callback(callback) {
  (s_name_to_verbosity_callback = callback);
}

// C/C++ source: source/build/src/loguru.cpp:1002
const __cxx_literal_eea725adae854a77c455 = Uint8Array.from([70, 65, 84, 65, 76, 0]);
const __cxx_literal_3b7df1a15f0983009cec = Uint8Array.from([69, 82, 82, 79, 82, 0]);
const __cxx_literal_90e0379e862987fc59be = Uint8Array.from([87, 65, 82, 78, 0]);
const __cxx_literal_a582ad75c457e9558dc7 = Uint8Array.from([73, 78, 70, 79, 0]);
export function get_verbosity_name(verbosity) {
  let name = (s_verbosity_to_name_callback ? s_verbosity_to_name_callback(verbosity) : null);
  if ((!name)) {
    if ((verbosity <= i32(-3))) {
      (name = __cxx_literal_eea725adae854a77c455);
    } else {
      if ((verbosity == i32(-2))) {
        (name = __cxx_literal_3b7df1a15f0983009cec);
      } else {
        if ((verbosity == i32(-1))) {
          (name = __cxx_literal_90e0379e862987fc59be);
        } else {
          if ((verbosity == i32(0))) {
            (name = __cxx_literal_a582ad75c457e9558dc7);
          }
        }
      }
    }
  }
  return name;
}

// C/C++ source: source/build/src/loguru.cpp:1027
const __cxx_literal_96e96fc5b844c4c61780 = Uint8Array.from([79, 70, 70, 0]);
const __cxx_literal_bc791819984ff67899a6 = Uint8Array.from([73, 78, 70, 79, 0]);
const __cxx_literal_1b7086fbf9645c828a0e = Uint8Array.from([87, 65, 82, 78, 73, 78, 71, 0]);
const __cxx_literal_45b8749ab96bcd7c2e44 = Uint8Array.from([69, 82, 82, 79, 82, 0]);
const __cxx_literal_86c91b4ba2668ac3b420 = Uint8Array.from([70, 65, 84, 65, 76, 0]);
export function get_verbosity_from_name(name) {
  let verbosity = i32((s_name_to_verbosity_callback ? s_name_to_verbosity_callback(name) : i32(-10)));
  if ((verbosity == i32(-10))) {
    if ((cByteMemory.strcmp(name, __cxx_literal_96e96fc5b844c4c61780) == 0)) {
      (verbosity = i32(-9));
    } else {
      if ((cByteMemory.strcmp(name, __cxx_literal_bc791819984ff67899a6) == 0)) {
        (verbosity = i32(0));
      } else {
        if ((cByteMemory.strcmp(name, __cxx_literal_1b7086fbf9645c828a0e) == 0)) {
          (verbosity = i32(-1));
        } else {
          if ((cByteMemory.strcmp(name, __cxx_literal_45b8749ab96bcd7c2e44) == 0)) {
            (verbosity = i32(-2));
          } else {
            if ((cByteMemory.strcmp(name, __cxx_literal_86c91b4ba2668ac3b420) == 0)) {
              (verbosity = i32(-3));
            }
          }
        }
      }
    }
  }
  return verbosity;
}

// C/C++ source: source/build/src/loguru.cpp:1079
export function current_verbosity_cutoff() {
  return ((g_stderr_verbosity > s_max_out_verbosity) ? g_stderr_verbosity : s_max_out_verbosity);
}

// C/C++ source: source/build/src/loguru.cpp:1089
export let s_pthread_key_once = i32(0);
function __cxx_static_address_e6e86d0b277fb727fe61f4ae() {
  return __cxx_static_address_e6e86d0b277fb727fe61f4ae.reference || (__cxx_static_address_e6e86d0b277fb727fe61f4ae.reference = {
    __cReference: true,
    get value() { return s_pthread_key_once; },
    set value(__cxx_lvalue_0) { s_pthread_key_once = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:1090
export let s_pthread_key_name = 0;
function __cxx_static_address_73d6f448388d5696921aa0a8() {
  return __cxx_static_address_73d6f448388d5696921aa0a8.reference || (__cxx_static_address_73d6f448388d5696921aa0a8.reference = {
    __cReference: true,
    get value() { return s_pthread_key_name; },
    set value(__cxx_lvalue_0) { s_pthread_key_name = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:1092
export function make_pthread_key_name() {
  pthread_key_create(__cxx_static_address_73d6f448388d5696921aa0a8(), free);
}

// C/C++ source: source/build/src/loguru.cpp:1339
const __cxx_literal_c2599307753ddd066cfb = Uint8Array.from([100, 97, 116, 101, 32, 32, 32, 32, 32, 32, 32, 0]);
const __cxx_literal_7f6d5339710f8e56a13e = Uint8Array.from([116, 105, 109, 101, 32, 32, 32, 32, 32, 32, 32, 32, 32, 0]);
const __cxx_literal_99e7623d2b3f35fab63c = Uint8Array.from([32, 114, 117, 110, 116, 105, 109, 101, 32, 0]);
const __cxx_literal_a7d77ca911b32528b403 = Uint8Array.from([91, 37, 45, 42, 115, 93, 0]);
const __cxx_literal_90438eb6ac7b3333e619 = Uint8Array.from([32, 116, 104, 114, 101, 97, 100, 32, 110, 97, 109, 101, 47, 105, 100, 0]);
const __cxx_literal_863dce074834e9ef8a4d = Uint8Array.from([37, 42, 115, 58, 108, 105, 110, 101, 32, 32, 0]);
const __cxx_literal_4778bd1b9e7716aec1f3 = Uint8Array.from([102, 105, 108, 101, 0]);
const __cxx_literal_9d2d9771cc80461a35a5 = Uint8Array.from([32, 115, 114, 99, 0]);
const __cxx_literal_1f6d6ff59424e85eea19 = Uint8Array.from([124, 32, 0]);
export function print_preamble_header(out_buff, out_buff_size) {
  if ((out_buff_size == u64(0))) {
    return;
  }
  ((cDeref(cPointerOffset(out_buff, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
  let pos = u64(0);
  0;
  if (g_preamble_date) {
    let bytes = i32(cByteMemory.snprintf(cPointerOffset(out_buff, pos, Uint8Array.BYTES_PER_ELEMENT), (BigInt(out_buff_size) - BigInt(pos)), __cxx_literal_c2599307753ddd066cfb));
    if ((bytes > 0)) {
      (pos = u64((BigInt(pos) + BigInt(u64(bytes)))));
    }
  }
  if ((g_preamble_time && (pos < out_buff_size))) {
    let bytes = i32(cByteMemory.snprintf(cPointerOffset(out_buff, pos, Uint8Array.BYTES_PER_ELEMENT), (BigInt(out_buff_size) - BigInt(pos)), __cxx_literal_7f6d5339710f8e56a13e));
    if ((bytes > 0)) {
      (pos = u64((BigInt(pos) + BigInt(u64(bytes)))));
    }
  }
  if ((g_preamble_uptime && (pos < out_buff_size))) {
    let bytes = i32(cByteMemory.snprintf(cPointerOffset(out_buff, pos, Uint8Array.BYTES_PER_ELEMENT), (BigInt(out_buff_size) - BigInt(pos)), __cxx_literal_99e7623d2b3f35fab63c));
    if ((bytes > 0)) {
      (pos = u64((BigInt(pos) + BigInt(u64(bytes)))));
    }
  }
  if ((g_preamble_thread && (pos < out_buff_size))) {
    let bytes = i32(cByteMemory.snprintf(cPointerOffset(out_buff, pos, Uint8Array.BYTES_PER_ELEMENT), (BigInt(out_buff_size) - BigInt(pos)), __cxx_literal_a7d77ca911b32528b403, 8, __cxx_literal_90438eb6ac7b3333e619));
    if ((bytes > 0)) {
      (pos = u64((BigInt(pos) + BigInt(u64(bytes)))));
    }
  }
  if ((g_preamble_file && (pos < out_buff_size))) {
    let bytes = i32(cByteMemory.snprintf(cPointerOffset(out_buff, pos, Uint8Array.BYTES_PER_ELEMENT), (BigInt(out_buff_size) - BigInt(pos)), __cxx_literal_863dce074834e9ef8a4d, 12, __cxx_literal_4778bd1b9e7716aec1f3));
    if ((bytes > 0)) {
      (pos = u64((BigInt(pos) + BigInt(u64(bytes)))));
    }
  }
  if ((g_preamble_verbose && (pos < out_buff_size))) {
    let bytes = i32(cByteMemory.snprintf(cPointerOffset(out_buff, pos, Uint8Array.BYTES_PER_ELEMENT), (BigInt(out_buff_size) - BigInt(pos)), __cxx_literal_9d2d9771cc80461a35a5));
    if ((bytes > 0)) {
      (pos = u64((BigInt(pos) + BigInt(u64(bytes)))));
    }
  }
  if ((g_preamble_pipe && (pos < out_buff_size))) {
    cByteMemory.snprintf(cPointerOffset(out_buff, pos, Uint8Array.BYTES_PER_ELEMENT), (BigInt(out_buff_size) - BigInt(pos)), __cxx_literal_1f6d6ff59424e85eea19);
  }
}

// C/C++ source: source/build/src/loguru.cpp:1825
export let s_ec_pthread_once = i32(0);
function __cxx_static_address_4e026a0390300f0a9bf64788() {
  return __cxx_static_address_4e026a0390300f0a9bf64788.reference || (__cxx_static_address_4e026a0390300f0a9bf64788.reference = {
    __cReference: true,
    get value() { return s_ec_pthread_once; },
    set value(__cxx_lvalue_0) { s_ec_pthread_once = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:1826
export let s_ec_pthread_key = 0;
function __cxx_static_address_cf9f3078a59633d046234ac9() {
  return __cxx_static_address_cf9f3078a59633d046234ac9.reference || (__cxx_static_address_cf9f3078a59633d046234ac9.reference = {
    __cReference: true,
    get value() { return s_ec_pthread_key; },
    set value(__cxx_lvalue_0) { s_ec_pthread_key = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:2007
export function write_to_stderr__cxx_7a1196b4a2a0(data) {
  write_to_stderr__cxx_86eef19e5d6e(data, cByteMemory.strlen(data));
}

// C/C++ source: source/build/src/loguru.cpp:2123
export function write_to_stderr__cxx_86eef19e5d6e(data, size) {
  let result = i64(write(2, data, size));
  result;
}

// C/C++ source: source/build/src/loguru.cpp:2129
export function call_default_signal_handler(signal_number) {
  let sig_action = new sigaction();
  cByteMemory.memset(sig_action, 0, 152);
  sigemptyset(cObjectFieldRef(sig_action, "sa_mask"));
  (sig_action.__sigaction_handler.sa_handler = 0);
  sigaction(signal_number, sig_action, null);
  kill(getpid(), signal_number);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_7a2032e71317eec4 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_74236de6567ad66d8a979c20() {
  return __cxx_static_address_74236de6567ad66d8a979c20.reference || (__cxx_static_address_74236de6567ad66d8a979c20.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_7a2032e71317eec4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c5ffcfb092321e6b(__a, __b) {
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

// C/C++ source: source/build/src/loguru.cpp:273
export class Text {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_764ecac09a0d2f12(owned_str) {
    this._str = owned_str;
    
  }
  static __cxx_construct_764ecac09a0d2f12(owned_str) {
    const value=Object.create(Text.prototype);
    value.__cxx_construct_764ecac09a0d2f12(owned_str);
    return value;
  }
  __cxx_construct_e09e7104d3253952(t) {
        (this._str = t._str);
    (t._str = null);
  }
  static __cxx_construct_e09e7104d3253952(t) {
    const value=Object.create(Text.prototype);
    value.__cxx_construct_e09e7104d3253952(t);
    return value;
  }
  c_str() {
    return this._str;
  }
  empty() {
    return Boolean((cPointerCompare(this._str, null, "==") || (i32((cDeref(this._str, Uint8Array).value)) == i32(0))));
  }
  release() {
    let result = this._str;
    (this._str = null);
    return result;
  }
  __cxx_destruct_e85fb8f635a08c88() {
    _xfree(this._str);
  }
}
