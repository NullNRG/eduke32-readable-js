// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/mmulti.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { crctab16 } from "./engine.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";

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

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_cbfeccbc5ee4c97e = i32(3754936);
function __cxx_static_address_fd2e959757d232c2a78790fd() {
  return __cxx_static_address_fd2e959757d232c2a78790fd.reference || (__cxx_static_address_fd2e959757d232c2a78790fd.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_cbfeccbc5ee4c97e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_443358f289d54b51 = i32(1144);
function __cxx_static_address_c6add7509ac7c8bf93e6bc3b() {
  return __cxx_static_address_c6add7509ac7c8bf93e6bc3b.reference || (__cxx_static_address_c6add7509ac7c8bf93e6bc3b.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_443358f289d54b51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:66
export let packetrate = i32(250);
export function __cxx_global_cell_234479c02a6b9adf306b06c2() {
  return __cxx_global_cell_234479c02a6b9adf306b06c2.reference || (__cxx_global_cell_234479c02a6b9adf306b06c2.reference = {
    __cReference: true,
    get value() { return packetrate; },
    set value(__cxx_lvalue_0) { packetrate = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:77
export let networkmode = i32((-1));
export function __cxx_global_cell_c371527a4a6e640e407b0d15() {
  return __cxx_global_cell_c371527a4a6e640e407b0d15.reference || (__cxx_global_cell_c371527a4a6e640e407b0d15.reference = {
    __cReference: true,
    get value() { return networkmode; },
    set value(__cxx_lvalue_0) { networkmode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:78
export let myconnectindex = 0;
export function __cxx_global_cell_04adffdeab684b9c52206917() {
  return __cxx_global_cell_04adffdeab684b9c52206917.reference || (__cxx_global_cell_04adffdeab684b9c52206917.reference = {
    __cReference: true,
    get value() { return myconnectindex; },
    set value(__cxx_lvalue_0) { myconnectindex = i32(__cxx_lvalue_0); }
  });
}

export let numplayers = 0;
export function __cxx_global_cell_af3e7a8f9b4d40a559acf109() {
  return __cxx_global_cell_af3e7a8f9b4d40a559acf109.reference || (__cxx_global_cell_af3e7a8f9b4d40a559acf109.reference = {
    __cReference: true,
    get value() { return numplayers; },
    set value(__cxx_lvalue_0) { numplayers = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:79
export let connecthead = 0;
export function __cxx_global_cell_37274ddda5136df9cc793c3b() {
  return __cxx_global_cell_37274ddda5136df9cc793c3b.reference || (__cxx_global_cell_37274ddda5136df9cc793c3b.reference = {
    __cReference: true,
    get value() { return connecthead; },
    set value(__cxx_lvalue_0) { connecthead = i32(__cxx_lvalue_0); }
  });
}

export let connectpoint2 = new Int32Array(16);
function __cxx_static_address_20737f63fb1db8ca738d74b8() {
  return __cxx_static_address_20737f63fb1db8ca738d74b8.reference || (__cxx_static_address_20737f63fb1db8ca738d74b8.reference = {
    __cReference: true,
    get value() { return connectpoint2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:81
export let tims = 0;
function __cxx_static_address_cc08e77cb3aa98f842c16819() {
  return __cxx_static_address_cc08e77cb3aa98f842c16819.reference || (__cxx_static_address_cc08e77cb3aa98f842c16819.reference = {
    __cReference: true,
    get value() { return tims; },
    set value(__cxx_lvalue_0) { tims = i32(__cxx_lvalue_0); }
  });
}

export let lastsendtims = new Int32Array(16);
function __cxx_static_address_a17a3d4f80e0a7dfd8073e15() {
  return __cxx_static_address_a17a3d4f80e0a7dfd8073e15.reference || (__cxx_static_address_a17a3d4f80e0a7dfd8073e15.reference = {
    __cReference: true,
    get value() { return lastsendtims; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:82
export let pakbuf = new Uint8Array(2048);
function __cxx_static_address_26c87c01a18f7fc7a3c35f88() {
  return __cxx_static_address_26c87c01a18f7fc7a3c35f88.reference || (__cxx_static_address_26c87c01a18f7fc7a3c35f88.reference = {
    __cReference: true,
    get value() { return pakbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:83
export let fullpakbufsignals = new Int32Array(16);
function __cxx_static_address_c5ce07998d6027fe1aa378c3() {
  return __cxx_static_address_c5ce07998d6027fe1aa378c3.reference || (__cxx_static_address_c5ce07998d6027fe1aa378c3.reference = {
    __cReference: true,
    get value() { return fullpakbufsignals; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:86
export let ipak = Array.from({ length: 16 }, () => new Int32Array(512));
function __cxx_static_address_516e14d8c0a19114c5d1e922() {
  return __cxx_static_address_516e14d8c0a19114c5d1e922.reference || (__cxx_static_address_516e14d8c0a19114c5d1e922.reference = {
    __cReference: true,
    get value() { return ipak; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let icnt0 = new Int32Array(16);
function __cxx_static_address_ade687849e77d80e6c08c970() {
  return __cxx_static_address_ade687849e77d80e6c08c970.reference || (__cxx_static_address_ade687849e77d80e6c08c970.reference = {
    __cReference: true,
    get value() { return icnt0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:87
export let opak = Array.from({ length: 16 }, () => new Int32Array(512));
function __cxx_static_address_29b8fad646959b94f29341ba() {
  return __cxx_static_address_29b8fad646959b94f29341ba.reference || (__cxx_static_address_29b8fad646959b94f29341ba.reference = {
    __cReference: true,
    get value() { return opak; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ocnt0 = new Int32Array(16);
function __cxx_static_address_82603657d47bf80b4879f3be() {
  return __cxx_static_address_82603657d47bf80b4879f3be.reference || (__cxx_static_address_82603657d47bf80b4879f3be.reference = {
    __cReference: true,
    get value() { return ocnt0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let ocnt1 = new Int32Array(16);
function __cxx_static_address_7cca31863b3cb18c1409c48a() {
  return __cxx_static_address_7cca31863b3cb18c1409c48a.reference || (__cxx_static_address_7cca31863b3cb18c1409c48a.reference = {
    __cReference: true,
    get value() { return ocnt1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:90
export let pakmem = null;
function __cxx_static_address_2e246e9666d688d51a9359e7() {
  return __cxx_static_address_2e246e9666d688d51a9359e7.reference || (__cxx_static_address_2e246e9666d688d51a9359e7.reference = {
    __cReference: true,
    get value() { return pakmem; },
    set value(__cxx_lvalue_0) { pakmem = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_c4eadfe43fb93a17 = i32(2147483647);
function __cxx_static_address_48c82a3d1303f9b18c61bfb1() {
  return __cxx_static_address_48c82a3d1303f9b18c61bfb1.reference || (__cxx_static_address_48c82a3d1303f9b18c61bfb1.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_c4eadfe43fb93a17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_67d716259a6b888d = i32(2147483648);
function __cxx_static_address_2c9257b559d2dd90cd787b9c() {
  return __cxx_static_address_2c9257b559d2dd90cd787b9c.reference || (__cxx_static_address_2c9257b559d2dd90cd787b9c.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_67d716259a6b888d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_16954dbf61fdd04c = i32(2147483648);
function __cxx_static_address_f9bff8b6f8ff3dfdfbc7838e() {
  return __cxx_static_address_f9bff8b6f8ff3dfdfbc7838e.reference || (__cxx_static_address_f9bff8b6f8ff3dfdfbc7838e.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_16954dbf61fdd04c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_5a036f2fc2cdd825 = i32(65536);
function __cxx_static_address_1a1ce0d1e9e79f8d5290dc18() {
  return __cxx_static_address_1a1ce0d1e9e79f8d5290dc18.reference || (__cxx_static_address_1a1ce0d1e9e79f8d5290dc18.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_5a036f2fc2cdd825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_e64e638dfc693673 = i32(32768);
function __cxx_static_address_007257b353639408c6cc7ad3() {
  return __cxx_static_address_007257b353639408c6cc7ad3.reference || (__cxx_static_address_007257b353639408c6cc7ad3.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_e64e638dfc693673; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_8746fa78fd8f6d9f = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_2df8d31eac1f9f7396705c86() {
  return __cxx_static_address_2df8d31eac1f9f7396705c86.reference || (__cxx_static_address_2df8d31eac1f9f7396705c86.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_8746fa78fd8f6d9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:91
export let pakmemi = i32(1);
function __cxx_static_address_3d469055205057e12f154f7d() {
  return __cxx_static_address_3d469055205057e12f154f7d.reference || (__cxx_static_address_3d469055205057e12f154f7d.reference = {
    __cReference: true,
    get value() { return pakmemi; },
    set value(__cxx_lvalue_0) { pakmemi = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:94
export let mysock = i32((-1));
function __cxx_static_address_9a0423af4c469c73677da32b() {
  return __cxx_static_address_9a0423af4c469c73677da32b.reference || (__cxx_static_address_9a0423af4c469c73677da32b.reference = {
    __cReference: true,
    get value() { return mysock; },
    set value(__cxx_lvalue_0) { mysock = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:95
export let myip = 0;
function __cxx_static_address_76b725b5ab34e3bbddd690ff() {
  return __cxx_static_address_76b725b5ab34e3bbddd690ff.reference || (__cxx_static_address_76b725b5ab34e3bbddd690ff.reference = {
    __cReference: true,
    get value() { return myip; },
    set value(__cxx_lvalue_0) { myip = i32(__cxx_lvalue_0); }
  });
}

export let myport = i32(23513);
function __cxx_static_address_cdc4577be8b2ceba188a3850() {
  return __cxx_static_address_cdc4577be8b2ceba188a3850.reference || (__cxx_static_address_cdc4577be8b2ceba188a3850.reference = {
    __cReference: true,
    get value() { return myport; },
    set value(__cxx_lvalue_0) { myport = i32(__cxx_lvalue_0); }
  });
}

export let otherip = new Int32Array(16);
function __cxx_static_address_e4171a8b590974b06b8c864a() {
  return __cxx_static_address_e4171a8b590974b06b8c864a.reference || (__cxx_static_address_e4171a8b590974b06b8c864a.reference = {
    __cReference: true,
    get value() { return otherip; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let otherport = new Int32Array(16);
function __cxx_static_address_668324898164b4be5cfc5f87() {
  return __cxx_static_address_668324898164b4be5cfc5f87.reference || (__cxx_static_address_668324898164b4be5cfc5f87.reference = {
    __cReference: true,
    get value() { return otherport; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:96
export let snatchip = i32(0);
function __cxx_static_address_5c5135d77722c894c51d7bad() {
  return __cxx_static_address_5c5135d77722c894c51d7bad.reference || (__cxx_static_address_5c5135d77722c894c51d7bad.reference = {
    __cReference: true,
    get value() { return snatchip; },
    set value(__cxx_lvalue_0) { snatchip = i32(__cxx_lvalue_0); }
  });
}

export let snatchport = i32(0);
function __cxx_static_address_21caba332ede0b5f9bc6cd30() {
  return __cxx_static_address_21caba332ede0b5f9bc6cd30.reference || (__cxx_static_address_21caba332ede0b5f9bc6cd30.reference = {
    __cReference: true,
    get value() { return snatchport; },
    set value(__cxx_lvalue_0) { snatchport = i32(__cxx_lvalue_0); }
  });
}

export let netready = i32(0);
function __cxx_static_address_40e633aa17420bb5fd1eee5e() {
  return __cxx_static_address_40e633aa17420bb5fd1eee5e.reference || (__cxx_static_address_40e633aa17420bb5fd1eee5e.reference = {
    __cReference: true,
    get value() { return netready; },
    set value(__cxx_lvalue_0) { netready = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:103
export let natfree = 0;
export function __cxx_global_cell_81696b4f3d6fd9c7e3b6b0b1() {
  return __cxx_global_cell_81696b4f3d6fd9c7e3b6b0b1.reference || (__cxx_global_cell_81696b4f3d6fd9c7e3b6b0b1.reference = {
    __cReference: true,
    get value() { return natfree; },
    set value(__cxx_lvalue_0) { natfree = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:104
export let nfCurrentPlayer = i32(0);
export function __cxx_global_cell_a76839e4b4da8a8f0f0c2cba() {
  return __cxx_global_cell_a76839e4b4da8a8f0f0c2cba.reference || (__cxx_global_cell_a76839e4b4da8a8f0f0c2cba.reference = {
    __cReference: true,
    get value() { return nfCurrentPlayer; },
    set value(__cxx_lvalue_0) { nfCurrentPlayer = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:105
export let nfFinished = i32(0);
export function __cxx_global_cell_327d6d9c2f87cafbc2d024c9() {
  return __cxx_global_cell_327d6d9c2f87cafbc2d024c9.reference || (__cxx_global_cell_327d6d9c2f87cafbc2d024c9.reference = {
    __cReference: true,
    get value() { return nfFinished; },
    set value(__cxx_lvalue_0) { nfFinished = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:106
export let HeardFrom = new Int32Array(16);
function __cxx_static_address_089033ea64563758892e51c8() {
  return __cxx_static_address_089033ea64563758892e51c8.reference || (__cxx_static_address_089033ea64563758892e51c8.reference = {
    __cReference: true,
    get value() { return HeardFrom; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:107
export let HeardFrom2 = new Int32Array(16);
function __cxx_static_address_b1128756a791f2a4b2e8cf49() {
  return __cxx_static_address_b1128756a791f2a4b2e8cf49.reference || (__cxx_static_address_b1128756a791f2a4b2e8cf49.reference = {
    __cReference: true,
    get value() { return HeardFrom2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:109
export function nfCheckCP(other) {
  if (((!Boolean(natfree)) || Boolean(nfFinished))) {
    return i32(1);
  } else {
    if ((nfCurrentPlayer == other)) {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/mmulti.cpp:119
export function nfCheckHF(other) {
  if (((cDeref(cPointerOffset(HeardFrom, other, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == 1)) {
    return i32(1);
  } else {
    return i32(0);
  }
}

// C/C++ source: source/build/src/mmulti.cpp:313
export function isvalidipaddress(st) {
  let i;
  let bcnt;
  let num;
  (bcnt = i32(0));
  (num = i32(0));
  for ((i = i32(0)); Boolean((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(46))) {
      ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => bcnt, __cxx_lvalue_3 => { bcnt = __cxx_lvalue_3; }));
      (num = i32(0));
      continue;
    }
    if ((i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(58))) {
      if ((bcnt != 3)) {
        return i32(0);
      }
      (num = i32(0));
      for (((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; })); Boolean((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
        if (((i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >= i32(48)) && (i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) <= i32(57)))) {
          (num = i32((i32((i32(Math.imul(num, 10)) + i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) - i32(48))));
          if ((num >= 65536)) {
            return i32(0);
          }
        } else {
          return i32(0);
        }
      }
      return i32(1);
    }
    if (((i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >= i32(48)) && (i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) <= i32(57)))) {
      (num = i32((i32((i32(Math.imul(num, 10)) + i32((cDeref(cPointerOffset(st, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) - i32(48))));
      if ((num >= 256)) {
        return i32(0);
      }
    }
  }
  return i32((bcnt == 3));
}

// C/C++ source: source/build/src/mmulti.cpp:341
export let syncstate = ((((0) & 255)) & 255);
export function __cxx_global_cell_44993e0ee4c31a98bcf52fcb() {
  return __cxx_global_cell_44993e0ee4c31a98bcf52fcb.reference || (__cxx_global_cell_44993e0ee4c31a98bcf52fcb.reference = {
    __cReference: true,
    get value() { return syncstate; },
    set value(__cxx_lvalue_0) { syncstate = ((__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:342
export function mmulti_setpackettimeout(datimeoutcount, daresendagaincount) {
  (datimeoutcount = i32(datimeoutcount));
  (daresendagaincount = i32(daresendagaincount));
}

// C/C++ source: source/build/src/mmulti.cpp:343
export function mmulti_generic(other, bufptr, messleng, command) {
  (other = i32(other));
  (bufptr = bufptr);
  (messleng = i32(messleng));
  (command = i32(command));
}

// C/C++ source: source/build/src/mmulti.cpp:350
export function mmulti_getoutputcirclesize() {
  return i32(0);
}

// C/C++ source: source/build/src/mmulti.cpp:351
export function mmulti_flushpackets() {

}

// C/C++ source: source/build/src/mmulti.cpp:352
export function mmulti_sendlogon() {

}

// C/C++ source: source/build/src/mmulti.cpp:353
export function mmulti_sendlogoff() {

}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_41e01d7bf51b0611 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_785751072a1c91c4970806f4() {
  return __cxx_static_address_785751072a1c91c4970806f4.reference || (__cxx_static_address_785751072a1c91c4970806f4.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_41e01d7bf51b0611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_9801ef0c9317e1d2 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 2560, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1440}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1920, "y": 1080}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1680, "y": 1050}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 1200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1600, "y": 900}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1366, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 1024}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 960}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1280, "y": 720}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1152, "y": 864}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 768}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 1024, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 800, "y": 600}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 480}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 640, "y": 400}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 512, "y": 384}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 480, "y": 360}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 400, "y": 300}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 240}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 320, "y": 200}, null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": 0, "y": 0}, null, {})]);
function __cxx_static_address_f36a03c9ce3e3d2de0b46f7e() {
  return __cxx_static_address_f36a03c9ce3e3d2de0b46f7e.reference || (__cxx_static_address_f36a03c9ce3e3d2de0b46f7e.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_9801ef0c9317e1d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_c5ae47629cc175b5 = new Uint8Array([((0) & 255), ((0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, ((0) & 255), ((0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, ((0) & 255), ((0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, ((39) & 255), 96, ((0) & 255), ((92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_7d0939a4da3953e2f77d7243() {
  return __cxx_static_address_7d0939a4da3953e2f77d7243.reference || (__cxx_static_address_7d0939a4da3953e2f77d7243.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_c5ae47629cc175b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_79f87523d52c1c38 = new Uint8Array([((0) & 255), ((0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, ((0) & 255), ((0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, ((0) & 255), ((0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, ((0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, ((0) & 255), 42, ((0) & 255), ((32) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255), ((0) & 255)]);
function __cxx_static_address_d0325cbcf34a5fbbbfa2cf4a() {
  return __cxx_static_address_d0325cbcf34a5fbbbfa2cf4a.reference || (__cxx_static_address_d0325cbcf34a5fbbbfa2cf4a.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_79f87523d52c1c38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_fe39c080311ed072 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_fc5dd052778030261b114eb8() {
  return __cxx_static_address_fc5dd052778030261b114eb8.reference || (__cxx_static_address_fc5dd052778030261b114eb8.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_fe39c080311ed072; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_fa541027b43118b9 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_2d6fe3df00d1e3e09e3fa517() {
  return __cxx_static_address_2d6fe3df00d1e3e09e3fa517.reference || (__cxx_static_address_2d6fe3df00d1e3e09e3fa517.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_fa541027b43118b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_6009b95cbeb9f66f = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_caa27b2eeb955335b4fbc814() {
  return __cxx_static_address_caa27b2eeb955335b4fbc814.reference || (__cxx_static_address_caa27b2eeb955335b4fbc814.reference = {
    __cReference: true,
    get value() { return pow264__header_global_6009b95cbeb9f66f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:1450
export function xfree__header_2958dfba6143(ptr) {
  _sm_free(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/src/mmulti.cpp:1300
export function getcrc16__header_43e838d3174d(buffer, bufleng, crc) {
  for (let i = i32(0); (i < bufleng); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (crc = i32((i32((i32((crc << 8)) & 65535)) ^ (cDeref(cPointerOffset(crctab16, i32((i32((i32((i32(((((crc) & 65535)) & 65535)) >> 8)) & 65535)) ^ i32((cDeref(cPointerOffset(cTypedPointer(buffer, Uint8Array), i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  }
  return ((((((i32((crc & 65535))) & 65535)) & 65535)) & 65535);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
