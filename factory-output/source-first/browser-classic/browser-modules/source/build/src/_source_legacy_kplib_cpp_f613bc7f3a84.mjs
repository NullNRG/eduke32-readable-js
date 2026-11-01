// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/kplib.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { fread } from "../../../browser-abi/libc_provider.mjs";
import { fseek } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_19fba13327f490e0c98ebd37 } from "./kplib.cpp.mjs";
import { __cxx_private_cell_44e9d131024042d9f1569617 } from "./kplib.cpp.mjs";
import { kzfs } from "./kplib.cpp.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";

// LP64 source object addresses over native JavaScript storage. No instructions
// or virtual machine are executed. Pointer slots and uintptr_t use these SAME
// bits; arithmetic remains ordinary generated JavaScript/BigInt arithmetic.
const cSourceAddresses = (() => {
  const abi='source-lp64-addresses/2', abiKey=Symbol.for('source-first.native-pointer-abi');
  if(globalThis[abiKey] && globalThis[abiKey]!==abi)
    throw new TypeError('Incompatible source pointer representation');
  if(globalThis[Symbol.for('source-first.byte-record-pointer-identities/1')])
    throw new TypeError('Legacy pointer tokens cannot share LP64 address storage');
  globalThis[abiKey]=abi;
  const key=Symbol.for(abi);
  if(globalThis[key])return globalThis[key];
  const byBuffer=new WeakMap(),regions=[],opaque=new WeakMap(),byBits=new Map();
  let nextRegion=0x10000000000n,nextOpaque=0xffff000000000000n;
  const heapKey=Symbol.for('source-first.native-C-heap/2');
  const heap=()=>globalThis[heapKey];
  const regionFor=buffer=>{
    if(!(buffer instanceof ArrayBuffer))throw new TypeError('C address requires original byte storage');
    let region=byBuffer.get(buffer);
    if(!region){
      if(buffer.byteLength>0x100000000)throw new RangeError('C address region exceeds 4 GiB');
      const native=heap();
      region={buffer,base:native?.buffer===buffer?0n:nextRegion};
      if(region.base!==0n){nextRegion+=0x200000000n;if(nextRegion>=nextOpaque)throw new RangeError('LP64 source address capacity exceeded');}
      regions.push(region);byBuffer.set(buffer,region);
    }
    if(region.base===0n&&heap()?.buffer!==buffer)throw new TypeError('Original C heap identity changed');
    return region;
  };
  const liveBounds=(buffer,offset,width=0)=>{
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(width)||offset<0||width<0)
      throw new RangeError('Invalid original C pointer bounds');
    const cpp=globalThis[Symbol.for('source-first.cpp-heap/1')]?.buffers.get(buffer);
    if(cpp&&!cpp.live)throw new RangeError('C pointer addresses deleted C++ storage');
    const native=heap();
    if(native?.buffer===buffer){
      // An address can be both one-past one allocation and the beginning
      // of its neighbour. A raw malloc address must select its live owner.
      if(native.allocations.has(offset)){
        const size=native.allocations.get(offset);
        if(width<=size)return {lower:offset,upper:offset+size};
      }
      for(const [base,size] of native.allocations){
        if(offset>=base&&offset+width<=base+size)return {lower:base,upper:base+size};
      }
      throw new RangeError('C pointer addresses freed or unallocated heap storage');
    }
    if(!Number.isSafeInteger(offset)||offset<0||offset+width>buffer.byteLength)
      throw new RangeError('C pointer address escapes original byte storage');
    return {lower:0,upper:buffer.byteLength};
  };
  const canonical=value=>{
    if(value?.__cDeferredPointer===true||value?.__cDeferredReference===true)return canonical(value.resolve());
    const bytes=value?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes||
      value?.[Symbol.for('source-first.clang-byte-record-array/1')];
    if(bytes)return {buffer:bytes.buffer,offset:bytes.byteOffset};
    if(ArrayBuffer.isView(value))return {buffer:value.buffer,offset:value.byteOffset};
    if(value?.__cPointer===true){
      const arrayBytes=value.array&&value.buffer?.[Symbol.for('source-first.clang-byte-record-array/1')];
      if(arrayBytes)return {buffer:arrayBytes.buffer,offset:arrayBytes.byteOffset+value.offset};
      if(!value.array)return {buffer:value.buffer,offset:value.offset};
      // Managed non-byte C++ objects retain identity but do not acquire an
      // invented byte layout. Integer arithmetic on opaque addresses fails.
      if(value.offset===0&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value.buffer?.[0]))
        return {owner:value.buffer[0],value:value.buffer[0]};
      throw new TypeError('C integer address requires proven contiguous byte storage');
    }
    if(value?.__cReference===true){
      if(value.value?.[Symbol.for('source-first.original-byte-record-storage/1')])return canonical(value.value);
      return {owner:value,value};
    }
    if(typeof value==='function'||Array.isArray(value)||globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value))
      return {owner:value,value};
    throw new TypeError('C address requires original storage, lvalue or callable');
  };
  const api={abi,
    encode(value){
      const seen=new Set();
      while(value?.__cDeferredPointer===true||value?.__cDeferredReference===true){
        if(seen.has(value))throw new TypeError('Cyclic original static pointer relocation');
        seen.add(value);value=value.resolve();
      }
      if(value===null)return 0n;
      const item=canonical(value);
      if(item.buffer){
        const region=regionFor(item.buffer);liveBounds(item.buffer,item.offset);
        const bits=region.base+BigInt(item.offset);
        if(!byBits.has(bits))byBits.set(bits,value);
        return bits;
      }
      if(!opaque.has(item.owner)){
        if(nextOpaque>0xfffffffffffffff8n)throw new RangeError('C opaque address capacity exceeded');
        opaque.set(item.owner,nextOpaque);byBits.set(nextOpaque,item.value);nextOpaque+=8n;
      }
      return opaque.get(item.owner);
    },
    decode(value){
      if(typeof value!=='bigint'&&!(typeof value==='number'&&Number.isSafeInteger(value)))
        throw new TypeError('C integer address must be exactly representable');
      const bits=BigInt.asUintN(64,BigInt(value));
      if(bits===0n)return null;
      // The browser may bind its heap before the first compiled module loads.
      // Register that real address region before decoding a malloc result.
      const native=heap();if(native)regionFor(native.buffer);
      if(byBits.has(bits)){
        const value=byBits.get(bits),allocation=globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(value);
        if(allocation&&!allocation.live)throw new RangeError('C address refers to a destroyed C++ object');
        const item=canonical(value);if(item.buffer)liveBounds(item.buffer,item.offset);
        return value;
      }
      for(const region of regions){
        const offset=bits-region.base;
        if(offset<0n||offset>BigInt(region.buffer.byteLength))continue;
        const at=Number(offset),bounds=liveBounds(region.buffer,at);
        return {__cPointer:true,buffer:region.buffer,offset:at,array:false,...bounds};
      }
      throw new TypeError('Unknown original C pointer address');
    },
    assert(buffer,offset,width=0){liveBounds(buffer,offset,width);},
    forgetHeap(base,size){
      const start=BigInt(base),end=start+BigInt(size);
      for(const bits of byBits.keys())if(bits>=start&&bits<=end)byBits.delete(bits);
    },
    forgetAllocation(value){
      if(value===undefined)return;
      const item=canonical(value);
      if(item.buffer){
        const region=byBuffer.get(item.buffer);
        if(region&&region.base!==0n){
          const end=region.base+BigInt(region.buffer.byteLength);
          for(const bits of byBits.keys())if(bits>=region.base&&bits<=end)byBits.delete(bits);
          regions.splice(regions.indexOf(region),1);byBuffer.delete(item.buffer);
        }
      }else if(opaque.has(item.owner)){
        byBits.delete(opaque.get(item.owner));opaque.delete(item.owner);
      }
    },
    registerHeap(native){
      if(heap()&&heap()!==native)throw new TypeError('Cannot replace the original source C heap');
      if(byBuffer.has(native.buffer)&&byBuffer.get(native.buffer).base!==0n)
        throw new TypeError('C heap was previously registered as foreign storage');
      globalThis[heapKey]=native;regionFor(native.buffer);
    }
  };
  globalThis[key]=api;return api;
})();


// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if(typeof source==='number'||typeof source==='bigint')return cPointer(cSourceAddresses.decode(source));
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) {
    if(!source.array)globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(source.buffer,source.__cAddressOnly?source.lower:source.offset);
    return source;
  }
  if(source?.__cReference===true&&source.value?.[Symbol.for('source-first.original-byte-record-storage/1')])
    return cPointer(source.value);
  const record=source?.[Symbol.for('source-first.original-byte-record-storage/1')];
  if(record)return cPointer(record.bytes);
  const allocation=source&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(source);
  if(allocation&&!allocation.live)throw new RangeError('C pointer addresses a destroyed C++ object');
  if (allocation) return {__cPointer:true,buffer:allocation.slots,lower:0,
    upper:allocation.extent,offset:0,array:true,stride:allocation.extent};
  if (Array.isArray(source)) {
    const bytes=source[Symbol.for('source-first.clang-byte-record-array/1')];
    return { __cPointer:true, buffer:source, lower:0, upper:bytes?bytes.length:source.length,
      offset:0,array:true,stride:bytes&&source.length?bytes.length/source.length:1 };
  }
  if (!ArrayBuffer.isView(source) || source instanceof DataView)
    throw new TypeError('C pointer requires bounded array storage');
  globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(source.buffer,source.byteOffset,source.byteLength);
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
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer)||
      (globalThis[Symbol.for('source-lp64-addresses/2')]?{
        lower:pointer.lower,upper:pointer.upper,
        read:offset=>globalThis[Symbol.for('source-lp64-addresses/2')].decode(new DataView(pointer.buffer).getBigUint64(offset,true)),
        write:(offset,value)=>new DataView(pointer.buffer).setBigUint64(offset,globalThis[Symbol.for('source-lp64-addresses/2')].encode(value),true)
      }:null);
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
  if (source===null||source===0||source===0n) return null;
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
const cPointerOffset = (source, delta, stride=1, addressOnly=false) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  const outside=next<p.lower||next>p.upper;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || outside&&!addressOnly)
    throw new RangeError('C pointer escapes original array bounds');
  if(p.__cPointer===true&&p.__cReference===true){
    if(next===p.offset)return p;
    return {__cPointer:true,buffer:p.buffer,array:p.array,lower:p.lower,upper:p.upper,offset:next,
      ...(p.array?{stride:p.stride}: {}),...(outside?{__cAddressOnly:true}: {})};
  }
  const result={...p,offset:next,__cAddressOnly:outside};
  return result;
};
const cDeref = (source, Type) => {
  if (source && !ArrayBuffer.isView(source) && source.__cPointer !== true &&
      typeof source==='object' && 'value' in source) return source;
  const p=cPointer(source);
  if (p.array) {
    if (p.offset<p.lower||p.offset>=p.upper) throw new RangeError('C array pointer dereferences outside its original bounds');
    if (Type.BYTES_PER_ELEMENT!==p.stride || p.offset%p.stride!==0)
      throw new TypeError('Array element type does not match original pointer stride');
    const index=p.offset/p.stride;
    return {get value(){return p.buffer[index];}, set value(value){p.buffer[index]=value;}};
  }
  const width=Type?.BYTES_PER_ELEMENT;
  if (!Number.isSafeInteger(width) || width<=0 || p.offset<p.lower || p.offset+width>p.upper)
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
// An address-reinterpreted scalar has one native byte allocation. Reads via
// its source identifier and all typed/byte aliases share the same DataView.
const cScalarStorage = (Type, initial) => {
  const array=new Type([initial]),pointer=cPointer(array),reference=cDeref(pointer,Type);
  return {...pointer,__cReference:true,
    get value(){return reference.value;},set value(value){reference.value=value;}};
};
const cPointerCompare = (left,right,op) => {
  if(left===0||left===0n)left=null;
  if(right===0||right===0n)right=null;
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

// Standalone source-array allocations have an abstract aligned base. Aliases
// retain the same buffer and offset; no copying or fabricated integer address.
// Only zero-offset, complete, typed allocations may establish this guarantee.
const cAlignedStorage = (storage, alignment) => {
  if (!Number.isSafeInteger(alignment) || alignment<1 || alignment>1048576 ||
      (alignment & (alignment-1)) || !ArrayBuffer.isView(storage) ||
      storage instanceof DataView || storage.byteOffset!==0 ||
      storage.byteLength!==storage.buffer.byteLength)
    throw new TypeError('Explicit source alignment needs a complete typed allocation');
  const key=Symbol.for('source-first.allocation-alignment/1');
  const registry=globalThis[key] ||= new WeakMap();
  registry.set(storage.buffer,Math.max(alignment,storage.BYTES_PER_ELEMENT,registry.get(storage.buffer)||1));
  return storage;
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
// Evaluate source values in declaration order. Resolve only their verified
// static address relocations after the neighboring storage bindings exist.
const cStaticInitializerValues = values => () => values;
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
// A native multidimensional array has ONE allocation. Each readable JS row
// is a typed view into that allocation, so host byte operations and row
// pointers observe exactly the same C storage and original row strides.
const cNativeArray = (type,dims,initializers=[]) => {
  const C=cByteRecordNative[type]?.[0];
  if(!C||!Array.isArray(dims)||!dims.length||dims.length>8||
      dims.some(n=>!Number.isSafeInteger(n)||n<0||n>1000000)||
      dims.reduce((a,b)=>a*b,1)>1000000)
    throw new TypeError('Native C array requires verified dimensions and scalar width');
  const bytes=new Uint8Array(dims.reduce((a,b)=>a*b,1)*C.BYTES_PER_ELEMENT);
  let offset=0;
  const build=(depth,values)=>{
    const length=dims[depth],start=offset;
    if(!(Array.isArray(values)||depth===dims.length-1&&values instanceof C)||values.length>length)
      throw new TypeError('Native C array initializer differs from original dimensions');
    if(depth===dims.length-1){
      const row=new C(bytes.buffer,offset,length);row.set(values);offset+=row.byteLength;return row;
    }
    const rows=Array.from({length},(_,i)=>build(depth+1,values[i]??[]));
    Object.defineProperty(rows,Symbol.for('source-first.clang-byte-record-array/1'),
      {value:bytes.subarray(start,offset)});
    Object.defineProperty(rows,Symbol.for('source-first.native-array-layout/1'),
      {value:JSON.stringify({array:type,dims:dims.slice(depth)})});
    return rows;
  };
  return build(0,initializers);
};
// Pointer fields and uintptr_t share the verified LP64 source address space.
const cByteRecordPointers = cSourceAddresses;
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
  if(schema.projection && (!(storage instanceof Uint8Array) || typeof values==='function' ||
      !values || Object.keys(values).length || schema.prototype))
    throw new TypeError('Nontrivial C++ field view requires existing storage without initialization');
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
  let pending=typeof values==='function'?values:null,initializing=false;
  const initialize=()=>{
    if(!pending||initializing)return;
    initializing=true;
    try{apply(pending());pending=null;}finally{initializing=false;}
  };
  const target=cMarkAggregate(Object.create(prototype));
  const result=pending?new Proxy(target,{
    get:(object,key,receiver)=>{if(key!==cByteRecordStorageTag&&key!==cAggregateRecordTag)initialize();return Reflect.get(object,key,receiver);},
    set:(object,key,value,receiver)=>{initialize();return Reflect.set(object,key,value,receiver);}
  }):target;
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  cByteRecordStorage.set(result,{get bytes(){initialize();return bytes;},schema:JSON.stringify(schema),prototypes});
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
  function apply(initialValues){
  for (const [name,value] of Object.entries(initialValues)) {
    const field=schema.fields[name];
    if (!field) throw new TypeError('Initializer is not a Clang record field');
    if(field.recordArray||field.pointerArray||field.nativeArray){
      const dest=result[name][Symbol.for('source-first.clang-byte-record-array/1')];
      if(field.recordArray){
        const source=value?.[Symbol.for('source-first.clang-byte-record-array/1')];
        if(!source||source.length!==field.size||value[Symbol.for('source-first.byte-record-array-layout/1')]!==
            JSON.stringify({schema:field.recordArray,dims:field.dims}))throw new TypeError('Member record-array initializer differs from Clang schema');
        dest.set(source);
      }else if(field.pointerArray){
        const populate=(array,dims,items)=>{
          if(!Array.isArray(items)||items.length>dims[0])throw RangeError('Pointer member initializer exceeds original extent');
          for(let i=0;i<items.length;i++)if(dims.length===1)array[i]=items[i];else populate(array[i],dims.slice(1),items[i]);
        };
        populate(result[name],field.dims,value);
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
  }
  if(!pending)apply(values);
  return result;
};

// One allocation for a C array of Clang-proven trivially-constructed byte
// records. Numeric indices are stable, lazy views over the SAME byte store.
// Unlike Array.from(... cInitByteRecord()), this preserves memcpy, pointer
// strides, and overlapping-union aliasing between consecutive C records.
const cByteRecordArrayStorage = Symbol.for('source-first.clang-byte-record-array/1');
const cByteRecordArray = (schema, count, prototypes={}, initializers=[], storage=null) => {
  if(schema?.projection && (!(storage instanceof Uint8Array)||typeof initializers==='function'||initializers.length))
    throw new TypeError('Nontrivial C++ array view cannot construct objects');
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000000 ||
      !Number.isSafeInteger(schema?.size) || schema.size < 1 ||
      schema.size > 1048576 || count * schema.size > 268435456)
    throw new RangeError('C record array exceeds proven bounded storage');
  if(typeof initializers!=='function'&&(!Array.isArray(initializers)||initializers.length>count))throw new RangeError('C record initializer exceeds array extent');
  const bytes = storage || new Uint8Array(count * schema.size);
  if(!(bytes instanceof Uint8Array)||bytes.length!==count*schema.size)
    throw new TypeError('C record array backing store differs from Clang extent');
  const records = new Array(count).fill(null), signature = JSON.stringify(schema);
  let pending=typeof initializers==='function'?initializers:null,initializing=false;
  const initialize=()=>{
    if(!pending||initializing)return;
    initializing=true;
    try{
      const values=pending();
      if(!Array.isArray(values)||values.length>count)throw RangeError('C record initializer exceeds array extent');
      for(let i=0;i<values.length;i++)result[i]=values[i];
      pending=null;
    }finally{initializing=false;}
  };
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
      initialize();
      if (key === cByteRecordArrayStorage) return bytes;
      const i = indexOf(key);
      if (i >= 0) return getRecord(i);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value) {
      initialize();
      const i = indexOf(key);
      if (i < 0) throw new RangeError('C record array index outside original extent');
      if(schema.projection)throw new TypeError('Nontrivial C++ array assignment requires original operator');
      const source = cByteRecordStorage.get(value);
      if (!source || source.schema !== signature)
        throw new TypeError('C record array assignment requires identical Clang byte layout');
      bytes.set(source.bytes, i * schema.size);
      return true;
    }
  });
  if(!pending)for(let i=0;i<initializers.length;i++)result[i]=initializers[i];
  return result;
};

// Every row and element in a multidimensional C array shares one allocation.
const cByteRecordNDArray = (schema,dims,prototypes={},initializers=[],storage=null) => {
  if(schema?.projection && (!(storage instanceof Uint8Array)||typeof initializers==='function'||initializers.length))
    throw new TypeError('Nontrivial C++ array view cannot construct objects');
  if(!Array.isArray(dims)||dims.length<1||dims.length>8||
      dims.some(n=>!Number.isSafeInteger(n)||n<1||n>1000000)||
      !Number.isSafeInteger(schema?.size)||schema.size<1||
      dims.reduce((a,b)=>a*b,1)*schema.size>268435456)
    throw new RangeError('Invalid Clang record array dimensions');
  if(dims.length===1)return cByteRecordArray(schema,dims[0],prototypes,initializers,storage);
  if(typeof initializers!=='function'&&(!Array.isArray(initializers)||initializers.length>dims[0]))throw new RangeError('C record row initializer exceeds extent');
  const stride=dims.slice(1).reduce((a,b)=>a*b,1)*schema.size;
  const bytes=storage||new Uint8Array(dims[0]*stride);
  if(!(bytes instanceof Uint8Array)||bytes.length!==dims[0]*stride)throw new TypeError('Invalid record row storage');
  let resolved=null;
  const values=()=>{
    if(resolved===null){
      resolved=initializers();
      if(!Array.isArray(resolved)||resolved.length>dims[0])throw RangeError('C record row initializer exceeds extent');
    }
    return resolved;
  };
  const rows=Array.from({length:dims[0]},(_,i)=>cByteRecordNDArray(schema,dims.slice(1),prototypes,
    typeof initializers==='function'?()=>values()[i]||[]:initializers[i]||[],bytes.subarray(i*stride,(i+1)*stride)));
  let resolving=false;
  Object.defineProperty(rows,cByteRecordArrayStorage,{get(){
    if(!resolving){resolving=true;try{for(const row of rows)row[cByteRecordArrayStorage];}finally{resolving=false;}}
    return bytes;
  }});
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
        if(pointer.recordSchema.projection)throw new TypeError('Nontrivial C++ record assignment requires original operator');
        const source=cByteRecordStorage.get(next),destination=cByteRecordStorage.get(record);
        if(!source||source.schema!==destination.schema)throw new TypeError('Record-pointer assignment requires identical Clang layout');
        destination.bytes.set(source.bytes);
      }};
    }
  };
  Object.defineProperty(globalThis,key,{value:api});return api;
})();
const cRecordPointer = (source,schema,prototypes={}) => {
  if(!Number.isSafeInteger(schema?.size)||schema.size<1||!schema.fields||
      !Number.isSafeInteger(schema.align)||schema.align<1)
    throw new TypeError('Record pointer requires an original Clang schema');
  if(source===null||source===0||source===0n)return null;
  if(source?.__cDeferredPointer||source?.__cDeferredReference)return cRecordPointer(source.resolve(),schema,prototypes);
  if(source?.__cReference&&source.__cPointer!==true)return cRecordPointer(source.value,schema,prototypes);
  const owner=source?.[Symbol.for('source-first.record-field-owner/1')],owned=owner&&cByteRecordStorage.get(owner);
  if(owned&&source.offset===owned.bytes.byteOffset&&JSON.stringify(schema)===owned.schema)
    return cRecordPointer(owner,schema,prototypes);
  const bytes=cByteRecordStorage.get(source)?.bytes||source?.[cByteRecordArrayStorage];
  // A host may borrow a flat readable record for field-only C APIs (for
  // example libdivide). Preserve the SAME object rather than serialize a
  // detached copy. Byte casts/copies and pointer arithmetic still require
  // native storage; this facade never acquires a fabricated heap address.
  if(!schema.projection && !bytes && source && typeof source==='object' &&
      (Object.getPrototypeOf(source)===Object.prototype||Object.getPrototypeOf(source)===null) &&
      source.__cPointer!==true && !schema.union &&
      Object.entries(schema.fields).every(([name,field])=>
        (field.pointer||field.native&&!Object.hasOwn(field,'length')) &&
        Object.hasOwn(Object.getOwnPropertyDescriptor(source,name)||{},'value')))
    return {__cReference:true,get value(){return source;}};
  const pointer=cPointer(bytes||source);
  // Source arrays can retain object slots instead of a serialized POD layout.
  // Keep that original owner and stride; do not reinterpret those slots as
  // heap bytes or detach their fields by constructing a new record view.
  if(pointer.array){
    if(schema.projection)throw new TypeError('Nontrivial C++ field view requires original byte storage');
    const owned=Array.isArray(source)
      ? {...pointer,upper:source.length*schema.size,stride:schema.size} : pointer;
    if(owned.stride!==schema.size || owned.lower%owned.stride || owned.offset%owned.stride ||
        owned.upper%owned.stride || !Array.isArray(owned.buffer))
      throw new TypeError('Record pointer differs from original object-array stride');
    if(owned.offset<owned.lower || owned.offset>=owned.upper)
      throw new RangeError('Record pointer dereferences outside original object slots');
    const value=owned.buffer[owned.offset/owned.stride];
    if(value===null || typeof value!=='object' || ArrayBuffer.isView(value))
      throw new TypeError('Record pointer requires original record object slots');
    return owned;
  }
  if(pointer.array||!Number.isSafeInteger(schema?.size)||schema.size<1||
      !Number.isSafeInteger(schema.align)||schema.align<1||pointer.offset%schema.align)
    throw new TypeError('Record pointer requires aligned Clang-proven original bytes');
  return {...pointer,__cRecordPointer:true,recordSchema:schema,recordPrototypes:prototypes};
};

