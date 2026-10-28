// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/baselayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_global_cell_026e4893be4e21af32359651 } from "./sdlayer.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { __cxx_global_cell_5a97be12fac9e104b96ea90d } from "./osd.cpp.mjs";
import { startwin_isopen } from "./sdlayer.cpp.mjs";
import { startwin_puts } from "./sdlayer.cpp.mjs";


const cStackAlloc = amount => {
  if (typeof amount !== 'number' && typeof amount !== 'bigint')
    throw new TypeError('C stack allocation needs an integral byte count');
  const count=Number(amount);
  if (!Number.isSafeInteger(count) || count<0 || count>8388608)
    throw new RangeError('C stack allocation outside bounded byte extent');
  return new Uint8Array(count || 1);
};
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
export const fix16_rad_to_deg_mult__header_global_48319d0eb71d99ae = i32(3754936);
function __cxx_static_address_77292dea62b8175a19ce83b1() {
  return __cxx_static_address_77292dea62b8175a19ce83b1.reference || (__cxx_static_address_77292dea62b8175a19ce83b1.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_48319d0eb71d99ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_d8de19363cdb073a = i32(1144);
function __cxx_static_address_2db01138aedda52ad008ee1c() {
  return __cxx_static_address_2db01138aedda52ad008ee1c.reference || (__cxx_static_address_2db01138aedda52ad008ee1c.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_d8de19363cdb073a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:33
export let g_numdisplays = i32(1);
export function __cxx_global_cell_9fad9f5c6a95d4e89a1de80a() {
  return __cxx_global_cell_9fad9f5c6a95d4e89a1de80a.reference || (__cxx_global_cell_9fad9f5c6a95d4e89a1de80a.reference = {
    __cReference: true,
    get value() { return g_numdisplays; },
    set value(__cxx_lvalue_0) { g_numdisplays = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:34
export let g_displayindex = 0;
export function __cxx_global_cell_1593acb7552d6b6c91fb2a4b() {
  return __cxx_global_cell_1593acb7552d6b6c91fb2a4b.reference || (__cxx_global_cell_1593acb7552d6b6c91fb2a4b.reference = {
    __cReference: true,
    get value() { return g_displayindex; },
    set value(__cxx_lvalue_0) { g_displayindex = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:37
export let inputdevices = ((((0) & 255)) & 255);
export function __cxx_global_cell_816e78cbc24a2eb6f3b7a4ee() {
  return __cxx_global_cell_816e78cbc24a2eb6f3b7a4ee.reference || (__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee.reference = {
    __cReference: true,
    get value() { return inputdevices; },
    set value(__cxx_lvalue_0) { inputdevices = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:39
export let keystatus = new Uint8Array(256);
function __cxx_static_address_445951956ef36b38c80e3fc7() {
  return __cxx_static_address_445951956ef36b38c80e3fc7.reference || (__cxx_static_address_445951956ef36b38c80e3fc7.reference = {
    __cReference: true,
    get value() { return keystatus; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:40
export let g_keyFIFO = new Uint8Array(64);
function __cxx_static_address_9c0b6def7e586988165de6b2() {
  return __cxx_static_address_9c0b6def7e586988165de6b2.reference || (__cxx_static_address_9c0b6def7e586988165de6b2.reference = {
    __cReference: true,
    get value() { return g_keyFIFO; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:41
export let g_keyAsciiFIFO = new Uint8Array(64);
function __cxx_static_address_9d7cfb4860150506caf9aed9() {
  return __cxx_static_address_9d7cfb4860150506caf9aed9.reference || (__cxx_static_address_9d7cfb4860150506caf9aed9.reference = {
    __cReference: true,
    get value() { return g_keyAsciiFIFO; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:42
export let g_keyFIFOpos = 0;
export function __cxx_global_cell_8244e5f039497bc6364338f8() {
  return __cxx_global_cell_8244e5f039497bc6364338f8.reference || (__cxx_global_cell_8244e5f039497bc6364338f8.reference = {
    __cReference: true,
    get value() { return g_keyFIFOpos; },
    set value(__cxx_lvalue_0) { g_keyFIFOpos = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:43
export let g_keyFIFOend = 0;
export function __cxx_global_cell_df1f765f773d5b8f0f0da51c() {
  return __cxx_global_cell_df1f765f773d5b8f0f0da51c.reference || (__cxx_global_cell_df1f765f773d5b8f0f0da51c.reference = {
    __cReference: true,
    get value() { return g_keyFIFOend; },
    set value(__cxx_lvalue_0) { g_keyFIFOend = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:44
export let g_keyAsciiPos = 0;
export function __cxx_global_cell_a6fc8c10b0aec7fd31285ec6() {
  return __cxx_global_cell_a6fc8c10b0aec7fd31285ec6.reference || (__cxx_global_cell_a6fc8c10b0aec7fd31285ec6.reference = {
    __cReference: true,
    get value() { return g_keyAsciiPos; },
    set value(__cxx_lvalue_0) { g_keyAsciiPos = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:45
export let g_keyAsciiEnd = 0;
export function __cxx_global_cell_ee6f4502eccd328f27b46fb8() {
  return __cxx_global_cell_ee6f4502eccd328f27b46fb8.reference || (__cxx_global_cell_ee6f4502eccd328f27b46fb8.reference = {
    __cReference: true,
    get value() { return g_keyAsciiEnd; },
    set value(__cxx_lvalue_0) { g_keyAsciiEnd = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:46
export let g_keyRemapTable = new Uint8Array(256);
function __cxx_static_address_81ecfc0be30c5336a42dbf01() {
  return __cxx_static_address_81ecfc0be30c5336a42dbf01.reference || (__cxx_static_address_81ecfc0be30c5336a42dbf01.reference = {
    __cReference: true,
    get value() { return g_keyRemapTable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:47
export let g_keyNameTable = Array.from({ length: 256 }, () => new Uint8Array(24));
function __cxx_static_address_ee99317f7980f545595ba000() {
  return __cxx_static_address_ee99317f7980f545595ba000.reference || (__cxx_static_address_ee99317f7980f545595ba000.reference = {
    __cReference: true,
    get value() { return g_keyNameTable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:49
export let g_controllerSupportFlags = 0;
export function __cxx_global_cell_d0cb64ef22766dce0c3d933d() {
  return __cxx_global_cell_d0cb64ef22766dce0c3d933d.reference || (__cxx_global_cell_d0cb64ef22766dce0c3d933d.reference = {
    __cReference: true,
    get value() { return g_controllerSupportFlags; },
    set value(__cxx_lvalue_0) { g_controllerSupportFlags = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:51
export let r_maxfps = i32((-1));
export function __cxx_global_cell_9856254f6c33ff5182a27f76() {
  return __cxx_global_cell_9856254f6c33ff5182a27f76.reference || (__cxx_global_cell_9856254f6c33ff5182a27f76.reference = {
    __cReference: true,
    get value() { return r_maxfps; },
    set value(__cxx_lvalue_0) { r_maxfps = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:52
export let g_frameDelay = 0n;
export function __cxx_global_cell_5669eb8f22367bb78b701754() {
  return __cxx_global_cell_5669eb8f22367bb78b701754.reference || (__cxx_global_cell_5669eb8f22367bb78b701754.reference = {
    __cReference: true,
    get value() { return g_frameDelay; },
    set value(__cxx_lvalue_0) { g_frameDelay = u64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:83
export function initputs(buf) {
  if ((!startwin_isopen())) {
    return;
  }
  let len = i32(cByteMemory.strlen(buf));
  if ((i32((cDeref(cPointerOffset(buf, len, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(10))) {
    startwin_puts(buf);
  } else {
    let buf2 = cTypedPointer(cStackAlloc(u64(i32((len + 2)))), Uint8Array);
    cByteMemory.memcpy(buf2, buf, u64(len));
    ((cDeref(cPointerOffset(buf2, len, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((10) & 255));
    ((cDeref(cPointerOffset(buf2, i32((len + 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((0) & 255));
    startwin_puts(buf2);
  }
}

// C/C++ source: source/build/src/baselayer.cpp:104
const __cxx_literal_807706a542765fd0a22c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_24555b2c3c13cce9d68d = Uint8Array.from([32, 32, 32, 32, 32, 32, 32, 32, 32, 45, 45, 45, 32, 66, 85, 67, 75, 69, 84, 32, 76, 73, 83, 84, 32, 45, 45, 45, 0]);
const __cxx_literal_f770cc0db587c052f469 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_21e63f53de0bc2e61cea = Uint8Array.from([98, 117, 99, 107, 101, 116, 32, 35, 37, 117, 32, 40, 37, 100, 32, 98, 108, 111, 99, 107, 115, 32, 111, 102, 32, 37, 100, 32, 98, 121, 116, 101, 115, 41, 58, 0]);
const __cxx_literal_d07c27c01f332b721833 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_f28e671c460a9380dcce = Uint8Array.from([37, 49, 50, 115, 58, 32, 37, 117, 0]);
const __cxx_literal_fa7e6257bf96990442b7 = Uint8Array.from([99, 97, 99, 104, 101, 32, 104, 105, 116, 0]);
const __cxx_literal_35af0379d79c223eca29 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_c9dc61e22903eb95302b = Uint8Array.from([37, 49, 50, 115, 58, 32, 37, 117, 0]);
const __cxx_literal_bfd83952fc588620ea21 = Uint8Array.from([104, 105, 116, 0]);
const __cxx_literal_4a62e5c8e95ecaad3166 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_0f54b9049ce202245526 = Uint8Array.from([37, 49, 50, 115, 58, 32, 37, 115, 37, 117, 0]);
const __cxx_literal_d69121ffd9b8471a9d10 = Uint8Array.from([109, 105, 115, 115, 0]);
const __cxx_literal_9784888c5dce1e6d36ae = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_824d5c622ba6af817666 = Uint8Array.from([37, 49, 50, 115, 58, 32, 37, 117, 0]);
const __cxx_literal_35a82148a1293a0c842d = Uint8Array.from([102, 114, 101, 101, 100, 0]);
const __cxx_literal_ec30956ca0c4fb34db4d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_9d5e991d09794bdf2a9f = Uint8Array.from([37, 49, 50, 115, 58, 32, 37, 117, 32, 40, 37, 100, 32, 98, 121, 116, 101, 115, 41, 0]);
const __cxx_literal_134540665bb77076261b = Uint8Array.from([105, 110, 32, 117, 115, 101, 0]);
const __cxx_literal_297c807d45c3eb8cfca4 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 98, 97, 115, 101, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_091c85c7b2fe1c036757 = Uint8Array.from([37, 100, 32, 116, 111, 116, 97, 108, 32, 98, 121, 116, 101, 115, 32, 105, 110, 32, 117, 115, 101, 32, 97, 99, 114, 111, 115, 115, 32, 37, 100, 32, 98, 117, 99, 107, 101, 116, 115, 46, 0]);
export function osdfunc_bucketlist(UNUSED_parm) {
  ;
  ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_807706a542765fd0a22c, u32(108), __cxx_literal_24555b2c3c13cce9d68d));
  let numBuckets = i32(cRecordObject(__cxx_global_cell_11016d3c7177543e564ab46c().value).GetBucketsCount());
  let totalBytesUsed = u32(0);
  for (let i = i32(0); (i < numBuckets); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    let elementSize = u32(cRecordObject(__cxx_global_cell_11016d3c7177543e564ab46c().value).GetBucketElementSize(u64(i)));
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_f770cc0db587c052f469, u32(117), __cxx_literal_21e63f53de0bc2e61cea, i, cRecordObject(__cxx_global_cell_11016d3c7177543e564ab46c().value).GetBucketElementsCount(u64(i)), elementSize));
    let stats = cRecordObject(__cxx_global_cell_11016d3c7177543e564ab46c().value).GetBucketStats(u64(i));
    let cacheHitCount = u32((stats).value.cacheHitCount.load(5));
    let hitCount = u32((stats).value.hitCount.load(5));
    let missCount = u32((stats).value.missCount.load(5));
    let freeCount = u32((stats).value.freeCount.load(5));
    if (Boolean(cacheHitCount)) {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_d07c27c01f332b721833, u32(127), __cxx_literal_f28e671c460a9380dcce, __cxx_literal_fa7e6257bf96990442b7, cacheHitCount));
    }
    if (Boolean(hitCount)) {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_35af0379d79c223eca29, u32(130), __cxx_literal_c9dc61e22903eb95302b, __cxx_literal_bfd83952fc588620ea21, hitCount));
    }
    if (Boolean(missCount)) {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_4a62e5c8e95ecaad3166, u32(133), __cxx_literal_0f54b9049ce202245526, __cxx_literal_d69121ffd9b8471a9d10, (__cxx_global_cell_5a97be12fac9e104b96ea90d().value).value.draw.errorfmt, missCount));
    }
    if (Boolean(freeCount)) {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_9784888c5dce1e6d36ae, u32(136), __cxx_literal_824d5c622ba6af817666, __cxx_literal_35a82148a1293a0c842d, freeCount));
    }
    let useCount = u32((u32((u32((cacheHitCount + hitCount)) + missCount)) - freeCount));
    let bucketBytesUsed = u32(Math.imul(useCount, elementSize));
    (totalBytesUsed = u32((Number(totalBytesUsed) + Number(bucketBytesUsed))));
    ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_ec30956ca0c4fb34db4d, u32(141), __cxx_literal_9d5e991d09794bdf2a9f, __cxx_literal_134540665bb77076261b, useCount, bucketBytesUsed));
  }
  ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_297c807d45c3eb8cfca4, u32(144), __cxx_literal_091c85c7b2fe1c036757, totalBytesUsed, numBuckets));
  return i32(0);
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_e2930ccfcb8733c0 = i32(2147483647);
function __cxx_static_address_93a7e0532c4ae13ca64f1be8() {
  return __cxx_static_address_93a7e0532c4ae13ca64f1be8.reference || (__cxx_static_address_93a7e0532c4ae13ca64f1be8.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_e2930ccfcb8733c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_241c9048eee6643a = i32(2147483648);
function __cxx_static_address_ee73b7162df5d36b5200bbde() {
  return __cxx_static_address_ee73b7162df5d36b5200bbde.reference || (__cxx_static_address_ee73b7162df5d36b5200bbde.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_241c9048eee6643a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_84e4140c4d0968ed = i32(2147483648);
function __cxx_static_address_cd03939bab4dff9a7127c12d() {
  return __cxx_static_address_cd03939bab4dff9a7127c12d.reference || (__cxx_static_address_cd03939bab4dff9a7127c12d.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_84e4140c4d0968ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_f4e6db31672a6781 = i32(65536);
function __cxx_static_address_97bb30b1a97d348d07f5acc8() {
  return __cxx_static_address_97bb30b1a97d348d07f5acc8.reference || (__cxx_static_address_97bb30b1a97d348d07f5acc8.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_f4e6db31672a6781; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_5380d7e81555132e = i32(32768);
function __cxx_static_address_efa22279064145602f80849b() {
  return __cxx_static_address_efa22279064145602f80849b.reference || (__cxx_static_address_efa22279064145602f80849b.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_5380d7e81555132e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_ccb7f31ac570a7c5 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_20bc971c95ad27654299fd85() {
  return __cxx_static_address_20bc971c95ad27654299fd85.reference || (__cxx_static_address_20bc971c95ad27654299fd85.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_ccb7f31ac570a7c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:172
export let gameVerbosityCallback = null;
export function __cxx_global_cell_cb5e428fb755e6264fd9139d() {
  return __cxx_global_cell_cb5e428fb755e6264fd9139d.reference || (__cxx_global_cell_cb5e428fb755e6264fd9139d.reference = {
    __cReference: true,
    get value() { return gameVerbosityCallback; },
    set value(__cxx_lvalue_0) { gameVerbosityCallback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:173
export function engineSetLogVerbosityCallback(cb) {
  (gameVerbosityCallback = cb);
}

// C/C++ source: source/build/src/baselayer.cpp:175
const __cxx_literal_14c2bde782bc57cad112 = Uint8Array.from([69, 78, 71, 0]);
const __cxx_literal_04fd66ce775686032be4 = Uint8Array.from([71, 70, 88, 0]);
const __cxx_literal_f60823bff5a759dee0a2 = Uint8Array.from([71, 76, 0]);
const __cxx_literal_82ee2c9eeaf07a754d37 = Uint8Array.from([65, 83, 83, 0]);
const __cxx_literal_e48decad9fa288ce0038 = Uint8Array.from([73, 78, 80, 84, 0]);
const __cxx_literal_d96054986804d092c675 = Uint8Array.from([78, 69, 84, 0]);
const __cxx_literal_97e466da7f4c6de34fbb = Uint8Array.from([80, 82, 0]);
const __cxx_literal_58cf1fdef956124b4cd5 = Uint8Array.from([77, 69, 77, 0]);
const __cxx_literal_b106a27b1d02342e0ebc = Uint8Array.from([68, 66, 71, 0]);
export function engineVerbosityCallback(verbosity) {
  if (gameVerbosityCallback) {
    let str = gameVerbosityCallback(verbosity);
    if (cPointerCompare(str, null, "!=")) {
      return str;
    }
  }
  let s = cPointerArray(9, [null, __cxx_literal_14c2bde782bc57cad112, __cxx_literal_04fd66ce775686032be4, __cxx_literal_f60823bff5a759dee0a2, __cxx_literal_82ee2c9eeaf07a754d37, __cxx_literal_e48decad9fa288ce0038, __cxx_literal_d96054986804d092c675, __cxx_literal_97e466da7f4c6de34fbb, __cxx_literal_58cf1fdef956124b4cd5]);
  if ((u64(u32(verbosity)) < ARRAY_SIZE__header_e83d8ab5781b(s))) {
    return (cPointerElementRef(s, verbosity).value);
  } else {
    if ((verbosity == i32(127))) {
      return __cxx_literal_b106a27b1d02342e0ebc;
    } else {
      return null;
    }
  }
}

// C/C++ source: source/build/src/baselayer.cpp:194
export let g_useLogCallback = Boolean(true);
export function __cxx_global_cell_079877be927e9ceeb785b6a6() {
  return __cxx_global_cell_079877be927e9ceeb785b6a6.reference || (__cxx_global_cell_079877be927e9ceeb785b6a6.reference = {
    __cReference: true,
    get value() { return g_useLogCallback; },
    set value(__cxx_lvalue_0) { g_useLogCallback = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:257
export let keypresscallback = null;
export function __cxx_global_cell_77d14caa4bb6e2cb2f6b3f8f() {
  return __cxx_global_cell_77d14caa4bb6e2cb2f6b3f8f.reference || (__cxx_global_cell_77d14caa4bb6e2cb2f6b3f8f.reference = {
    __cReference: true,
    get value() { return keypresscallback; },
    set value(__cxx_lvalue_0) { keypresscallback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:259
export function keySetCallback(callback) {
  (keypresscallback = callback);
}

// C/C++ source: source/build/src/baselayer.cpp:261
export function keyGetState(key) {
  return i32((cDeref(cPointerOffset(keystatus, (cDeref(cPointerOffset(g_keyRemapTable, key, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
}

// C/C++ source: source/build/src/baselayer.cpp:263
export function keySetState(key, state) {
  ((cDeref(cPointerOffset(keystatus, (cDeref(cPointerOffset(g_keyRemapTable, key, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((state) & 255)) & 255));
  if (Boolean(state)) {
    ((cDeref(cPointerOffset(g_keyFIFO, g_keyFIFOend, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(g_keyRemapTable, key, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(g_keyFIFO, i32((i32((i32(g_keyFIFOend) + 1)) & i32((64 - 1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((state) & 255)) & 255));
    (g_keyFIFOend = ((((i32((i32((i32(g_keyFIFOend) + 2)) & i32((64 - 1))))) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/baselayer.cpp:275
export function keyGetScan() {
  if ((i32(g_keyFIFOpos) == i32(g_keyFIFOend))) {
    return ((((0) & 255)) & 255);
  }
  let c = (((cDeref(cPointerOffset(g_keyFIFO, g_keyFIFOpos, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
  (g_keyFIFOpos = ((((i32((i32((i32(g_keyFIFOpos) + 2)) & i32((64 - 1))))) & 255)) & 255));
  return ((c) & 255);
}

// C/C++ source: source/build/src/baselayer.cpp:286
export function keyFlushScans() {
  cByteMemory.memset(__cxx_static_address_9c0b6def7e586988165de6b2(), 0, 64);
  (g_keyFIFOpos = (((g_keyFIFOend = ((((0) & 255)) & 255))) & 255));
}

// C/C++ source: source/build/src/baselayer.cpp:295
export function keyGetChar() {
  if ((i32(g_keyAsciiPos) == i32(g_keyAsciiEnd))) {
    return ((((0) & 255)) & 255);
  }
  let c = (((cDeref(cPointerOffset(g_keyAsciiFIFO, g_keyAsciiPos, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
  (g_keyAsciiPos = ((((i32((i32((i32(g_keyAsciiPos) + 1)) & i32((64 - 1))))) & 255)) & 255));
  return ((c) & 255);
}

// C/C++ source: source/build/src/baselayer.cpp:306
export function keyFlushChars() {
  cByteMemory.memset(__cxx_static_address_9d7cfb4860150506caf9aed9(), 0, 64);
  (g_keyAsciiPos = (((g_keyAsciiEnd = ((((0) & 255)) & 255))) & 255));
}

// C/C++ source: source/build/src/baselayer.cpp:312
export function keyGetName(num) {
  return ((u32(num) >= u32(256)) ? null : (cPointerElementRef(g_keyNameTable, num).value));
}

// C/C++ source: source/build/src/baselayer.cpp:314
export let g_mousePos = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}}, {});
export function __cxx_global_cell_52921ad2f7df0862590c48b4() {
  return __cxx_global_cell_52921ad2f7df0862590c48b4.reference || (__cxx_global_cell_52921ad2f7df0862590c48b4.reference = {
    __cReference: true,
    get value() { return g_mousePos; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:315
export let g_mouseAbs = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}}, {});
export function __cxx_global_cell_c9714796681e8c5a7f827938() {
  return __cxx_global_cell_c9714796681e8c5a7f827938.reference || (__cxx_global_cell_c9714796681e8c5a7f827938.reference = {
    __cReference: true,
    get value() { return g_mouseAbs; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:316
export let g_mouseBits = 0;
export function __cxx_global_cell_1e0923736d676262c5e9d588() {
  return __cxx_global_cell_1e0923736d676262c5e9d588.reference || (__cxx_global_cell_1e0923736d676262c5e9d588.reference = {
    __cReference: true,
    get value() { return g_mouseBits; },
    set value(__cxx_lvalue_0) { g_mouseBits = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:317
export let g_mouseClickState = 0;
export function __cxx_global_cell_e05bfe76ea6b9140ad7ed9e7() {
  return __cxx_global_cell_e05bfe76ea6b9140ad7ed9e7.reference || (__cxx_global_cell_e05bfe76ea6b9140ad7ed9e7.reference = {
    __cReference: true,
    get value() { return g_mouseClickState; },
    set value(__cxx_lvalue_0) { g_mouseClickState = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:319
export let g_mouseEnabled = false;
export function __cxx_global_cell_489f4a2f5e930aaf72c81254() {
  return __cxx_global_cell_489f4a2f5e930aaf72c81254.reference || (__cxx_global_cell_489f4a2f5e930aaf72c81254.reference = {
    __cReference: true,
    get value() { return g_mouseEnabled; },
    set value(__cxx_lvalue_0) { g_mouseEnabled = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:320
export let g_mouseGrabbed = false;
export function __cxx_global_cell_98758ea3e7ef83f477f7ff1f() {
  return __cxx_global_cell_98758ea3e7ef83f477f7ff1f.reference || (__cxx_global_cell_98758ea3e7ef83f477f7ff1f.reference = {
    __cReference: true,
    get value() { return g_mouseGrabbed; },
    set value(__cxx_lvalue_0) { g_mouseGrabbed = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:321
export let g_mouseInsideWindow = Boolean(Boolean(1));
export function __cxx_global_cell_80f8e5fd148b9081d92a796f() {
  return __cxx_global_cell_80f8e5fd148b9081d92a796f.reference || (__cxx_global_cell_80f8e5fd148b9081d92a796f.reference = {
    __cReference: true,
    get value() { return g_mouseInsideWindow; },
    set value(__cxx_lvalue_0) { g_mouseInsideWindow = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:322
export let g_mouseLockedToWindow = Boolean(Boolean(1));
export function __cxx_global_cell_f2b488870f755876d24f149d() {
  return __cxx_global_cell_f2b488870f755876d24f149d.reference || (__cxx_global_cell_f2b488870f755876d24f149d.reference = {
    __cReference: true,
    get value() { return g_mouseLockedToWindow; },
    set value(__cxx_lvalue_0) { g_mouseLockedToWindow = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:324
export let g_mouseCallback = null;
export function __cxx_global_cell_1cf0029028a3e73171a1adee() {
  return __cxx_global_cell_1cf0029028a3e73171a1adee.reference || (__cxx_global_cell_1cf0029028a3e73171a1adee.reference = {
    __cReference: true,
    get value() { return g_mouseCallback; },
    set value(__cxx_lvalue_0) { g_mouseCallback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:325
export function mouseSetCallback(callback) {
  (g_mouseCallback = callback);
}

// C/C++ source: source/build/src/baselayer.cpp:327
export let g_controllerHotplugCallback = null;
export function __cxx_global_cell_98c8686ca508db9a2275a6f8() {
  return __cxx_global_cell_98c8686ca508db9a2275a6f8.reference || (__cxx_global_cell_98c8686ca508db9a2275a6f8.reference = {
    __cReference: true,
    get value() { return g_controllerHotplugCallback; },
    set value(__cxx_lvalue_0) { g_controllerHotplugCallback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:329
export function mouseAdvanceClickState() {
  switch (i32(g_mouseClickState)) {
    case i32(1): {
      (g_mouseClickState = ((((2) & 255)) & 255));
    }
    return i32(1);
    case i32(3): {
      (g_mouseClickState = ((((0) & 255)) & 255));
    }
    return i32(1);
    case i32(2): {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/baselayer.cpp:340
export function mouseReadPos(x, y) {
  if ((((!g_mouseEnabled) || (!g_mouseGrabbed)) || (!Boolean(__cxx_global_cell_026e4893be4e21af32359651().value)))) {
    ((cDeref(x, Int32Array).value) = i32(((cDeref(y, Int32Array).value) = i32(0))));
    return;
  }
  ((cDeref(x, Int32Array).value) = i32(g_mousePos.x));
  ((cDeref(y, Int32Array).value) = i32(g_mousePos.y));
  (g_mousePos.x = i32((g_mousePos.y = i32(0))));
}

// C/C++ source: source/build/src/baselayer.cpp:368
export function mouseReadButtons() {
  return i32((((((!g_mouseEnabled) || (!Boolean(__cxx_global_cell_026e4893be4e21af32359651().value))) || (!g_mouseInsideWindow)) || (__cxx_global_cell_5a97be12fac9e104b96ea90d().value && Boolean(u32(((__cxx_global_cell_5a97be12fac9e104b96ea90d().value).value.flags & u32(4)))))) ? 0 : g_mouseBits));
}

// C/C++ source: source/build/src/baselayer.cpp:373
export let joystick = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_12": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"hasRumble": {"bitfield": {"boolean": false, "signed": false, "start": 1, "wide": false, "width": 1}, "offset": 0, "size": 1}, "isGameController": {"bitfield": {"boolean": false, "signed": false, "start": 0, "wide": false, "width": 1}, "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}, "flags": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": true, "size": 4, "union": true}, "offset": 56}, "bits": {"native": "Int32Array", "offset": 24, "size": 4}, "numAxes": {"native": "Int32Array", "offset": 28, "size": 4}, "numBalls": {"native": "Int32Array", "offset": 32, "size": 4}, "numButtons": {"native": "Int32Array", "offset": 36, "size": 4}, "numHats": {"native": "Int32Array", "offset": 40, "size": 4}, "pAxis": {"offset": 0, "pointer": true, "size": 8}, "pCallback": {"offset": 16, "pointer": true, "size": 8}, "pHat": {"offset": 8, "pointer": true, "size": 8}, "rumbleHigh": {"native": "Uint16Array", "offset": 50, "size": 2}, "rumbleLow": {"native": "Uint16Array", "offset": 48, "size": 2}, "rumbleTime": {"native": "Uint16Array", "offset": 52, "size": 2}, "validButtons": {"native": "Uint32Array", "offset": 44, "size": 4}}, "overlaps": true, "size": 64, "union": false}}, {});
export function __cxx_global_cell_39a39d1bfab5e142a4f76536() {
  return __cxx_global_cell_39a39d1bfab5e142a4f76536.reference || (__cxx_global_cell_39a39d1bfab5e142a4f76536.reference = {
    __cReference: true,
    get value() { return joystick; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:375
export function joySetCallback(callback) {
  (joystick.pCallback = callback);
}

// C/C++ source: source/build/src/baselayer.cpp:376
export function joyReadButtons(pResult) {
  ((cDeref(pResult, Int32Array).value) = i32((Boolean(__cxx_global_cell_026e4893be4e21af32359651().value) ? joystick.bits : 0)));
}

// C/C++ source: source/build/src/baselayer.cpp:377
export function joyHasButton(button) {
  return Boolean((!(!Boolean(u32((joystick.validButtons & u32(i32((1 << button)))))))));
}

// C/C++ source: source/build/src/baselayer.cpp:379
export let g_fileDropCallback = null;
export function __cxx_global_cell_aaf60fd1c42f81465bb8841b() {
  return __cxx_global_cell_aaf60fd1c42f81465bb8841b.reference || (__cxx_global_cell_aaf60fd1c42f81465bb8841b.reference = {
    __cReference: true,
    get value() { return g_fileDropCallback; },
    set value(__cxx_lvalue_0) { g_fileDropCallback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:475
export function makeasmwriteable() {

}

// C/C++ source: source/build/src/baselayer.cpp:482
export let vsync = i32(0);
export function __cxx_global_cell_f60600beda8cdf07cf996425() {
  return __cxx_global_cell_f60600beda8cdf07cf996425.reference || (__cxx_global_cell_f60600beda8cdf07cf996425.reference = {
    __cReference: true,
    get value() { return vsync; },
    set value(__cxx_lvalue_0) { vsync = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:483
export let r_finishbeforeswap = i32(0);
export function __cxx_global_cell_0ce57da17a78d695b3f88514() {
  return __cxx_global_cell_0ce57da17a78d695b3f88514.reference || (__cxx_global_cell_0ce57da17a78d695b3f88514.reference = {
    __cReference: true,
    get value() { return r_finishbeforeswap; },
    set value(__cxx_lvalue_0) { r_finishbeforeswap = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:484
export let r_glfinish = i32(0);
export function __cxx_global_cell_0df10b0c2580b280b124d5bc() {
  return __cxx_global_cell_0df10b0c2580b280b124d5bc.reference || (__cxx_global_cell_0df10b0c2580b280b124d5bc.reference = {
    __cReference: true,
    get value() { return r_glfinish; },
    set value(__cxx_lvalue_0) { r_glfinish = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:486
export let glinfo = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_7": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bgra": {"bitfield": {"boolean": false, "signed": false, "start": 0, "wide": false, "width": 1}, "offset": 0, "size": 1}, "bufferstorage": {"bitfield": {"boolean": false, "signed": false, "start": 1, "wide": false, "width": 1}, "offset": 0, "size": 1}, "debugoutput": {"bitfield": {"boolean": false, "signed": false, "start": 2, "wide": false, "width": 1}, "offset": 0, "size": 1}, "depthclamp": {"bitfield": {"boolean": false, "signed": false, "start": 3, "wide": false, "width": 1}, "offset": 0, "size": 1}, "depthtex": {"bitfield": {"boolean": false, "signed": false, "start": 4, "wide": false, "width": 1}, "offset": 0, "size": 1}, "fbos": {"bitfield": {"boolean": false, "signed": false, "start": 5, "wide": false, "width": 1}, "offset": 0, "size": 1}, "glsl": {"bitfield": {"boolean": false, "signed": false, "start": 6, "wide": false, "width": 1}, "offset": 0, "size": 1}, "multitex": {"bitfield": {"boolean": false, "signed": false, "start": 7, "wide": false, "width": 1}, "offset": 0, "size": 1}, "occlusionqueries": {"bitfield": {"boolean": false, "signed": false, "start": 0, "wide": false, "width": 1}, "offset": 1, "size": 1}, "rect": {"bitfield": {"boolean": false, "signed": false, "start": 1, "wide": false, "width": 1}, "offset": 1, "size": 1}, "reset_notification": {"bitfield": {"boolean": false, "signed": false, "start": 2, "wide": false, "width": 1}, "offset": 1, "size": 1}, "samplerobjects": {"bitfield": {"boolean": false, "signed": false, "start": 3, "wide": false, "width": 1}, "offset": 1, "size": 1}, "shadow": {"bitfield": {"boolean": false, "signed": false, "start": 4, "wide": false, "width": 1}, "offset": 1, "size": 1}, "sync": {"bitfield": {"boolean": false, "signed": false, "start": 5, "wide": false, "width": 1}, "offset": 1, "size": 1}, "texcompr": {"bitfield": {"boolean": false, "signed": false, "start": 6, "wide": false, "width": 1}, "offset": 1, "size": 1}, "texnpot": {"bitfield": {"boolean": false, "signed": false, "start": 7, "wide": false, "width": 1}, "offset": 1, "size": 1}, "vsync": {"bitfield": {"boolean": false, "signed": false, "start": 0, "wide": false, "width": 1}, "offset": 2, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}, "features": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 4, "union": true}, "offset": 44}, "extensions": {"offset": 24, "pointer": true, "size": 8}, "filled": {"native": "Int32Array", "offset": 40, "size": 4}, "maxTextureSize": {"native": "Int32Array", "offset": 36, "size": 4}, "maxanisotropy": {"native": "Float32Array", "offset": 32, "size": 4}, "renderer": {"offset": 8, "pointer": true, "size": 8}, "vendor": {"offset": 0, "pointer": true, "size": 8}, "version": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 48, "union": false}, {"vendor": Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 0]), "renderer": Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 0]), "version": Uint8Array.from([48, 46, 48, 46, 48, 0]), "extensions": Uint8Array.from([0]), "maxanisotropy": 1, "maxTextureSize": 64, "filled": 0, "__cxx_anonymous_7": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bgra": {"bitfield": {"boolean": false, "signed": false, "start": 0, "wide": false, "width": 1}, "offset": 0, "size": 1}, "bufferstorage": {"bitfield": {"boolean": false, "signed": false, "start": 1, "wide": false, "width": 1}, "offset": 0, "size": 1}, "debugoutput": {"bitfield": {"boolean": false, "signed": false, "start": 2, "wide": false, "width": 1}, "offset": 0, "size": 1}, "depthclamp": {"bitfield": {"boolean": false, "signed": false, "start": 3, "wide": false, "width": 1}, "offset": 0, "size": 1}, "depthtex": {"bitfield": {"boolean": false, "signed": false, "start": 4, "wide": false, "width": 1}, "offset": 0, "size": 1}, "fbos": {"bitfield": {"boolean": false, "signed": false, "start": 5, "wide": false, "width": 1}, "offset": 0, "size": 1}, "glsl": {"bitfield": {"boolean": false, "signed": false, "start": 6, "wide": false, "width": 1}, "offset": 0, "size": 1}, "multitex": {"bitfield": {"boolean": false, "signed": false, "start": 7, "wide": false, "width": 1}, "offset": 0, "size": 1}, "occlusionqueries": {"bitfield": {"boolean": false, "signed": false, "start": 0, "wide": false, "width": 1}, "offset": 1, "size": 1}, "rect": {"bitfield": {"boolean": false, "signed": false, "start": 1, "wide": false, "width": 1}, "offset": 1, "size": 1}, "reset_notification": {"bitfield": {"boolean": false, "signed": false, "start": 2, "wide": false, "width": 1}, "offset": 1, "size": 1}, "samplerobjects": {"bitfield": {"boolean": false, "signed": false, "start": 3, "wide": false, "width": 1}, "offset": 1, "size": 1}, "shadow": {"bitfield": {"boolean": false, "signed": false, "start": 4, "wide": false, "width": 1}, "offset": 1, "size": 1}, "sync": {"bitfield": {"boolean": false, "signed": false, "start": 5, "wide": false, "width": 1}, "offset": 1, "size": 1}, "texcompr": {"bitfield": {"boolean": false, "signed": false, "start": 6, "wide": false, "width": 1}, "offset": 1, "size": 1}, "texnpot": {"bitfield": {"boolean": false, "signed": false, "start": 7, "wide": false, "width": 1}, "offset": 1, "size": 1}, "vsync": {"bitfield": {"boolean": false, "signed": false, "start": 0, "wide": false, "width": 1}, "offset": 2, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}, "features": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 4, "union": true}, {"features": u32(0)}, null, {})}, null, {});
export function __cxx_global_cell_51e9e737024735ad0316eb6f() {
  return __cxx_global_cell_51e9e737024735ad0316eb6f.reference || (__cxx_global_cell_51e9e737024735ad0316eb6f.reference = {
    __cReference: true,
    get value() { return glinfo; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_f0551c9ac1f62a23 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_036c114420bea9b9962395ae() {
  return __cxx_static_address_036c114420bea9b9962395ae.reference || (__cxx_static_address_036c114420bea9b9962395ae.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_f0551c9ac1f62a23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_7fdd90e9f69ce725 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_4c1846fb22c2e0858459e3c6() {
  return __cxx_static_address_4c1846fb22c2e0858459e3c6.reference || (__cxx_static_address_4c1846fb22c2e0858459e3c6.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_7fdd90e9f69ce725; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_c0f6fef02240b756 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_1104b24d7ac8bb6545ed712f() {
  return __cxx_static_address_1104b24d7ac8bb6545ed712f.reference || (__cxx_static_address_1104b24d7ac8bb6545ed712f.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_c0f6fef02240b756; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_7ccff8120cbedf5b = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_78a128ad9a3e3ffb51822799() {
  return __cxx_static_address_78a128ad9a3e3ffb51822799.reference || (__cxx_static_address_78a128ad9a3e3ffb51822799.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_7ccff8120cbedf5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_a98bb88deeedd43b = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_7c1c75c42b6b3ca8bd3c6f93() {
  return __cxx_static_address_7c1c75c42b6b3ca8bd3c6f93.reference || (__cxx_static_address_7c1c75c42b6b3ca8bd3c6f93.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_a98bb88deeedd43b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_5b5081925400e430 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_d90d8778fae75b5bc403bf69() {
  return __cxx_static_address_d90d8778fae75b5bc403bf69.reference || (__cxx_static_address_d90d8778fae75b5bc403bf69.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_5b5081925400e430; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_6055034d6a19ed97 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_63098ff0323f6563741d87c0() {
  return __cxx_static_address_63098ff0323f6563741d87c0.reference || (__cxx_static_address_63098ff0323f6563741d87c0.reference = {
    __cReference: true,
    get value() { return pow264__header_global_6055034d6a19ed97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/src/baselayer.cpp:1161
export function nextPow2__header_644217228af3(value) {
  let i = i32(1);
  while ((i < value)) {
    (i = i32((i << 1)));
  }
  return i32(i);
}

// C/C++ source: source/build/src/baselayer.cpp:1450
export function xfree__header_de87d04c7c84(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function ARRAY_SIZE__header_e83d8ab5781b(arg0) {
  return u64(9n);
}

// C/C++ source: source/build/src/baselayer.cpp:1451
export function xaligned_free__header_8ec8914845bb(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_d0e4358054a560bb(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_9f711f2400ba566e(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function clamp__header_1ecf5feb2977(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:849
export function _sm_allocator_thread_cache_destroy(allocator) {
  if (cPointerCompare(allocator, null, "==")) {
    return;
  }
  cRecordObject(allocator).DestroyThreadCache();
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:139
export function Align(val, alignment) {
  ;
  let r = u64((BigInt((BigInt(val) + BigInt((BigInt(alignment) - BigInt(u64(1)))))) & BigInt((~(BigInt(alignment) - BigInt(u64(1)))))));
  ;
  return u64(r);
}

// Original Clang-generated fragment; imports existing owner storage.
export { osdcmd_cvar_set_baselayer } from "./_source_legacy_baselayer_cpp_6c82a26ee030.mjs";