// Readable JS representation of Clang-proven pointer-free C/C++ POD copies.
// Fail closed if external storage has not been materialized in the agreed type.
const cCopyAggregate = (value, schema) => {
  if(schema.byteRecord?.projection || schema.recordArray?.projection)
    throw new TypeError('Nontrivial C++ copy requires original constructor');
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
    return cNativeArray(schema.array,schema.dims);
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

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/src/kplib.cpp:60
export const pow2mask = new Int32Array([0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215, 33554431, 67108863, 134217727, 268435455, 536870911, 1073741823, 2147483647]);
function __cxx_static_address_db77747fd97e714584d2217b() {
  return __cxx_static_address_db77747fd97e714584d2217b.reference || (__cxx_static_address_db77747fd97e714584d2217b.reference = {
    __cReference: true,
    get value() { return pow2mask; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_db77747fd97e714584d2217b() { return __cxx_static_address_db77747fd97e714584d2217b(); }

// C/C++ source: source/build/src/kplib.cpp:86
export let zipfilmode = 0;
function __cxx_static_address_84b58697e1377ebb6589640f() {
  return __cxx_static_address_84b58697e1377ebb6589640f.reference || (__cxx_static_address_84b58697e1377ebb6589640f.reference = {
    __cReference: true,
    get value() { return zipfilmode; },
    set value(__cxx_lvalue_0) { zipfilmode = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_84b58697e1377ebb6589640f() { return __cxx_static_address_84b58697e1377ebb6589640f(); }

// C/C++ source: source/build/src/kplib.cpp:124
export let gslider = i32(0);
function __cxx_static_address_57a5d28f57b8e3415c7b14e5() {
  return __cxx_static_address_57a5d28f57b8e3415c7b14e5.reference || (__cxx_static_address_57a5d28f57b8e3415c7b14e5.reference = {
    __cReference: true,
    get value() { return gslider; },
    set value(__cxx_lvalue_0) { gslider = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_57a5d28f57b8e3415c7b14e5() { return __cxx_static_address_57a5d28f57b8e3415c7b14e5(); }

// C/C++ source: source/build/src/kplib.cpp:126
export let clen = new Int32Array(320);
function __cxx_static_address_439d0ebacabacbc4bb46f782() {
  return __cxx_static_address_439d0ebacabacbc4bb46f782.reference || (__cxx_static_address_439d0ebacabacbc4bb46f782.reference = {
    __cReference: true,
    get value() { return clen; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_439d0ebacabacbc4bb46f782() { return __cxx_static_address_439d0ebacabacbc4bb46f782(); }

// C/C++ source: source/build/src/kplib.cpp:126
export let cclen = new Int32Array(19);
function __cxx_static_address_73f971a45117b405bae691bf() {
  return __cxx_static_address_73f971a45117b405bae691bf.reference || (__cxx_static_address_73f971a45117b405bae691bf.reference = {
    __cReference: true,
    get value() { return cclen; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_73f971a45117b405bae691bf() { return __cxx_static_address_73f971a45117b405bae691bf(); }

// C/C++ source: source/build/src/kplib.cpp:126
export let bitpos = 0;
function __cxx_static_address_b26e6394b97f66d1fd62bd8c() {
  return __cxx_static_address_b26e6394b97f66d1fd62bd8c.reference || (__cxx_static_address_b26e6394b97f66d1fd62bd8c.reference = {
    __cReference: true,
    get value() { return bitpos; },
    set value(__cxx_lvalue_0) { bitpos = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_b26e6394b97f66d1fd62bd8c() { return __cxx_static_address_b26e6394b97f66d1fd62bd8c(); }

// C/C++ source: source/build/src/kplib.cpp:129
export let ccind = new Int32Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
function __cxx_static_address_258736156e619bfc312178fd() {
  return __cxx_static_address_258736156e619bfc312178fd.reference || (__cxx_static_address_258736156e619bfc312178fd.reference = {
    __cReference: true,
    get value() { return ccind; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_258736156e619bfc312178fd() { return __cxx_static_address_258736156e619bfc312178fd(); }

// C/C++ source: source/build/src/kplib.cpp:130
export let ibuf0 = new Int32Array(288);
function __cxx_static_address_5156c579fa7a8389c264632c() {
  return __cxx_static_address_5156c579fa7a8389c264632c.reference || (__cxx_static_address_5156c579fa7a8389c264632c.reference = {
    __cReference: true,
    get value() { return ibuf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_5156c579fa7a8389c264632c() { return __cxx_static_address_5156c579fa7a8389c264632c(); }

// C/C++ source: source/build/src/kplib.cpp:130
export let nbuf0 = new Int32Array(32);
function __cxx_static_address_2a654032177c315b4aec897b() {
  return __cxx_static_address_2a654032177c315b4aec897b.reference || (__cxx_static_address_2a654032177c315b4aec897b.reference = {
    __cReference: true,
    get value() { return nbuf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_2a654032177c315b4aec897b() { return __cxx_static_address_2a654032177c315b4aec897b(); }

// C/C++ source: source/build/src/kplib.cpp:130
export let ibuf1 = new Int32Array(32);
function __cxx_static_address_3927a84e1afc8dfb325bad43() {
  return __cxx_static_address_3927a84e1afc8dfb325bad43.reference || (__cxx_static_address_3927a84e1afc8dfb325bad43.reference = {
    __cReference: true,
    get value() { return ibuf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_3927a84e1afc8dfb325bad43() { return __cxx_static_address_3927a84e1afc8dfb325bad43(); }

// C/C++ source: source/build/src/kplib.cpp:130
export let nbuf1 = new Int32Array(32);
function __cxx_static_address_00edfc6e9ac95cacc45ca40e() {
  return __cxx_static_address_00edfc6e9ac95cacc45ca40e.reference || (__cxx_static_address_00edfc6e9ac95cacc45ca40e.reference = {
    __cReference: true,
    get value() { return nbuf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_00edfc6e9ac95cacc45ca40e() { return __cxx_static_address_00edfc6e9ac95cacc45ca40e(); }

// C/C++ source: source/build/src/kplib.cpp:131
export let filptr = null;
function __cxx_static_address_3dab0cd39cd715da7cf79ad8() {
  return __cxx_static_address_3dab0cd39cd715da7cf79ad8.reference || (__cxx_static_address_3dab0cd39cd715da7cf79ad8.reference = {
    __cReference: true,
    get value() { return filptr; },
    set value(__cxx_lvalue_0) { filptr = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_3dab0cd39cd715da7cf79ad8() { return __cxx_static_address_3dab0cd39cd715da7cf79ad8(); }

// C/C++ source: source/build/src/kplib.cpp:132
export let slidebuf = new Uint8Array(32768);
function __cxx_static_address_fd8146c0023b762cfb4928be() {
  return __cxx_static_address_fd8146c0023b762cfb4928be.reference || (__cxx_static_address_fd8146c0023b762cfb4928be.reference = {
    __cReference: true,
    get value() { return slidebuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_fd8146c0023b762cfb4928be() { return __cxx_static_address_fd8146c0023b762cfb4928be(); }

// C/C++ source: source/build/src/kplib.cpp:134
export let olinbuf = new Uint8Array(131072);
function __cxx_static_address_cb0af6faa2121464215cdde3() {
  return __cxx_static_address_cb0af6faa2121464215cdde3.reference || (__cxx_static_address_cb0af6faa2121464215cdde3.reference = {
    __cReference: true,
    get value() { return olinbuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_cb0af6faa2121464215cdde3() { return __cxx_static_address_cb0af6faa2121464215cdde3(); }

// C/C++ source: source/build/src/kplib.cpp:140
export let qhufval0 = new Int32Array(512);
function __cxx_static_address_23f9e1083f5f338d4e2b34d7() {
  return __cxx_static_address_23f9e1083f5f338d4e2b34d7.reference || (__cxx_static_address_23f9e1083f5f338d4e2b34d7.reference = {
    __cReference: true,
    get value() { return qhufval0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_23f9e1083f5f338d4e2b34d7() { return __cxx_static_address_23f9e1083f5f338d4e2b34d7(); }

// C/C++ source: source/build/src/kplib.cpp:140
export let qhufval1 = new Int32Array(64);
function __cxx_static_address_a53b89e0c4766998f8de8a84() {
  return __cxx_static_address_a53b89e0c4766998f8de8a84.reference || (__cxx_static_address_a53b89e0c4766998f8de8a84.reference = {
    __cReference: true,
    get value() { return qhufval1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_a53b89e0c4766998f8de8a84() { return __cxx_static_address_a53b89e0c4766998f8de8a84(); }

// C/C++ source: source/build/src/kplib.cpp:141
export let qhufbit0 = new Uint8Array(512);
function __cxx_static_address_efafaac33827fb77a02fa134() {
  return __cxx_static_address_efafaac33827fb77a02fa134.reference || (__cxx_static_address_efafaac33827fb77a02fa134.reference = {
    __cReference: true,
    get value() { return qhufbit0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_efafaac33827fb77a02fa134() { return __cxx_static_address_efafaac33827fb77a02fa134(); }

// C/C++ source: source/build/src/kplib.cpp:141
export let qhufbit1 = new Uint8Array(64);
function __cxx_static_address_f4b438f749a364d46c61198d() {
  return __cxx_static_address_f4b438f749a364d46c61198d.reference || (__cxx_static_address_f4b438f749a364d46c61198d.reference = {
    __cReference: true,
    get value() { return qhufbit1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f4b438f749a364d46c61198d() { return __cxx_static_address_f4b438f749a364d46c61198d(); }

// C/C++ source: source/build/src/kplib.cpp:172
export function bitrev(b, c) {
  let i;
  let j;
  for ((((i = i32(1)), (j = i32(0))), (c = i32((1 << c)))); (i < c); (i = i32((Number(i) + Number(i))))) {
    (j = i32((Number(j) + Number(j))));
    if (Boolean(i32((b & i)))) {
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }));
    }
  }
  return i32(j);
}

// C/C++ source: source/build/src/kplib.cpp:181
export let fakebuf = new Uint8Array(8);
function __cxx_static_address_e0bf579ec89757a16ed9f5aa() {
  return __cxx_static_address_e0bf579ec89757a16ed9f5aa.reference || (__cxx_static_address_e0bf579ec89757a16ed9f5aa.reference = {
    __cReference: true,
    get value() { return fakebuf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e0bf579ec89757a16ed9f5aa() { return __cxx_static_address_e0bf579ec89757a16ed9f5aa(); }

// C/C++ source: source/build/src/kplib.cpp:182
export let nfilptr = null;
function __cxx_static_address_c0d33cac26996e1d4a46f3d9() {
  return __cxx_static_address_c0d33cac26996e1d4a46f3d9.reference || (__cxx_static_address_c0d33cac26996e1d4a46f3d9.reference = {
    __cReference: true,
    get value() { return nfilptr; },
    set value(__cxx_lvalue_0) { nfilptr = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_c0d33cac26996e1d4a46f3d9() { return __cxx_static_address_c0d33cac26996e1d4a46f3d9(); }

// C/C++ source: source/build/src/kplib.cpp:183
export let nbitpos = 0;
function __cxx_static_address_f5e103d64e5ebff54019b0d0() {
  return __cxx_static_address_f5e103d64e5ebff54019b0d0.reference || (__cxx_static_address_f5e103d64e5ebff54019b0d0.reference = {
    __cReference: true,
    get value() { return nbitpos; },
    set value(__cxx_lvalue_0) { nbitpos = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_f5e103d64e5ebff54019b0d0() { return __cxx_static_address_f5e103d64e5ebff54019b0d0(); }

// C/C++ source: source/build/src/kplib.cpp:184
export function suckbitsnextblock() {
  if (Boolean(zipfilmode)) {
    B_BUF32(cPointerOffset(olinbuf, 0, Uint8Array.BYTES_PER_ELEMENT), B_UNBUF32(cPointerOffset(olinbuf, u64((BigInt(131072) - BigInt(u64(4)))), Uint8Array.BYTES_PER_ELEMENT)));
    let n = u32((min__template_c5ffcfb092321e6b(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u32(i32((kzfs.compleng - kzfs.comptell)))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u32(u64((BigInt(131072) - BigInt(u64(4)))))))).value);
    fread(cPointerOffset(olinbuf, 4, Uint8Array.BYTES_PER_ELEMENT), u64(n), u64(1), kzfs.fil);
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number(n)))))(cObjectFieldRef(kzfs, "comptell"));
    (bitpos = i32((Number(bitpos) - Number(u64((BigInt(u64((BigInt(131072) - BigInt(u64(4))))) << BigInt(3)))))));
    return;
  }
  if (nfilptr) {
    (filptr = nfilptr);
    (nfilptr = null);
    (bitpos = i32((Number(bitpos) - Number(i32((i32((nbitpos - 4)) << 3))))));
    return;
  }
  (nbitpos = i32(B_SWAP32__header_86d0d39cb98e(B_UNBUF32(cPointerOffset(filptr, 8, Uint8Array.BYTES_PER_ELEMENT)))));
  (nfilptr = cPointerOffset(filptr, i32((nbitpos + 12)), Uint8Array.BYTES_PER_ELEMENT));
  B_BUF32(cPointerOffset(fakebuf, 0, Uint8Array.BYTES_PER_ELEMENT), B_UNBUF32(cPointerOffset(filptr, 0, Uint8Array.BYTES_PER_ELEMENT)));
  if ((B_UNBUF32(cPointerOffset(filptr, 12, Uint8Array.BYTES_PER_ELEMENT)) == B_PASS32__header_8a7178a88765(1413563465))) {
    B_BUF32(cPointerOffset(fakebuf, 4, Uint8Array.BYTES_PER_ELEMENT), B_UNBUF32(cPointerOffset(filptr, 16, Uint8Array.BYTES_PER_ELEMENT)));
  }
  (filptr = cPointerOffset(fakebuf, 4, Uint8Array.BYTES_PER_ELEMENT));
  (bitpos = i32((Number(bitpos) - Number(32))));
}

// C/C++ source: source/build/src/kplib.cpp:217
export function peekbits(n) {
  return i32(u32(((B_PASS32__header_8a7178a88765(B_UNBUF32(cPointerOffset(filptr, i32((bitpos >> 3)), Uint8Array.BYTES_PER_ELEMENT))) >>> i32((bitpos & 7))) & u32((cDeref(cPointerOffset(pow2mask, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))));
}

// C/C++ source: source/build/include/compat.h:1036
export function B_UNBUF32(buf) {
  return u32((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value));
}

// C/C++ source: source/build/src/kplib.cpp:218
export function suckbits(n) {
  (bitpos = i32((Number(bitpos) + Number(n))));
  if ((bitpos < 0)) {
    return;
  }
  suckbitsnextblock();
}

// C/C++ source: source/build/src/kplib.cpp:219
export function getbits(n) {
  let i = i32(peekbits(n));
  suckbits(n);
  return i32(i);
}

// C/C++ source: source/build/src/kplib.cpp:221
export function hufgetsym(hitab, hbmax) {
  let v;
  let n;
  (v = i32((n = i32(0))));
  do {
    (v = i32((i32((i32((i32((v << 1)) + getbits(1))) + (cDeref(cPointerOffset(hbmax, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) - (cDeref(cPointerOffset(hbmax, i32((n + 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }));
  } while ((v >= 0));
  return i32((cDeref(cPointerOffset(hitab, i32(((cDeref(cPointerOffset(hbmax, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + v)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
}

// C/C++ source: source/build/src/kplib.cpp:241
export function qhufgencode(hitab, hbmax, qhval, qhbit, numbits) {
  let i;
  let j;
  let k;
  let n;
  let r;
  (i = i32((r = i32(0))));
  for ((n = i32(1)); (n <= numbits); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => n, __cxx_lvalue_1 => { n = __cxx_lvalue_1; }))) {
    for ((k = i32((cDeref(cPointerOffset(hbmax, i32((n - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); (k < (cDeref(cPointerOffset(hbmax, n, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => k, __cxx_lvalue_3 => { k = __cxx_lvalue_3; }))) {
      for ((j = i32((i + (cDeref(cPointerOffset(pow2mask, i32((numbits - n)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))); (i <= j); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
        (r = i32(bitrev(i, numbits)));
        ((cDeref(cPointerOffset(qhval, r, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(hitab, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
        ((cDeref(cPointerOffset(qhbit, r, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(n) & 255)) & 255)) & 255));
      }
    }
  }
  for ((j = i32((cDeref(cPointerOffset(pow2mask, numbits, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))); (i <= j); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    (r = i32(bitrev(i, numbits)));
    ((cDeref(cPointerOffset(qhbit, r, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/kplib.cpp:289
export function hufgencode(inbuf, inum, hitab, hbmax) {
  let i;
  let tbuf = cZeroAggregate({"array": "Int32Array", "dims": [31]});
  let tbufptr;
  let hbmaxptr;
  memset(tbuf, 0, 124);
  for ((i = i32((inum - 1))); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cDeref(cPointerOffset(tbuf, (cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array));
  }
  ((cDeref(cPointerOffset(tbuf, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmax, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0))));
  for ((i = i32(0)); (i < 28); (i = i32((Number(i) + Number(4))))) {
    (tbufptr = cPointerOffset(tbuf, i, Int32Array.BYTES_PER_ELEMENT));
    (hbmaxptr = cPointerOffset(hbmax, i, Int32Array.BYTES_PER_ELEMENT));
    ((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(hbmaxptr, Int32Array).value) + (cDeref(tbufptr, Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
    ((cDeref(cPointerOffset(hbmaxptr, 4, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  }
  (tbufptr = cPointerOffset(tbuf, i, Int32Array.BYTES_PER_ELEMENT));
  (hbmaxptr = cPointerOffset(hbmax, i, Int32Array.BYTES_PER_ELEMENT));
  ((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(hbmaxptr, Int32Array).value) + (cDeref(tbufptr, Int32Array).value))));
  ((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  ((cDeref(cPointerOffset(hbmaxptr, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(hbmaxptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + (cDeref(cPointerOffset(tbufptr, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))));
  for ((i = i32(0)); (i < inum); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => i, __cxx_lvalue_4 => { i = __cxx_lvalue_4; }))) {
    if (Boolean((cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) {
      ((cDeref(cPointerOffset(hitab, ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(cDeref(cPointerOffset(hbmax, (cDeref(cPointerOffset(inbuf, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
    }
  }
}

// C/C++ source: source/build/src/kplib.cpp:2809
export let gzbufptr = null;
function __cxx_static_address_bb1f28aaaf1422ad38efa78a() {
  return __cxx_static_address_bb1f28aaaf1422ad38efa78a.reference || (__cxx_static_address_bb1f28aaaf1422ad38efa78a.reference = {
    __cReference: true,
    get value() { return gzbufptr; },
    set value(__cxx_lvalue_0) { gzbufptr = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_bb1f28aaaf1422ad38efa78a() { return __cxx_static_address_bb1f28aaaf1422ad38efa78a(); }

// C/C++ source: source/build/include/compat.h:1032
export function B_BUF32(buf, x) {
  ((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value) = u32(x));
}

// C/C++ source: source/build/src/kplib.cpp:2810
export function putbuf4zip(buf, uncomp0, uncomp1) {
  const __cxx_lvalue_0 = cRef(() => uncomp0, __cxx_lvalue_2 => { uncomp0 = i32(__cxx_lvalue_2); });
  const __cxx_lvalue_1 = cRef(() => uncomp1, __cxx_lvalue_3 => { uncomp1 = i32(__cxx_lvalue_3); });
  let i0;
  let i1;
  (i0 = i32((max__template_b1cfaf2244c73238(__cxx_lvalue_0, cObjectFieldRef(kzfs, "pos"))).value));
  (i1 = i32((min__template_774131ccff66371d(__cxx_lvalue_1, cObjectFieldRef(kzfs, "endpos"))).value));
  if ((i0 < i1)) {
    memcpy(cPointerOffset(gzbufptr, i0, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(buf, i32((i0 - uncomp0)), Uint8Array.BYTES_PER_ELEMENT), u64(i32((i1 - i0))));
  }
}

// C/C++ source: source/build/src/kplib.cpp:2821
export function kzread(buffer, leng) {
  const __cxx_lvalue_0 = cRef(() => leng, __cxx_lvalue_40 => { leng = i32(__cxx_lvalue_40); });
  let __cxx_lvalue_1 = null;
  let i, j, k, bfinal, btype, hlit, hdist;







  if (((!kzfs.fil) || (leng <= 0))) {
    return i32(0);
  }
  __source_exit_retkzread: {
    if ((!__cxx_lvalue_1 && ((kzfs.comptyp == 0)))) {
      if ((kzfs.pos != kzfs.i)) {
        fseek(kzfs.fil, i64(i32((kzfs.seek0 + kzfs.pos))), 0);
        (kzfs.i = i32(kzfs.pos));
      }
      (i = i32((min__template_774131ccff66371d(((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(i32((kzfs.leng - kzfs.pos))), __cxx_lvalue_0)).value));
      fread(buffer, u64(i), u64(1), kzfs.fil);
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) + Number(i)))))(cObjectFieldRef(kzfs, "i"));
    } else {
      if (((__cxx_lvalue_1 === "kzreadplc0" || __cxx_lvalue_1 === "kzreadplc1" || __cxx_lvalue_1 === "kzreadplc2" || __cxx_lvalue_1 === "kzreadplc3") || (!__cxx_lvalue_1 && ((kzfs.comptyp == 8))))) {
        (zipfilmode = i32(1));
        (gzbufptr = cTypedPointer(buffer, Uint8Array));
        (gzbufptr = cPointerOffset(gzbufptr, (-kzfs.pos), Uint8Array.BYTES_PER_ELEMENT));
        (kzfs.endpos = i32((min__template_774131ccff66371d(((__cxx_lvalue_4) => cRef(() => __cxx_lvalue_4, () => { throw new TypeError("const C++ reference write"); }))(i32((kzfs.pos + leng))), cObjectFieldRef(kzfs, "leng"))).value));
        if ((kzfs.endpos == kzfs.pos)) {
          return i32(0);
        }
        if ((kzfs.pos < i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value - 32768)))) {
          if (Boolean(kzfs.comptell)) {
            fseek(kzfs.fil, i64(kzfs.seek0), 0);
          }
          (__cxx_private_cell_19fba13327f490e0c98ebd37().value = i32(0));
          (gslider = i32(16384));
          (kzfs.jmpplc = i32(0));
          (kzfs.comptell = i32((min__template_774131ccff66371d(cObjectFieldRef(kzfs, "compleng"), ((__cxx_lvalue_5) => cRef(() => __cxx_lvalue_5, () => { throw new TypeError("const C++ reference write"); }))(i32(131072)))).value));
          fread(cPointerOffset(olinbuf, 0, Uint8Array.BYTES_PER_ELEMENT), u64(kzfs.comptell), u64(1), kzfs.fil);
          (bitpos = i32((-i32((i32((i32(131072) - 4)) << 3)))));
          (filptr = cPointerOffset(olinbuf, (-i32((bitpos >> 3))), Uint8Array.BYTES_PER_ELEMENT));
        } else {
          (i = i32((max__template_b1cfaf2244c73238(((__cxx_lvalue_6) => cRef(() => __cxx_lvalue_6, () => { throw new TypeError("const C++ reference write"); }))(i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value - 32768))), ((__cxx_lvalue_7) => cRef(() => __cxx_lvalue_7, () => { throw new TypeError("const C++ reference write"); }))(0))).value));
          (j = i32((gslider - 16384)));
          if ((kzfs.endpos <= __cxx_private_cell_19fba13327f490e0c98ebd37().value)) {
            (j = i32(kzfs.endpos));
          }
          if ((!Boolean(i32((i32((i ^ j)) & 32768))))) {
            putbuf4zip(cPointerOffset(slidebuf, i32((i & 32767)), Uint8Array.BYTES_PER_ELEMENT), i, j);
          } else {
            putbuf4zip(cPointerOffset(slidebuf, i32((i & 32767)), Uint8Array.BYTES_PER_ELEMENT), i, i32((j & (~32767))));
            putbuf4zip(slidebuf, i32((j & (~32767))), j);
          }
          if ((kzfs.endpos <= __cxx_private_cell_19fba13327f490e0c98ebd37().value)) {
            break __source_exit_retkzread;
          }
        }
        switch (kzfs.jmpplc) {
          case 0: __cxx_lvalue_1 = "kzreadplc0"; break;
          case 1: __cxx_lvalue_1 = "kzreadplc1"; break;
          case 2: __cxx_lvalue_1 = "kzreadplc2"; break;
          case 3: __cxx_lvalue_1 = "kzreadplc3"; break;
        }
        // Original resume label: kzreadplc0
        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc0") {
          __cxx_lvalue_1 = null;
          if (!__cxx_lvalue_1) {
            ;
          }
        }
        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1" || __cxx_lvalue_1 === "kzreadplc2") {
          __source_control_0: do {
            if (!__cxx_lvalue_1) {
              (bfinal = i32(getbits(1)));
            }
            if (!__cxx_lvalue_1) {
              (btype = i32(getbits(2)));
            }
            if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
              if (((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && ((btype == 0))))) {
                if (!__cxx_lvalue_1) {
                  suckbits(i32(((-bitpos) & 7)));
                }
                if (!__cxx_lvalue_1) {
                  (i = i32(getbits(16)));
                }
                if (!__cxx_lvalue_1) {
                  if ((i32((getbits(16) ^ i)) != 65535)) {
                    if (!__cxx_lvalue_1) {
                      return i32((-1));
                    }
                  }
                }
                if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                  __source_control_1: for (; ((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && (Boolean(i)))); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous - 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
                    if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                      if (((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && ((__cxx_private_cell_19fba13327f490e0c98ebd37().value >= gslider))))) {
                        if (!__cxx_lvalue_1) {
                          putbuf4zip(cPointerOffset(slidebuf, i32((i32((gslider - 16384)) & 32767)), Uint8Array.BYTES_PER_ELEMENT), i32((gslider - 16384)), gslider);
                        }
                        if (!__cxx_lvalue_1) {
                          (gslider = i32((Number(gslider) + Number(16384))));
                        }
                        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                          if (((__cxx_lvalue_1 === "kzreadplc1") || (!__cxx_lvalue_1 && ((i32((gslider - 16384)) >= kzfs.endpos))))) {
                            if (!__cxx_lvalue_1) {
                              (kzfs.jmpplc = i32(1));
                            }
                            if (!__cxx_lvalue_1) {
                              (kzfs.i = i32(i));
                            }
                            if (!__cxx_lvalue_1) {
                              (kzfs.bfinal = i32(bfinal));
                            }
                            if (!__cxx_lvalue_1) {
                              break __source_exit_retkzread;
                            }
                            // Original resume label: kzreadplc1
                            if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc1") {
                              __cxx_lvalue_1 = null;
                              if (!__cxx_lvalue_1) {
                                ;
                              }
                            }
                            if (!__cxx_lvalue_1) {
                              (i = i32(kzfs.i));
                            }
                            if (!__cxx_lvalue_1) {
                              (bfinal = i32(kzfs.bfinal));
                            }
                          }
                        }
                      }
                    }
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(slidebuf, i32((((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(__cxx_private_cell_19fba13327f490e0c98ebd37()) & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(getbits(8)) & 255)) & 255)) & 255));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  continue __source_control_0;
                }
              }
            }
            if (!__cxx_lvalue_1) {
              if ((btype == 3)) {
                if (!__cxx_lvalue_1) {
                  continue __source_control_0;
                }
              }
            }
            if (!__cxx_lvalue_1) {
              if ((btype == 1)) {
                if (!__cxx_lvalue_1) {
                  (hlit = i32(288));
                }
                if (!__cxx_lvalue_1) {
                  (hdist = i32(32));
                }
                if (!__cxx_lvalue_1) {
                  (i = i32(0));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_2: for (; (i < 144); ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = i32((previous + 1)); __cxx_lvalue_11.value = next; return previous; })(cRef(() => i, __cxx_lvalue_12 => { i = __cxx_lvalue_12; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(clen, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_3: for (; (i < 256); ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous + 1)); __cxx_lvalue_13.value = next; return previous; })(cRef(() => i, __cxx_lvalue_14 => { i = __cxx_lvalue_14; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(clen, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(9));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_4: for (; (i < 280); ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = i32((previous + 1)); __cxx_lvalue_15.value = next; return previous; })(cRef(() => i, __cxx_lvalue_16 => { i = __cxx_lvalue_16; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(clen, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(7));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_5: for (; (i < 288); ((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = i32((previous + 1)); __cxx_lvalue_17.value = next; return previous; })(cRef(() => i, __cxx_lvalue_18 => { i = __cxx_lvalue_18; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(clen, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(8));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_6: for (; (i < 320); ((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = i32((previous + 1)); __cxx_lvalue_19.value = next; return previous; })(cRef(() => i, __cxx_lvalue_20 => { i = __cxx_lvalue_20; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(clen, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(5));
                    }
                  }
                }
              } else {
                if (!__cxx_lvalue_1) {
                  (hlit = i32((getbits(5) + 257)));
                }
                if (!__cxx_lvalue_1) {
                  (hdist = i32((getbits(5) + 1)));
                }
                if (!__cxx_lvalue_1) {
                  (j = i32((getbits(4) + 4)));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_7: for ((i = i32(0)); (i < j); ((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = i32((previous + 1)); __cxx_lvalue_21.value = next; return previous; })(cRef(() => i, __cxx_lvalue_22 => { i = __cxx_lvalue_22; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(cclen, (cDeref(cPointerOffset(ccind, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(getbits(3)));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  __source_control_8: for (; (i < 19); ((__cxx_lvalue_23) => { const previous = __cxx_lvalue_23.value; const next = i32((previous + 1)); __cxx_lvalue_23.value = next; return previous; })(cRef(() => i, __cxx_lvalue_24 => { i = __cxx_lvalue_24; }))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(cclen, (cDeref(cPointerOffset(ccind, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  hufgencode(cclen, 19, ibuf0, nbuf0);
                }
                if (!__cxx_lvalue_1) {
                  (j = i32(0));
                }
                if (!__cxx_lvalue_1) {
                  (k = i32((hlit + hdist)));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_9: while ((j < k)) {
                    if (!__cxx_lvalue_1) {
                      (i = i32(hufgetsym(ibuf0, nbuf0)));
                    }
                    if (!__cxx_lvalue_1) {
                      if ((i < 16)) {
                        if (!__cxx_lvalue_1) {
                          ((cDeref(cPointerOffset(clen, ((__cxx_lvalue_25) => { const previous = __cxx_lvalue_25.value; const next = i32((previous + 1)); __cxx_lvalue_25.value = next; return previous; })(cRef(() => j, __cxx_lvalue_26 => { j = __cxx_lvalue_26; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
                        }
                        if (!__cxx_lvalue_1) {
                          continue __source_control_9;
                        }
                      }
                    }
                    if (!__cxx_lvalue_1) {
                      if ((i == 16)) {
                        if (!__cxx_lvalue_1) {
                          __source_control_10: for ((i = i32((getbits(2) + 3))); Boolean(i); ((__cxx_lvalue_27) => { const previous = __cxx_lvalue_27.value; const next = i32((previous - 1)); __cxx_lvalue_27.value = next; return previous; })(cRef(() => i, __cxx_lvalue_28 => { i = __cxx_lvalue_28; }))) {
                            if (!__cxx_lvalue_1) {
                              ((cDeref(cPointerOffset(clen, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(clen, i32((j - 1)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                            }
                            if (!__cxx_lvalue_1) {
                              ((__cxx_lvalue_29) => { const previous = __cxx_lvalue_29.value; const next = i32((previous + 1)); __cxx_lvalue_29.value = next; return previous; })(cRef(() => j, __cxx_lvalue_30 => { j = __cxx_lvalue_30; }));
                            }
                          }
                        }
                      } else {
                        if (!__cxx_lvalue_1) {
                          if ((i == 17)) {
                            if (!__cxx_lvalue_1) {
                              (i = i32((getbits(3) + 3)));
                            }
                          } else {
                            if (!__cxx_lvalue_1) {
                              (i = i32((getbits(7) + 11)));
                            }
                          }
                        }
                        if (!__cxx_lvalue_1) {
                          __source_control_11: for (; Boolean(i); ((__cxx_lvalue_31) => { const previous = __cxx_lvalue_31.value; const next = i32((previous - 1)); __cxx_lvalue_31.value = next; return previous; })(cRef(() => i, __cxx_lvalue_32 => { i = __cxx_lvalue_32; }))) {
                            if (!__cxx_lvalue_1) {
                              ((cDeref(cPointerOffset(clen, ((__cxx_lvalue_33) => { const previous = __cxx_lvalue_33.value; const next = i32((previous + 1)); __cxx_lvalue_33.value = next; return previous; })(cRef(() => j, __cxx_lvalue_34 => { j = __cxx_lvalue_34; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(0));
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            if (!__cxx_lvalue_1) {
              hufgencode(clen, hlit, ibuf0, nbuf0);
            }
            if (!__cxx_lvalue_1) {
              qhufgencode(ibuf0, nbuf0, qhufval0, qhufbit0, 9);
            }
            if (!__cxx_lvalue_1) {
              hufgencode(cPointerOffset(clen, hlit, Int32Array.BYTES_PER_ELEMENT), hdist, ibuf1, nbuf1);
            }
            if (!__cxx_lvalue_1) {
              qhufgencode(ibuf1, nbuf1, qhufval1, qhufbit1, 6);
            }
            if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
              __source_control_12: while (((__cxx_lvalue_1 === "kzreadplc2") || (!__cxx_lvalue_1 && (Boolean(1))))) {
                if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
                  if (((__cxx_lvalue_1 === "kzreadplc2") || (!__cxx_lvalue_1 && ((__cxx_private_cell_19fba13327f490e0c98ebd37().value >= gslider))))) {
                    if (!__cxx_lvalue_1) {
                      putbuf4zip(cPointerOffset(slidebuf, i32((i32((gslider - 16384)) & 32767)), Uint8Array.BYTES_PER_ELEMENT), i32((gslider - 16384)), gslider);
                    }
                    if (!__cxx_lvalue_1) {
                      (gslider = i32((Number(gslider) + Number(16384))));
                    }
                    if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
                      if (((__cxx_lvalue_1 === "kzreadplc2") || (!__cxx_lvalue_1 && ((i32((gslider - 16384)) >= kzfs.endpos))))) {
                        if (!__cxx_lvalue_1) {
                          (kzfs.jmpplc = i32(2));
                        }
                        if (!__cxx_lvalue_1) {
                          (kzfs.bfinal = i32(bfinal));
                        }
                        if (!__cxx_lvalue_1) {
                          break __source_exit_retkzread;
                        }
                        // Original resume label: kzreadplc2
                        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc2") {
                          __cxx_lvalue_1 = null;
                          if (!__cxx_lvalue_1) {
                            ;
                          }
                        }
                        if (!__cxx_lvalue_1) {
                          (bfinal = i32(kzfs.bfinal));
                        }
                      }
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  (k = i32(peekbits(9)));
                }
                if (!__cxx_lvalue_1) {
                  if (Boolean((cDeref(cPointerOffset(qhufbit0, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
                    if (!__cxx_lvalue_1) {
                      (i = i32((cDeref(cPointerOffset(qhufval0, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                    }
                    if (!__cxx_lvalue_1) {
                      suckbits(i32((cDeref(cPointerOffset(qhufbit0, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
                    }
                  } else {
                    if (!__cxx_lvalue_1) {
                      (i = i32(hufgetsym(ibuf0, nbuf0)));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  if ((i < 256)) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(slidebuf, i32((((__cxx_lvalue_35) => { const previous = __cxx_lvalue_35.value; const next = i32((previous + 1)); __cxx_lvalue_35.value = next; return previous; })(__cxx_private_cell_19fba13327f490e0c98ebd37()) & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(i) & 255)) & 255)) & 255));
                    }
                    if (!__cxx_lvalue_1) {
                      continue __source_control_12;
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  if ((i == 256)) {
                    if (!__cxx_lvalue_1) {
                      break __source_control_12;
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  (i = i32((getbits((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((i + 30)) - 257))).value)[0]) + (cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, i32((i32((i + 30)) - 257))).value)[1])));
                }
                if (!__cxx_lvalue_1) {
                  (k = i32(peekbits(6)));
                }
                if (!__cxx_lvalue_1) {
                  if (Boolean((cDeref(cPointerOffset(qhufbit1, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
                    if (!__cxx_lvalue_1) {
                      (j = i32((cDeref(cPointerOffset(qhufval1, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
                    }
                    if (!__cxx_lvalue_1) {
                      suckbits(i32((cDeref(cPointerOffset(qhufbit1, k, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
                    }
                  } else {
                    if (!__cxx_lvalue_1) {
                      (j = i32(hufgetsym(ibuf1, nbuf1)));
                    }
                  }
                }
                if (!__cxx_lvalue_1) {
                  (j = i32((getbits((cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, j).value)[0]) + (cPointerElementRef(__cxx_private_cell_44e9d131024042d9f1569617().value, j).value)[1])));
                }
                if (!__cxx_lvalue_1) {
                  __source_control_13: for (; Boolean(i); (((__cxx_lvalue_36) => { const previous = __cxx_lvalue_36.value; const next = i32((previous - 1)); __cxx_lvalue_36.value = next; return previous; })(cRef(() => i, __cxx_lvalue_37 => { i = __cxx_lvalue_37; })), ((__cxx_lvalue_38) => { const previous = __cxx_lvalue_38.value; const next = i32((previous + 1)); __cxx_lvalue_38.value = next; return previous; })(__cxx_private_cell_19fba13327f490e0c98ebd37()))) {
                    if (!__cxx_lvalue_1) {
                      ((cDeref(cPointerOffset(slidebuf, i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(slidebuf, i32((i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value - j)) & 32767)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
                    }
                  }
                }
              }
            }
          } while ((!Boolean(bfinal)));
        }
        if (!__cxx_lvalue_1) {
          (gslider = i32((Number(gslider) - Number(16384))));
        }
        if (!__cxx_lvalue_1) {
          if ((!Boolean(i32((i32((gslider ^ __cxx_private_cell_19fba13327f490e0c98ebd37().value)) & 32768))))) {
            if (!__cxx_lvalue_1) {
              putbuf4zip(cPointerOffset(slidebuf, i32((gslider & 32767)), Uint8Array.BYTES_PER_ELEMENT), gslider, __cxx_private_cell_19fba13327f490e0c98ebd37().value);
            }
          } else {
            if (!__cxx_lvalue_1) {
              putbuf4zip(cPointerOffset(slidebuf, i32((gslider & 32767)), Uint8Array.BYTES_PER_ELEMENT), gslider, i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value & (~32767))));
            }
            if (!__cxx_lvalue_1) {
              putbuf4zip(slidebuf, i32((__cxx_private_cell_19fba13327f490e0c98ebd37().value & (~32767))), __cxx_private_cell_19fba13327f490e0c98ebd37().value);
            }
          }
        }
        // Original resume label: kzreadplc3
        if (!__cxx_lvalue_1 || __cxx_lvalue_1 === "kzreadplc3") {
          __cxx_lvalue_1 = null;
          if (!__cxx_lvalue_1) {
            ;
          }
        }
        if (!__cxx_lvalue_1) {
          (kzfs.jmpplc = i32(3));
        }
      }
    }
  }
  if (!__cxx_lvalue_1) {
    ;
  }
  if (!__cxx_lvalue_1) {
    (i = i32(kzfs.pos));
  }
  if (!__cxx_lvalue_1) {
    ((__cxx_lvalue_39) => (__cxx_lvalue_39.value = i32((Number(__cxx_lvalue_39.value) + Number(leng)))))(cObjectFieldRef(kzfs, "pos"));
  }
  if (!__cxx_lvalue_1) {
    if ((kzfs.pos > kzfs.leng)) {
      if (!__cxx_lvalue_1) {
        (kzfs.pos = i32(kzfs.leng));
      }
    }
  }
  if (!__cxx_lvalue_1) {
    return i32((kzfs.pos - i));
  }
}

// C/C++ source: source/build/include/compat.h:948
export function B_SWAP32_impl(value) {
  return u32((u32((u32(((u32((value & 4278190080)) >>> 24) | (u32((value & 16711680)) >>> 8))) | u32((u32((value & 65280)) << 8)))) | u32((u32((value & 255)) << 24))));
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

export function B_PASS32__header_8a7178a88765(x) {
  return u32(x);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c5ffcfb092321e6b(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function B_SWAP32__header_86d0d39cb98e(x) {
  return u32(B_SWAP32_impl(u32(x)));
}
