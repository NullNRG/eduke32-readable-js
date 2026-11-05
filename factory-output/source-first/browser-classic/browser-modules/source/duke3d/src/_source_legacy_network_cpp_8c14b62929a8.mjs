// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/network.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
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
  const byBuffer=new WeakMap(),regions=[],opaque=new WeakMap(),byBits=new Map(),functionAddresses=new Map();
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
      if(value?.__cFunctionAddress===true&&functionAddresses.get(value.bits)===value)return value.bits;
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
        const at=Number(offset);let bounds;
        try{bounds=liveBounds(region.buffer,at);}
        catch(error){if(functionAddresses.has(bits))return functionAddresses.get(bits);throw error;}
        return {__cPointer:true,buffer:region.buffer,offset:at,array:false,...bounds};
      }
      if(functionAddresses.has(bits))return functionAddresses.get(bits);
      throw new TypeError('Unknown original C pointer address');
    },
    functionFromInteger(value){
      if(typeof value!=='bigint'&&!(typeof value==='number'&&Number.isSafeInteger(value)))
        throw new TypeError('Function address must be exactly representable');
      const bits=BigInt.asUintN(64,BigInt(value));
      if(bits===0n)return null;
      if(typeof byBits.get(bits)==='function')return byBits.get(bits);
      // Source-defined sentinel bits are values, not executable callbacks or
      // allocations. They can be stored/compared/round-tripped, never invoked.
      if(!functionAddresses.has(bits))functionAddresses.set(bits,Object.freeze({__cFunctionAddress:true,bits}));
      return functionAddresses.get(bits);
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
  if(source?.__cFunctionAddress===true)throw new TypeError('Function address has no readable data storage');
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
// A GNU trailing char[1] keeps its declared array size. Only pointer decay
// may borrow the remaining ORIGINAL complete heap allocation, as Clang's
// configured flexible-array mode allows; ordinary member arrays stay bounded.
const cArrayDecay = source => source?.[Symbol.for('source-first.clang-byte-tail-pointer/1')] || source;
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
  if(source?.__cDeferredReference===true)source=source.resolve();
  if(source?.__cReference===true&&source.__cPointer!==true&&
      !source.value?.[Symbol.for('source-first.original-byte-record-storage/1')]){
    if((delta===0||delta===0n)&&Number.isSafeInteger(stride)&&stride>0)return source;
    throw new RangeError('C scalar reference arithmetic requires original byte storage');
  }
  // Native record/row arrays expose readable JS indices over one existing
  // byte allocation. Address arithmetic must retain that allocation and its
  // actual subarray offset, rather than turn it into detached object slots.
  const arrayBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  const initial=cPointer(arrayBytes||source);
  const p=Array.isArray(source)&&!arrayBytes ? {...initial, upper:source.length*stride, stride} : initial;
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
  // An output-only automatic object owns bytes before its original callee
  // writes them. Omitting initial does not emit a C/C++ zero initializer.
  const array=initial===undefined?new Type(1):new Type([initial]),pointer=cPointer(array),reference=cDeref(pointer,Type);
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
  if(left?.__cFunctionAddress===true||right?.__cFunctionAddress===true){
    if(op!=='=='&&op!=='!=')throw new TypeError('Cannot order integer-derived function addresses');
    const equal=cSourceAddresses.encode(left)===cSourceAddresses.encode(right);
    return op==='=='?equal:!equal;
  }
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
const cInitByteRecord = (schema, values={}, storage=null, prototypes={}, allocation=null) => {
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
        if(field.oneByteTailArray==='clang-flex-arrays-0-or-1/1' && field.length===1 && C.BYTES_PER_ELEMENT===1 && allocation){
          const heap=globalThis[Symbol.for('source-first.native-C-heap/2')];
          // Original allocators can return a payload after their own header.
          // Retain that one live allocation's bounds rather than requiring
          // the source object to start at the raw host malloc address.
          const complete=heap?.buffer===bytes.buffer && [...heap.allocations].find(([base,size])=>
            base<=bytes.byteOffset && allocation.lower>=base && allocation.upper<=base+size);
          if(complete && allocation.offset===bytes.byteOffset &&
              allocation.upper>=bytes.byteOffset+schema.size && allocation.upper>=bytes.byteOffset+field.offset+field.size)
            Object.defineProperty(array,Symbol.for('source-first.clang-byte-tail-pointer/1'),{value:{
              __cPointer:true,array:false,buffer:bytes.buffer,lower:bytes.byteOffset+field.offset,
              offset:bytes.byteOffset+field.offset,upper:allocation.upper}});
        }
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
    protocol:'source-record-pointer-views/2',
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
      const tail=Object.values(schema.fields).some(field=>field.oneByteTailArray);
      const identity=p.offset+':'+JSON.stringify(schema)+(tail?':'+p.lower+':'+p.upper:'');
      let views=buffers.get(p.buffer);if(!views){views=new Map();buffers.set(p.buffer,views);}
      if(!views.has(identity))views.set(identity,cInitByteRecord(schema,{},new Uint8Array(p.buffer,p.offset,schema.size),p.recordPrototypes,p));
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

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_4efdedc83fe89ccc = i32(3754936);
function __cxx_static_address_d04281e75b68199457d22a8e() {
  return __cxx_static_address_d04281e75b68199457d22a8e.reference || (__cxx_static_address_d04281e75b68199457d22a8e.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_4efdedc83fe89ccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_bb465a6a93cc3e7b = i32(1144);
function __cxx_static_address_c8a8f789010c1e9f926354cf() {
  return __cxx_static_address_c8a8f789010c1e9f926354cf.reference || (__cxx_static_address_c8a8f789010c1e9f926354cf.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_bb465a6a93cc3e7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_d7e3f63f4ca6bf9e = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b3f5b8c603d50a1d7e9d789() {
  return __cxx_static_address_7b3f5b8c603d50a1d7e9d789.reference || (__cxx_static_address_7b3f5b8c603d50a1d7e9d789.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_d7e3f63f4ca6bf9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_2fe6a023ac6b4739 = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13801f90de76768d0ff853e6() {
  return __cxx_static_address_13801f90de76768d0ff853e6.reference || (__cxx_static_address_13801f90de76768d0ff853e6.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_2fe6a023ac6b4739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_9b76f855f8271466 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_966a1609f23cf8a363c3ec6e() {
  return __cxx_static_address_966a1609f23cf8a363c3ec6e.reference || (__cxx_static_address_966a1609f23cf8a363c3ec6e.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_9b76f855f8271466; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_9e84943661f20bc5 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ac99f958ec857ed1412bbb8() {
  return __cxx_static_address_1ac99f958ec857ed1412bbb8.reference || (__cxx_static_address_1ac99f958ec857ed1412bbb8.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_9e84943661f20bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_6764dcb48fa343ec = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_318bcf3a7684bead2897f2f4() {
  return __cxx_static_address_318bcf3a7684bead2897f2f4.reference || (__cxx_static_address_318bcf3a7684bead2897f2f4.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_6764dcb48fa343ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_75812f82632dd201 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1063f83119f33c1b94005642() {
  return __cxx_static_address_1063f83119f33c1b94005642.reference || (__cxx_static_address_1063f83119f33c1b94005642.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_75812f82632dd201; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_b828190a24d7be6f = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44bade2011e7dd6f19e877fd() {
  return __cxx_static_address_44bade2011e7dd6f19e877fd.reference || (__cxx_static_address_44bade2011e7dd6f19e877fd.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_b828190a24d7be6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_badb00c692ee7440 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eda8747c4d3c5aa215d35880() {
  return __cxx_static_address_eda8747c4d3c5aa215d35880.reference || (__cxx_static_address_eda8747c4d3c5aa215d35880.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_badb00c692ee7440; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_53aa2bc6112d107f = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26485e1d0ae3900370449901() {
  return __cxx_static_address_26485e1d0ae3900370449901.reference || (__cxx_static_address_26485e1d0ae3900370449901.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_53aa2bc6112d107f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_9d7a8830d78ec60c = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cc1542ee42c2b12c0e71339() {
  return __cxx_static_address_9cc1542ee42c2b12c0e71339.reference || (__cxx_static_address_9cc1542ee42c2b12c0e71339.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_9d7a8830d78ec60c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_209d7327e71ca58e = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d8103b9340d474265a8c29d() {
  return __cxx_static_address_5d8103b9340d474265a8c29d.reference || (__cxx_static_address_5d8103b9340d474265a8c29d.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_209d7327e71ca58e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_7db4b04a20e79ea6 = ((u32(((u32(11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9698aa2b6146faa2e2786bc3() {
  return __cxx_static_address_9698aa2b6146faa2e2786bc3.reference || (__cxx_static_address_9698aa2b6146faa2e2786bc3.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_7db4b04a20e79ea6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_d1a29343e6c585d5 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca44d3401250275a1f0d66d0() {
  return __cxx_static_address_ca44d3401250275a1f0d66d0.reference || (__cxx_static_address_ca44d3401250275a1f0d66d0.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_d1a29343e6c585d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_2ff20a77c6621cfa = ((u32(((u32(14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2423b74869ce962858a3579() {
  return __cxx_static_address_e2423b74869ce962858a3579.reference || (__cxx_static_address_e2423b74869ce962858a3579.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_2ff20a77c6621cfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_468b022e08a63e62 = ((u32(((u32(15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de24af4c08bb0797917386c8() {
  return __cxx_static_address_de24af4c08bb0797917386c8.reference || (__cxx_static_address_de24af4c08bb0797917386c8.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_468b022e08a63e62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_baa083fad13d6b11 = ((u32(((u32(16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_461d0cdd6511b74f5d214242() {
  return __cxx_static_address_461d0cdd6511b74f5d214242.reference || (__cxx_static_address_461d0cdd6511b74f5d214242.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_baa083fad13d6b11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_472d49bb51461640 = ((u32(((u32(17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3870b6b35cf377efd5dba34() {
  return __cxx_static_address_d3870b6b35cf377efd5dba34.reference || (__cxx_static_address_d3870b6b35cf377efd5dba34.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_472d49bb51461640; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_76d01a2ccfa9097e = ((u32(((u32(18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_103f936b54188fb3679e18c6() {
  return __cxx_static_address_103f936b54188fb3679e18c6.reference || (__cxx_static_address_103f936b54188fb3679e18c6.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_76d01a2ccfa9097e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_6d441b13a51f761f = ((u32(((u32(19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c953b7e49787380d14de8dd() {
  return __cxx_static_address_0c953b7e49787380d14de8dd.reference || (__cxx_static_address_0c953b7e49787380d14de8dd.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_6d441b13a51f761f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_76f457984ee062a8 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280656283b6a04f0c12ed05d() {
  return __cxx_static_address_280656283b6a04f0c12ed05d.reference || (__cxx_static_address_280656283b6a04f0c12ed05d.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_76f457984ee062a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_c49390a0aa9f0e48 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0725152eccc52efe49de24cc() {
  return __cxx_static_address_0725152eccc52efe49de24cc.reference || (__cxx_static_address_0725152eccc52efe49de24cc.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_c49390a0aa9f0e48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_865b900dbc5c8059 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a38a3d43bbc7756240e98eff() {
  return __cxx_static_address_a38a3d43bbc7756240e98eff.reference || (__cxx_static_address_a38a3d43bbc7756240e98eff.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_865b900dbc5c8059; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_29c641458b39ad8e = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6cdb01473ca17c3c2db852c() {
  return __cxx_static_address_c6cdb01473ca17c3c2db852c.reference || (__cxx_static_address_c6cdb01473ca17c3c2db852c.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_29c641458b39ad8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_286b5d8016e22b85 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c71524b1a7034d3cf7b55ea3() {
  return __cxx_static_address_c71524b1a7034d3cf7b55ea3.reference || (__cxx_static_address_c71524b1a7034d3cf7b55ea3.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_286b5d8016e22b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_1e80ac1ec322e2d5 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbc3eb8bb96fed9908d3d009() {
  return __cxx_static_address_dbc3eb8bb96fed9908d3d009.reference || (__cxx_static_address_dbc3eb8bb96fed9908d3d009.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_1e80ac1ec322e2d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_58d73115441e0dac = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e399f93566f52c1d5bec19e() {
  return __cxx_static_address_4e399f93566f52c1d5bec19e.reference || (__cxx_static_address_4e399f93566f52c1d5bec19e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_58d73115441e0dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_2fa7dd54b4a2cbed = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_919094e97eaafa8a2c2f9066() {
  return __cxx_static_address_919094e97eaafa8a2c2f9066.reference || (__cxx_static_address_919094e97eaafa8a2c2f9066.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_2fa7dd54b4a2cbed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_c87ab014ba3793eb = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c4ee9e2e82f0154b9e9b7c() {
  return __cxx_static_address_19c4ee9e2e82f0154b9e9b7c.reference || (__cxx_static_address_19c4ee9e2e82f0154b9e9b7c.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_c87ab014ba3793eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_b9013e5cce1443ae = ((u32(((u32(34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a153a29ac0dc1cd00aad0ea() {
  return __cxx_static_address_7a153a29ac0dc1cd00aad0ea.reference || (__cxx_static_address_7a153a29ac0dc1cd00aad0ea.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_b9013e5cce1443ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_cb2f81f2125a8e1c = ((u32(((u32(35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf6a84c0d45a34953181a1e9() {
  return __cxx_static_address_cf6a84c0d45a34953181a1e9.reference || (__cxx_static_address_cf6a84c0d45a34953181a1e9.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_cb2f81f2125a8e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_c1d0d66f90b19607 = ((u32(((u32(36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e70be0c6f529573c3b16eac5() {
  return __cxx_static_address_e70be0c6f529573c3b16eac5.reference || (__cxx_static_address_e70be0c6f529573c3b16eac5.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_c1d0d66f90b19607; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_ac8460a19f1e5960 = ((u32(((u32(38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51dc85ffe2da68b24c8422c4() {
  return __cxx_static_address_51dc85ffe2da68b24c8422c4.reference || (__cxx_static_address_51dc85ffe2da68b24c8422c4.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_ac8460a19f1e5960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_689777669fcaeb7a = ((u32(((u32(39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df4d4084f7f1d0132e716264() {
  return __cxx_static_address_df4d4084f7f1d0132e716264.reference || (__cxx_static_address_df4d4084f7f1d0132e716264.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_689777669fcaeb7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_4e479329205196ea = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32139c51617e5221c4f2d6f1() {
  return __cxx_static_address_32139c51617e5221c4f2d6f1.reference || (__cxx_static_address_32139c51617e5221c4f2d6f1.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_4e479329205196ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_5ba25c549b122f56 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4d38c9bb8049988457d90e6() {
  return __cxx_static_address_e4d38c9bb8049988457d90e6.reference || (__cxx_static_address_e4d38c9bb8049988457d90e6.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_5ba25c549b122f56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_3f9949890bb0fc8a = ((u32(((u32(43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ec38266dbdcbfdda48bb12f() {
  return __cxx_static_address_8ec38266dbdcbfdda48bb12f.reference || (__cxx_static_address_8ec38266dbdcbfdda48bb12f.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_3f9949890bb0fc8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_c781f2a3d0055afa = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eec2663e80c8591275a7ad4f() {
  return __cxx_static_address_eec2663e80c8591275a7ad4f.reference || (__cxx_static_address_eec2663e80c8591275a7ad4f.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_c781f2a3d0055afa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_c56a5901eb150f06 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d0331205143c5ce914cdc59() {
  return __cxx_static_address_2d0331205143c5ce914cdc59.reference || (__cxx_static_address_2d0331205143c5ce914cdc59.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_c56a5901eb150f06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_2c246250718efd8f = ((u32(((u32(50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_841e16f96d5016da07d561f9() {
  return __cxx_static_address_841e16f96d5016da07d561f9.reference || (__cxx_static_address_841e16f96d5016da07d561f9.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_2c246250718efd8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_31645cb95468e4d0 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34bbb9f0b6d45943ff008f2f() {
  return __cxx_static_address_34bbb9f0b6d45943ff008f2f.reference || (__cxx_static_address_34bbb9f0b6d45943ff008f2f.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_31645cb95468e4d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_c01f074a8caaaaa5 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40e447da59ce815d0da79487() {
  return __cxx_static_address_40e447da59ce815d0da79487.reference || (__cxx_static_address_40e447da59ce815d0da79487.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_c01f074a8caaaaa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_3b01a1d1755bc27e = ((u32(((u32(69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ae57dee43e57170f22a7756() {
  return __cxx_static_address_8ae57dee43e57170f22a7756.reference || (__cxx_static_address_8ae57dee43e57170f22a7756.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_3b01a1d1755bc27e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_6338f3c0dbc22679 = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_201fbb6b8646cfa123fbd203() {
  return __cxx_static_address_201fbb6b8646cfa123fbd203.reference || (__cxx_static_address_201fbb6b8646cfa123fbd203.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_6338f3c0dbc22679; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_a45064b6426e7364 = ((u32(((u32(71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86346c39bbe1cee492d4f55d() {
  return __cxx_static_address_86346c39bbe1cee492d4f55d.reference || (__cxx_static_address_86346c39bbe1cee492d4f55d.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_a45064b6426e7364; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_34620ba3ef856153 = ((u32(((u32(73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cddcef8e7f9167f6b44407a8() {
  return __cxx_static_address_cddcef8e7f9167f6b44407a8.reference || (__cxx_static_address_cddcef8e7f9167f6b44407a8.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_34620ba3ef856153; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_4bafe53b37a4c159 = ((u32(((u32(75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2327208edfc5a6b678d2a8d4() {
  return __cxx_static_address_2327208edfc5a6b678d2a8d4.reference || (__cxx_static_address_2327208edfc5a6b678d2a8d4.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_4bafe53b37a4c159; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_60458ee5f0ed675f = ((u32(((u32(76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84790f86ebcb21637bee8f5f() {
  return __cxx_static_address_84790f86ebcb21637bee8f5f.reference || (__cxx_static_address_84790f86ebcb21637bee8f5f.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_60458ee5f0ed675f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_b5e83e9d38d81c92 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0b23f6351cc88868d435355() {
  return __cxx_static_address_c0b23f6351cc88868d435355.reference || (__cxx_static_address_c0b23f6351cc88868d435355.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_b5e83e9d38d81c92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_6364557c0b09e179 = ((u32(((u32(81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_983cbd4d36a576681f675279() {
  return __cxx_static_address_983cbd4d36a576681f675279.reference || (__cxx_static_address_983cbd4d36a576681f675279.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_6364557c0b09e179; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_dae25ca32c26fd84 = ((u32(((u32(83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91ed5f78a69a9df38ff8dd77() {
  return __cxx_static_address_91ed5f78a69a9df38ff8dd77.reference || (__cxx_static_address_91ed5f78a69a9df38ff8dd77.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_dae25ca32c26fd84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_3d225578dd627601 = ((u32(((u32(91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce9173853909789e906adce2() {
  return __cxx_static_address_ce9173853909789e906adce2.reference || (__cxx_static_address_ce9173853909789e906adce2.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_3d225578dd627601; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_3f691a994dd60b52 = ((u32(((u32(92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d23af690c9316d98a26fd8cc() {
  return __cxx_static_address_d23af690c9316d98a26fd8cc.reference || (__cxx_static_address_d23af690c9316d98a26fd8cc.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_3f691a994dd60b52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_18452fdaa94eae86 = ((u32(((u32(97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ca5e6ec068b41383d3d7e65() {
  return __cxx_static_address_8ca5e6ec068b41383d3d7e65.reference || (__cxx_static_address_8ca5e6ec068b41383d3d7e65.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_18452fdaa94eae86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_e8ec64bffc5f07fa = ((u32(((u32(102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01aaeac7039c3cea1c330a4f() {
  return __cxx_static_address_01aaeac7039c3cea1c330a4f.reference || (__cxx_static_address_01aaeac7039c3cea1c330a4f.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_e8ec64bffc5f07fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_b389ce33c493bbc1 = ((u32(((u32(107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffa4cd7f96d1ba9cade068e9() {
  return __cxx_static_address_ffa4cd7f96d1ba9cade068e9.reference || (__cxx_static_address_ffa4cd7f96d1ba9cade068e9.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_b389ce33c493bbc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_21cced9fc4d55516 = ((u32(((u32(109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e65f04df6ffb93bcf17fb25() {
  return __cxx_static_address_6e65f04df6ffb93bcf17fb25.reference || (__cxx_static_address_6e65f04df6ffb93bcf17fb25.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_21cced9fc4d55516; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_4b7ea3c31a8afaab = ((u32(((u32(111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6eab68f8bf5ee96e0f2b5ab0() {
  return __cxx_static_address_6eab68f8bf5ee96e0f2b5ab0.reference || (__cxx_static_address_6eab68f8bf5ee96e0f2b5ab0.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_4b7ea3c31a8afaab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_0b298d4c8bb14a6d = ((u32(((u32(117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d94a8bc45d4062c5aa8699a() {
  return __cxx_static_address_9d94a8bc45d4062c5aa8699a.reference || (__cxx_static_address_9d94a8bc45d4062c5aa8699a.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_0b298d4c8bb14a6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_d58870e493eb7650 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd973e3b06ef9caae1105eec() {
  return __cxx_static_address_fd973e3b06ef9caae1105eec.reference || (__cxx_static_address_fd973e3b06ef9caae1105eec.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_d58870e493eb7650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_c1e375f38116f64e = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_978b91035f5a80dde36b8e25() {
  return __cxx_static_address_978b91035f5a80dde36b8e25.reference || (__cxx_static_address_978b91035f5a80dde36b8e25.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_c1e375f38116f64e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_88218dbe3e2ad55a = ((u32(((u32(126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb0efc3527701b023072a8cf() {
  return __cxx_static_address_fb0efc3527701b023072a8cf.reference || (__cxx_static_address_fb0efc3527701b023072a8cf.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_88218dbe3e2ad55a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_2cb1b9f0fe554114 = ((u32(((u32(127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4b7872ce8141f1ccaff4f3b() {
  return __cxx_static_address_a4b7872ce8141f1ccaff4f3b.reference || (__cxx_static_address_a4b7872ce8141f1ccaff4f3b.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_2cb1b9f0fe554114; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_dee57248d3775b1e = ((u32(((u32(128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7ff00e800f8c241f3541e3e() {
  return __cxx_static_address_c7ff00e800f8c241f3541e3e.reference || (__cxx_static_address_c7ff00e800f8c241f3541e3e.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_dee57248d3775b1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_b9a455696618c9b3 = ((u32(((u32(131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eb6d5a7a963e488645912aa() {
  return __cxx_static_address_8eb6d5a7a963e488645912aa.reference || (__cxx_static_address_8eb6d5a7a963e488645912aa.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_b9a455696618c9b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_1906ae9a85fab161 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67a25d97d68d12197935dfe9() {
  return __cxx_static_address_67a25d97d68d12197935dfe9.reference || (__cxx_static_address_67a25d97d68d12197935dfe9.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_1906ae9a85fab161; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_f82542ddc16071a2 = ((u32(((u32(141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18aea930679e22e788ca81d8() {
  return __cxx_static_address_18aea930679e22e788ca81d8.reference || (__cxx_static_address_18aea930679e22e788ca81d8.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_f82542ddc16071a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_085ed39a74fdd412 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e33fa777068566503ad897f() {
  return __cxx_static_address_5e33fa777068566503ad897f.reference || (__cxx_static_address_5e33fa777068566503ad897f.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_085ed39a74fdd412; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_a51ea01db6e8fdcf = ((u32(((u32(149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e38569cbfbcd7c20d7e50ba2() {
  return __cxx_static_address_e38569cbfbcd7c20d7e50ba2.reference || (__cxx_static_address_e38569cbfbcd7c20d7e50ba2.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_a51ea01db6e8fdcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_7ccf26e696854871 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9a49874f808554d35d102e7() {
  return __cxx_static_address_a9a49874f808554d35d102e7.reference || (__cxx_static_address_a9a49874f808554d35d102e7.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_7ccf26e696854871; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_7b174ae54db2d021 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b0c61840f3d851f5e19e5a4() {
  return __cxx_static_address_9b0c61840f3d851f5e19e5a4.reference || (__cxx_static_address_9b0c61840f3d851f5e19e5a4.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_7b174ae54db2d021; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_c4594f0e07904fd9 = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93c5e4787f29dfa97a67c316() {
  return __cxx_static_address_93c5e4787f29dfa97a67c316.reference || (__cxx_static_address_93c5e4787f29dfa97a67c316.reference = {
    __cReference: true,
    get value() { return THUD____header_global_c4594f0e07904fd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_0163e4106eb55841 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_567b4be29ff3657e38950cb9() {
  return __cxx_static_address_567b4be29ff3657e38950cb9.reference || (__cxx_static_address_567b4be29ff3657e38950cb9.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_0163e4106eb55841; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_fa5c13e5261e8035 = ((u32(((u32(163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7254ef97dc61f6a3bf9875d5() {
  return __cxx_static_address_7254ef97dc61f6a3bf9875d5.reference || (__cxx_static_address_7254ef97dc61f6a3bf9875d5.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_fa5c13e5261e8035; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_1cb69d0d6c2c16d4 = ((u32(((u32(169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1473b5d1b90bd9429e46de81() {
  return __cxx_static_address_1473b5d1b90bd9429e46de81.reference || (__cxx_static_address_1473b5d1b90bd9429e46de81.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_1cb69d0d6c2c16d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_2c1319b2bbd61c16 = ((u32(((u32(177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d51424d7ae112c760d502cb2() {
  return __cxx_static_address_d51424d7ae112c760d502cb2.reference || (__cxx_static_address_d51424d7ae112c760d502cb2.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_2c1319b2bbd61c16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_7131c01d5aaca715 = ((u32(((u32(195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58382576d4614c819e62a043() {
  return __cxx_static_address_58382576d4614c819e62a043.reference || (__cxx_static_address_58382576d4614c819e62a043.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_7131c01d5aaca715; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_b252bf50115d2a84 = ((u32(((u32(196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19911b8800f406e1b839a69c() {
  return __cxx_static_address_19911b8800f406e1b839a69c.reference || (__cxx_static_address_19911b8800f406e1b839a69c.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_b252bf50115d2a84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_9f144d8c0530d7de = ((u32(((u32(197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45f5c7440e4ab6396baeea36() {
  return __cxx_static_address_45f5c7440e4ab6396baeea36.reference || (__cxx_static_address_45f5c7440e4ab6396baeea36.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_9f144d8c0530d7de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_74ef833eeb43517a = ((u32(((u32(199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_389f539caea49dae85d7ca24() {
  return __cxx_static_address_389f539caea49dae85d7ca24.reference || (__cxx_static_address_389f539caea49dae85d7ca24.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_74ef833eeb43517a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_5083875a35901da1 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_447dffa00f8a5079aab5ed9e() {
  return __cxx_static_address_447dffa00f8a5079aab5ed9e.reference || (__cxx_static_address_447dffa00f8a5079aab5ed9e.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_5083875a35901da1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_2568ce1807627951 = ((u32(((u32(207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd26053e9c5548a88eb2fc95() {
  return __cxx_static_address_fd26053e9c5548a88eb2fc95.reference || (__cxx_static_address_fd26053e9c5548a88eb2fc95.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_2568ce1807627951; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_efe268d5ec6116ee = ((u32(((u32(208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ff3f666b75330a8a02d1f22() {
  return __cxx_static_address_5ff3f666b75330a8a02d1f22.reference || (__cxx_static_address_5ff3f666b75330a8a02d1f22.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_efe268d5ec6116ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_3a3e1f1d48fa312a = ((u32(((u32(209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb43fac784d9d7de43dca927() {
  return __cxx_static_address_cb43fac784d9d7de43dca927.reference || (__cxx_static_address_cb43fac784d9d7de43dca927.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_3a3e1f1d48fa312a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_7095a17ddc1369de = ((u32(((u32(210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_938ee13b26566fef190e5499() {
  return __cxx_static_address_938ee13b26566fef190e5499.reference || (__cxx_static_address_938ee13b26566fef190e5499.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_7095a17ddc1369de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_d611284f686931d7 = ((u32(((u32(211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2718b4e1285ef1100f68721e() {
  return __cxx_static_address_2718b4e1285ef1100f68721e.reference || (__cxx_static_address_2718b4e1285ef1100f68721e.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_d611284f686931d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_1c18eddd87169180 = ((u32(((u32(212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_585724e12bfecc809c66517d() {
  return __cxx_static_address_585724e12bfecc809c66517d.reference || (__cxx_static_address_585724e12bfecc809c66517d.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_1c18eddd87169180; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_72a82972b5a3284a = ((u32(((u32(213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_855ef19c163f90d14f81ec33() {
  return __cxx_static_address_855ef19c163f90d14f81ec33.reference || (__cxx_static_address_855ef19c163f90d14f81ec33.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_72a82972b5a3284a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_0b982a485d039924 = ((u32(((u32(215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdcc6438cafa24022530faf0() {
  return __cxx_static_address_cdcc6438cafa24022530faf0.reference || (__cxx_static_address_cdcc6438cafa24022530faf0.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_0b982a485d039924; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_05a0b478f3d3df65 = ((u32(((u32(216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2365961f29a08c5879b07e7b() {
  return __cxx_static_address_2365961f29a08c5879b07e7b.reference || (__cxx_static_address_2365961f29a08c5879b07e7b.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_05a0b478f3d3df65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_4dd009f0fe16d536 = ((u32(((u32(217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48da87a0d1d58d4f624ce9d7() {
  return __cxx_static_address_48da87a0d1d58d4f624ce9d7.reference || (__cxx_static_address_48da87a0d1d58d4f624ce9d7.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_4dd009f0fe16d536; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_d42e34bee7fa4bda = ((u32(((u32(218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9bc3693b9ba9d70a52076c3() {
  return __cxx_static_address_c9bc3693b9ba9d70a52076c3.reference || (__cxx_static_address_c9bc3693b9ba9d70a52076c3.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_d42e34bee7fa4bda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_f464afa7971a138a = ((u32(((u32(219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c91d2a133eec9da7f9e8c714() {
  return __cxx_static_address_c91d2a133eec9da7f9e8c714.reference || (__cxx_static_address_c91d2a133eec9da7f9e8c714.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_f464afa7971a138a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_845865841e08de3e = ((u32(((u32(226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f24d62caf0f3fb4171960ac() {
  return __cxx_static_address_5f24d62caf0f3fb4171960ac.reference || (__cxx_static_address_5f24d62caf0f3fb4171960ac.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_845865841e08de3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_83d50f27df2eb52e = ((u32(((u32(227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1abc5490117570a77d0cb826() {
  return __cxx_static_address_1abc5490117570a77d0cb826.reference || (__cxx_static_address_1abc5490117570a77d0cb826.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_83d50f27df2eb52e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_e674a6073d2cfd6f = ((u32(((u32(229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_751befee22c72047a16b1496() {
  return __cxx_static_address_751befee22c72047a16b1496.reference || (__cxx_static_address_751befee22c72047a16b1496.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_e674a6073d2cfd6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_d55e18ecc7da63f0 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fea1487e515286c85054ba4f() {
  return __cxx_static_address_fea1487e515286c85054ba4f.reference || (__cxx_static_address_fea1487e515286c85054ba4f.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_d55e18ecc7da63f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_0449df2062b4f39f = ((u32(((u32(232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f2e2df377ee7f2e3a138167() {
  return __cxx_static_address_9f2e2df377ee7f2e3a138167.reference || (__cxx_static_address_9f2e2df377ee7f2e3a138167.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_0449df2062b4f39f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_9582a5b62bae469c = ((u32(((u32(243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d51513962e14e34afedbf300() {
  return __cxx_static_address_d51513962e14e34afedbf300.reference || (__cxx_static_address_d51513962e14e34afedbf300.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_9582a5b62bae469c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_8098bc9aacbefc1e = ((u32(((u32(244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7952c733a14bde3ced1af3fa() {
  return __cxx_static_address_7952c733a14bde3ced1af3fa.reference || (__cxx_static_address_7952c733a14bde3ced1af3fa.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_8098bc9aacbefc1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_fa4d5a851c54f4df = ((u32(((u32(245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c04e9c07ee74618c9475e14e() {
  return __cxx_static_address_c04e9c07ee74618c9475e14e.reference || (__cxx_static_address_c04e9c07ee74618c9475e14e.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_fa4d5a851c54f4df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_cd5df3353d84e991 = ((u32(((u32(246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_902a32b5b5a2cc9f75ac9466() {
  return __cxx_static_address_902a32b5b5a2cc9f75ac9466.reference || (__cxx_static_address_902a32b5b5a2cc9f75ac9466.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_cd5df3353d84e991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_88bf6340d677d11b = ((u32(((u32(247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971692d559c25f1afee970ac() {
  return __cxx_static_address_971692d559c25f1afee970ac.reference || (__cxx_static_address_971692d559c25f1afee970ac.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_88bf6340d677d11b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_2722b0846ec68a43 = ((u32(((u32(249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b6a653a864e4c1fd6b557a6() {
  return __cxx_static_address_0b6a653a864e4c1fd6b557a6.reference || (__cxx_static_address_0b6a653a864e4c1fd6b557a6.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_2722b0846ec68a43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_988a81f3591b745c = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2601317a7fa65e472879eee() {
  return __cxx_static_address_e2601317a7fa65e472879eee.reference || (__cxx_static_address_e2601317a7fa65e472879eee.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_988a81f3591b745c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_1e4d4e624f6e3425 = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e89b178c50cf3b55f07f3a3() {
  return __cxx_static_address_1e89b178c50cf3b55f07f3a3.reference || (__cxx_static_address_1e89b178c50cf3b55f07f3a3.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_1e4d4e624f6e3425; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_d7f8c41b5a594fd2 = ((u32(((u32(284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16c0ec305a0a290760db0fa7() {
  return __cxx_static_address_16c0ec305a0a290760db0fa7.reference || (__cxx_static_address_16c0ec305a0a290760db0fa7.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_d7f8c41b5a594fd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_80e468195a3e89b4 = ((u32(((u32(288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95e02ed88daf206ecc4b91ff() {
  return __cxx_static_address_95e02ed88daf206ecc4b91ff.reference || (__cxx_static_address_95e02ed88daf206ecc4b91ff.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_80e468195a3e89b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_923bd0472d59c938 = ((u32(((u32(289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99add9523873ac091bf9747f() {
  return __cxx_static_address_99add9523873ac091bf9747f.reference || (__cxx_static_address_99add9523873ac091bf9747f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_923bd0472d59c938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_ee59ed4d6d11c0a8 = ((u32(((u32(290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5457c3593111a84a01399bd0() {
  return __cxx_static_address_5457c3593111a84a01399bd0.reference || (__cxx_static_address_5457c3593111a84a01399bd0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_ee59ed4d6d11c0a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_7efe02df221442fc = ((u32(((u32(291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6bfea48a5f471eb012a5c85() {
  return __cxx_static_address_d6bfea48a5f471eb012a5c85.reference || (__cxx_static_address_d6bfea48a5f471eb012a5c85.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_7efe02df221442fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_f9efce55f5b6aa69 = ((u32(((u32(292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52b6305e9df1061e5af0b196() {
  return __cxx_static_address_52b6305e9df1061e5af0b196.reference || (__cxx_static_address_52b6305e9df1061e5af0b196.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_f9efce55f5b6aa69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_2a7d5953d7e71d1e = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7182c834179783084e5f171f() {
  return __cxx_static_address_7182c834179783084e5f171f.reference || (__cxx_static_address_7182c834179783084e5f171f.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_2a7d5953d7e71d1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_7ef3379e82ddf39d = ((u32(((u32(294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f161c9e9904facfec6a4618e() {
  return __cxx_static_address_f161c9e9904facfec6a4618e.reference || (__cxx_static_address_f161c9e9904facfec6a4618e.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_7ef3379e82ddf39d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_d4fa91f270a945f6 = ((u32(((u32(295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69a8f69e767636b9f504568c() {
  return __cxx_static_address_69a8f69e767636b9f504568c.reference || (__cxx_static_address_69a8f69e767636b9f504568c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_d4fa91f270a945f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_104c7194d56834e9 = ((u32(((u32(296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebd1690e38be83b6630b4075() {
  return __cxx_static_address_ebd1690e38be83b6630b4075.reference || (__cxx_static_address_ebd1690e38be83b6630b4075.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_104c7194d56834e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_0b0e30a898bb1eb1 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_341e0a313aa7728582827c81() {
  return __cxx_static_address_341e0a313aa7728582827c81.reference || (__cxx_static_address_341e0a313aa7728582827c81.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_0b0e30a898bb1eb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_3909192e9dfa8e00 = ((u32(((u32(298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb1b1786f85e23f779a12e21() {
  return __cxx_static_address_fb1b1786f85e23f779a12e21.reference || (__cxx_static_address_fb1b1786f85e23f779a12e21.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_3909192e9dfa8e00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_523cd2dc469c07a2 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8eeacdddfc822c40954f73eb() {
  return __cxx_static_address_8eeacdddfc822c40954f73eb.reference || (__cxx_static_address_8eeacdddfc822c40954f73eb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_523cd2dc469c07a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_0f6de26caa9085f0 = ((u32(((u32(300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca1a1d11e7f69c70bd933a76() {
  return __cxx_static_address_ca1a1d11e7f69c70bd933a76.reference || (__cxx_static_address_ca1a1d11e7f69c70bd933a76.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_0f6de26caa9085f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_c2357ff9a577e12d = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bb596007e89ad2ce90d98a3() {
  return __cxx_static_address_3bb596007e89ad2ce90d98a3.reference || (__cxx_static_address_3bb596007e89ad2ce90d98a3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_c2357ff9a577e12d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_30e8a59d3a39aea5 = ((u32(((u32(303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56aab4ffc11cf7e31c82ace5() {
  return __cxx_static_address_56aab4ffc11cf7e31c82ace5.reference || (__cxx_static_address_56aab4ffc11cf7e31c82ace5.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_30e8a59d3a39aea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_add142612d1a12d4 = ((u32(((u32(308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5b84c1be5aadfffe665829b() {
  return __cxx_static_address_f5b84c1be5aadfffe665829b.reference || (__cxx_static_address_f5b84c1be5aadfffe665829b.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_add142612d1a12d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_72381d8b9aa207d1 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a828ce82d8130d51a47f4b8() {
  return __cxx_static_address_5a828ce82d8130d51a47f4b8.reference || (__cxx_static_address_5a828ce82d8130d51a47f4b8.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_72381d8b9aa207d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_f2b8b97123ac382c = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e1625135afb29a6f044a34d() {
  return __cxx_static_address_8e1625135afb29a6f044a34d.reference || (__cxx_static_address_8e1625135afb29a6f044a34d.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_f2b8b97123ac382c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_c00dc713a4aeaccc = ((u32(((u32(352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cccc42ae7d7e70cb62707c3e() {
  return __cxx_static_address_cccc42ae7d7e70cb62707c3e.reference || (__cxx_static_address_cccc42ae7d7e70cb62707c3e.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_c00dc713a4aeaccc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_41f08242954ae710 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aedcab6f8bd268d5d45b8a40() {
  return __cxx_static_address_aedcab6f8bd268d5d45b8a40.reference || (__cxx_static_address_aedcab6f8bd268d5d45b8a40.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_41f08242954ae710; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_bcaf934928c9074a = ((u32(((u32(364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccfa97aebee118ec73a69610() {
  return __cxx_static_address_ccfa97aebee118ec73a69610.reference || (__cxx_static_address_ccfa97aebee118ec73a69610.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_bcaf934928c9074a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_12130ffabea95d9e = ((u32(((u32(365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86cbca1253599b6cc2b8707() {
  return __cxx_static_address_a86cbca1253599b6cc2b8707.reference || (__cxx_static_address_a86cbca1253599b6cc2b8707.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_12130ffabea95d9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_95e6e96f49353688 = ((u32(((u32(366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4573c8cb154d34e884a12965() {
  return __cxx_static_address_4573c8cb154d34e884a12965.reference || (__cxx_static_address_4573c8cb154d34e884a12965.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_95e6e96f49353688; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_b6534bef2ad781cf = ((u32(((u32(367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02dfe9ff5893c45ae8d80510() {
  return __cxx_static_address_02dfe9ff5893c45ae8d80510.reference || (__cxx_static_address_02dfe9ff5893c45ae8d80510.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_b6534bef2ad781cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_2ed5fb80c8e4a0c1 = ((u32(((u32(368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d6e3d01de07d98d66541f44() {
  return __cxx_static_address_6d6e3d01de07d98d66541f44.reference || (__cxx_static_address_6d6e3d01de07d98d66541f44.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_2ed5fb80c8e4a0c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_ef87739ea29afc36 = ((u32(((u32(370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16f5e1b1007b0928ea35f973() {
  return __cxx_static_address_16f5e1b1007b0928ea35f973.reference || (__cxx_static_address_16f5e1b1007b0928ea35f973.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_ef87739ea29afc36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_5ff7968ab503e3df = ((u32(((u32(371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ada861a7aaf3ecb1608d105() {
  return __cxx_static_address_2ada861a7aaf3ecb1608d105.reference || (__cxx_static_address_2ada861a7aaf3ecb1608d105.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_5ff7968ab503e3df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_a1e3f74eaa8fa7f0 = ((u32(((u32(384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39a23424f2b6c522cb952a00() {
  return __cxx_static_address_39a23424f2b6c522cb952a00.reference || (__cxx_static_address_39a23424f2b6c522cb952a00.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_a1e3f74eaa8fa7f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_8be49ca0f9b44a00 = ((u32(((u32(385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80e4ef3903a849b5fa100396() {
  return __cxx_static_address_80e4ef3903a849b5fa100396.reference || (__cxx_static_address_80e4ef3903a849b5fa100396.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_8be49ca0f9b44a00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_3d743b69fd3dce21 = ((u32(((u32(388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9cf5c2d4e5c10b6c73439e3() {
  return __cxx_static_address_b9cf5c2d4e5c10b6c73439e3.reference || (__cxx_static_address_b9cf5c2d4e5c10b6c73439e3.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_3d743b69fd3dce21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_14afc26cac90354a = ((u32(((u32(392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2814a1c5c6306a5c45183ea0() {
  return __cxx_static_address_2814a1c5c6306a5c45183ea0.reference || (__cxx_static_address_2814a1c5c6306a5c45183ea0.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_14afc26cac90354a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_597528890e30e204 = ((u32(((u32(393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282b6ebeb1fa88d7f286e2a2() {
  return __cxx_static_address_282b6ebeb1fa88d7f286e2a2.reference || (__cxx_static_address_282b6ebeb1fa88d7f286e2a2.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_597528890e30e204; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_f8abb876e11d7a33 = ((u32(((u32(398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ff3d790836956832192f1a7() {
  return __cxx_static_address_4ff3d790836956832192f1a7.reference || (__cxx_static_address_4ff3d790836956832192f1a7.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_f8abb876e11d7a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_cd60689a05d9cd9e = ((u32(((u32(399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1d8d40f1c56e5abf104b20d() {
  return __cxx_static_address_f1d8d40f1c56e5abf104b20d.reference || (__cxx_static_address_f1d8d40f1c56e5abf104b20d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_cd60689a05d9cd9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_de2b7e43874e6e44 = ((u32(((u32(400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d7c1b764e3206ade6c66efb() {
  return __cxx_static_address_2d7c1b764e3206ade6c66efb.reference || (__cxx_static_address_2d7c1b764e3206ade6c66efb.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_de2b7e43874e6e44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_723818479f2d2306 = ((u32(((u32(401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47b2f060b78024319442e154() {
  return __cxx_static_address_47b2f060b78024319442e154.reference || (__cxx_static_address_47b2f060b78024319442e154.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_723818479f2d2306; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_d1a27b9ab67c5ddd = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_913047e77121ca2a23680820() {
  return __cxx_static_address_913047e77121ca2a23680820.reference || (__cxx_static_address_913047e77121ca2a23680820.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_d1a27b9ab67c5ddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_6f06ee5f49564cef = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f27dacbcd01e29f7436dabf8() {
  return __cxx_static_address_f27dacbcd01e29f7436dabf8.reference || (__cxx_static_address_f27dacbcd01e29f7436dabf8.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_6f06ee5f49564cef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_dc96c0e7555a123a = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c62b3a63a701eb06d83c3b() {
  return __cxx_static_address_d4c62b3a63a701eb06d83c3b.reference || (__cxx_static_address_d4c62b3a63a701eb06d83c3b.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_dc96c0e7555a123a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_1a3ac9b1ae881b67 = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fcf3d9f0046187a111d33d1() {
  return __cxx_static_address_3fcf3d9f0046187a111d33d1.reference || (__cxx_static_address_3fcf3d9f0046187a111d33d1.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_1a3ac9b1ae881b67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_7bc8f472cd9d0924 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af153f7497020d4e366b7faf() {
  return __cxx_static_address_af153f7497020d4e366b7faf.reference || (__cxx_static_address_af153f7497020d4e366b7faf.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_7bc8f472cd9d0924; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_c72b6128e0d9b836 = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b70abaad727a17218e8c115b() {
  return __cxx_static_address_b70abaad727a17218e8c115b.reference || (__cxx_static_address_b70abaad727a17218e8c115b.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_c72b6128e0d9b836; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_ad462d63897c7bc5 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78a0fb2baaff7bde0be9aef3() {
  return __cxx_static_address_78a0fb2baaff7bde0be9aef3.reference || (__cxx_static_address_78a0fb2baaff7bde0be9aef3.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_ad462d63897c7bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_64c8be41eeba0bb6 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_465edf3b772655d9dac3d260() {
  return __cxx_static_address_465edf3b772655d9dac3d260.reference || (__cxx_static_address_465edf3b772655d9dac3d260.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_64c8be41eeba0bb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_75b311d7312ab888 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_038c8e8d5e85257c1de0208c() {
  return __cxx_static_address_038c8e8d5e85257c1de0208c.reference || (__cxx_static_address_038c8e8d5e85257c1de0208c.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_75b311d7312ab888; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_991b97af96c97572 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_099a2b63522b4665c794a397() {
  return __cxx_static_address_099a2b63522b4665c794a397.reference || (__cxx_static_address_099a2b63522b4665c794a397.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_991b97af96c97572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_cf1ea1a2918d6d48 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c942288e7e8e4cb744bb48() {
  return __cxx_static_address_e7c942288e7e8e4cb744bb48.reference || (__cxx_static_address_e7c942288e7e8e4cb744bb48.reference = {
    __cReference: true,
    get value() { return FOF____header_global_cf1ea1a2918d6d48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_eb3c6c765a817b23 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5423fd65acc561545d4f689c() {
  return __cxx_static_address_5423fd65acc561545d4f689c.reference || (__cxx_static_address_5423fd65acc561545d4f689c.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_eb3c6c765a817b23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_c3c4479fe2c69270 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb2825a1bd7021400eeb9e1f() {
  return __cxx_static_address_fb2825a1bd7021400eeb9e1f.reference || (__cxx_static_address_fb2825a1bd7021400eeb9e1f.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_c3c4479fe2c69270; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_0832107e05d5ca24 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8ebae6b4a8535381ff76ee0() {
  return __cxx_static_address_c8ebae6b4a8535381ff76ee0.reference || (__cxx_static_address_c8ebae6b4a8535381ff76ee0.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_0832107e05d5ca24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_38ffd6098db7d943 = ((u32(((u32(23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72cb3fc8ce41237a01cd58db() {
  return __cxx_static_address_72cb3fc8ce41237a01cd58db.reference || (__cxx_static_address_72cb3fc8ce41237a01cd58db.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_38ffd6098db7d943; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_6ed25f2e53b31b3b = ((u32(((u32(24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42b5ba8f803a5a0af3a8621f() {
  return __cxx_static_address_42b5ba8f803a5a0af3a8621f.reference || (__cxx_static_address_42b5ba8f803a5a0af3a8621f.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_6ed25f2e53b31b3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_82aa41510bbe55ae = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_180c2c45f07eb38b317de92d() {
  return __cxx_static_address_180c2c45f07eb38b317de92d.reference || (__cxx_static_address_180c2c45f07eb38b317de92d.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_82aa41510bbe55ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_37ea551f6cc94aef = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e081d04dcbf55f5dcf8e1b1() {
  return __cxx_static_address_0e081d04dcbf55f5dcf8e1b1.reference || (__cxx_static_address_0e081d04dcbf55f5dcf8e1b1.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_37ea551f6cc94aef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_1f380d32fe8c494c = ((u32(((u32(27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e016e37194a9b1b8329bf7e() {
  return __cxx_static_address_5e016e37194a9b1b8329bf7e.reference || (__cxx_static_address_5e016e37194a9b1b8329bf7e.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_1f380d32fe8c494c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_39de6d7b2db686d0 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92640091678c3b4243ae52eb() {
  return __cxx_static_address_92640091678c3b4243ae52eb.reference || (__cxx_static_address_92640091678c3b4243ae52eb.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_39de6d7b2db686d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_848fb02020213c3d = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8691ff47b1bed7869798c2d1() {
  return __cxx_static_address_8691ff47b1bed7869798c2d1.reference || (__cxx_static_address_8691ff47b1bed7869798c2d1.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_848fb02020213c3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_16dfb02ccdb9a4a1 = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00ebd28dd39b93a1acc88f07() {
  return __cxx_static_address_00ebd28dd39b93a1acc88f07.reference || (__cxx_static_address_00ebd28dd39b93a1acc88f07.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_16dfb02ccdb9a4a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_0d827f217fc36fad = ((u32(((u32(31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d6c737a9600d308451f8547() {
  return __cxx_static_address_0d6c737a9600d308451f8547.reference || (__cxx_static_address_0d6c737a9600d308451f8547.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_0d827f217fc36fad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_2f328b5708f38194 = ((u32(((u32(32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b104d02f073cc610f3d8ac9() {
  return __cxx_static_address_1b104d02f073cc610f3d8ac9.reference || (__cxx_static_address_1b104d02f073cc610f3d8ac9.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_2f328b5708f38194; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_2bc8d476e2bd83da = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8acfc04a65cb48d8aeb03f8e() {
  return __cxx_static_address_8acfc04a65cb48d8aeb03f8e.reference || (__cxx_static_address_8acfc04a65cb48d8aeb03f8e.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_2bc8d476e2bd83da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_b082f639aa35e8ac = ((u32(((u32(37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebf23661a881ff690ccf115c() {
  return __cxx_static_address_ebf23661a881ff690ccf115c.reference || (__cxx_static_address_ebf23661a881ff690ccf115c.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_b082f639aa35e8ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_6557630b46efbcfd = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f4cf7e2a845cddec7e71478() {
  return __cxx_static_address_5f4cf7e2a845cddec7e71478.reference || (__cxx_static_address_5f4cf7e2a845cddec7e71478.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_6557630b46efbcfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_2af6fbb5424e98bb = ((u32(((u32(41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75833ea12d981101c435d878() {
  return __cxx_static_address_75833ea12d981101c435d878.reference || (__cxx_static_address_75833ea12d981101c435d878.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_2af6fbb5424e98bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_5766f474c9145cc1 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3306ff8c4f52e9ab55bc5a5a() {
  return __cxx_static_address_3306ff8c4f52e9ab55bc5a5a.reference || (__cxx_static_address_3306ff8c4f52e9ab55bc5a5a.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_5766f474c9145cc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_4c054204c88271a2 = ((u32(((u32(44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_026e4c46e65e2a24b6f4348f() {
  return __cxx_static_address_026e4c46e65e2a24b6f4348f.reference || (__cxx_static_address_026e4c46e65e2a24b6f4348f.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_4c054204c88271a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_5c4e394086bd8453 = ((u32(((u32(45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7410d22d207edbe49dce573() {
  return __cxx_static_address_f7410d22d207edbe49dce573.reference || (__cxx_static_address_f7410d22d207edbe49dce573.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_5c4e394086bd8453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_9898288140ecad4f = ((u32(((u32(46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9d3b43e7d0bb858aebeb029() {
  return __cxx_static_address_d9d3b43e7d0bb858aebeb029.reference || (__cxx_static_address_d9d3b43e7d0bb858aebeb029.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_9898288140ecad4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_efcfc46e09103a67 = ((u32(((u32(47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9e7f70287e91a36ced0dc16() {
  return __cxx_static_address_b9e7f70287e91a36ced0dc16.reference || (__cxx_static_address_b9e7f70287e91a36ced0dc16.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_efcfc46e09103a67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_98df2f4d68d299e0 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beb83de87861a33eb5a66c41() {
  return __cxx_static_address_beb83de87861a33eb5a66c41.reference || (__cxx_static_address_beb83de87861a33eb5a66c41.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_98df2f4d68d299e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_afecca580a2f56ac = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba03c190916a86abb1976482() {
  return __cxx_static_address_ba03c190916a86abb1976482.reference || (__cxx_static_address_ba03c190916a86abb1976482.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_afecca580a2f56ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_3d317cfe400e8a84 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0124e5932db6ad517d250b0e() {
  return __cxx_static_address_0124e5932db6ad517d250b0e.reference || (__cxx_static_address_0124e5932db6ad517d250b0e.reference = {
    __cReference: true,
    get value() { return COLA____header_global_3d317cfe400e8a84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_430d0baa0747fc17 = ((u32(((u32(52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_690607a9944f0c3ac8d9ec61() {
  return __cxx_static_address_690607a9944f0c3ac8d9ec61.reference || (__cxx_static_address_690607a9944f0c3ac8d9ec61.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_430d0baa0747fc17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_b77009f011fd3ce9 = ((u32(((u32(53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c2d94ec172f906fa203179e() {
  return __cxx_static_address_0c2d94ec172f906fa203179e.reference || (__cxx_static_address_0c2d94ec172f906fa203179e.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_b77009f011fd3ce9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_399a640b906f95e4 = ((u32(((u32(54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36c1cfc4ec75e2a3a4698cbe() {
  return __cxx_static_address_36c1cfc4ec75e2a3a4698cbe.reference || (__cxx_static_address_36c1cfc4ec75e2a3a4698cbe.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_399a640b906f95e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_ac09746d138693a7 = ((u32(((u32(55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f062541309e1b7f278009f5() {
  return __cxx_static_address_1f062541309e1b7f278009f5.reference || (__cxx_static_address_1f062541309e1b7f278009f5.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_ac09746d138693a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_b9e8e48f8c20374f = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4983d3e36bfc06e8874fee54() {
  return __cxx_static_address_4983d3e36bfc06e8874fee54.reference || (__cxx_static_address_4983d3e36bfc06e8874fee54.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_b9e8e48f8c20374f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_ad1db14da25e7c17 = ((u32(((u32(57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19cf7001aa51e38eafcc041d() {
  return __cxx_static_address_19cf7001aa51e38eafcc041d.reference || (__cxx_static_address_19cf7001aa51e38eafcc041d.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_ad1db14da25e7c17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_177479f787c77d4e = ((u32(((u32(59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c953e13bf8dbcf105f1c6c06() {
  return __cxx_static_address_c953e13bf8dbcf105f1c6c06.reference || (__cxx_static_address_c953e13bf8dbcf105f1c6c06.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_177479f787c77d4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_13a625f04a9bbf4f = ((u32(((u32(60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0b403de1e8032c7f2358512() {
  return __cxx_static_address_b0b403de1e8032c7f2358512.reference || (__cxx_static_address_b0b403de1e8032c7f2358512.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_13a625f04a9bbf4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_65726a1c873182b0 = ((u32(((u32(61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01ce42ce1e6df3f6ca1dfd7() {
  return __cxx_static_address_b01ce42ce1e6df3f6ca1dfd7.reference || (__cxx_static_address_b01ce42ce1e6df3f6ca1dfd7.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_65726a1c873182b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_7ff26ae0f60dffb5 = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b700b46f271756449c2df73a() {
  return __cxx_static_address_b700b46f271756449c2df73a.reference || (__cxx_static_address_b700b46f271756449c2df73a.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_7ff26ae0f60dffb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_8bd47a9bd510a81d = ((u32(((u32(78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63ee4095d20500576f9013df() {
  return __cxx_static_address_63ee4095d20500576f9013df.reference || (__cxx_static_address_63ee4095d20500576f9013df.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_8bd47a9bd510a81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_0c99cd4b999164aa = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98cfa5a2cd5c176500cc6969() {
  return __cxx_static_address_98cfa5a2cd5c176500cc6969.reference || (__cxx_static_address_98cfa5a2cd5c176500cc6969.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_0c99cd4b999164aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_9958feaccdffa524 = ((u32(((u32(80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f634b9cadce4f9518806c2ca() {
  return __cxx_static_address_f634b9cadce4f9518806c2ca.reference || (__cxx_static_address_f634b9cadce4f9518806c2ca.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_9958feaccdffa524; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_56ded694b0bea713 = ((u32(((u32(84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69897d401a64f155638a10df() {
  return __cxx_static_address_69897d401a64f155638a10df.reference || (__cxx_static_address_69897d401a64f155638a10df.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_56ded694b0bea713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_a9e20462f9405df0 = ((u32(((u32(89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62debc17dc81614f5151a4a8() {
  return __cxx_static_address_62debc17dc81614f5151a4a8.reference || (__cxx_static_address_62debc17dc81614f5151a4a8.reference = {
    __cReference: true,
    get value() { return LA____header_global_a9e20462f9405df0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_009395ac21666490 = ((u32(((u32(100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fab1819183dd666deb61baf() {
  return __cxx_static_address_5fab1819183dd666deb61baf.reference || (__cxx_static_address_5fab1819183dd666deb61baf.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_009395ac21666490; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_b007dd746f1c9a37 = ((u32(((u32(120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_645aafea8f6e9568b8528590() {
  return __cxx_static_address_645aafea8f6e9568b8528590.reference || (__cxx_static_address_645aafea8f6e9568b8528590.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_b007dd746f1c9a37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_706b80ea8e643ea4 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbcb720d87bdbc837177ba2a() {
  return __cxx_static_address_fbcb720d87bdbc837177ba2a.reference || (__cxx_static_address_fbcb720d87bdbc837177ba2a.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_706b80ea8e643ea4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_656d750bc82c95a6 = ((u32(((u32(122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98dbf0c38026117f53c1b755() {
  return __cxx_static_address_98dbf0c38026117f53c1b755.reference || (__cxx_static_address_98dbf0c38026117f53c1b755.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_656d750bc82c95a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_2b4b099143bba249 = ((u32(((u32(123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45eb25a81804098b09098876() {
  return __cxx_static_address_45eb25a81804098b09098876.reference || (__cxx_static_address_45eb25a81804098b09098876.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_2b4b099143bba249; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_29601d31de39213f = ((u32(((u32(124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c64bd2bbaf09ac261347b931() {
  return __cxx_static_address_c64bd2bbaf09ac261347b931.reference || (__cxx_static_address_c64bd2bbaf09ac261347b931.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_29601d31de39213f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_42d81a0158ed886f = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfcee5c8c1b3c13001404254() {
  return __cxx_static_address_cfcee5c8c1b3c13001404254.reference || (__cxx_static_address_cfcee5c8c1b3c13001404254.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_42d81a0158ed886f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_ec9d48812d73265e = ((u32(((u32(130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48a7ef1ab47cec5f15f5f42b() {
  return __cxx_static_address_48a7ef1ab47cec5f15f5f42b.reference || (__cxx_static_address_48a7ef1ab47cec5f15f5f42b.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_ec9d48812d73265e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_db52ff5bee02bca5 = ((u32(((u32(132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_023c08f71d1b340e80e00b92() {
  return __cxx_static_address_023c08f71d1b340e80e00b92.reference || (__cxx_static_address_023c08f71d1b340e80e00b92.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_db52ff5bee02bca5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_6056018352840e1c = ((u32(((u32(134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f3581393ce03209bed0328f() {
  return __cxx_static_address_6f3581393ce03209bed0328f.reference || (__cxx_static_address_6f3581393ce03209bed0328f.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_6056018352840e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_fc88c0049fb82abb = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eebcd40c1c5590e461733902() {
  return __cxx_static_address_eebcd40c1c5590e461733902.reference || (__cxx_static_address_eebcd40c1c5590e461733902.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_fc88c0049fb82abb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_d277fa71dd5616ed = ((u32(((u32(138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e2e2b0c773750a68c87f308() {
  return __cxx_static_address_6e2e2b0c773750a68c87f308.reference || (__cxx_static_address_6e2e2b0c773750a68c87f308.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_d277fa71dd5616ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_990350619611c617 = ((u32(((u32(140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d91b284097dcc7d33015c38d() {
  return __cxx_static_address_d91b284097dcc7d33015c38d.reference || (__cxx_static_address_d91b284097dcc7d33015c38d.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_990350619611c617; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_df6c5b279156f7b2 = ((u32(((u32(142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46c3ce4e16e6240ef98294be() {
  return __cxx_static_address_46c3ce4e16e6240ef98294be.reference || (__cxx_static_address_46c3ce4e16e6240ef98294be.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_df6c5b279156f7b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_d28a77a441e355c8 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_734c711a909095a890fb93b0() {
  return __cxx_static_address_734c711a909095a890fb93b0.reference || (__cxx_static_address_734c711a909095a890fb93b0.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_d28a77a441e355c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_f15e30e23570f651 = ((u32(((u32(150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4025b6912f303bf25be15908() {
  return __cxx_static_address_4025b6912f303bf25be15908.reference || (__cxx_static_address_4025b6912f303bf25be15908.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_f15e30e23570f651; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_c0e1365f17f50462 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6401e844b38a4b6bffa75351() {
  return __cxx_static_address_6401e844b38a4b6bffa75351.reference || (__cxx_static_address_6401e844b38a4b6bffa75351.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_c0e1365f17f50462; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_5c00961b2e8e3fed = ((u32(((u32(152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d0661d26e966a851be7167a() {
  return __cxx_static_address_2d0661d26e966a851be7167a.reference || (__cxx_static_address_2d0661d26e966a851be7167a.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_5c00961b2e8e3fed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_24ec04e87ff723cb = ((u32(((u32(153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f286ce342ce9453c3dc6850() {
  return __cxx_static_address_5f286ce342ce9453c3dc6850.reference || (__cxx_static_address_5f286ce342ce9453c3dc6850.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_24ec04e87ff723cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_eaf917553bcb4208 = ((u32(((u32(154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6cfed772f18a529cf8f162d() {
  return __cxx_static_address_e6cfed772f18a529cf8f162d.reference || (__cxx_static_address_e6cfed772f18a529cf8f162d.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_eaf917553bcb4208; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_3f6ddccf22601479 = ((u32(((u32(155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01d08d5180de6dcb1c1e6d70() {
  return __cxx_static_address_01d08d5180de6dcb1c1e6d70.reference || (__cxx_static_address_01d08d5180de6dcb1c1e6d70.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_3f6ddccf22601479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_530966403ee4661b = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8346f93f4139e2603b295fa2() {
  return __cxx_static_address_8346f93f4139e2603b295fa2.reference || (__cxx_static_address_8346f93f4139e2603b295fa2.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_530966403ee4661b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_68c8d9d5d75643e4 = ((u32(((u32(157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c14a23a45e749726dd8e1675() {
  return __cxx_static_address_c14a23a45e749726dd8e1675.reference || (__cxx_static_address_c14a23a45e749726dd8e1675.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_68c8d9d5d75643e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_fd9a909835a6382f = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_241b0323ef4ac1559e3d8138() {
  return __cxx_static_address_241b0323ef4ac1559e3d8138.reference || (__cxx_static_address_241b0323ef4ac1559e3d8138.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_fd9a909835a6382f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_5975083caf98cc54 = ((u32(((u32(159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b81a09279ba1f7e65eab8b1() {
  return __cxx_static_address_0b81a09279ba1f7e65eab8b1.reference || (__cxx_static_address_0b81a09279ba1f7e65eab8b1.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_5975083caf98cc54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_93a2d8a7fa78919a = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99498d0c0d20460c9b40d483() {
  return __cxx_static_address_99498d0c0d20460c9b40d483.reference || (__cxx_static_address_99498d0c0d20460c9b40d483.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_93a2d8a7fa78919a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_f9bcbd0f37170a5a = ((u32(((u32(162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1729fccdd830a99cd6d3f15() {
  return __cxx_static_address_d1729fccdd830a99cd6d3f15.reference || (__cxx_static_address_d1729fccdd830a99cd6d3f15.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_f9bcbd0f37170a5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_bc12e0ea5b147464 = ((u32(((u32(164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e5e46606ba0dda2631d1b78() {
  return __cxx_static_address_0e5e46606ba0dda2631d1b78.reference || (__cxx_static_address_0e5e46606ba0dda2631d1b78.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_bc12e0ea5b147464; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_7903bd348c93daad = ((u32(((u32(166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e61f1703052c270df249046() {
  return __cxx_static_address_3e61f1703052c270df249046.reference || (__cxx_static_address_3e61f1703052c270df249046.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_7903bd348c93daad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_d1047a3f2d38e616 = ((u32(((u32(168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d60ff6ef33d387b4b7b9ef2d() {
  return __cxx_static_address_d60ff6ef33d387b4b7b9ef2d.reference || (__cxx_static_address_d60ff6ef33d387b4b7b9ef2d.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_d1047a3f2d38e616; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_b37ec1d9ff7205a8 = ((u32(((u32(170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b3f42a0961afe6f1964b77a() {
  return __cxx_static_address_2b3f42a0961afe6f1964b77a.reference || (__cxx_static_address_2b3f42a0961afe6f1964b77a.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_b37ec1d9ff7205a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_32e5c4892eb4f65f = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b513bd6151857a60e6524bb() {
  return __cxx_static_address_4b513bd6151857a60e6524bb.reference || (__cxx_static_address_4b513bd6151857a60e6524bb.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_32e5c4892eb4f65f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_f88781b093ff5dd4 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_670c12cfaa091db8f28e7e29() {
  return __cxx_static_address_670c12cfaa091db8f28e7e29.reference || (__cxx_static_address_670c12cfaa091db8f28e7e29.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_f88781b093ff5dd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_2343871fd41b406a = ((u32(((u32(255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b24a9709d3253cc76210a110() {
  return __cxx_static_address_b24a9709d3253cc76210a110.reference || (__cxx_static_address_b24a9709d3253cc76210a110.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_2343871fd41b406a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_5098a0d05b96a389 = ((u32(((u32(263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_330294d110cb07a0adf0fe11() {
  return __cxx_static_address_330294d110cb07a0adf0fe11.reference || (__cxx_static_address_330294d110cb07a0adf0fe11.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_5098a0d05b96a389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_cb5e1d789dc2aae7 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebfa0e58d7226d0a40d9714c() {
  return __cxx_static_address_ebfa0e58d7226d0a40d9714c.reference || (__cxx_static_address_ebfa0e58d7226d0a40d9714c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_cb5e1d789dc2aae7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_dbb22b8002563d15 = ((u32(((u32(265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3032026c052709a6c847e19() {
  return __cxx_static_address_b3032026c052709a6c847e19.reference || (__cxx_static_address_b3032026c052709a6c847e19.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_dbb22b8002563d15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_646fe53bc8dde704 = ((u32(((u32(266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8252b71ae7670d216793d368() {
  return __cxx_static_address_8252b71ae7670d216793d368.reference || (__cxx_static_address_8252b71ae7670d216793d368.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_646fe53bc8dde704; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_5338d992b012b08c = ((u32(((u32(267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbfaf9ddb721ec6c6e6ab4eb() {
  return __cxx_static_address_cbfaf9ddb721ec6c6e6ab4eb.reference || (__cxx_static_address_cbfaf9ddb721ec6c6e6ab4eb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_5338d992b012b08c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_69f7a39f24c4a3d1 = ((u32(((u32(268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_745856adf6931ea0e255ba02() {
  return __cxx_static_address_745856adf6931ea0e255ba02.reference || (__cxx_static_address_745856adf6931ea0e255ba02.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_69f7a39f24c4a3d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_7ebaa0b3a32de6da = ((u32(((u32(269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c94ad694b26dd1b14b5554eb() {
  return __cxx_static_address_c94ad694b26dd1b14b5554eb.reference || (__cxx_static_address_c94ad694b26dd1b14b5554eb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_7ebaa0b3a32de6da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_6d950553ae93c383 = ((u32(((u32(270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_672c7848ef35e5fc7f69f718() {
  return __cxx_static_address_672c7848ef35e5fc7f69f718.reference || (__cxx_static_address_672c7848ef35e5fc7f69f718.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_6d950553ae93c383; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_ccb47b5fbc8b49e7 = ((u32(((u32(271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e144a32ea341a5b207769c5() {
  return __cxx_static_address_8e144a32ea341a5b207769c5.reference || (__cxx_static_address_8e144a32ea341a5b207769c5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_ccb47b5fbc8b49e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_84454de8d106c1e9 = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c998ea3f36e0fb892f7ac99() {
  return __cxx_static_address_6c998ea3f36e0fb892f7ac99.reference || (__cxx_static_address_6c998ea3f36e0fb892f7ac99.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_84454de8d106c1e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_fa18990593a5fd6f = ((u32(((u32(273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caf78a261b2cca0ca8345555() {
  return __cxx_static_address_caf78a261b2cca0ca8345555.reference || (__cxx_static_address_caf78a261b2cca0ca8345555.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_fa18990593a5fd6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_e5ccfae7ebbe8c70 = ((u32(((u32(274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f004f42e88965f4bbb7634b() {
  return __cxx_static_address_6f004f42e88965f4bbb7634b.reference || (__cxx_static_address_6f004f42e88965f4bbb7634b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_e5ccfae7ebbe8c70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_b12aa9870cc39352 = ((u32(((u32(275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aba5d1b7fd4bd80fa03f04ae() {
  return __cxx_static_address_aba5d1b7fd4bd80fa03f04ae.reference || (__cxx_static_address_aba5d1b7fd4bd80fa03f04ae.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_b12aa9870cc39352; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_d9bcb22087faa243 = ((u32(((u32(285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cd65ea347d461d73a19b5be() {
  return __cxx_static_address_8cd65ea347d461d73a19b5be.reference || (__cxx_static_address_8cd65ea347d461d73a19b5be.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_d9bcb22087faa243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_1fd3c7ebee10976b = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07323c555500e1e61e63f0b4() {
  return __cxx_static_address_07323c555500e1e61e63f0b4.reference || (__cxx_static_address_07323c555500e1e61e63f0b4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_1fd3c7ebee10976b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_3dfaced6525cbe4e = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39c6286a86fcee803e424482() {
  return __cxx_static_address_39c6286a86fcee803e424482.reference || (__cxx_static_address_39c6286a86fcee803e424482.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_3dfaced6525cbe4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_ced7f503aad406d1 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08b77279718695428eb8bf1f() {
  return __cxx_static_address_08b77279718695428eb8bf1f.reference || (__cxx_static_address_08b77279718695428eb8bf1f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_ced7f503aad406d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_6c454f351dcdf876 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28bd6f33c0e1d5cab5e9c170() {
  return __cxx_static_address_28bd6f33c0e1d5cab5e9c170.reference || (__cxx_static_address_28bd6f33c0e1d5cab5e9c170.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_6c454f351dcdf876; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_1c8aa4968c3918fd = ((u32(((u32(305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53c5d8e350bf753f0821231f() {
  return __cxx_static_address_53c5d8e350bf753f0821231f.reference || (__cxx_static_address_53c5d8e350bf753f0821231f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_1c8aa4968c3918fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_2eef4a88b0dd40c9 = ((u32(((u32(306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e11530b029a469df8cf108c() {
  return __cxx_static_address_1e11530b029a469df8cf108c.reference || (__cxx_static_address_1e11530b029a469df8cf108c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_2eef4a88b0dd40c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_10b5367f5606f88b = ((u32(((u32(307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af6bee56424590e0d52154bb() {
  return __cxx_static_address_af6bee56424590e0d52154bb.reference || (__cxx_static_address_af6bee56424590e0d52154bb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_10b5367f5606f88b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_7449f2160010b7da = ((u32(((u32(336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86cf41c456b6b7af9f561d50() {
  return __cxx_static_address_86cf41c456b6b7af9f561d50.reference || (__cxx_static_address_86cf41c456b6b7af9f561d50.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_7449f2160010b7da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_f916413a993eab0c = ((u32(((u32(341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04ff576622677eb010fc7c51() {
  return __cxx_static_address_04ff576622677eb010fc7c51.reference || (__cxx_static_address_04ff576622677eb010fc7c51.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_f916413a993eab0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_7e64470c21144fb3 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7027d6b2b79e15a2ec672424() {
  return __cxx_static_address_7027d6b2b79e15a2ec672424.reference || (__cxx_static_address_7027d6b2b79e15a2ec672424.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_7e64470c21144fb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_dec3ca5d294bfe3b = ((u32(((u32(343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_403cac96bf4bd31c3edf44a0() {
  return __cxx_static_address_403cac96bf4bd31c3edf44a0.reference || (__cxx_static_address_403cac96bf4bd31c3edf44a0.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_dec3ca5d294bfe3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_247993ce7cbfdc54 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_080933c9c4380adc3ddc6e34() {
  return __cxx_static_address_080933c9c4380adc3ddc6e34.reference || (__cxx_static_address_080933c9c4380adc3ddc6e34.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_247993ce7cbfdc54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_af2a70219a59650c = ((u32(((u32(357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_925cfdd043ee656e47db7681() {
  return __cxx_static_address_925cfdd043ee656e47db7681.reference || (__cxx_static_address_925cfdd043ee656e47db7681.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_af2a70219a59650c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_bd61c49b4585e8f9 = ((u32(((u32(360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b61ce819e8fbe3fad7cb11c() {
  return __cxx_static_address_5b61ce819e8fbe3fad7cb11c.reference || (__cxx_static_address_5b61ce819e8fbe3fad7cb11c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_bd61c49b4585e8f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_ca363c1b5eaa3fc1 = ((u32(((u32(361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9db7172bca0335c11f578fe() {
  return __cxx_static_address_d9db7172bca0335c11f578fe.reference || (__cxx_static_address_d9db7172bca0335c11f578fe.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_ca363c1b5eaa3fc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_c47ca57d1bf5cc16 = ((u32(((u32(362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_543c8773fd31f156583d5315() {
  return __cxx_static_address_543c8773fd31f156583d5315.reference || (__cxx_static_address_543c8773fd31f156583d5315.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_c47ca57d1bf5cc16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_8ff610a6402cb406 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9365827dbd93c356161d726b() {
  return __cxx_static_address_9365827dbd93c356161d726b.reference || (__cxx_static_address_9365827dbd93c356161d726b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_8ff610a6402cb406; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_6828504e557f2e20 = ((u32(((u32(387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_686c1ef38a9cbdd4ddb34302() {
  return __cxx_static_address_686c1ef38a9cbdd4ddb34302.reference || (__cxx_static_address_686c1ef38a9cbdd4ddb34302.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_6828504e557f2e20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_b2c482d5789f446f = ((u32(((u32(391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e51db481db12c1931bd7b5a6() {
  return __cxx_static_address_e51db481db12c1931bd7b5a6.reference || (__cxx_static_address_e51db481db12c1931bd7b5a6.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_b2c482d5789f446f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_bef1c7587484d9e4 = ((u32(((u32(395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a9548299311f7acde0aa795() {
  return __cxx_static_address_5a9548299311f7acde0aa795.reference || (__cxx_static_address_5a9548299311f7acde0aa795.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_bef1c7587484d9e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_8b707a4509992b4e = ((u32(((u32(407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e08784d4b146e3bb819dc57d() {
  return __cxx_static_address_e08784d4b146e3bb819dc57d.reference || (__cxx_static_address_e08784d4b146e3bb819dc57d.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_8b707a4509992b4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_3fdba8fa076c6c23 = ((u32(((u32(411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a430791430099cb9e38a7078() {
  return __cxx_static_address_a430791430099cb9e38a7078.reference || (__cxx_static_address_a430791430099cb9e38a7078.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_3fdba8fa076c6c23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_946d0e6e8eb26e09 = ((u32(((u32(412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f302f98849ef3899fd57b812() {
  return __cxx_static_address_f302f98849ef3899fd57b812.reference || (__cxx_static_address_f302f98849ef3899fd57b812.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_946d0e6e8eb26e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_72a436302af4bc83 = ((u32(((u32(416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_650a909b3a8ff4de2cb0cd05() {
  return __cxx_static_address_650a909b3a8ff4de2cb0cd05.reference || (__cxx_static_address_650a909b3a8ff4de2cb0cd05.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_72a436302af4bc83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_623b9ca286babba7 = ((u32(((u32(447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f6e92b500c404af1c1ad817() {
  return __cxx_static_address_5f6e92b500c404af1c1ad817.reference || (__cxx_static_address_5f6e92b500c404af1c1ad817.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_623b9ca286babba7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_dabf25f1acff894a = ((u32(((u32(448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_855e750b22fee112e5f047e0() {
  return __cxx_static_address_855e750b22fee112e5f047e0.reference || (__cxx_static_address_855e750b22fee112e5f047e0.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_dabf25f1acff894a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_2c07aa0630d1ec70 = ((u32(((u32(449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a6ad5cabaad48e700514a86() {
  return __cxx_static_address_0a6ad5cabaad48e700514a86.reference || (__cxx_static_address_0a6ad5cabaad48e700514a86.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_2c07aa0630d1ec70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_1f27e96ab94b3895 = ((u32(((u32(499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a92a069e7a8ee0582a92a76() {
  return __cxx_static_address_7a92a069e7a8ee0582a92a76.reference || (__cxx_static_address_7a92a069e7a8ee0582a92a76.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_1f27e96ab94b3895; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_fed0aa2f09890b5d = ((u32(((u32(502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d77d4e45d475f245a138f397() {
  return __cxx_static_address_d77d4e45d475f245a138f397.reference || (__cxx_static_address_d77d4e45d475f245a138f397.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_fed0aa2f09890b5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_f98fca392ddb0281 = ((u32(((u32(503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05d1a7e7c9339f4abae9306f() {
  return __cxx_static_address_05d1a7e7c9339f4abae9306f.reference || (__cxx_static_address_05d1a7e7c9339f4abae9306f.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_f98fca392ddb0281; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_2ce17552eea87851 = ((u32(((u32(504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c28d550f6963d40e05e6a9f9() {
  return __cxx_static_address_c28d550f6963d40e05e6a9f9.reference || (__cxx_static_address_c28d550f6963d40e05e6a9f9.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_2ce17552eea87851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_ce3265848c6bbc06 = ((u32(((u32(510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84ce83ceb8356a4f4457bfd5() {
  return __cxx_static_address_84ce83ceb8356a4f4457bfd5.reference || (__cxx_static_address_84ce83ceb8356a4f4457bfd5.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_ce3265848c6bbc06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_087c5f4bbac7ec74 = ((u32(((u32(514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e2bb793a130bd762154022d() {
  return __cxx_static_address_3e2bb793a130bd762154022d.reference || (__cxx_static_address_3e2bb793a130bd762154022d.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_087c5f4bbac7ec74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_10e6bf2ac7c1edb5 = ((u32(((u32(516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e56082aada619e87333a2cd8() {
  return __cxx_static_address_e56082aada619e87333a2cd8.reference || (__cxx_static_address_e56082aada619e87333a2cd8.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_10e6bf2ac7c1edb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_c5b67501eb0f9b80 = ((u32(((u32(517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_165d9db24532e76c953d7990() {
  return __cxx_static_address_165d9db24532e76c953d7990.reference || (__cxx_static_address_165d9db24532e76c953d7990.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_c5b67501eb0f9b80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_b9f7a720a1ee57f3 = ((u32(((u32(546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf7f7f798374a5e52ff015b() {
  return __cxx_static_address_faf7f7f798374a5e52ff015b.reference || (__cxx_static_address_faf7f7f798374a5e52ff015b.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_b9f7a720a1ee57f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_234d69cd13000784 = ((u32(((u32(547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_423ddae77d6bdf44f919901d() {
  return __cxx_static_address_423ddae77d6bdf44f919901d.reference || (__cxx_static_address_423ddae77d6bdf44f919901d.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_234d69cd13000784; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_247bd6397166f181 = ((u32(((u32(548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44a4973b0849cfd02e978e18() {
  return __cxx_static_address_44a4973b0849cfd02e978e18.reference || (__cxx_static_address_44a4973b0849cfd02e978e18.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_247bd6397166f181; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_a46ee9e8621735c0 = ((u32(((u32(549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2db854946ea2b2dd46e30723() {
  return __cxx_static_address_2db854946ea2b2dd46e30723.reference || (__cxx_static_address_2db854946ea2b2dd46e30723.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_a46ee9e8621735c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_ed8e7388813df937 = ((u32(((u32(550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb4bea78998b781f1818f022() {
  return __cxx_static_address_fb4bea78998b781f1818f022.reference || (__cxx_static_address_fb4bea78998b781f1818f022.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_ed8e7388813df937; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_a0ff54970b62cea8 = ((u32(((u32(551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1107e31d440c569ffe7d534() {
  return __cxx_static_address_d1107e31d440c569ffe7d534.reference || (__cxx_static_address_d1107e31d440c569ffe7d534.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_a0ff54970b62cea8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_f1013f861f758f8f = ((u32(((u32(554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_435800360328595c5fdd6b3a() {
  return __cxx_static_address_435800360328595c5fdd6b3a.reference || (__cxx_static_address_435800360328595c5fdd6b3a.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_f1013f861f758f8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_1156ea907866711b = ((u32(((u32(556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae51390256178eae72467235() {
  return __cxx_static_address_ae51390256178eae72467235.reference || (__cxx_static_address_ae51390256178eae72467235.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_1156ea907866711b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_ad0a9f39dc6c9151 = ((u32(((u32(557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4de7e864311a5754956a9ed() {
  return __cxx_static_address_a4de7e864311a5754956a9ed.reference || (__cxx_static_address_a4de7e864311a5754956a9ed.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_ad0a9f39dc6c9151; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_9d0546666b8424ea = ((u32(((u32(559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4629229a5be7b43947431c8b() {
  return __cxx_static_address_4629229a5be7b43947431c8b.reference || (__cxx_static_address_4629229a5be7b43947431c8b.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_9d0546666b8424ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_4dffc08a4651ba0e = ((u32(((u32(560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b83257188a1161b916658cc() {
  return __cxx_static_address_5b83257188a1161b916658cc.reference || (__cxx_static_address_5b83257188a1161b916658cc.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_4dffc08a4651ba0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_344f50ab49afce94 = ((u32(((u32(563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86985b607297a716be40c15e() {
  return __cxx_static_address_86985b607297a716be40c15e.reference || (__cxx_static_address_86985b607297a716be40c15e.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_344f50ab49afce94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_90b670e369b5278a = ((u32(((u32(567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a368be0299fd9dfaaa3035fe() {
  return __cxx_static_address_a368be0299fd9dfaaa3035fe.reference || (__cxx_static_address_a368be0299fd9dfaaa3035fe.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_90b670e369b5278a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_5a9abaf6cd6daec7 = ((u32(((u32(568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_665d61c1826dbf52e96f93b2() {
  return __cxx_static_address_665d61c1826dbf52e96f93b2.reference || (__cxx_static_address_665d61c1826dbf52e96f93b2.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_5a9abaf6cd6daec7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_05b5f2396c1bb305 = ((u32(((u32(569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7332e43f866341650596f07b() {
  return __cxx_static_address_7332e43f866341650596f07b.reference || (__cxx_static_address_7332e43f866341650596f07b.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_05b5f2396c1bb305; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_9936c1d242625940 = ((u32(((u32(571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_770c5d9fb6c9c531f32f592e() {
  return __cxx_static_address_770c5d9fb6c9c531f32f592e.reference || (__cxx_static_address_770c5d9fb6c9c531f32f592e.reference = {
    __cReference: true,
    get value() { return STALL____header_global_9936c1d242625940; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_8747d920be2cdabf = ((u32(((u32(573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83b0e90ef28d9905cf63ebb0() {
  return __cxx_static_address_83b0e90ef28d9905cf63ebb0.reference || (__cxx_static_address_83b0e90ef28d9905cf63ebb0.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_8747d920be2cdabf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_d7be92b1464e12a7 = ((u32(((u32(577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8cf0ae03f3a743eddb3e718() {
  return __cxx_static_address_a8cf0ae03f3a743eddb3e718.reference || (__cxx_static_address_a8cf0ae03f3a743eddb3e718.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_d7be92b1464e12a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_bda5dfb4f7cbad65 = ((u32(((u32(578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3390a0c353af1c20eb7e078b() {
  return __cxx_static_address_3390a0c353af1c20eb7e078b.reference || (__cxx_static_address_3390a0c353af1c20eb7e078b.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_bda5dfb4f7cbad65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_dd290b5f9009df38 = ((u32(((u32(579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36e3cc3d6151e6eb1cebaf41() {
  return __cxx_static_address_36e3cc3d6151e6eb1cebaf41.reference || (__cxx_static_address_36e3cc3d6151e6eb1cebaf41.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_dd290b5f9009df38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_18093146e0e600da = ((u32(((u32(580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c984e021ad80fdfab9e66fdf() {
  return __cxx_static_address_c984e021ad80fdfab9e66fdf.reference || (__cxx_static_address_c984e021ad80fdfab9e66fdf.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_18093146e0e600da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_9a167176f1a7fdc4 = ((u32(((u32(595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4089db3123af925862eaf95a() {
  return __cxx_static_address_4089db3123af925862eaf95a.reference || (__cxx_static_address_4089db3123af925862eaf95a.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_9a167176f1a7fdc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_9ec606d0a38d8bec = ((u32(((u32(596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_729bf60f92b511b0a683703f() {
  return __cxx_static_address_729bf60f92b511b0a683703f.reference || (__cxx_static_address_729bf60f92b511b0a683703f.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_9ec606d0a38d8bec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_e76a6a97467180d2 = ((u32(((u32(602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_004c4f45af169f3fd8154588() {
  return __cxx_static_address_004c4f45af169f3fd8154588.reference || (__cxx_static_address_004c4f45af169f3fd8154588.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_e76a6a97467180d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_1a6008d9fd0322d5 = ((u32(((u32(603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bad9839f471c5696332948f2() {
  return __cxx_static_address_bad9839f471c5696332948f2.reference || (__cxx_static_address_bad9839f471c5696332948f2.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_1a6008d9fd0322d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_74b04ea8cc255a9f = ((u32(((u32(607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e97e967f90315b1870d941b5() {
  return __cxx_static_address_e97e967f90315b1870d941b5.reference || (__cxx_static_address_e97e967f90315b1870d941b5.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_74b04ea8cc255a9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_528301e2284a9ee1 = ((u32(((u32(609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c461c321382953e1a96c9de() {
  return __cxx_static_address_7c461c321382953e1a96c9de.reference || (__cxx_static_address_7c461c321382953e1a96c9de.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_528301e2284a9ee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_e4bf2d6e8c7101ca = ((u32(((u32(615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54fbd7ac1d33afdd5b402a76() {
  return __cxx_static_address_54fbd7ac1d33afdd5b402a76.reference || (__cxx_static_address_54fbd7ac1d33afdd5b402a76.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_e4bf2d6e8c7101ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_7c2241018b80a04f = ((u32(((u32(616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_931fb87c50feaee6e0d1060c() {
  return __cxx_static_address_931fb87c50feaee6e0d1060c.reference || (__cxx_static_address_931fb87c50feaee6e0d1060c.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_7c2241018b80a04f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_a4ef868eb398ec50 = ((u32(((u32(617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98d97fa746c76cac78e1caa9() {
  return __cxx_static_address_98d97fa746c76cac78e1caa9.reference || (__cxx_static_address_98d97fa746c76cac78e1caa9.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_a4ef868eb398ec50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_bdb74575c8a8a8fb = ((u32(((u32(618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd4115b124a12ae1daa0b3e1() {
  return __cxx_static_address_fd4115b124a12ae1daa0b3e1.reference || (__cxx_static_address_fd4115b124a12ae1daa0b3e1.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_bdb74575c8a8a8fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_e6f54de7db850339 = ((u32(((u32(619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d0409470267637da31231d1() {
  return __cxx_static_address_6d0409470267637da31231d1.reference || (__cxx_static_address_6d0409470267637da31231d1.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_e6f54de7db850339; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_e07c0a231b306e51 = ((u32(((u32(621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b50756913e3e121edf3c0095() {
  return __cxx_static_address_b50756913e3e121edf3c0095.reference || (__cxx_static_address_b50756913e3e121edf3c0095.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_e07c0a231b306e51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_cddd0d583f2ea5a7 = ((u32(((u32(633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_015cfdd1a4e0555688387676() {
  return __cxx_static_address_015cfdd1a4e0555688387676.reference || (__cxx_static_address_015cfdd1a4e0555688387676.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_cddd0d583f2ea5a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_a984e2b675b360db = ((u32(((u32(634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b8559c94598a1f0bd1248cf() {
  return __cxx_static_address_9b8559c94598a1f0bd1248cf.reference || (__cxx_static_address_9b8559c94598a1f0bd1248cf.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_a984e2b675b360db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_855772739aeeeaf7 = ((u32(((u32(640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d5d572cf96901e1dc619072() {
  return __cxx_static_address_5d5d572cf96901e1dc619072.reference || (__cxx_static_address_5d5d572cf96901e1dc619072.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_855772739aeeeaf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_1bc6993b5f5f1df6 = ((u32(((u32(660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39999d0649a0a9bd7962ad63() {
  return __cxx_static_address_39999d0649a0a9bd7962ad63.reference || (__cxx_static_address_39999d0649a0a9bd7962ad63.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_1bc6993b5f5f1df6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_1333fc98d917c0e8 = ((u32(((u32(661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e8a259aa11cfffbd50e91af() {
  return __cxx_static_address_1e8a259aa11cfffbd50e91af.reference || (__cxx_static_address_1e8a259aa11cfffbd50e91af.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_1333fc98d917c0e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_aa81ba85cfd29e61 = ((u32(((u32(662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1349b4d7a427a41453866a42() {
  return __cxx_static_address_1349b4d7a427a41453866a42.reference || (__cxx_static_address_1349b4d7a427a41453866a42.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_aa81ba85cfd29e61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_bb138606ee83dddd = ((u32(((u32(663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18e03c3dbe6d133b378ad318() {
  return __cxx_static_address_18e03c3dbe6d133b378ad318.reference || (__cxx_static_address_18e03c3dbe6d133b378ad318.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_bb138606ee83dddd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_dfd426f9d164dc35 = ((u32(((u32(669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d22cff9475a1152c1f0a108() {
  return __cxx_static_address_6d22cff9475a1152c1f0a108.reference || (__cxx_static_address_6d22cff9475a1152c1f0a108.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_dfd426f9d164dc35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_f5d8849cae783e74 = ((u32(((u32(672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f82b2ea3f11ffdcecf3b08a() {
  return __cxx_static_address_0f82b2ea3f11ffdcecf3b08a.reference || (__cxx_static_address_0f82b2ea3f11ffdcecf3b08a.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_f5d8849cae783e74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_45885b296dbe88de = ((u32(((u32(673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c26a748218e585134b20f89() {
  return __cxx_static_address_7c26a748218e585134b20f89.reference || (__cxx_static_address_7c26a748218e585134b20f89.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_45885b296dbe88de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_52d09573528c8efe = ((u32(((u32(674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b8ae4df0aae96fe2e1a3ed() {
  return __cxx_static_address_02b8ae4df0aae96fe2e1a3ed.reference || (__cxx_static_address_02b8ae4df0aae96fe2e1a3ed.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_52d09573528c8efe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_8366efc72dcc445f = ((u32(((u32(675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e04052cffa3b1c922700d54e() {
  return __cxx_static_address_e04052cffa3b1c922700d54e.reference || (__cxx_static_address_e04052cffa3b1c922700d54e.reference = {
    __cReference: true,
    get value() { return EGG____header_global_8366efc72dcc445f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_a5321a6491c9a129 = ((u32(((u32(678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42c87a4df7d1a9a62b000fd5() {
  return __cxx_static_address_42c87a4df7d1a9a62b000fd5.reference || (__cxx_static_address_42c87a4df7d1a9a62b000fd5.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_a5321a6491c9a129; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_71655d57bfb9abba = ((u32(((u32(680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba45267b497d32d482d40c0e() {
  return __cxx_static_address_ba45267b497d32d482d40c0e.reference || (__cxx_static_address_ba45267b497d32d482d40c0e.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_71655d57bfb9abba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_675472c2ead7434c = ((u32(((u32(685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_266cbe7a59d3f307c6f8d508() {
  return __cxx_static_address_266cbe7a59d3f307c6f8d508.reference || (__cxx_static_address_266cbe7a59d3f307c6f8d508.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_675472c2ead7434c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_bdb68b7a2a976b99 = ((u32(((u32(686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71796fb1e80be446a7017c3e() {
  return __cxx_static_address_71796fb1e80be446a7017c3e.reference || (__cxx_static_address_71796fb1e80be446a7017c3e.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_bdb68b7a2a976b99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_032cf586bc37326d = ((u32(((u32(689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38f5dceb104979b512e0966a() {
  return __cxx_static_address_38f5dceb104979b512e0966a.reference || (__cxx_static_address_38f5dceb104979b512e0966a.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_032cf586bc37326d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_6ee12ef4c8ae6348 = ((u32(((u32(694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_645f22dec5944e58689ae4ad() {
  return __cxx_static_address_645f22dec5944e58689ae4ad.reference || (__cxx_static_address_645f22dec5944e58689ae4ad.reference = {
    __cReference: true,
    get value() { return POT1____header_global_6ee12ef4c8ae6348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_1b00115ee56fcaff = ((u32(((u32(695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60a2b6c406c37693acdb15e4() {
  return __cxx_static_address_60a2b6c406c37693acdb15e4.reference || (__cxx_static_address_60a2b6c406c37693acdb15e4.reference = {
    __cReference: true,
    get value() { return POT2____header_global_1b00115ee56fcaff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_d8204027855fb78b = ((u32(((u32(697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dc0e0635a5bc520b1dfb873() {
  return __cxx_static_address_8dc0e0635a5bc520b1dfb873.reference || (__cxx_static_address_8dc0e0635a5bc520b1dfb873.reference = {
    __cReference: true,
    get value() { return POT3____header_global_d8204027855fb78b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_2aadb330698c32f8 = ((u32(((u32(700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac46897fe4c11a331b14e7d5() {
  return __cxx_static_address_ac46897fe4c11a331b14e7d5.reference || (__cxx_static_address_ac46897fe4c11a331b14e7d5.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_2aadb330698c32f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_2170e45c9743ffcc = ((u32(((u32(701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d4029002835b1e849d716f8() {
  return __cxx_static_address_2d4029002835b1e849d716f8.reference || (__cxx_static_address_2d4029002835b1e849d716f8.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_2170e45c9743ffcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_b3712ee7ec0796f9 = ((u32(((u32(702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19539b180c69e61c8276218d() {
  return __cxx_static_address_19539b180c69e61c8276218d.reference || (__cxx_static_address_19539b180c69e61c8276218d.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_b3712ee7ec0796f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_d9119b06db15a3bb = ((u32(((u32(703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ef06f21b6f1014cdaa25349() {
  return __cxx_static_address_7ef06f21b6f1014cdaa25349.reference || (__cxx_static_address_7ef06f21b6f1014cdaa25349.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_d9119b06db15a3bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_6966133e1a5a2e13 = ((u32(((u32(704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42b9ddc39998fb69e2dd088b() {
  return __cxx_static_address_42b9ddc39998fb69e2dd088b.reference || (__cxx_static_address_42b9ddc39998fb69e2dd088b.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_6966133e1a5a2e13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_564f1934c2f581e4 = ((u32(((u32(705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1148b72f82d630abed1873a7() {
  return __cxx_static_address_1148b72f82d630abed1873a7.reference || (__cxx_static_address_1148b72f82d630abed1873a7.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_564f1934c2f581e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_65018e6e8ddb55a6 = ((u32(((u32(706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fab04d377af4827e0dbafe7() {
  return __cxx_static_address_6fab04d377af4827e0dbafe7.reference || (__cxx_static_address_6fab04d377af4827e0dbafe7.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_65018e6e8ddb55a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_2b2a773fe6922f31 = ((u32(((u32(712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2253fbb78ca1d97c3333372e() {
  return __cxx_static_address_2253fbb78ca1d97c3333372e.reference || (__cxx_static_address_2253fbb78ca1d97c3333372e.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_2b2a773fe6922f31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_948070326490c019 = ((u32(((u32(716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1d2ecae46e77b67314a3ec3() {
  return __cxx_static_address_e1d2ecae46e77b67314a3ec3.reference || (__cxx_static_address_e1d2ecae46e77b67314a3ec3.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_948070326490c019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_074f0f00a0401ce4 = ((u32(((u32(717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b47741c614d13a4c70a4a85() {
  return __cxx_static_address_3b47741c614d13a4c70a4a85.reference || (__cxx_static_address_3b47741c614d13a4c70a4a85.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_074f0f00a0401ce4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_e1199cd58958732f = ((u32(((u32(753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f60501a657589462749676a9() {
  return __cxx_static_address_f60501a657589462749676a9.reference || (__cxx_static_address_f60501a657589462749676a9.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_e1199cd58958732f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_e21b3b54c684419e = ((u32(((u32(762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82b73be4178d8141221ca4c7() {
  return __cxx_static_address_82b73be4178d8141221ca4c7.reference || (__cxx_static_address_82b73be4178d8141221ca4c7.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_e21b3b54c684419e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_15b9b9c661800757 = ((u32(((u32(765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42161a1a8f3058e74641d828() {
  return __cxx_static_address_42161a1a8f3058e74641d828.reference || (__cxx_static_address_42161a1a8f3058e74641d828.reference = {
    __cReference: true,
    get value() { return VASE____header_global_15b9b9c661800757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_060e9abed3926979 = ((u32(((u32(768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a258fc30e58ecf6c6f1e7e67() {
  return __cxx_static_address_a258fc30e58ecf6c6f1e7e67.reference || (__cxx_static_address_a258fc30e58ecf6c6f1e7e67.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_060e9abed3926979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_28f84a17deb5859a = ((u32(((u32(769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a182181328cdb01c9810f9e6() {
  return __cxx_static_address_a182181328cdb01c9810f9e6.reference || (__cxx_static_address_a182181328cdb01c9810f9e6.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_28f84a17deb5859a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_217ff6e3a9c498f1 = ((u32(((u32(774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03133c0b41cd3f2ec20aefc7() {
  return __cxx_static_address_03133c0b41cd3f2ec20aefc7.reference || (__cxx_static_address_03133c0b41cd3f2ec20aefc7.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_217ff6e3a9c498f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_261d463fea729f33 = ((u32(((u32(779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9e87e9a027f80a5486c73b3() {
  return __cxx_static_address_d9e87e9a027f80a5486c73b3.reference || (__cxx_static_address_d9e87e9a027f80a5486c73b3.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_261d463fea729f33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_ba2d7a4d34fcdd4b = ((u32(((u32(781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce5292510333911b8705133a() {
  return __cxx_static_address_ce5292510333911b8705133a.reference || (__cxx_static_address_ce5292510333911b8705133a.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_ba2d7a4d34fcdd4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_259d535d16e56d7e = ((u32(((u32(792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4bd6390d78268d50d9582e6() {
  return __cxx_static_address_e4bd6390d78268d50d9582e6.reference || (__cxx_static_address_e4bd6390d78268d50d9582e6.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_259d535d16e56d7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_d66f35028e79ff88 = ((u32(((u32(806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_199cca602aeb52da9bd6d49e() {
  return __cxx_static_address_199cca602aeb52da9bd6d49e.reference || (__cxx_static_address_199cca602aeb52da9bd6d49e.reference = {
    __cReference: true,
    get value() { return OJ____header_global_d66f35028e79ff88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_b78848b058b145b5 = ((u32(((u32(830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4ff968efcc19747af90a384() {
  return __cxx_static_address_c4ff968efcc19747af90a384.reference || (__cxx_static_address_c4ff968efcc19747af90a384.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_b78848b058b145b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_200de2b6bfbcc9a2 = ((u32(((u32(859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22f0b8481370a5e0986bafe2() {
  return __cxx_static_address_22f0b8481370a5e0986bafe2.reference || (__cxx_static_address_22f0b8481370a5e0986bafe2.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_200de2b6bfbcc9a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_a4c26519f772d8b9 = ((u32(((u32(860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7660a6b61e14ae3f73899abe() {
  return __cxx_static_address_7660a6b61e14ae3f73899abe.reference || (__cxx_static_address_7660a6b61e14ae3f73899abe.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_a4c26519f772d8b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_d9fa7dd7a737051e = ((u32(((u32(862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63fba05bc96005af0d864395() {
  return __cxx_static_address_63fba05bc96005af0d864395.reference || (__cxx_static_address_63fba05bc96005af0d864395.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_d9fa7dd7a737051e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_ce7c137dcbbccf55 = ((u32(((u32(864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0542e2392890509620418550() {
  return __cxx_static_address_0542e2392890509620418550.reference || (__cxx_static_address_0542e2392890509620418550.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_ce7c137dcbbccf55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_5ccfd2c5c58ebba9 = ((u32(((u32(867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a3c831ade6bd77f2395d28f() {
  return __cxx_static_address_8a3c831ade6bd77f2395d28f.reference || (__cxx_static_address_8a3c831ade6bd77f2395d28f.reference = {
    __cReference: true,
    get value() { return ATM____header_global_5ccfd2c5c58ebba9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_e73094a8391d7c7c = ((u32(((u32(869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b484357be834469994578bcd() {
  return __cxx_static_address_b484357be834469994578bcd.reference || (__cxx_static_address_b484357be834469994578bcd.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_e73094a8391d7c7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_0664add67c2ab762 = ((u32(((u32(888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_336aeb943d0dc56a9d60dfe3() {
  return __cxx_static_address_336aeb943d0dc56a9d60dfe3.reference || (__cxx_static_address_336aeb943d0dc56a9d60dfe3.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_0664add67c2ab762; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_2c220c9dd3661ebe = ((u32(((u32(901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a3dcb7dfedd1db7b51cfe6c() {
  return __cxx_static_address_3a3dcb7dfedd1db7b51cfe6c.reference || (__cxx_static_address_3a3dcb7dfedd1db7b51cfe6c.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_2c220c9dd3661ebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_6974c63a77fae3e3 = ((u32(((u32(902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bfe4f97707772fe95904bbf() {
  return __cxx_static_address_4bfe4f97707772fe95904bbf.reference || (__cxx_static_address_4bfe4f97707772fe95904bbf.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_6974c63a77fae3e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_2647f5740a59e341 = ((u32(((u32(903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be270f52f0981d7c7ec61a2d() {
  return __cxx_static_address_be270f52f0981d7c7ec61a2d.reference || (__cxx_static_address_be270f52f0981d7c7ec61a2d.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_2647f5740a59e341; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_24d569396da6d1bf = ((u32(((u32(904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5a001dd1310e7c11e38270e() {
  return __cxx_static_address_a5a001dd1310e7c11e38270e.reference || (__cxx_static_address_a5a001dd1310e7c11e38270e.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_24d569396da6d1bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_7b76b754c57329e0 = ((u32(((u32(908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e872b33022a906539833eeb8() {
  return __cxx_static_address_e872b33022a906539833eeb8.reference || (__cxx_static_address_e872b33022a906539833eeb8.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_7b76b754c57329e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_94c777ad7bf042de = ((u32(((u32(910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bdf7536fd3d9301dcf89998() {
  return __cxx_static_address_3bdf7536fd3d9301dcf89998.reference || (__cxx_static_address_3bdf7536fd3d9301dcf89998.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_94c777ad7bf042de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_11818bb31ac648d0 = ((u32(((u32(911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_656d690003b97cd4d5e840f3() {
  return __cxx_static_address_656d690003b97cd4d5e840f3.reference || (__cxx_static_address_656d690003b97cd4d5e840f3.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_11818bb31ac648d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_1e4cfdd18ddbc13f = ((u32(((u32(913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2888afb7207cd4fe3e1fd4e9() {
  return __cxx_static_address_2888afb7207cd4fe3e1fd4e9.reference || (__cxx_static_address_2888afb7207cd4fe3e1fd4e9.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_1e4cfdd18ddbc13f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_ba6ff58efef8fdcc = ((u32(((u32(914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d3cd4396c1f015a0016d6e9() {
  return __cxx_static_address_8d3cd4396c1f015a0016d6e9.reference || (__cxx_static_address_8d3cd4396c1f015a0016d6e9.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_ba6ff58efef8fdcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_f92f8c3a3a984cf1 = ((u32(((u32(915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f54fcf75b7c240b9f9a5e99() {
  return __cxx_static_address_1f54fcf75b7c240b9f9a5e99.reference || (__cxx_static_address_1f54fcf75b7c240b9f9a5e99.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_f92f8c3a3a984cf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_b70596c4360e943a = ((u32(((u32(916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_648f4aa784389c1528dedb15() {
  return __cxx_static_address_648f4aa784389c1528dedb15.reference || (__cxx_static_address_648f4aa784389c1528dedb15.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_b70596c4360e943a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_2cfdffbe7f81f2fe = ((u32(((u32(921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f81735a9f1d682528e60c2bc() {
  return __cxx_static_address_f81735a9f1d682528e60c2bc.reference || (__cxx_static_address_f81735a9f1d682528e60c2bc.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_2cfdffbe7f81f2fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_717699a0c0ccf65c = ((u32(((u32(925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e633e10158a020b9be4a852f() {
  return __cxx_static_address_e633e10158a020b9be4a852f.reference || (__cxx_static_address_e633e10158a020b9be4a852f.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_717699a0c0ccf65c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_916dec6a4046794d = ((u32(((u32(926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ca32c1d1666baed20d54262() {
  return __cxx_static_address_2ca32c1d1666baed20d54262.reference || (__cxx_static_address_2ca32c1d1666baed20d54262.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_916dec6a4046794d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_7a09fdb647127be4 = ((u32(((u32(939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e016e7d21a52a59ec34e784b() {
  return __cxx_static_address_e016e7d21a52a59ec34e784b.reference || (__cxx_static_address_e016e7d21a52a59ec34e784b.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_7a09fdb647127be4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_f03dc21216faca5c = ((u32(((u32(940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_987403419c477bd258f786f1() {
  return __cxx_static_address_987403419c477bd258f786f1.reference || (__cxx_static_address_987403419c477bd258f786f1.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_f03dc21216faca5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_30f4175d6f8bcefe = ((u32(((u32(950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fe0e60dadc6f863d2aea953() {
  return __cxx_static_address_5fe0e60dadc6f863d2aea953.reference || (__cxx_static_address_5fe0e60dadc6f863d2aea953.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_30f4175d6f8bcefe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_b088cf9f1ea71134 = ((u32(((u32(951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e5e98764aa4429a6b24bbc0() {
  return __cxx_static_address_1e5e98764aa4429a6b24bbc0.reference || (__cxx_static_address_1e5e98764aa4429a6b24bbc0.reference = {
    __cReference: true,
    get value() { return BOX____header_global_b088cf9f1ea71134; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_587060176884bbae = ((u32(((u32(952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba191c8e9e7ceaf60bacb9a5() {
  return __cxx_static_address_ba191c8e9e7ceaf60bacb9a5.reference || (__cxx_static_address_ba191c8e9e7ceaf60bacb9a5.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_587060176884bbae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_451203e0e4269a76 = ((u32(((u32(954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_341a240481fab19528b33fa7() {
  return __cxx_static_address_341a240481fab19528b33fa7.reference || (__cxx_static_address_341a240481fab19528b33fa7.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_451203e0e4269a76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_c670a97840a20d63 = ((u32(((u32(955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e43e752f86d3b244b815df81() {
  return __cxx_static_address_e43e752f86d3b244b815df81.reference || (__cxx_static_address_e43e752f86d3b244b815df81.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_c670a97840a20d63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_d037e55d1a099423 = ((u32(((u32(956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f51942dfcab6fe3c74b48a5() {
  return __cxx_static_address_6f51942dfcab6fe3c74b48a5.reference || (__cxx_static_address_6f51942dfcab6fe3c74b48a5.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_d037e55d1a099423; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_ba1a866db5509f2d = ((u32(((u32(957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_763484c168d7b2dcfdd81cd6() {
  return __cxx_static_address_763484c168d7b2dcfdd81cd6.reference || (__cxx_static_address_763484c168d7b2dcfdd81cd6.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_ba1a866db5509f2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_0c45fc9861c18f44 = ((u32(((u32(963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21577ffb1e4fe849c93b0f2f() {
  return __cxx_static_address_21577ffb1e4fe849c93b0f2f.reference || (__cxx_static_address_21577ffb1e4fe849c93b0f2f.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_0c45fc9861c18f44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_7ccd89c2d79754d4 = ((u32(((u32(964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_638963f3fdb4a229def00a4c() {
  return __cxx_static_address_638963f3fdb4a229def00a4c.reference || (__cxx_static_address_638963f3fdb4a229def00a4c.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_7ccd89c2d79754d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_ebde5e1b1d2a2e26 = ((u32(((u32(965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c733ccc5890bef20683d897f() {
  return __cxx_static_address_c733ccc5890bef20683d897f.reference || (__cxx_static_address_c733ccc5890bef20683d897f.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_ebde5e1b1d2a2e26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_f05eb46f86af0fcf = ((u32(((u32(969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7342a55b9138a99235dca503() {
  return __cxx_static_address_7342a55b9138a99235dca503.reference || (__cxx_static_address_7342a55b9138a99235dca503.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_f05eb46f86af0fcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_bcdf668b70c460ea = ((u32(((u32(971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1e49872669723bc3d9594fd() {
  return __cxx_static_address_c1e49872669723bc3d9594fd.reference || (__cxx_static_address_c1e49872669723bc3d9594fd.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_bcdf668b70c460ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_119ce2dde367a6d8 = ((u32(((u32(972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4fc05d98e9673041c517dc3() {
  return __cxx_static_address_b4fc05d98e9673041c517dc3.reference || (__cxx_static_address_b4fc05d98e9673041c517dc3.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_119ce2dde367a6d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_f614d0cc5fac5ab0 = ((u32(((u32(973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4382baeea23cfafbc453e067() {
  return __cxx_static_address_4382baeea23cfafbc453e067.reference || (__cxx_static_address_4382baeea23cfafbc453e067.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_f614d0cc5fac5ab0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_d50e5641c1207757 = ((u32(((u32(974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adaaf560211518ad10dcfc8c() {
  return __cxx_static_address_adaaf560211518ad10dcfc8c.reference || (__cxx_static_address_adaaf560211518ad10dcfc8c.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_d50e5641c1207757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_b99ae07b5f7652da = ((u32(((u32(975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_245b30477400ccbc1b87dd3b() {
  return __cxx_static_address_245b30477400ccbc1b87dd3b.reference || (__cxx_static_address_245b30477400ccbc1b87dd3b.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_b99ae07b5f7652da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_6aa0cbf6c0bad6a5 = ((u32(((u32(977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76b125ec73e4a1fe5429d5a8() {
  return __cxx_static_address_76b125ec73e4a1fe5429d5a8.reference || (__cxx_static_address_76b125ec73e4a1fe5429d5a8.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_6aa0cbf6c0bad6a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_18ef82e2bd6070a2 = ((u32(((u32(978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53d99754051d168c57ea70be() {
  return __cxx_static_address_53d99754051d168c57ea70be.reference || (__cxx_static_address_53d99754051d168c57ea70be.reference = {
    __cReference: true,
    get value() { return CONE____header_global_18ef82e2bd6070a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_cf4a3586b896c715 = ((u32(((u32(979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f62f0a4ba5590eabe6db04a5() {
  return __cxx_static_address_f62f0a4ba5590eabe6db04a5.reference || (__cxx_static_address_f62f0a4ba5590eabe6db04a5.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_cf4a3586b896c715; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_864df66a0649d8b5 = ((u32(((u32(981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e21c9dadab3ffa4130d0199a() {
  return __cxx_static_address_e21c9dadab3ffa4130d0199a.reference || (__cxx_static_address_e21c9dadab3ffa4130d0199a.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_864df66a0649d8b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_efe4af8de1ffa3bd = ((u32(((u32(988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f8b99b46dc56eaf1ec0c4a0() {
  return __cxx_static_address_9f8b99b46dc56eaf1ec0c4a0.reference || (__cxx_static_address_9f8b99b46dc56eaf1ec0c4a0.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_efe4af8de1ffa3bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_a61579beeaccdb65 = ((u32(((u32(990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e38f557e1a5b08a7469b2598() {
  return __cxx_static_address_e38f557e1a5b08a7469b2598.reference || (__cxx_static_address_e38f557e1a5b08a7469b2598.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_a61579beeaccdb65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_d9dcf98b46074157 = ((u32(((u32(994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88561dfabf431a5c5f518ef5() {
  return __cxx_static_address_88561dfabf431a5c5f518ef5.reference || (__cxx_static_address_88561dfabf431a5c5f518ef5.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_d9dcf98b46074157; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_222439a91cde936e = ((u32(((u32(995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1c27b0a7703026ea34a108d() {
  return __cxx_static_address_b1c27b0a7703026ea34a108d.reference || (__cxx_static_address_b1c27b0a7703026ea34a108d.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_222439a91cde936e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_f033d6eaeda65629 = ((u32(((u32(996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d55307216d32d3c5bdf59335() {
  return __cxx_static_address_d55307216d32d3c5bdf59335.reference || (__cxx_static_address_d55307216d32d3c5bdf59335.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_f033d6eaeda65629; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_44e69020e696d2d2 = ((u32(((u32(997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28fafd5667d915b84ca4b322() {
  return __cxx_static_address_28fafd5667d915b84ca4b322.reference || (__cxx_static_address_28fafd5667d915b84ca4b322.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_44e69020e696d2d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_132a411fc1ae6c32 = ((u32(((u32(1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd6ab67f1995dd249d58e8a8() {
  return __cxx_static_address_fd6ab67f1995dd249d58e8a8.reference || (__cxx_static_address_fd6ab67f1995dd249d58e8a8.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_132a411fc1ae6c32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_1912fbfb76a60f03 = ((u32(((u32(1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1f039847af79de78f3a38a8() {
  return __cxx_static_address_a1f039847af79de78f3a38a8.reference || (__cxx_static_address_a1f039847af79de78f3a38a8.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_1912fbfb76a60f03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_5dfbcb679759ebd6 = ((u32(((u32(1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4f5dd24b706d820ea3211c5() {
  return __cxx_static_address_e4f5dd24b706d820ea3211c5.reference || (__cxx_static_address_e4f5dd24b706d820ea3211c5.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_5dfbcb679759ebd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_731ba37cbe78f825 = ((u32(((u32(1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7bcae0a6410ef5d769e46b2() {
  return __cxx_static_address_f7bcae0a6410ef5d769e46b2.reference || (__cxx_static_address_f7bcae0a6410ef5d769e46b2.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_731ba37cbe78f825; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_e967ac801610138a = ((u32(((u32(1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad9d0273b8a74ecfed968b7d() {
  return __cxx_static_address_ad9d0273b8a74ecfed968b7d.reference || (__cxx_static_address_ad9d0273b8a74ecfed968b7d.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_e967ac801610138a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_b49575a39ce21487 = ((u32(((u32(1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90db8c80e794852927c48e25() {
  return __cxx_static_address_90db8c80e794852927c48e25.reference || (__cxx_static_address_90db8c80e794852927c48e25.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_b49575a39ce21487; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_98ec18889c03c955 = ((u32(((u32(1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_218de50ba026f4b7002e6127() {
  return __cxx_static_address_218de50ba026f4b7002e6127.reference || (__cxx_static_address_218de50ba026f4b7002e6127.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_98ec18889c03c955; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_4fb09ac47a309117 = ((u32(((u32(1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d073f1543ce36b52f40cccd7() {
  return __cxx_static_address_d073f1543ce36b52f40cccd7.reference || (__cxx_static_address_d073f1543ce36b52f40cccd7.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_4fb09ac47a309117; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_7838414ede5427eb = ((u32(((u32(1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_faf1b75c5c0d4a8322d8adba() {
  return __cxx_static_address_faf1b75c5c0d4a8322d8adba.reference || (__cxx_static_address_faf1b75c5c0d4a8322d8adba.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_7838414ede5427eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_660a4a8c5b6c8d0b = ((u32(((u32(1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_176fe2891282ded51f1f5841() {
  return __cxx_static_address_176fe2891282ded51f1f5841.reference || (__cxx_static_address_176fe2891282ded51f1f5841.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_660a4a8c5b6c8d0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_3364aee1d804f635 = ((u32(((u32(1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11ed3053fb4620e2d805b024() {
  return __cxx_static_address_11ed3053fb4620e2d805b024.reference || (__cxx_static_address_11ed3053fb4620e2d805b024.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_3364aee1d804f635; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_25adaed4fef16009 = ((u32(((u32(1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cd79c34d2b1c3668778afb1() {
  return __cxx_static_address_4cd79c34d2b1c3668778afb1.reference || (__cxx_static_address_4cd79c34d2b1c3668778afb1.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_25adaed4fef16009; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_dbbe1a7678d1cb37 = ((u32(((u32(1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05fe121349717b8cbe50e09b() {
  return __cxx_static_address_05fe121349717b8cbe50e09b.reference || (__cxx_static_address_05fe121349717b8cbe50e09b.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_dbbe1a7678d1cb37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_3cad9503a75e0136 = ((u32(((u32(1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ed17e8f68869665f68ebdf7() {
  return __cxx_static_address_3ed17e8f68869665f68ebdf7.reference || (__cxx_static_address_3ed17e8f68869665f68ebdf7.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_3cad9503a75e0136; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_c0b257145192e019 = ((u32(((u32(1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aed1c6042e057ede02fbf7fa() {
  return __cxx_static_address_aed1c6042e057ede02fbf7fa.reference || (__cxx_static_address_aed1c6042e057ede02fbf7fa.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_c0b257145192e019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_a883897f6469b69c = ((u32(((u32(1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0459be99d8488e9a08f236a() {
  return __cxx_static_address_b0459be99d8488e9a08f236a.reference || (__cxx_static_address_b0459be99d8488e9a08f236a.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_a883897f6469b69c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_59c97d0828d7f0c7 = ((u32(((u32(1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3792196308fa76a31f0ad3ff() {
  return __cxx_static_address_3792196308fa76a31f0ad3ff.reference || (__cxx_static_address_3792196308fa76a31f0ad3ff.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_59c97d0828d7f0c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_d5d76dc650a250f1 = ((u32(((u32(1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c147a4bab4707ff7fe02eb4d() {
  return __cxx_static_address_c147a4bab4707ff7fe02eb4d.reference || (__cxx_static_address_c147a4bab4707ff7fe02eb4d.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_d5d76dc650a250f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_d746e2c86e5217e4 = ((u32(((u32(1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2d37c5a620b6e85697f7de3() {
  return __cxx_static_address_c2d37c5a620b6e85697f7de3.reference || (__cxx_static_address_c2d37c5a620b6e85697f7de3.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_d746e2c86e5217e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_45ed0b418ef18355 = ((u32(((u32(1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16edea22e4e88040784e59c3() {
  return __cxx_static_address_16edea22e4e88040784e59c3.reference || (__cxx_static_address_16edea22e4e88040784e59c3.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_45ed0b418ef18355; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_c56a4b1ece9f3216 = ((u32(((u32(1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43bf1478fc37dfc22a1b84a6() {
  return __cxx_static_address_43bf1478fc37dfc22a1b84a6.reference || (__cxx_static_address_43bf1478fc37dfc22a1b84a6.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_c56a4b1ece9f3216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_3916dc3f7e1d91cc = ((u32(((u32(1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4df8e809bf64c6fc66ee4b2() {
  return __cxx_static_address_b4df8e809bf64c6fc66ee4b2.reference || (__cxx_static_address_b4df8e809bf64c6fc66ee4b2.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_3916dc3f7e1d91cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_9cf463d1cd408f17 = ((u32(((u32(1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_936a065542360b3bbfe0c007() {
  return __cxx_static_address_936a065542360b3bbfe0c007.reference || (__cxx_static_address_936a065542360b3bbfe0c007.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_9cf463d1cd408f17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_27aa4fb2997c14ea = ((u32(((u32(1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71e3600cdcef0350c6907f56() {
  return __cxx_static_address_71e3600cdcef0350c6907f56.reference || (__cxx_static_address_71e3600cdcef0350c6907f56.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_27aa4fb2997c14ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_8a0921766be148b6 = ((u32(((u32(1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36fb48730ee6f813cec269cb() {
  return __cxx_static_address_36fb48730ee6f813cec269cb.reference || (__cxx_static_address_36fb48730ee6f813cec269cb.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_8a0921766be148b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_7feae564aeb98190 = ((u32(((u32(1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_292e8fbb383f88ee486f2b51() {
  return __cxx_static_address_292e8fbb383f88ee486f2b51.reference || (__cxx_static_address_292e8fbb383f88ee486f2b51.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_7feae564aeb98190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_dd798d94dc569fcc = ((u32(((u32(1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0933f877a1da4e3d1c8a4af2() {
  return __cxx_static_address_0933f877a1da4e3d1c8a4af2.reference || (__cxx_static_address_0933f877a1da4e3d1c8a4af2.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_dd798d94dc569fcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_4b6656ffb9b48c83 = ((u32(((u32(1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bcc218f9dcc46239205c3b4() {
  return __cxx_static_address_5bcc218f9dcc46239205c3b4.reference || (__cxx_static_address_5bcc218f9dcc46239205c3b4.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_4b6656ffb9b48c83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_32e4b53dcf3fd8c1 = ((u32(((u32(1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d23dca32dc4c27ff78023a3() {
  return __cxx_static_address_7d23dca32dc4c27ff78023a3.reference || (__cxx_static_address_7d23dca32dc4c27ff78023a3.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_32e4b53dcf3fd8c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_e9639a0f7fb921cb = ((u32(((u32(1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d18c1f420ca78feb3d605be() {
  return __cxx_static_address_3d18c1f420ca78feb3d605be.reference || (__cxx_static_address_3d18c1f420ca78feb3d605be.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_e9639a0f7fb921cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_dfce8542aa0eada7 = ((u32(((u32(1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9281acbbcb2b8cd465bc94ee() {
  return __cxx_static_address_9281acbbcb2b8cd465bc94ee.reference || (__cxx_static_address_9281acbbcb2b8cd465bc94ee.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_dfce8542aa0eada7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_0305a24b039af1c7 = ((u32(((u32(1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7f8e1139832a6ccc11c3ecb() {
  return __cxx_static_address_b7f8e1139832a6ccc11c3ecb.reference || (__cxx_static_address_b7f8e1139832a6ccc11c3ecb.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_0305a24b039af1c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_a5729fb66ce5c468 = ((u32(((u32(1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03f17c73351d2f4cbc3b5fee() {
  return __cxx_static_address_03f17c73351d2f4cbc3b5fee.reference || (__cxx_static_address_03f17c73351d2f4cbc3b5fee.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_a5729fb66ce5c468; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_c26fa91dc9fd032e = ((u32(((u32(1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d107989c9c210ab9bb917024() {
  return __cxx_static_address_d107989c9c210ab9bb917024.reference || (__cxx_static_address_d107989c9c210ab9bb917024.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_c26fa91dc9fd032e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_351cf79bd53d057c = ((u32(((u32(1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0a13258bf4ccb827c201e7d() {
  return __cxx_static_address_b0a13258bf4ccb827c201e7d.reference || (__cxx_static_address_b0a13258bf4ccb827c201e7d.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_351cf79bd53d057c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_9fe7b773269be8fb = ((u32(((u32(1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beaa980747e4b022ef6c6150() {
  return __cxx_static_address_beaa980747e4b022ef6c6150.reference || (__cxx_static_address_beaa980747e4b022ef6c6150.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_9fe7b773269be8fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_ff8ed9541388275f = ((u32(((u32(1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beb437f753037bf2395fb890() {
  return __cxx_static_address_beb437f753037bf2395fb890.reference || (__cxx_static_address_beb437f753037bf2395fb890.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_ff8ed9541388275f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_7297f22e7ad930d8 = ((u32(((u32(1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d613b2c0de14ca72ca7faaa6() {
  return __cxx_static_address_d613b2c0de14ca72ca7faaa6.reference || (__cxx_static_address_d613b2c0de14ca72ca7faaa6.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_7297f22e7ad930d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_ae7619cd0022478c = ((u32(((u32(1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47243be6553f00f2d7cc0fc8() {
  return __cxx_static_address_47243be6553f00f2d7cc0fc8.reference || (__cxx_static_address_47243be6553f00f2d7cc0fc8.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_ae7619cd0022478c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_43aa99f8c9842c60 = ((u32(((u32(1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39bed4e6bc8fe2df8941ace8() {
  return __cxx_static_address_39bed4e6bc8fe2df8941ace8.reference || (__cxx_static_address_39bed4e6bc8fe2df8941ace8.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_43aa99f8c9842c60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_d1203f66d415ecc3 = ((u32(((u32(1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84b3e2353b5cc2b733726912() {
  return __cxx_static_address_84b3e2353b5cc2b733726912.reference || (__cxx_static_address_84b3e2353b5cc2b733726912.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_d1203f66d415ecc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_8ecff78ff3e11330 = ((u32(((u32(1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97759eb9124fecf4b58c2d7f() {
  return __cxx_static_address_97759eb9124fecf4b58c2d7f.reference || (__cxx_static_address_97759eb9124fecf4b58c2d7f.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_8ecff78ff3e11330; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_2fabcc97b00e2d2d = ((u32(((u32(1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd8f4ac4d18c5806ebef4caf() {
  return __cxx_static_address_fd8f4ac4d18c5806ebef4caf.reference || (__cxx_static_address_fd8f4ac4d18c5806ebef4caf.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_2fabcc97b00e2d2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_ef17d485ceea4739 = ((u32(((u32(1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25d77ae27ebd6defaf819ed1() {
  return __cxx_static_address_25d77ae27ebd6defaf819ed1.reference || (__cxx_static_address_25d77ae27ebd6defaf819ed1.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_ef17d485ceea4739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_6bb5e6045ba37e26 = ((u32(((u32(1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42e805ad4dd961880c7a1bbf() {
  return __cxx_static_address_42e805ad4dd961880c7a1bbf.reference || (__cxx_static_address_42e805ad4dd961880c7a1bbf.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_6bb5e6045ba37e26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_3cb07a78208856bd = ((u32(((u32(1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb8dda3fbd49a9cefd9f03ca() {
  return __cxx_static_address_bb8dda3fbd49a9cefd9f03ca.reference || (__cxx_static_address_bb8dda3fbd49a9cefd9f03ca.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_3cb07a78208856bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_6d1c96bb761be72b = ((u32(((u32(1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0098e2dda2be3229acda2d8() {
  return __cxx_static_address_f0098e2dda2be3229acda2d8.reference || (__cxx_static_address_f0098e2dda2be3229acda2d8.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_6d1c96bb761be72b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_12d5a9fb77d33174 = ((u32(((u32(1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0f1c8b347093cff57c95fc8() {
  return __cxx_static_address_b0f1c8b347093cff57c95fc8.reference || (__cxx_static_address_b0f1c8b347093cff57c95fc8.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_12d5a9fb77d33174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_4c68e56769bc5301 = ((u32(((u32(1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dab7ce346ad2158febd479a() {
  return __cxx_static_address_9dab7ce346ad2158febd479a.reference || (__cxx_static_address_9dab7ce346ad2158febd479a.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_4c68e56769bc5301; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_d81e7bc41b57c620 = ((u32(((u32(1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_358648a8b1b86502bcd210f0() {
  return __cxx_static_address_358648a8b1b86502bcd210f0.reference || (__cxx_static_address_358648a8b1b86502bcd210f0.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_d81e7bc41b57c620; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_22d7ccd4063f3d9b = ((u32(((u32(1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_713e7029a05c43a248738e9a() {
  return __cxx_static_address_713e7029a05c43a248738e9a.reference || (__cxx_static_address_713e7029a05c43a248738e9a.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_22d7ccd4063f3d9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_81cd11f8b56822f1 = ((u32(((u32(1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da8c3d013580292e4f5df901() {
  return __cxx_static_address_da8c3d013580292e4f5df901.reference || (__cxx_static_address_da8c3d013580292e4f5df901.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_81cd11f8b56822f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_595db69a90cdd103 = ((u32(((u32(1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53c9ce8b8091ffae5bd15ffc() {
  return __cxx_static_address_53c9ce8b8091ffae5bd15ffc.reference || (__cxx_static_address_53c9ce8b8091ffae5bd15ffc.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_595db69a90cdd103; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_c403d72bab4557de = ((u32(((u32(1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca0ecd835abc7cdb87e32d20() {
  return __cxx_static_address_ca0ecd835abc7cdb87e32d20.reference || (__cxx_static_address_ca0ecd835abc7cdb87e32d20.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_c403d72bab4557de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_faa971fd96eec79d = ((u32(((u32(1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d81cc8f1518b49ecee7b382() {
  return __cxx_static_address_2d81cc8f1518b49ecee7b382.reference || (__cxx_static_address_2d81cc8f1518b49ecee7b382.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_faa971fd96eec79d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_7600d936faa318af = ((u32(((u32(1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bcd96fb2b26a944586b1c92() {
  return __cxx_static_address_3bcd96fb2b26a944586b1c92.reference || (__cxx_static_address_3bcd96fb2b26a944586b1c92.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_7600d936faa318af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_6e6d751c5161be8c = ((u32(((u32(1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5701e92ad55c6350baf221b2() {
  return __cxx_static_address_5701e92ad55c6350baf221b2.reference || (__cxx_static_address_5701e92ad55c6350baf221b2.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_6e6d751c5161be8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_e698e2157a7e7b6a = ((u32(((u32(1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_950750c6c2c5b1fc045fbe3a() {
  return __cxx_static_address_950750c6c2c5b1fc045fbe3a.reference || (__cxx_static_address_950750c6c2c5b1fc045fbe3a.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_e698e2157a7e7b6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_54b4cad78ac5c382 = ((u32(((u32(1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c38a57e85dbbf6adee6d590e() {
  return __cxx_static_address_c38a57e85dbbf6adee6d590e.reference || (__cxx_static_address_c38a57e85dbbf6adee6d590e.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_54b4cad78ac5c382; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_e88e71c1114472f3 = ((u32(((u32(1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41f6341a444f0e0e7b5e5174() {
  return __cxx_static_address_41f6341a444f0e0e7b5e5174.reference || (__cxx_static_address_41f6341a444f0e0e7b5e5174.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_e88e71c1114472f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_886f4b5c9f482964 = ((u32(((u32(1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44afd0459b4bd26dcda40416() {
  return __cxx_static_address_44afd0459b4bd26dcda40416.reference || (__cxx_static_address_44afd0459b4bd26dcda40416.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_886f4b5c9f482964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_c8255ed6c54bf331 = ((u32(((u32(1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f570d46ba50742b47f04b75() {
  return __cxx_static_address_0f570d46ba50742b47f04b75.reference || (__cxx_static_address_0f570d46ba50742b47f04b75.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_c8255ed6c54bf331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_f444a5e261212a22 = ((u32(((u32(1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7990c08284841556d0df3b4b() {
  return __cxx_static_address_7990c08284841556d0df3b4b.reference || (__cxx_static_address_7990c08284841556d0df3b4b.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_f444a5e261212a22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_1bcdb5377770327b = ((u32(((u32(1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85f3bb2e8bf8385346e6d499() {
  return __cxx_static_address_85f3bb2e8bf8385346e6d499.reference || (__cxx_static_address_85f3bb2e8bf8385346e6d499.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_1bcdb5377770327b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_23b7bec86660e78c = ((u32(((u32(1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aedd6a302c535a5c4ea37c7() {
  return __cxx_static_address_2aedd6a302c535a5c4ea37c7.reference || (__cxx_static_address_2aedd6a302c535a5c4ea37c7.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_23b7bec86660e78c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_bcd0e56a791e30c0 = ((u32(((u32(1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_313be42e49858aea13bdf1e2() {
  return __cxx_static_address_313be42e49858aea13bdf1e2.reference || (__cxx_static_address_313be42e49858aea13bdf1e2.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_bcd0e56a791e30c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_89b2fd17a03352e6 = ((u32(((u32(1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce7d42f61e5324ebbbb136fa() {
  return __cxx_static_address_ce7d42f61e5324ebbbb136fa.reference || (__cxx_static_address_ce7d42f61e5324ebbbb136fa.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_89b2fd17a03352e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_e2d69286e4d9219d = ((u32(((u32(1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8c62c3c0b2ca0b80ff52234() {
  return __cxx_static_address_f8c62c3c0b2ca0b80ff52234.reference || (__cxx_static_address_f8c62c3c0b2ca0b80ff52234.reference = {
    __cReference: true,
    get value() { return RAT____header_global_e2d69286e4d9219d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_8a411896da7d175f = ((u32(((u32(1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca9c612714c77227d86ea033() {
  return __cxx_static_address_ca9c612714c77227d86ea033.reference || (__cxx_static_address_ca9c612714c77227d86ea033.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_8a411896da7d175f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_d6b53a26f19ad02a = ((u32(((u32(1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fd9cb008213500393d5a21e() {
  return __cxx_static_address_3fd9cb008213500393d5a21e.reference || (__cxx_static_address_3fd9cb008213500393d5a21e.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_d6b53a26f19ad02a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_67915f034536883a = ((u32(((u32(1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8b3ccac1316500b43ba9143() {
  return __cxx_static_address_c8b3ccac1316500b43ba9143.reference || (__cxx_static_address_c8b3ccac1316500b43ba9143.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_67915f034536883a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_303e7dfe49168399 = ((u32(((u32(1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76e6f02051d63e96df384ce2() {
  return __cxx_static_address_76e6f02051d63e96df384ce2.reference || (__cxx_static_address_76e6f02051d63e96df384ce2.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_303e7dfe49168399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_f5b026289c2f0bf7 = ((u32(((u32(1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb3b3918d925fcf57827978b() {
  return __cxx_static_address_fb3b3918d925fcf57827978b.reference || (__cxx_static_address_fb3b3918d925fcf57827978b.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_f5b026289c2f0bf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_2be2a27ff03d4079 = ((u32(((u32(1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_720544b21c4d9ab14c72e454() {
  return __cxx_static_address_720544b21c4d9ab14c72e454.reference || (__cxx_static_address_720544b21c4d9ab14c72e454.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_2be2a27ff03d4079; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_c52830d8b1727432 = ((u32(((u32(1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7be9bc00084727f275b9ea2d() {
  return __cxx_static_address_7be9bc00084727f275b9ea2d.reference || (__cxx_static_address_7be9bc00084727f275b9ea2d.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_c52830d8b1727432; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_a7e58251e4ae2ad7 = ((u32(((u32(1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e75c5ec681f25c3e1f90b94d() {
  return __cxx_static_address_e75c5ec681f25c3e1f90b94d.reference || (__cxx_static_address_e75c5ec681f25c3e1f90b94d.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_a7e58251e4ae2ad7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_9384162d4a44a176 = ((u32(((u32(1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d6d03232b78a3d6205de61d() {
  return __cxx_static_address_5d6d03232b78a3d6205de61d.reference || (__cxx_static_address_5d6d03232b78a3d6205de61d.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_9384162d4a44a176; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_4d7817475128ae04 = ((u32(((u32(1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97975ace29fdefc1ee98f1fb() {
  return __cxx_static_address_97975ace29fdefc1ee98f1fb.reference || (__cxx_static_address_97975ace29fdefc1ee98f1fb.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_4d7817475128ae04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_cc560ea02802d811 = ((u32(((u32(1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bb49636d419245da43ba789() {
  return __cxx_static_address_8bb49636d419245da43ba789.reference || (__cxx_static_address_8bb49636d419245da43ba789.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_cc560ea02802d811; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_ee03c24b77f47d6b = ((u32(((u32(1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f95cf1e402fda8dc4c21c2c() {
  return __cxx_static_address_1f95cf1e402fda8dc4c21c2c.reference || (__cxx_static_address_1f95cf1e402fda8dc4c21c2c.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_ee03c24b77f47d6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_1b38330cb76822ce = ((u32(((u32(1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f386a947747ee759736e7d33() {
  return __cxx_static_address_f386a947747ee759736e7d33.reference || (__cxx_static_address_f386a947747ee759736e7d33.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_1b38330cb76822ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_daf43fab7367c303 = ((u32(((u32(1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25676cb0c6ef4547209347df() {
  return __cxx_static_address_25676cb0c6ef4547209347df.reference || (__cxx_static_address_25676cb0c6ef4547209347df.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_daf43fab7367c303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_7f7b0d86d0d2ed6c = ((u32(((u32(1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16d160260309da58029cd1ab() {
  return __cxx_static_address_16d160260309da58029cd1ab.reference || (__cxx_static_address_16d160260309da58029cd1ab.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_7f7b0d86d0d2ed6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_85f32dd010736f19 = ((u32(((u32(1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_443a80bee4836290510315e2() {
  return __cxx_static_address_443a80bee4836290510315e2.reference || (__cxx_static_address_443a80bee4836290510315e2.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_85f32dd010736f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_3939225851625898 = ((u32(((u32(1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98dc8873b7bfe21b8d4c3c1f() {
  return __cxx_static_address_98dc8873b7bfe21b8d4c3c1f.reference || (__cxx_static_address_98dc8873b7bfe21b8d4c3c1f.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_3939225851625898; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_69cd3620250545b2 = ((u32(((u32(1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0364edcfced9376a1d0204c3() {
  return __cxx_static_address_0364edcfced9376a1d0204c3.reference || (__cxx_static_address_0364edcfced9376a1d0204c3.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_69cd3620250545b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_ba4f79c05dd86991 = ((u32(((u32(1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_561d2ddc16aee96fde9d00e7() {
  return __cxx_static_address_561d2ddc16aee96fde9d00e7.reference || (__cxx_static_address_561d2ddc16aee96fde9d00e7.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_ba4f79c05dd86991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_bcfadd990392b5f5 = ((u32(((u32(1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9db8fa74eef5b0158844aa0() {
  return __cxx_static_address_e9db8fa74eef5b0158844aa0.reference || (__cxx_static_address_e9db8fa74eef5b0158844aa0.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_bcfadd990392b5f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_863adfd1248e607f = ((u32(((u32(1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6f76b50d01d2cb5b37d237e() {
  return __cxx_static_address_d6f76b50d01d2cb5b37d237e.reference || (__cxx_static_address_d6f76b50d01d2cb5b37d237e.reference = {
    __cReference: true,
    get value() { return INDY____header_global_863adfd1248e607f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_dc22f2d464814ef5 = ((u32(((u32(1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2050d44d12df9e2f13047824() {
  return __cxx_static_address_2050d44d12df9e2f13047824.reference || (__cxx_static_address_2050d44d12df9e2f13047824.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_dc22f2d464814ef5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_b405dfccb0517a64 = ((u32(((u32(1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4a8b9d78a7f6e9a8cf4af1d() {
  return __cxx_static_address_c4a8b9d78a7f6e9a8cf4af1d.reference || (__cxx_static_address_c4a8b9d78a7f6e9a8cf4af1d.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_b405dfccb0517a64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_46e71c5a3795f140 = ((u32(((u32(1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9e294a89c2d2ec15fddfe8e() {
  return __cxx_static_address_d9e294a89c2d2ec15fddfe8e.reference || (__cxx_static_address_d9e294a89c2d2ec15fddfe8e.reference = {
    __cReference: true,
    get value() { return MONK____header_global_46e71c5a3795f140; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_0adb099d88e73848 = ((u32(((u32(1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_312d8b5ff03cb64b4c2a0cd2() {
  return __cxx_static_address_312d8b5ff03cb64b4c2a0cd2.reference || (__cxx_static_address_312d8b5ff03cb64b4c2a0cd2.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_0adb099d88e73848; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_9cdba1602de70b03 = ((u32(((u32(1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2a478dee00c250d8a9749da() {
  return __cxx_static_address_e2a478dee00c250d8a9749da.reference || (__cxx_static_address_e2a478dee00c250d8a9749da.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_9cdba1602de70b03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_e9ff6a47574b994c = ((u32(((u32(1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2654dac2deeeee5a07ec97a() {
  return __cxx_static_address_b2654dac2deeeee5a07ec97a.reference || (__cxx_static_address_b2654dac2deeeee5a07ec97a.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_e9ff6a47574b994c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_abda38fa42a8348e = ((u32(((u32(1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65ad19c5d3e9c573543d7d30() {
  return __cxx_static_address_65ad19c5d3e9c573543d7d30.reference || (__cxx_static_address_65ad19c5d3e9c573543d7d30.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_abda38fa42a8348e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_7f29f2fbde42dddb = ((u32(((u32(1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_325ea27c32280153f5ea270e() {
  return __cxx_static_address_325ea27c32280153f5ea270e.reference || (__cxx_static_address_325ea27c32280153f5ea270e.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_7f29f2fbde42dddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_3366f0461a46fd28 = ((u32(((u32(1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_835b2401119eedd8165967ed() {
  return __cxx_static_address_835b2401119eedd8165967ed.reference || (__cxx_static_address_835b2401119eedd8165967ed.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_3366f0461a46fd28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_814c3e1c499e24f3 = ((u32(((u32(1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a34c3f54d806a21165f1b7e() {
  return __cxx_static_address_0a34c3f54d806a21165f1b7e.reference || (__cxx_static_address_0a34c3f54d806a21165f1b7e.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_814c3e1c499e24f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_55ee94177c5f03c6 = ((u32(((u32(1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3b7a523ee484eff7d8100db() {
  return __cxx_static_address_d3b7a523ee484eff7d8100db.reference || (__cxx_static_address_d3b7a523ee484eff7d8100db.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_55ee94177c5f03c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_0a7de701f80751a8 = ((u32(((u32(1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9005134a3cc9c50343ecd02() {
  return __cxx_static_address_e9005134a3cc9c50343ecd02.reference || (__cxx_static_address_e9005134a3cc9c50343ecd02.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_0a7de701f80751a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_340a0d16cdef34e0 = ((u32(((u32(1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb16955050afc5e3819d127d() {
  return __cxx_static_address_eb16955050afc5e3819d127d.reference || (__cxx_static_address_eb16955050afc5e3819d127d.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_340a0d16cdef34e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_b966b7b5d7c8a068 = ((u32(((u32(1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e2e930d3085ab900ce1e7b1() {
  return __cxx_static_address_1e2e930d3085ab900ce1e7b1.reference || (__cxx_static_address_1e2e930d3085ab900ce1e7b1.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_b966b7b5d7c8a068; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_f6ae32b169846daa = ((u32(((u32(1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5309af5bffe5bfba52c716b3() {
  return __cxx_static_address_5309af5bffe5bfba52c716b3.reference || (__cxx_static_address_5309af5bffe5bfba52c716b3.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_f6ae32b169846daa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_6e3335a14d58c1e8 = ((u32(((u32(1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f76e0368e2d75a2f47109be() {
  return __cxx_static_address_1f76e0368e2d75a2f47109be.reference || (__cxx_static_address_1f76e0368e2d75a2f47109be.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_6e3335a14d58c1e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_3e3ca4b5ca46d188 = ((u32(((u32(1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35233d2706aca9a1875468f3() {
  return __cxx_static_address_35233d2706aca9a1875468f3.reference || (__cxx_static_address_35233d2706aca9a1875468f3.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_3e3ca4b5ca46d188; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_abd56837f2e61d89 = ((u32(((u32(1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_130b85271f270b08a0ba4d5c() {
  return __cxx_static_address_130b85271f270b08a0ba4d5c.reference || (__cxx_static_address_130b85271f270b08a0ba4d5c.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_abd56837f2e61d89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_f3e9a0eea9a7baeb = ((u32(((u32(1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80e925685bc184d8e5b9b0e8() {
  return __cxx_static_address_80e925685bc184d8e5b9b0e8.reference || (__cxx_static_address_80e925685bc184d8e5b9b0e8.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_f3e9a0eea9a7baeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_134f0c36868a65ff = ((u32(((u32(1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a67c841bf324784a442c29eb() {
  return __cxx_static_address_a67c841bf324784a442c29eb.reference || (__cxx_static_address_a67c841bf324784a442c29eb.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_134f0c36868a65ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_3c910d8bae7634bb = ((u32(((u32(1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3c43b0def3ad6f491fbfe07() {
  return __cxx_static_address_d3c43b0def3ad6f491fbfe07.reference || (__cxx_static_address_d3c43b0def3ad6f491fbfe07.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_3c910d8bae7634bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_c827f979ab8b30fd = ((u32(((u32(1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cf5ab20e6ce8b284739b7e7() {
  return __cxx_static_address_5cf5ab20e6ce8b284739b7e7.reference || (__cxx_static_address_5cf5ab20e6ce8b284739b7e7.reference = {
    __cReference: true,
    get value() { return FIST____header_global_c827f979ab8b30fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_0c5ad04527447bfe = ((u32(((u32(1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c71beb82f8437fd75a50f74() {
  return __cxx_static_address_3c71beb82f8437fd75a50f74.reference || (__cxx_static_address_3c71beb82f8437fd75a50f74.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_0c5ad04527447bfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_bab632ae95d1d82f = ((u32(((u32(1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d63580dc659ee34666f73e6() {
  return __cxx_static_address_2d63580dc659ee34666f73e6.reference || (__cxx_static_address_2d63580dc659ee34666f73e6.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_bab632ae95d1d82f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_7a0f54f05a2afe8a = ((u32(((u32(1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_961834baf302075e19e66383() {
  return __cxx_static_address_961834baf302075e19e66383.reference || (__cxx_static_address_961834baf302075e19e66383.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_7a0f54f05a2afe8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_22f0002c0a75ce2f = ((u32(((u32(1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_095a72368ec098ab76a93dc6() {
  return __cxx_static_address_095a72368ec098ab76a93dc6.reference || (__cxx_static_address_095a72368ec098ab76a93dc6.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_22f0002c0a75ce2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_aa0dbc59dde195f8 = ((u32(((u32(1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35b30469408cd7cbfc8adff3() {
  return __cxx_static_address_35b30469408cd7cbfc8adff3.reference || (__cxx_static_address_35b30469408cd7cbfc8adff3.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_aa0dbc59dde195f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_85be9a478c4fbe91 = ((u32(((u32(1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c5052ec29ecfd493ae8a0b4() {
  return __cxx_static_address_1c5052ec29ecfd493ae8a0b4.reference || (__cxx_static_address_1c5052ec29ecfd493ae8a0b4.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_85be9a478c4fbe91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_151344ffc35596fc = ((u32(((u32(1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fff2ee94d7727a5e1af9228c() {
  return __cxx_static_address_fff2ee94d7727a5e1af9228c.reference || (__cxx_static_address_fff2ee94d7727a5e1af9228c.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_151344ffc35596fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_a38cde0ee74754bd = ((u32(((u32(1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33b3e1a719a6542203be046f() {
  return __cxx_static_address_33b3e1a719a6542203be046f.reference || (__cxx_static_address_33b3e1a719a6542203be046f.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_a38cde0ee74754bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_22d43b4fd6adb253 = ((u32(((u32(1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_797a1ec11d9cac5abd2eca13() {
  return __cxx_static_address_797a1ec11d9cac5abd2eca13.reference || (__cxx_static_address_797a1ec11d9cac5abd2eca13.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_22d43b4fd6adb253; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_b64af11cd0b1b77f = ((u32(((u32(1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e04744c89e4e9736328653a() {
  return __cxx_static_address_4e04744c89e4e9736328653a.reference || (__cxx_static_address_4e04744c89e4e9736328653a.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_b64af11cd0b1b77f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_f0866ea83026865a = ((u32(((u32(1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12f8c5ae8486640c2310e5c2() {
  return __cxx_static_address_12f8c5ae8486640c2310e5c2.reference || (__cxx_static_address_12f8c5ae8486640c2310e5c2.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_f0866ea83026865a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_a5b84367ba368be7 = ((u32(((u32(1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea4fa5916ab092dfd691449e() {
  return __cxx_static_address_ea4fa5916ab092dfd691449e.reference || (__cxx_static_address_ea4fa5916ab092dfd691449e.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_a5b84367ba368be7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_80d6eb6eef400431 = ((u32(((u32(1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ee53aef66be1fca7bf45a8a() {
  return __cxx_static_address_1ee53aef66be1fca7bf45a8a.reference || (__cxx_static_address_1ee53aef66be1fca7bf45a8a.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_80d6eb6eef400431; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_4af54a3f34a57faf = ((u32(((u32(1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac1c883caa94f8f211959f84() {
  return __cxx_static_address_ac1c883caa94f8f211959f84.reference || (__cxx_static_address_ac1c883caa94f8f211959f84.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_4af54a3f34a57faf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_a4090b548b198a19 = ((u32(((u32(1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20adba49d0059bfebaeb22e6() {
  return __cxx_static_address_20adba49d0059bfebaeb22e6.reference || (__cxx_static_address_20adba49d0059bfebaeb22e6.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_a4090b548b198a19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_942d7a8b948e10d6 = ((u32(((u32(1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a348a6093dc81fc979d17314() {
  return __cxx_static_address_a348a6093dc81fc979d17314.reference || (__cxx_static_address_a348a6093dc81fc979d17314.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_942d7a8b948e10d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_9e1a3cb05b2db636 = ((u32(((u32(1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7be4d82f3d352f72d629f1b4() {
  return __cxx_static_address_7be4d82f3d352f72d629f1b4.reference || (__cxx_static_address_7be4d82f3d352f72d629f1b4.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_9e1a3cb05b2db636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_6a870f74a31fd8ee = ((u32(((u32(1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_910001db988f107445b0c73e() {
  return __cxx_static_address_910001db988f107445b0c73e.reference || (__cxx_static_address_910001db988f107445b0c73e.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_6a870f74a31fd8ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_c9b3df1cd28affad = ((u32(((u32(1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01c8d39c05186f7291bb03a6() {
  return __cxx_static_address_01c8d39c05186f7291bb03a6.reference || (__cxx_static_address_01c8d39c05186f7291bb03a6.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_c9b3df1cd28affad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_9580c8df3dbb902b = ((u32(((u32(1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e514acfb65cef3b6b8d49177() {
  return __cxx_static_address_e514acfb65cef3b6b8d49177.reference || (__cxx_static_address_e514acfb65cef3b6b8d49177.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_9580c8df3dbb902b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_b53f5b251b028c01 = ((u32(((u32(1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93f009fd52c45c7269305546() {
  return __cxx_static_address_93f009fd52c45c7269305546.reference || (__cxx_static_address_93f009fd52c45c7269305546.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_b53f5b251b028c01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_7a9274b37c918790 = ((u32(((u32(1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03c526bf792f10df0a5b1864() {
  return __cxx_static_address_03c526bf792f10df0a5b1864.reference || (__cxx_static_address_03c526bf792f10df0a5b1864.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_7a9274b37c918790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_81ec808bbfa150b4 = ((u32(((u32(1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caa3c07231f8873451b92fff() {
  return __cxx_static_address_caa3c07231f8873451b92fff.reference || (__cxx_static_address_caa3c07231f8873451b92fff.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_81ec808bbfa150b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_0e3aad14f1a3afdc = ((u32(((u32(1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdf7b6538121575fda62454e() {
  return __cxx_static_address_bdf7b6538121575fda62454e.reference || (__cxx_static_address_bdf7b6538121575fda62454e.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_0e3aad14f1a3afdc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_32ae140743c6069d = ((u32(((u32(1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cc99e7e94c4e8ffa9a1ef46() {
  return __cxx_static_address_5cc99e7e94c4e8ffa9a1ef46.reference || (__cxx_static_address_5cc99e7e94c4e8ffa9a1ef46.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_32ae140743c6069d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_d2293c69d6d36acd = ((u32(((u32(1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57804fba42f316d4affcad77() {
  return __cxx_static_address_57804fba42f316d4affcad77.reference || (__cxx_static_address_57804fba42f316d4affcad77.reference = {
    __cReference: true,
    get value() { return RECON____header_global_d2293c69d6d36acd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_e5ec7c152c9c45c8 = ((u32(((u32(1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_935e03d2b34ba9d46255f37a() {
  return __cxx_static_address_935e03d2b34ba9d46255f37a.reference || (__cxx_static_address_935e03d2b34ba9d46255f37a.reference = {
    __cReference: true,
    get value() { return TANK____header_global_e5ec7c152c9c45c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_07089886e451bfc1 = ((u32(((u32(2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f388fbeaadf7e7447ef3ce31() {
  return __cxx_static_address_f388fbeaadf7e7447ef3ce31.reference || (__cxx_static_address_f388fbeaadf7e7447ef3ce31.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_07089886e451bfc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_10088c628d7b8a8b = ((u32(((u32(2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8967db49333879ff6fe254c4() {
  return __cxx_static_address_8967db49333879ff6fe254c4.reference || (__cxx_static_address_8967db49333879ff6fe254c4.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_10088c628d7b8a8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_96796b83bbb6bb4b = ((u32(((u32(2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2b26d9e9e6e7ee53b4c8528() {
  return __cxx_static_address_d2b26d9e9e6e7ee53b4c8528.reference || (__cxx_static_address_d2b26d9e9e6e7ee53b4c8528.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_96796b83bbb6bb4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_47f4f66995197172 = ((u32(((u32(2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ba7a6fdf3d92050dcdf96dd() {
  return __cxx_static_address_5ba7a6fdf3d92050dcdf96dd.reference || (__cxx_static_address_5ba7a6fdf3d92050dcdf96dd.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_47f4f66995197172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_55f42abd0f3f9286 = ((u32(((u32(2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f01c1cb09da4fe34be77bf1() {
  return __cxx_static_address_1f01c1cb09da4fe34be77bf1.reference || (__cxx_static_address_1f01c1cb09da4fe34be77bf1.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_55f42abd0f3f9286; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_e7cd2fe67f637be8 = ((u32(((u32(2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8527cf54ee2dda7f626cd242() {
  return __cxx_static_address_8527cf54ee2dda7f626cd242.reference || (__cxx_static_address_8527cf54ee2dda7f626cd242.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_e7cd2fe67f637be8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_ed362a305f732f86 = ((u32(((u32(2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65e18778bb8bd7f18169b3b1() {
  return __cxx_static_address_65e18778bb8bd7f18169b3b1.reference || (__cxx_static_address_65e18778bb8bd7f18169b3b1.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_ed362a305f732f86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_d209cd909ebf6402 = ((u32(((u32(2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f98f6e3828521f6043ef8c32() {
  return __cxx_static_address_f98f6e3828521f6043ef8c32.reference || (__cxx_static_address_f98f6e3828521f6043ef8c32.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_d209cd909ebf6402; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_1330e02d2d738ccd = ((u32(((u32(2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e0a0382d8bc6e4143137be6() {
  return __cxx_static_address_1e0a0382d8bc6e4143137be6.reference || (__cxx_static_address_1e0a0382d8bc6e4143137be6.reference = {
    __cReference: true,
    get value() { return FECES____header_global_1330e02d2d738ccd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_c082755b302c68fd = ((u32(((u32(2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e9186e8a44756247d60576c() {
  return __cxx_static_address_5e9186e8a44756247d60576c.reference || (__cxx_static_address_5e9186e8a44756247d60576c.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_c082755b302c68fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_49b51a0bedd607a3 = ((u32(((u32(2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_040d6b519c075f3dd7d772ab() {
  return __cxx_static_address_040d6b519c075f3dd7d772ab.reference || (__cxx_static_address_040d6b519c075f3dd7d772ab.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_49b51a0bedd607a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_dcaf16ffa4eb5564 = ((u32(((u32(2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c26e76ba3d5a93f08e61fc4c() {
  return __cxx_static_address_c26e76ba3d5a93f08e61fc4c.reference || (__cxx_static_address_c26e76ba3d5a93f08e61fc4c.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_dcaf16ffa4eb5564; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_46e289d559cb6dd6 = ((u32(((u32(2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f287cc61a5ae04c773a3aad9() {
  return __cxx_static_address_f287cc61a5ae04c773a3aad9.reference || (__cxx_static_address_f287cc61a5ae04c773a3aad9.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_46e289d559cb6dd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_03c7aba41369d813 = ((u32(((u32(2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60b84affb83cdb13a21d37b9() {
  return __cxx_static_address_60b84affb83cdb13a21d37b9.reference || (__cxx_static_address_60b84affb83cdb13a21d37b9.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_03c7aba41369d813; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_2f8fa9dd3e21546a = ((u32(((u32(2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2dcfbf08f01c2b88f967f27() {
  return __cxx_static_address_c2dcfbf08f01c2b88f967f27.reference || (__cxx_static_address_c2dcfbf08f01c2b88f967f27.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_2f8fa9dd3e21546a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_7c2574d1a3cbfe13 = ((u32(((u32(2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3156788cbf0c607819d9e6ff() {
  return __cxx_static_address_3156788cbf0c607819d9e6ff.reference || (__cxx_static_address_3156788cbf0c607819d9e6ff.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_7c2574d1a3cbfe13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_831ebbf54930e813 = ((u32(((u32(2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_064a84c8c927f23bae1cfb9f() {
  return __cxx_static_address_064a84c8c927f23bae1cfb9f.reference || (__cxx_static_address_064a84c8c927f23bae1cfb9f.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_831ebbf54930e813; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_65bcf7f1fd668e81 = ((u32(((u32(2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efbf8f6c0a4f83e6df47e316() {
  return __cxx_static_address_efbf8f6c0a4f83e6df47e316.reference || (__cxx_static_address_efbf8f6c0a4f83e6df47e316.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_65bcf7f1fd668e81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_9020b43dcf1816b6 = ((u32(((u32(2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beb163f4f1ae6d93a218cbbb() {
  return __cxx_static_address_beb163f4f1ae6d93a218cbbb.reference || (__cxx_static_address_beb163f4f1ae6d93a218cbbb.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_9020b43dcf1816b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_6c59fcc03ba1e83b = ((u32(((u32(2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48b7680333634f942bb26445() {
  return __cxx_static_address_48b7680333634f942bb26445.reference || (__cxx_static_address_48b7680333634f942bb26445.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_6c59fcc03ba1e83b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_f1aa23ce025e1485 = ((u32(((u32(2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eef3b799d818ee0d0cb157c() {
  return __cxx_static_address_4eef3b799d818ee0d0cb157c.reference || (__cxx_static_address_4eef3b799d818ee0d0cb157c.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_f1aa23ce025e1485; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_75677598686c1f87 = ((u32(((u32(2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c0f1b4db348520b9b43ca29() {
  return __cxx_static_address_5c0f1b4db348520b9b43ca29.reference || (__cxx_static_address_5c0f1b4db348520b9b43ca29.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_75677598686c1f87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_3d04796cfccc4fa1 = ((u32(((u32(2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_967687c44b91d5643aa0729d() {
  return __cxx_static_address_967687c44b91d5643aa0729d.reference || (__cxx_static_address_967687c44b91d5643aa0729d.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_3d04796cfccc4fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_7100674ee04804c6 = ((u32(((u32(2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da75863c51acfddc5ad8e709() {
  return __cxx_static_address_da75863c51acfddc5ad8e709.reference || (__cxx_static_address_da75863c51acfddc5ad8e709.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_7100674ee04804c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_9ac8d9fe4fea7585 = ((u32(((u32(2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ce42a592ffd51e744f1fd34() {
  return __cxx_static_address_0ce42a592ffd51e744f1fd34.reference || (__cxx_static_address_0ce42a592ffd51e744f1fd34.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_9ac8d9fe4fea7585; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_ca728cbc95c7e9f7 = ((u32(((u32(2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43a7a5a58326ec6fb9e3ec97() {
  return __cxx_static_address_43a7a5a58326ec6fb9e3ec97.reference || (__cxx_static_address_43a7a5a58326ec6fb9e3ec97.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_ca728cbc95c7e9f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_20ed08477528059b = ((u32(((u32(2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c70f428f239f5514f4905618() {
  return __cxx_static_address_c70f428f239f5514f4905618.reference || (__cxx_static_address_c70f428f239f5514f4905618.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_20ed08477528059b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_484cc478adff3695 = ((u32(((u32(2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c41b97357743764c088c22() {
  return __cxx_static_address_69c41b97357743764c088c22.reference || (__cxx_static_address_69c41b97357743764c088c22.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_484cc478adff3695; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_3000cb7a5a0669d3 = ((u32(((u32(2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b1c7a5906f635ede207f3a4() {
  return __cxx_static_address_7b1c7a5906f635ede207f3a4.reference || (__cxx_static_address_7b1c7a5906f635ede207f3a4.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_3000cb7a5a0669d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_7b5f48d46f751603 = ((u32(((u32(2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f95b5ba265de19903b462c64() {
  return __cxx_static_address_f95b5ba265de19903b462c64.reference || (__cxx_static_address_f95b5ba265de19903b462c64.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_7b5f48d46f751603; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_fd59ac5cdcff9979 = ((u32(((u32(2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5943162ed7aaa8183bc1f138() {
  return __cxx_static_address_5943162ed7aaa8183bc1f138.reference || (__cxx_static_address_5943162ed7aaa8183bc1f138.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_fd59ac5cdcff9979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_9f89377e18fc54a1 = ((u32(((u32(2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c74fce393e32cc22db312b62() {
  return __cxx_static_address_c74fce393e32cc22db312b62.reference || (__cxx_static_address_c74fce393e32cc22db312b62.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_9f89377e18fc54a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_efdf86fb32c5fd59 = ((u32(((u32(2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2132461b4aa4a74adcd94398() {
  return __cxx_static_address_2132461b4aa4a74adcd94398.reference || (__cxx_static_address_2132461b4aa4a74adcd94398.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_efdf86fb32c5fd59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_ca7d9fa7eb27cb06 = ((u32(((u32(2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74ebe69050bca47657d3e47b() {
  return __cxx_static_address_74ebe69050bca47657d3e47b.reference || (__cxx_static_address_74ebe69050bca47657d3e47b.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_ca7d9fa7eb27cb06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_530c69ffa635a12a = ((u32(((u32(2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0602b9cbe65c60a0d686f752() {
  return __cxx_static_address_0602b9cbe65c60a0d686f752.reference || (__cxx_static_address_0602b9cbe65c60a0d686f752.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_530c69ffa635a12a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_813bb12f3dd26b97 = ((u32(((u32(2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2e7e4e985938431871aab29() {
  return __cxx_static_address_f2e7e4e985938431871aab29.reference || (__cxx_static_address_f2e7e4e985938431871aab29.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_813bb12f3dd26b97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_2f853c745dbfb44e = ((u32(((u32(2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aecf700916a20132a07cdc78() {
  return __cxx_static_address_aecf700916a20132a07cdc78.reference || (__cxx_static_address_aecf700916a20132a07cdc78.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_2f853c745dbfb44e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_f45f1ad3ee4c6e78 = ((u32(((u32(2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2c7ada1bc7941475fd50a05() {
  return __cxx_static_address_d2c7ada1bc7941475fd50a05.reference || (__cxx_static_address_d2c7ada1bc7941475fd50a05.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_f45f1ad3ee4c6e78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_fb80b4ad0d450d5a = ((u32(((u32(2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b813cf8724f9ae525059500() {
  return __cxx_static_address_8b813cf8724f9ae525059500.reference || (__cxx_static_address_8b813cf8724f9ae525059500.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_fb80b4ad0d450d5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_0f56d7074efd2141 = ((u32(((u32(2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e4f82e2328606c9c1a9510e() {
  return __cxx_static_address_2e4f82e2328606c9c1a9510e.reference || (__cxx_static_address_2e4f82e2328606c9c1a9510e.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_0f56d7074efd2141; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_ed0aac6a13baefba = ((u32(((u32(2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bedfd8850f5efd3d4e5a8f65() {
  return __cxx_static_address_bedfd8850f5efd3d4e5a8f65.reference || (__cxx_static_address_bedfd8850f5efd3d4e5a8f65.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_ed0aac6a13baefba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_d06463247318a13a = ((u32(((u32(2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48b9a9675467af90700d9488() {
  return __cxx_static_address_48b9a9675467af90700d9488.reference || (__cxx_static_address_48b9a9675467af90700d9488.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_d06463247318a13a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_d8d56242ba113d64 = ((u32(((u32(2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_298c24a77aad37b5d4e366b0() {
  return __cxx_static_address_298c24a77aad37b5d4e366b0.reference || (__cxx_static_address_298c24a77aad37b5d4e366b0.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_d8d56242ba113d64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_4c5b9e40a43fc187 = ((u32(((u32(2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59a4cf7c25abfe44a3e630fd() {
  return __cxx_static_address_59a4cf7c25abfe44a3e630fd.reference || (__cxx_static_address_59a4cf7c25abfe44a3e630fd.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_4c5b9e40a43fc187; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_4c3030b03b115a20 = ((u32(((u32(2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_155094efab5a73f93eb80105() {
  return __cxx_static_address_155094efab5a73f93eb80105.reference || (__cxx_static_address_155094efab5a73f93eb80105.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_4c3030b03b115a20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_a851bb8adb00207e = ((u32(((u32(2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1efaad7b0e94a839e0513b14() {
  return __cxx_static_address_1efaad7b0e94a839e0513b14.reference || (__cxx_static_address_1efaad7b0e94a839e0513b14.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_a851bb8adb00207e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_bf6c0d2868a4bf68 = ((u32(((u32(2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2495a63f1609d6d2e736aefa() {
  return __cxx_static_address_2495a63f1609d6d2e736aefa.reference || (__cxx_static_address_2495a63f1609d6d2e736aefa.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_bf6c0d2868a4bf68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_57fd4dbbf14317ec = ((u32(((u32(2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45219a60f1e421311cbd58a1() {
  return __cxx_static_address_45219a60f1e421311cbd58a1.reference || (__cxx_static_address_45219a60f1e421311cbd58a1.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_57fd4dbbf14317ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_c5427c98d9ea3d79 = ((u32(((u32(2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3be3e9601acb8494d891df66() {
  return __cxx_static_address_3be3e9601acb8494d891df66.reference || (__cxx_static_address_3be3e9601acb8494d891df66.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_c5427c98d9ea3d79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_7aff447fbeda671a = ((u32(((u32(2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6077064995f3f937592e634a() {
  return __cxx_static_address_6077064995f3f937592e634a.reference || (__cxx_static_address_6077064995f3f937592e634a.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_7aff447fbeda671a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_6cd15b377f6e8d43 = ((u32(((u32(2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f54f3e15ef9002f329a977f() {
  return __cxx_static_address_7f54f3e15ef9002f329a977f.reference || (__cxx_static_address_7f54f3e15ef9002f329a977f.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_6cd15b377f6e8d43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_035bc93006724525 = ((u32(((u32(2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3da59a3c41b224c95a7be280() {
  return __cxx_static_address_3da59a3c41b224c95a7be280.reference || (__cxx_static_address_3da59a3c41b224c95a7be280.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_035bc93006724525; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_1620a776c3ef911b = ((u32(((u32(2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00573f0f1cb55212dab95ddf() {
  return __cxx_static_address_00573f0f1cb55212dab95ddf.reference || (__cxx_static_address_00573f0f1cb55212dab95ddf.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_1620a776c3ef911b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_95078a047355e0f2 = ((u32(((u32(2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ed4fc5ecca825e9965fbffb() {
  return __cxx_static_address_2ed4fc5ecca825e9965fbffb.reference || (__cxx_static_address_2ed4fc5ecca825e9965fbffb.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_95078a047355e0f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_d15b45fdf4c42452 = ((u32(((u32(2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7c86b0bb57f461aa6699bf8() {
  return __cxx_static_address_e7c86b0bb57f461aa6699bf8.reference || (__cxx_static_address_e7c86b0bb57f461aa6699bf8.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_d15b45fdf4c42452; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_59968fdf9d07d0f6 = ((u32(((u32(2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d841d29e05bee1e96be8e1c() {
  return __cxx_static_address_2d841d29e05bee1e96be8e1c.reference || (__cxx_static_address_2d841d29e05bee1e96be8e1c.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_59968fdf9d07d0f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_6d0d58ec3a0c8220 = ((u32(((u32(2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_458dd6aae456706c35c498c4() {
  return __cxx_static_address_458dd6aae456706c35c498c4.reference || (__cxx_static_address_458dd6aae456706c35c498c4.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_6d0d58ec3a0c8220; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_1eb6151fd76710e8 = ((u32(((u32(2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31b09660b57bb5957cef67a0() {
  return __cxx_static_address_31b09660b57bb5957cef67a0.reference || (__cxx_static_address_31b09660b57bb5957cef67a0.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_1eb6151fd76710e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_6beb5a64d008f11a = ((u32(((u32(2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c33fdcc963052c2d1dea0fa9() {
  return __cxx_static_address_c33fdcc963052c2d1dea0fa9.reference || (__cxx_static_address_c33fdcc963052c2d1dea0fa9.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_6beb5a64d008f11a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_586165772a5ecd5f = ((u32(((u32(2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4843396e7f911d665fb2b994() {
  return __cxx_static_address_4843396e7f911d665fb2b994.reference || (__cxx_static_address_4843396e7f911d665fb2b994.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_586165772a5ecd5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_2792e5fd80d0d430 = ((u32(((u32(2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf30366fecc5e40af82b339f() {
  return __cxx_static_address_bf30366fecc5e40af82b339f.reference || (__cxx_static_address_bf30366fecc5e40af82b339f.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_2792e5fd80d0d430; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_06f066fa06e68a7a = ((u32(((u32(2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5465b6b8dcd953f943ff11a() {
  return __cxx_static_address_c5465b6b8dcd953f943ff11a.reference || (__cxx_static_address_c5465b6b8dcd953f943ff11a.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_06f066fa06e68a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_1198973309e9e8ee = ((u32(((u32(2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_554b56ea3b38ee6acf2204e0() {
  return __cxx_static_address_554b56ea3b38ee6acf2204e0.reference || (__cxx_static_address_554b56ea3b38ee6acf2204e0.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_1198973309e9e8ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_6f8ce3c0257678e2 = ((u32(((u32(2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09c67f4219b332b8ac14f9f7() {
  return __cxx_static_address_09c67f4219b332b8ac14f9f7.reference || (__cxx_static_address_09c67f4219b332b8ac14f9f7.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_6f8ce3c0257678e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_158af9a1ba59f9cf = ((u32(((u32(2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21e3ae06fba40ce2f4166821() {
  return __cxx_static_address_21e3ae06fba40ce2f4166821.reference || (__cxx_static_address_21e3ae06fba40ce2f4166821.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_158af9a1ba59f9cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_3630b74745dd733f = ((u32(((u32(2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c49176a02d1801517e36779() {
  return __cxx_static_address_3c49176a02d1801517e36779.reference || (__cxx_static_address_3c49176a02d1801517e36779.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_3630b74745dd733f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_8cde503186689a1c = ((u32(((u32(2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1024e340f0605e0cc006a5a6() {
  return __cxx_static_address_1024e340f0605e0cc006a5a6.reference || (__cxx_static_address_1024e340f0605e0cc006a5a6.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_8cde503186689a1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_6fd3b50f264da705 = ((u32(((u32(2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b27f2ecd0970325e060ab560() {
  return __cxx_static_address_b27f2ecd0970325e060ab560.reference || (__cxx_static_address_b27f2ecd0970325e060ab560.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_6fd3b50f264da705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_7f74239db51ee002 = ((u32(((u32(2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47cf84ed7361efae9db5bd93() {
  return __cxx_static_address_47cf84ed7361efae9db5bd93.reference || (__cxx_static_address_47cf84ed7361efae9db5bd93.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_7f74239db51ee002; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_5874ef39e673bc5b = ((u32(((u32(2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa7d3f21fe592b80a9638d23() {
  return __cxx_static_address_aa7d3f21fe592b80a9638d23.reference || (__cxx_static_address_aa7d3f21fe592b80a9638d23.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_5874ef39e673bc5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_807f501bba457673 = ((u32(((u32(2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a35df3fc88d57820e80fadfd() {
  return __cxx_static_address_a35df3fc88d57820e80fadfd.reference || (__cxx_static_address_a35df3fc88d57820e80fadfd.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_807f501bba457673; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_0f235d295c421662 = ((u32(((u32(2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe4ee3f10f2f9f91808552a6() {
  return __cxx_static_address_fe4ee3f10f2f9f91808552a6.reference || (__cxx_static_address_fe4ee3f10f2f9f91808552a6.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_0f235d295c421662; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_e29771aab995754a = ((u32(((u32(2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8476a9a57e676a55270bdb7a() {
  return __cxx_static_address_8476a9a57e676a55270bdb7a.reference || (__cxx_static_address_8476a9a57e676a55270bdb7a.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_e29771aab995754a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_8daf90c13a1bf258 = ((u32(((u32(2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d1650ef19c0c062a1c636df() {
  return __cxx_static_address_1d1650ef19c0c062a1c636df.reference || (__cxx_static_address_1d1650ef19c0c062a1c636df.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_8daf90c13a1bf258; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_20ca9248731d26ec = ((u32(((u32(2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1bb3c728d3738be94c84acb() {
  return __cxx_static_address_c1bb3c728d3738be94c84acb.reference || (__cxx_static_address_c1bb3c728d3738be94c84acb.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_20ca9248731d26ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_6285e755fb2da861 = ((u32(((u32(2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e36e6ed1503fbfc75047a290() {
  return __cxx_static_address_e36e6ed1503fbfc75047a290.reference || (__cxx_static_address_e36e6ed1503fbfc75047a290.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_6285e755fb2da861; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_bd2bd1571a29e436 = ((u32(((u32(2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe71ae3ec3b570b5897643fd() {
  return __cxx_static_address_fe71ae3ec3b570b5897643fd.reference || (__cxx_static_address_fe71ae3ec3b570b5897643fd.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_bd2bd1571a29e436; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_e7fd2a98526784d6 = ((u32(((u32(2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bb4f8f440a2a9147dcf64a9() {
  return __cxx_static_address_5bb4f8f440a2a9147dcf64a9.reference || (__cxx_static_address_5bb4f8f440a2a9147dcf64a9.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_e7fd2a98526784d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_fb7a0b20b567a1f4 = ((u32(((u32(2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f472caae99f384effbf04e0() {
  return __cxx_static_address_6f472caae99f384effbf04e0.reference || (__cxx_static_address_6f472caae99f384effbf04e0.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_fb7a0b20b567a1f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_607729d4441e33f8 = ((u32(((u32(2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3fc2669cdea502de585c96d() {
  return __cxx_static_address_d3fc2669cdea502de585c96d.reference || (__cxx_static_address_d3fc2669cdea502de585c96d.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_607729d4441e33f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_753ba10801f4e6ce = ((u32(((u32(2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05c918f0a3dc6cb42a50d390() {
  return __cxx_static_address_05c918f0a3dc6cb42a50d390.reference || (__cxx_static_address_05c918f0a3dc6cb42a50d390.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_753ba10801f4e6ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_02fc32534398d689 = ((u32(((u32(2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3af2f61ac38794fde059fc19() {
  return __cxx_static_address_3af2f61ac38794fde059fc19.reference || (__cxx_static_address_3af2f61ac38794fde059fc19.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_02fc32534398d689; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_4a3d7157e672b2b0 = ((u32(((u32(2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f1422f57b60236d804b3da1() {
  return __cxx_static_address_3f1422f57b60236d804b3da1.reference || (__cxx_static_address_3f1422f57b60236d804b3da1.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_4a3d7157e672b2b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_e50006b5cb33e6a0 = ((u32(((u32(2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5c644b1b3044363246cbef() {
  return __cxx_static_address_ee5c644b1b3044363246cbef.reference || (__cxx_static_address_ee5c644b1b3044363246cbef.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_e50006b5cb33e6a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_177fc4671b1b5053 = ((u32(((u32(2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e70249ad92cf2f2487ad9faa() {
  return __cxx_static_address_e70249ad92cf2f2487ad9faa.reference || (__cxx_static_address_e70249ad92cf2f2487ad9faa.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_177fc4671b1b5053; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_e3192d614dacde68 = ((u32(((u32(2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ad7c72a899c5f88415da4f() {
  return __cxx_static_address_e1ad7c72a899c5f88415da4f.reference || (__cxx_static_address_e1ad7c72a899c5f88415da4f.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_e3192d614dacde68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_ff8ed4e66e3a82d9 = ((u32(((u32(2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a96b070999f956c458e1b28() {
  return __cxx_static_address_8a96b070999f956c458e1b28.reference || (__cxx_static_address_8a96b070999f956c458e1b28.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_ff8ed4e66e3a82d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_6ff166ac3b77ff4a = ((u32(((u32(2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acc8bea26864b841c20c7513() {
  return __cxx_static_address_acc8bea26864b841c20c7513.reference || (__cxx_static_address_acc8bea26864b841c20c7513.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_6ff166ac3b77ff4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_e0db41edcf44184a = ((u32(((u32(2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d1064721d6c02379e373c80() {
  return __cxx_static_address_9d1064721d6c02379e373c80.reference || (__cxx_static_address_9d1064721d6c02379e373c80.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_e0db41edcf44184a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_0dcf708d04d4db07 = ((u32(((u32(2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c693da2add0d94e55e673b30() {
  return __cxx_static_address_c693da2add0d94e55e673b30.reference || (__cxx_static_address_c693da2add0d94e55e673b30.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_0dcf708d04d4db07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_b4e97f9c3ab67118 = ((u32(((u32(2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c30f33e2011df4eb68397f1a() {
  return __cxx_static_address_c30f33e2011df4eb68397f1a.reference || (__cxx_static_address_c30f33e2011df4eb68397f1a.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_b4e97f9c3ab67118; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_464dafa5ec6fbb6d = ((u32(((u32(2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c6dd5bf51560fe069288ed3() {
  return __cxx_static_address_9c6dd5bf51560fe069288ed3.reference || (__cxx_static_address_9c6dd5bf51560fe069288ed3.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_464dafa5ec6fbb6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_e4b41d0b320a45e0 = ((u32(((u32(2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cba84735d0d10bb96c59905d() {
  return __cxx_static_address_cba84735d0d10bb96c59905d.reference || (__cxx_static_address_cba84735d0d10bb96c59905d.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_e4b41d0b320a45e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_0c084a031bb3452e = ((u32(((u32(2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f0e081f392699caea491114() {
  return __cxx_static_address_0f0e081f392699caea491114.reference || (__cxx_static_address_0f0e081f392699caea491114.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_0c084a031bb3452e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_cbe5df2fbc3d004a = ((u32(((u32(2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da6b964b89fcc34fc5f81bd7() {
  return __cxx_static_address_da6b964b89fcc34fc5f81bd7.reference || (__cxx_static_address_da6b964b89fcc34fc5f81bd7.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_cbe5df2fbc3d004a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_bbc3df83231476da = ((u32(((u32(2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5fa4f0ec3b664e9bf4badc0() {
  return __cxx_static_address_f5fa4f0ec3b664e9bf4badc0.reference || (__cxx_static_address_f5fa4f0ec3b664e9bf4badc0.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_bbc3df83231476da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_466c33d0c07e26d7 = ((u32(((u32(2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_102f19cc92ad4b216cc50f65() {
  return __cxx_static_address_102f19cc92ad4b216cc50f65.reference || (__cxx_static_address_102f19cc92ad4b216cc50f65.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_466c33d0c07e26d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_ee93d763ad7e1c49 = ((u32(((u32(2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97a294d35181b95b00b1d1f0() {
  return __cxx_static_address_97a294d35181b95b00b1d1f0.reference || (__cxx_static_address_97a294d35181b95b00b1d1f0.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_ee93d763ad7e1c49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_6ae3fb6e8ab8f617 = ((u32(((u32(2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9278489bbbac2f6871ed81c7() {
  return __cxx_static_address_9278489bbbac2f6871ed81c7.reference || (__cxx_static_address_9278489bbbac2f6871ed81c7.reference = {
    __cReference: true,
    get value() { return TIP____header_global_6ae3fb6e8ab8f617; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_dab228f48774eeb1 = ((u32(((u32(2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2106413946848c3dfb94cb9() {
  return __cxx_static_address_c2106413946848c3dfb94cb9.reference || (__cxx_static_address_c2106413946848c3dfb94cb9.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_dab228f48774eeb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_d7a66ac168d44a53 = ((u32(((u32(2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3f7bb17b7a0e8b8abf183d4() {
  return __cxx_static_address_a3f7bb17b7a0e8b8abf183d4.reference || (__cxx_static_address_a3f7bb17b7a0e8b8abf183d4.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_d7a66ac168d44a53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_8bc2a3871a45d572 = ((u32(((u32(2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25521093d8757952bc316757() {
  return __cxx_static_address_25521093d8757952bc316757.reference || (__cxx_static_address_25521093d8757952bc316757.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_8bc2a3871a45d572; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_68ecba1754ca46dc = ((u32(((u32(2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a491ae5f74ccb9e61d2bb4b() {
  return __cxx_static_address_6a491ae5f74ccb9e61d2bb4b.reference || (__cxx_static_address_6a491ae5f74ccb9e61d2bb4b.reference = {
    __cReference: true,
    get value() { return RPG____header_global_68ecba1754ca46dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_2092f370359ff44d = ((u32(((u32(2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21b67b59d7d22d19d98b450d() {
  return __cxx_static_address_21b67b59d7d22d19d98b450d.reference || (__cxx_static_address_21b67b59d7d22d19d98b450d.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_2092f370359ff44d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_bcf9327aeb95729f = ((u32(((u32(2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d92c57441b38e23643516f1() {
  return __cxx_static_address_2d92c57441b38e23643516f1.reference || (__cxx_static_address_2d92c57441b38e23643516f1.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_bcf9327aeb95729f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_dc9dc711b501e7c4 = ((u32(((u32(2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc970d15344d4feabdc76179() {
  return __cxx_static_address_fc970d15344d4feabdc76179.reference || (__cxx_static_address_fc970d15344d4feabdc76179.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_dc9dc711b501e7c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_c3d4b0777b97bd4d = ((u32(((u32(2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e315c8ab212b32dc47d68ac() {
  return __cxx_static_address_1e315c8ab212b32dc47d68ac.reference || (__cxx_static_address_1e315c8ab212b32dc47d68ac.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_c3d4b0777b97bd4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_ae913e28872706af = ((u32(((u32(2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a74828153401a5d7da62a44() {
  return __cxx_static_address_0a74828153401a5d7da62a44.reference || (__cxx_static_address_0a74828153401a5d7da62a44.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_ae913e28872706af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_158cc27fbd544a4d = ((u32(((u32(2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55ce914e608625161ca6699d() {
  return __cxx_static_address_55ce914e608625161ca6699d.reference || (__cxx_static_address_55ce914e608625161ca6699d.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_158cc27fbd544a4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_d1a37e847ba76f50 = ((u32(((u32(2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e79cb198a6561193a0704ade() {
  return __cxx_static_address_e79cb198a6561193a0704ade.reference || (__cxx_static_address_e79cb198a6561193a0704ade.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_d1a37e847ba76f50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_48e25e10ce623ac3 = ((u32(((u32(2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af53a1d736257c61a9085435() {
  return __cxx_static_address_af53a1d736257c61a9085435.reference || (__cxx_static_address_af53a1d736257c61a9085435.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_48e25e10ce623ac3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_3f197474d986df15 = ((u32(((u32(2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e853127f3031c737c6ed11ab() {
  return __cxx_static_address_e853127f3031c737c6ed11ab.reference || (__cxx_static_address_e853127f3031c737c6ed11ab.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_3f197474d986df15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_a248faa8fc46ddcf = ((u32(((u32(2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6316672fc6dd56739792a5ea() {
  return __cxx_static_address_6316672fc6dd56739792a5ea.reference || (__cxx_static_address_6316672fc6dd56739792a5ea.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_a248faa8fc46ddcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_a959c321ed1c5a13 = ((u32(((u32(2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a453f29075f85fdc762bc7a() {
  return __cxx_static_address_3a453f29075f85fdc762bc7a.reference || (__cxx_static_address_3a453f29075f85fdc762bc7a.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_a959c321ed1c5a13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_c5045c97c0a4df56 = ((u32(((u32(2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1df8baba7a60ff6915376c6() {
  return __cxx_static_address_d1df8baba7a60ff6915376c6.reference || (__cxx_static_address_d1df8baba7a60ff6915376c6.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_c5045c97c0a4df56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_77ec2456728663e2 = ((u32(((u32(2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_514dd470f4dcb5a950cbb5cb() {
  return __cxx_static_address_514dd470f4dcb5a950cbb5cb.reference || (__cxx_static_address_514dd470f4dcb5a950cbb5cb.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_77ec2456728663e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_28bee0b2bdbd16a3 = ((u32(((u32(2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ec548734b91578e2f22f74d() {
  return __cxx_static_address_9ec548734b91578e2f22f74d.reference || (__cxx_static_address_9ec548734b91578e2f22f74d.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_28bee0b2bdbd16a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_983d8b5db6fcf1d0 = ((u32(((u32(3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a6ea58d728bd87ac67947e1() {
  return __cxx_static_address_0a6ea58d728bd87ac67947e1.reference || (__cxx_static_address_0a6ea58d728bd87ac67947e1.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_983d8b5db6fcf1d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_c14918c9ff9df8fd = ((u32(((u32(3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03431cedcc94ecad80608475() {
  return __cxx_static_address_03431cedcc94ecad80608475.reference || (__cxx_static_address_03431cedcc94ecad80608475.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_c14918c9ff9df8fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_507be8ca3f87ecd2 = ((u32(((u32(3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80b6a8fad969d13af94cd1f0() {
  return __cxx_static_address_80b6a8fad969d13af94cd1f0.reference || (__cxx_static_address_80b6a8fad969d13af94cd1f0.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_507be8ca3f87ecd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_bcad1db2d5c93da9 = ((u32(((u32(3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_efc3f6da0149fe765393263e() {
  return __cxx_static_address_efc3f6da0149fe765393263e.reference || (__cxx_static_address_efc3f6da0149fe765393263e.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_bcad1db2d5c93da9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_e3d6c78c8011798f = ((u32(((u32(3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fb5d4fe3d0cc24d9ac6e5bb() {
  return __cxx_static_address_9fb5d4fe3d0cc24d9ac6e5bb.reference || (__cxx_static_address_9fb5d4fe3d0cc24d9ac6e5bb.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_e3d6c78c8011798f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_0bc93aa3559049d8 = ((u32(((u32(3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37cf637969c6d72607ca1512() {
  return __cxx_static_address_37cf637969c6d72607ca1512.reference || (__cxx_static_address_37cf637969c6d72607ca1512.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_0bc93aa3559049d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_b6c67411ae6451ad = ((u32(((u32(3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25381dc4546ec2fb30a6344c() {
  return __cxx_static_address_25381dc4546ec2fb30a6344c.reference || (__cxx_static_address_25381dc4546ec2fb30a6344c.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_b6c67411ae6451ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_c20885d5d2a45239 = ((u32(((u32(3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97beb330bcfd4208513b4b4a() {
  return __cxx_static_address_97beb330bcfd4208513b4b4a.reference || (__cxx_static_address_97beb330bcfd4208513b4b4a.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_c20885d5d2a45239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_013db17a91eb64c5 = ((u32(((u32(3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4e3dccc3e2c2614dd9fd6ec() {
  return __cxx_static_address_d4e3dccc3e2c2614dd9fd6ec.reference || (__cxx_static_address_d4e3dccc3e2c2614dd9fd6ec.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_013db17a91eb64c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_59310763e10e1697 = ((u32(((u32(3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6abd80ba16ff1d632de60c76() {
  return __cxx_static_address_6abd80ba16ff1d632de60c76.reference || (__cxx_static_address_6abd80ba16ff1d632de60c76.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_59310763e10e1697; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_7ceed54edbc4f158 = ((u32(((u32(3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fad54e2f258620a0b6953c5() {
  return __cxx_static_address_8fad54e2f258620a0b6953c5.reference || (__cxx_static_address_8fad54e2f258620a0b6953c5.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_7ceed54edbc4f158; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_f314266421d21504 = ((u32(((u32(3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_576fd580f2df08bb58430ef7() {
  return __cxx_static_address_576fd580f2df08bb58430ef7.reference || (__cxx_static_address_576fd580f2df08bb58430ef7.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_f314266421d21504; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_2e01e259b336b047 = ((u32(((u32(3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e56696511c64cb62db65a361() {
  return __cxx_static_address_e56696511c64cb62db65a361.reference || (__cxx_static_address_e56696511c64cb62db65a361.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_2e01e259b336b047; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_d4d461ccbb747831 = ((u32(((u32(3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c7959f0ebf2321d2d911f7c() {
  return __cxx_static_address_4c7959f0ebf2321d2d911f7c.reference || (__cxx_static_address_4c7959f0ebf2321d2d911f7c.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_d4d461ccbb747831; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_b321c488840a33d8 = ((u32(((u32(3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8dc5766822c06cbea17b88d() {
  return __cxx_static_address_a8dc5766822c06cbea17b88d.reference || (__cxx_static_address_a8dc5766822c06cbea17b88d.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_b321c488840a33d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_a920f09dc0568465 = ((u32(((u32(3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be631146750a817b10ea380c() {
  return __cxx_static_address_be631146750a817b10ea380c.reference || (__cxx_static_address_be631146750a817b10ea380c.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_a920f09dc0568465; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_fd16efead5ed3dcf = ((u32(((u32(3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84f2d8bd35855f28cdb165e3() {
  return __cxx_static_address_84f2d8bd35855f28cdb165e3.reference || (__cxx_static_address_84f2d8bd35855f28cdb165e3.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_fd16efead5ed3dcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_cdf8d90dc690e877 = ((u32(((u32(3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb3f9af397a336786df2cd3e() {
  return __cxx_static_address_bb3f9af397a336786df2cd3e.reference || (__cxx_static_address_bb3f9af397a336786df2cd3e.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_cdf8d90dc690e877; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_4ed51b634d98770b = ((u32(((u32(3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a18c58d7b7a4ca3c2ac478cf() {
  return __cxx_static_address_a18c58d7b7a4ca3c2ac478cf.reference || (__cxx_static_address_a18c58d7b7a4ca3c2ac478cf.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_4ed51b634d98770b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_e65caeaf0f1dc1d6 = ((u32(((u32(3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72014c1a50cf739733c63739() {
  return __cxx_static_address_72014c1a50cf739733c63739.reference || (__cxx_static_address_72014c1a50cf739733c63739.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_e65caeaf0f1dc1d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_90156d065a16f56f = ((u32(((u32(3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a6d9e346bd00b06ce78f383() {
  return __cxx_static_address_1a6d9e346bd00b06ce78f383.reference || (__cxx_static_address_1a6d9e346bd00b06ce78f383.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_90156d065a16f56f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_255ab56def92a4fe = ((u32(((u32(3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99a0b652e7a25bdd9c9a3843() {
  return __cxx_static_address_99a0b652e7a25bdd9c9a3843.reference || (__cxx_static_address_99a0b652e7a25bdd9c9a3843.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_255ab56def92a4fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_7de906f3c1d975f9 = ((u32(((u32(4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_885684fe5963c758bf657c7c() {
  return __cxx_static_address_885684fe5963c758bf657c7c.reference || (__cxx_static_address_885684fe5963c758bf657c7c.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_7de906f3c1d975f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_6997a8cb7f18f6c3 = ((u32(((u32(4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71b4281c65e77245b4bc18b5() {
  return __cxx_static_address_71b4281c65e77245b4bc18b5.reference || (__cxx_static_address_71b4281c65e77245b4bc18b5.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_6997a8cb7f18f6c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_3d125c3b09412331 = ((u32(((u32(4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1496f404abf5062dc4e35268() {
  return __cxx_static_address_1496f404abf5062dc4e35268.reference || (__cxx_static_address_1496f404abf5062dc4e35268.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_3d125c3b09412331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_3c4689457af132c4 = ((u32(((u32(4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b835e940786146ff5f075917() {
  return __cxx_static_address_b835e940786146ff5f075917.reference || (__cxx_static_address_b835e940786146ff5f075917.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_3c4689457af132c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_32dc8f344272f21c = ((u32(((u32(4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79b8beed3c4684b3ecc48b56() {
  return __cxx_static_address_79b8beed3c4684b3ecc48b56.reference || (__cxx_static_address_79b8beed3c4684b3ecc48b56.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_32dc8f344272f21c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_a056ec48909cdc9e = ((u32(((u32(4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82c06c76292ea33f138c4f9f() {
  return __cxx_static_address_82c06c76292ea33f138c4f9f.reference || (__cxx_static_address_82c06c76292ea33f138c4f9f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_a056ec48909cdc9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_ac8d2b00b40c06c6 = ((u32(((u32(4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_591ae20adc4fece5a0b13ed5() {
  return __cxx_static_address_591ae20adc4fece5a0b13ed5.reference || (__cxx_static_address_591ae20adc4fece5a0b13ed5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_ac8d2b00b40c06c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_ca9ffe6ddf98d0d4 = ((u32(((u32(4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d767331a2a639caa4c6fa751() {
  return __cxx_static_address_d767331a2a639caa4c6fa751.reference || (__cxx_static_address_d767331a2a639caa4c6fa751.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_ca9ffe6ddf98d0d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_f4b96c14704a524e = ((u32(((u32(4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d39dbb10cb66c46b6827f83() {
  return __cxx_static_address_5d39dbb10cb66c46b6827f83.reference || (__cxx_static_address_5d39dbb10cb66c46b6827f83.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_f4b96c14704a524e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_c3f0ec0165e9ed26 = ((u32(((u32(4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_672af502369ceb6097dc90cf() {
  return __cxx_static_address_672af502369ceb6097dc90cf.reference || (__cxx_static_address_672af502369ceb6097dc90cf.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_c3f0ec0165e9ed26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_d48a294799dcad2d = ((u32(((u32(4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60706a435117e3fbe539b796() {
  return __cxx_static_address_60706a435117e3fbe539b796.reference || (__cxx_static_address_60706a435117e3fbe539b796.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_d48a294799dcad2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_43e59a612764c253 = ((u32(((u32(4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04eb07b843f5b72090d9ab35() {
  return __cxx_static_address_04eb07b843f5b72090d9ab35.reference || (__cxx_static_address_04eb07b843f5b72090d9ab35.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_43e59a612764c253; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_4c259c7815c53c44 = ((u32(((u32(4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99045af2b107f5960b6301ae() {
  return __cxx_static_address_99045af2b107f5960b6301ae.reference || (__cxx_static_address_99045af2b107f5960b6301ae.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_4c259c7815c53c44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_324f2e3a51710eec = ((u32(((u32(4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42a125c3bfd08b71aaf4d8e2() {
  return __cxx_static_address_42a125c3bfd08b71aaf4d8e2.reference || (__cxx_static_address_42a125c3bfd08b71aaf4d8e2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_324f2e3a51710eec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_fed763fd589e8cd8 = ((u32(((u32(4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b45533e956c04d7b50a07211() {
  return __cxx_static_address_b45533e956c04d7b50a07211.reference || (__cxx_static_address_b45533e956c04d7b50a07211.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_fed763fd589e8cd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_e4e9f3a2431149f2 = ((u32(((u32(4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95dafdd85fd6b7441f1d6f4d() {
  return __cxx_static_address_95dafdd85fd6b7441f1d6f4d.reference || (__cxx_static_address_95dafdd85fd6b7441f1d6f4d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_e4e9f3a2431149f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_0ffe6b48195a05d4 = ((u32(((u32(4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66fa8b52d3e3647c28f8fc04() {
  return __cxx_static_address_66fa8b52d3e3647c28f8fc04.reference || (__cxx_static_address_66fa8b52d3e3647c28f8fc04.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_0ffe6b48195a05d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_e36a2c3d2d1e445d = ((u32(((u32(4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a09e20580ebc4b1c7ae92351() {
  return __cxx_static_address_a09e20580ebc4b1c7ae92351.reference || (__cxx_static_address_a09e20580ebc4b1c7ae92351.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_e36a2c3d2d1e445d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_de47d7e450059566 = ((u32(((u32(4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28db8056f933eaf57463600c() {
  return __cxx_static_address_28db8056f933eaf57463600c.reference || (__cxx_static_address_28db8056f933eaf57463600c.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_de47d7e450059566; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_488620fd854dbaef = ((u32(((u32(4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82223bb11495fd9d582be6d1() {
  return __cxx_static_address_82223bb11495fd9d582be6d1.reference || (__cxx_static_address_82223bb11495fd9d582be6d1.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_488620fd854dbaef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_9512bc3c2fe66085 = ((u32(((u32(4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c530a2fb3cb45235d6d18d3() {
  return __cxx_static_address_4c530a2fb3cb45235d6d18d3.reference || (__cxx_static_address_4c530a2fb3cb45235d6d18d3.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_9512bc3c2fe66085; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_9938482947185c99 = ((u32(((u32(4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89a0a09e54b0433a2a0fcab0() {
  return __cxx_static_address_89a0a09e54b0433a2a0fcab0.reference || (__cxx_static_address_89a0a09e54b0433a2a0fcab0.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_9938482947185c99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_6b9484dfeceadb0b = ((u32(((u32(4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41e2c797de9a7e2d734bcc76() {
  return __cxx_static_address_41e2c797de9a7e2d734bcc76.reference || (__cxx_static_address_41e2c797de9a7e2d734bcc76.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_6b9484dfeceadb0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_2786cbeaf4de6b60 = ((u32(((u32(4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a1b709d661c54081dbbab6c() {
  return __cxx_static_address_4a1b709d661c54081dbbab6c.reference || (__cxx_static_address_4a1b709d661c54081dbbab6c.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_2786cbeaf4de6b60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_8dfe30228fd4bf08 = ((u32(((u32(4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21eb66c546e4b5769d66b267() {
  return __cxx_static_address_21eb66c546e4b5769d66b267.reference || (__cxx_static_address_21eb66c546e4b5769d66b267.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_8dfe30228fd4bf08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_ddf9bd8665ab5511 = ((u32(((u32(4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57e0f01f4daf1fce4e282567() {
  return __cxx_static_address_57e0f01f4daf1fce4e282567.reference || (__cxx_static_address_57e0f01f4daf1fce4e282567.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_ddf9bd8665ab5511; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_0588166c7308c9ab = ((u32(((u32(4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c61102fb2546a54c1b008103() {
  return __cxx_static_address_c61102fb2546a54c1b008103.reference || (__cxx_static_address_c61102fb2546a54c1b008103.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_0588166c7308c9ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_772fdff56c47e5d5 = ((u32(((u32(4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f9d4a275b1eb594f32a4484() {
  return __cxx_static_address_6f9d4a275b1eb594f32a4484.reference || (__cxx_static_address_6f9d4a275b1eb594f32a4484.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_772fdff56c47e5d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_08a4256f8fb6b787 = ((u32(((u32(4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82d580ec49c9204c6cc36c4e() {
  return __cxx_static_address_82d580ec49c9204c6cc36c4e.reference || (__cxx_static_address_82d580ec49c9204c6cc36c4e.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_08a4256f8fb6b787; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_8bbe5dbf73480c49 = ((u32(((u32(4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beec6f4ddd76a042f1f4f8bc() {
  return __cxx_static_address_beec6f4ddd76a042f1f4f8bc.reference || (__cxx_static_address_beec6f4ddd76a042f1f4f8bc.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_8bbe5dbf73480c49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_155bcd88e671d0c5 = ((u32(((u32(4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fd3ad67e6e08c5f5791ec07() {
  return __cxx_static_address_9fd3ad67e6e08c5f5791ec07.reference || (__cxx_static_address_9fd3ad67e6e08c5f5791ec07.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_155bcd88e671d0c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_798a5fca60ed5305 = ((u32(((u32(4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_999a8f8026f938c94f055ddd() {
  return __cxx_static_address_999a8f8026f938c94f055ddd.reference || (__cxx_static_address_999a8f8026f938c94f055ddd.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_798a5fca60ed5305; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_7651eb0057f98901 = ((u32(((u32(4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f6bc8e6539fc022ff86b27b() {
  return __cxx_static_address_3f6bc8e6539fc022ff86b27b.reference || (__cxx_static_address_3f6bc8e6539fc022ff86b27b.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_7651eb0057f98901; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_4aa655f78c93f7dc = ((u32(((u32(4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03c0a4e05fafcda32f15396e() {
  return __cxx_static_address_03c0a4e05fafcda32f15396e.reference || (__cxx_static_address_03c0a4e05fafcda32f15396e.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_4aa655f78c93f7dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_bb9d287248448813 = ((u32(((u32(4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8023c7d62a11a9248c523eba() {
  return __cxx_static_address_8023c7d62a11a9248c523eba.reference || (__cxx_static_address_8023c7d62a11a9248c523eba.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_bb9d287248448813; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_14c14da3941a9979 = ((u32(((u32(4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9895d444dcf0002d315f7071() {
  return __cxx_static_address_9895d444dcf0002d315f7071.reference || (__cxx_static_address_9895d444dcf0002d315f7071.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_14c14da3941a9979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_91236251f55ef933 = ((u32(((u32(4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b30b7f561fe83f93f86f435c() {
  return __cxx_static_address_b30b7f561fe83f93f86f435c.reference || (__cxx_static_address_b30b7f561fe83f93f86f435c.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_91236251f55ef933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_1da85be58aabd94e = ((u32(((u32(4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7c3213966ffe75f169ce44c() {
  return __cxx_static_address_f7c3213966ffe75f169ce44c.reference || (__cxx_static_address_f7c3213966ffe75f169ce44c.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_1da85be58aabd94e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_bd4d6165276ed877 = ((u32(((u32(4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e61b45640b7f36d26ca9adeb() {
  return __cxx_static_address_e61b45640b7f36d26ca9adeb.reference || (__cxx_static_address_e61b45640b7f36d26ca9adeb.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_bd4d6165276ed877; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_c80afa42a86d475b = ((u32(((u32(4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6a421840b6e95d49c529428() {
  return __cxx_static_address_e6a421840b6e95d49c529428.reference || (__cxx_static_address_e6a421840b6e95d49c529428.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_c80afa42a86d475b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_3ce9415b86659027 = ((u32(((u32(4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c41e8889fd2c143573c3e07() {
  return __cxx_static_address_1c41e8889fd2c143573c3e07.reference || (__cxx_static_address_1c41e8889fd2c143573c3e07.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_3ce9415b86659027; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_3a3245ec9fc9092e = ((u32(((u32(4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df3582351f86d83b7b27994b() {
  return __cxx_static_address_df3582351f86d83b7b27994b.reference || (__cxx_static_address_df3582351f86d83b7b27994b.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_3a3245ec9fc9092e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_438cb0401437254e = ((u32(((u32(4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edf42d74895cc5a7c0da56fe() {
  return __cxx_static_address_edf42d74895cc5a7c0da56fe.reference || (__cxx_static_address_edf42d74895cc5a7c0da56fe.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_438cb0401437254e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_9fcef71fd9db6683 = ((u32(((u32(4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c48ee1853e21ab8263ce8526() {
  return __cxx_static_address_c48ee1853e21ab8263ce8526.reference || (__cxx_static_address_c48ee1853e21ab8263ce8526.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_9fcef71fd9db6683; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_0b34c830ad7d7f19 = ((u32(((u32(4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94678fb6e199ae72f3c7ee4b() {
  return __cxx_static_address_94678fb6e199ae72f3c7ee4b.reference || (__cxx_static_address_94678fb6e199ae72f3c7ee4b.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_0b34c830ad7d7f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_3360e6427aac8e3e = ((u32(((u32(4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee582cc4b321e3c510d88a73() {
  return __cxx_static_address_ee582cc4b321e3c510d88a73.reference || (__cxx_static_address_ee582cc4b321e3c510d88a73.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_3360e6427aac8e3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_c9b504260c0b6fa9 = ((u32(((u32(4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93658de3f7d5ece8414d8506() {
  return __cxx_static_address_93658de3f7d5ece8414d8506.reference || (__cxx_static_address_93658de3f7d5ece8414d8506.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_c9b504260c0b6fa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_2c9815a7944cfc9f = ((u32(((u32(4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cdb2962e08a767bb33ff224a() {
  return __cxx_static_address_cdb2962e08a767bb33ff224a.reference || (__cxx_static_address_cdb2962e08a767bb33ff224a.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_2c9815a7944cfc9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_462d50bc04af84ba = ((u32(((u32(4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_764a38f967200fbddfb404ed() {
  return __cxx_static_address_764a38f967200fbddfb404ed.reference || (__cxx_static_address_764a38f967200fbddfb404ed.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_462d50bc04af84ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_6131af19377f4a9d = ((u32(((u32(4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_294c24b902c6a5cfef84392b() {
  return __cxx_static_address_294c24b902c6a5cfef84392b.reference || (__cxx_static_address_294c24b902c6a5cfef84392b.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_6131af19377f4a9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_c7af2b9546b050d8 = ((u32(((u32(4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8709d53412a163df8d312df4() {
  return __cxx_static_address_8709d53412a163df8d312df4.reference || (__cxx_static_address_8709d53412a163df8d312df4.reference = {
    __cReference: true,
    get value() { return MAN____header_global_c7af2b9546b050d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_1deebc454068775d = ((u32(((u32(4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7f961f035e1075ec60f8ffd() {
  return __cxx_static_address_b7f961f035e1075ec60f8ffd.reference || (__cxx_static_address_b7f961f035e1075ec60f8ffd.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_1deebc454068775d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_2c84e3087e0d777c = ((u32(((u32(4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_387e076bb4c960e89dce5977() {
  return __cxx_static_address_387e076bb4c960e89dce5977.reference || (__cxx_static_address_387e076bb4c960e89dce5977.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_2c84e3087e0d777c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_1c57029076d7a76c = ((u32(((u32(4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b25d252f9d28762f2f116ed6() {
  return __cxx_static_address_b25d252f9d28762f2f116ed6.reference || (__cxx_static_address_b25d252f9d28762f2f116ed6.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_1c57029076d7a76c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_2cd20545588df611 = ((u32(((u32(4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e2b5f59d68eafb4f0f59230() {
  return __cxx_static_address_9e2b5f59d68eafb4f0f59230.reference || (__cxx_static_address_9e2b5f59d68eafb4f0f59230.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_2cd20545588df611; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_b2f4a0ef660483c2 = ((u32(((u32(4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be988204ff16f4ad0d77d896() {
  return __cxx_static_address_be988204ff16f4ad0d77d896.reference || (__cxx_static_address_be988204ff16f4ad0d77d896.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_b2f4a0ef660483c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_f47285dbc35a3a47 = ((u32(((u32(4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb345a8efceb12bb272d0c83() {
  return __cxx_static_address_cb345a8efceb12bb272d0c83.reference || (__cxx_static_address_cb345a8efceb12bb272d0c83.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_f47285dbc35a3a47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_e711ee506ac3e3f7 = ((u32(((u32(4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f349ce1811d8cdd467cabd8() {
  return __cxx_static_address_0f349ce1811d8cdd467cabd8.reference || (__cxx_static_address_0f349ce1811d8cdd467cabd8.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_e711ee506ac3e3f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_b91463333c012e50 = ((u32(((u32(4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb9f94b5df2b1a206355d386() {
  return __cxx_static_address_bb9f94b5df2b1a206355d386.reference || (__cxx_static_address_bb9f94b5df2b1a206355d386.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_b91463333c012e50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_8743d10acd14935d = ((u32(((u32(5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90453f65d16214f2a52848ee() {
  return __cxx_static_address_90453f65d16214f2a52848ee.reference || (__cxx_static_address_90453f65d16214f2a52848ee.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_8743d10acd14935d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_89bffe4dc87c4a09 = ((u32(((u32(5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e0512b57dce33bdc209283f() {
  return __cxx_static_address_1e0512b57dce33bdc209283f.reference || (__cxx_static_address_1e0512b57dce33bdc209283f.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_89bffe4dc87c4a09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_4c2426ebf6db57b5 = ((u32(((u32(5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_058ac3bfb0b8b7494185d588() {
  return __cxx_static_address_058ac3bfb0b8b7494185d588.reference || (__cxx_static_address_058ac3bfb0b8b7494185d588.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_4c2426ebf6db57b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_6f77f7b3b34e1c12 = ((u32(((u32(5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a52de8494ffb3178a1d93b0a() {
  return __cxx_static_address_a52de8494ffb3178a1d93b0a.reference || (__cxx_static_address_a52de8494ffb3178a1d93b0a.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_6f77f7b3b34e1c12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_354daee3aa336c22 = ((u32(((u32(5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca4da5e0b66e854f172f8d42() {
  return __cxx_static_address_ca4da5e0b66e854f172f8d42.reference || (__cxx_static_address_ca4da5e0b66e854f172f8d42.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_354daee3aa336c22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_f1bd534218d4b411 = ((u32(((u32(5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88a77d1c98e703642704a45a() {
  return __cxx_static_address_88a77d1c98e703642704a45a.reference || (__cxx_static_address_88a77d1c98e703642704a45a.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_f1bd534218d4b411; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_6dc298e7d3e0efec = ((u32(((u32(5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46ceb249cba3663a708b46f5() {
  return __cxx_static_address_46ceb249cba3663a708b46f5.reference || (__cxx_static_address_46ceb249cba3663a708b46f5.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_6dc298e7d3e0efec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_41e4e92cffaab642 = ((u32(((u32(5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab3626cf2ec054b5474edf95() {
  return __cxx_static_address_ab3626cf2ec054b5474edf95.reference || (__cxx_static_address_ab3626cf2ec054b5474edf95.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_41e4e92cffaab642; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_bd92468f965d2fcf = ((u32(((u32(5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7525de390a8e0e90e15ecf1() {
  return __cxx_static_address_d7525de390a8e0e90e15ecf1.reference || (__cxx_static_address_d7525de390a8e0e90e15ecf1.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_bd92468f965d2fcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_180924e5698a48a6 = ((u32(((u32(5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26c50fc5a4537cf4207a9033() {
  return __cxx_static_address_26c50fc5a4537cf4207a9033.reference || (__cxx_static_address_26c50fc5a4537cf4207a9033.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_180924e5698a48a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_611169469b93871b = ((u32(((u32(5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d0462f3236e391a63a9dc92() {
  return __cxx_static_address_5d0462f3236e391a63a9dc92.reference || (__cxx_static_address_5d0462f3236e391a63a9dc92.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_611169469b93871b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_4f0fab4dc4d22fea = ((u32(((u32(1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46be9a65ffda4d78fd83a2f8() {
  return __cxx_static_address_46be9a65ffda4d78fd83a2f8.reference || (__cxx_static_address_46be9a65ffda4d78fd83a2f8.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_4f0fab4dc4d22fea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_6a57822b41ffaca9 = ((u32(((u32(5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6eeff02378eba28cfdabdb6() {
  return __cxx_static_address_f6eeff02378eba28cfdabdb6.reference || (__cxx_static_address_f6eeff02378eba28cfdabdb6.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_6a57822b41ffaca9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_ac2bdf8f690f9115 = ((u32(((u32(5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79eab31a4b6610eeab4f21dd() {
  return __cxx_static_address_79eab31a4b6610eeab4f21dd.reference || (__cxx_static_address_79eab31a4b6610eeab4f21dd.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_ac2bdf8f690f9115; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_e4ae063b51217de3 = ((u32(((u32(5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_900aa6b2ad87a17f48941807() {
  return __cxx_static_address_900aa6b2ad87a17f48941807.reference || (__cxx_static_address_900aa6b2ad87a17f48941807.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_e4ae063b51217de3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_991b9bd7b1f181dd = ((u32(((u32(5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1bf764bd86ae9f78495a249() {
  return __cxx_static_address_a1bf764bd86ae9f78495a249.reference || (__cxx_static_address_a1bf764bd86ae9f78495a249.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_991b9bd7b1f181dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_00ae81d5c3367817 = ((u32(((u32(5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97b28cdda41fd6f05bf6db44() {
  return __cxx_static_address_97b28cdda41fd6f05bf6db44.reference || (__cxx_static_address_97b28cdda41fd6f05bf6db44.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_00ae81d5c3367817; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_07b41a329fcde6f7 = ((u32(((u32(5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05ccb3cd134440a140d60f1b() {
  return __cxx_static_address_05ccb3cd134440a140d60f1b.reference || (__cxx_static_address_05ccb3cd134440a140d60f1b.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_07b41a329fcde6f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_a6b303f929a19afd = ((u32(((u32(5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d6bf61dfd150cde83ba0713() {
  return __cxx_static_address_3d6bf61dfd150cde83ba0713.reference || (__cxx_static_address_3d6bf61dfd150cde83ba0713.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_a6b303f929a19afd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_e5fc35c037fe2fca = ((u32(((u32(5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_570120844c3dc33e144b2467() {
  return __cxx_static_address_570120844c3dc33e144b2467.reference || (__cxx_static_address_570120844c3dc33e144b2467.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_e5fc35c037fe2fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_56d2a62706f160e1 = ((u32(((u32(5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9404886534a012df1a2b03a5() {
  return __cxx_static_address_9404886534a012df1a2b03a5.reference || (__cxx_static_address_9404886534a012df1a2b03a5.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_56d2a62706f160e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_57c98081f4504733 = ((u32(((u32(5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc656e3bbb1261167080e422() {
  return __cxx_static_address_bc656e3bbb1261167080e422.reference || (__cxx_static_address_bc656e3bbb1261167080e422.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_57c98081f4504733; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_5d7682cf563eb97c = ((u32(((u32(5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b601c23d67ed50aa188280d3() {
  return __cxx_static_address_b601c23d67ed50aa188280d3.reference || (__cxx_static_address_b601c23d67ed50aa188280d3.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_5d7682cf563eb97c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_143e86bcb54e0384 = ((u32(((u32(5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_026f21938acf5859960c8e2e() {
  return __cxx_static_address_026f21938acf5859960c8e2e.reference || (__cxx_static_address_026f21938acf5859960c8e2e.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_143e86bcb54e0384; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_bd46b68347f2a3e6 = ((u32(((u32(5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b0264f611f0b44cda2de501() {
  return __cxx_static_address_4b0264f611f0b44cda2de501.reference || (__cxx_static_address_4b0264f611f0b44cda2de501.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_bd46b68347f2a3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_1e2aa0d9c0751b61 = ((u32(((u32(5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9722c518142938a330ac15b8() {
  return __cxx_static_address_9722c518142938a330ac15b8.reference || (__cxx_static_address_9722c518142938a330ac15b8.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_1e2aa0d9c0751b61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_e27fa2993d6a10a4 = ((u32(((u32(5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89f7117435015266143c23d9() {
  return __cxx_static_address_89f7117435015266143c23d9.reference || (__cxx_static_address_89f7117435015266143c23d9.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_e27fa2993d6a10a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_79dda1cd945ed3ee = ((u32(((u32(2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8169f28421827ee80e7610c3() {
  return __cxx_static_address_8169f28421827ee80e7610c3.reference || (__cxx_static_address_8169f28421827ee80e7610c3.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_79dda1cd945ed3ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_b158f00a82e52eda = ((u32(((u32(2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98d08375a399d9387aab8a93() {
  return __cxx_static_address_98d08375a399d9387aab8a93.reference || (__cxx_static_address_98d08375a399d9387aab8a93.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_b158f00a82e52eda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_15a30bf41bc1c05a = ((u32(((u32(5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa0e733c529e104d32fbfd77() {
  return __cxx_static_address_aa0e733c529e104d32fbfd77.reference || (__cxx_static_address_aa0e733c529e104d32fbfd77.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_15a30bf41bc1c05a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_548316c4d055b4d4 = ((u32(((u32(5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2514565f4fa3b106069870dd() {
  return __cxx_static_address_2514565f4fa3b106069870dd.reference || (__cxx_static_address_2514565f4fa3b106069870dd.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_548316c4d055b4d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_f20c898be7c155d8 = ((u32(((u32(5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_125e5b398dbb9a26b285cc2d() {
  return __cxx_static_address_125e5b398dbb9a26b285cc2d.reference || (__cxx_static_address_125e5b398dbb9a26b285cc2d.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_f20c898be7c155d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_21887247e53b31a5 = u64((BigInt(u64(64)) * BigInt(u64((BigInt(u64((BigInt(u64((BigInt(72) * BigInt(u64(16384))))) + BigInt(u64((BigInt(96) * BigInt(u64(4096)))))))) + BigInt(u64((BigInt(296) * BigInt(u64(16384))))))))));
function __cxx_static_address_a1817b2ddd4f80724a2a4262() {
  return __cxx_static_address_a1817b2ddd4f80724a2a4262.reference || (__cxx_static_address_a1817b2ddd4f80724a2a4262.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_21887247e53b31a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:45
export let g_netServer = null;
export function __cxx_global_cell_3107730442a78d066f9d60b4() {
  return __cxx_global_cell_3107730442a78d066f9d60b4.reference || (__cxx_global_cell_3107730442a78d066f9d60b4.reference = {
    __cReference: true,
    get value() { return g_netServer; },
    set value(__cxx_lvalue_0) { g_netServer = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:46
export let g_netClient = null;
export function __cxx_global_cell_ee7acbe9f86710f77e416322() {
  return __cxx_global_cell_ee7acbe9f86710f77e416322.reference || (__cxx_global_cell_ee7acbe9f86710f77e416322.reference = {
    __cReference: true,
    get value() { return g_netClient; },
    set value(__cxx_lvalue_0) { g_netClient = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:47
export let g_netClientPeer = null;
export function __cxx_global_cell_bc8ed7af36db791bcd92a2b4() {
  return __cxx_global_cell_bc8ed7af36db791bcd92a2b4.reference || (__cxx_global_cell_bc8ed7af36db791bcd92a2b4.reference = {
    __cReference: true,
    get value() { return g_netClientPeer; },
    set value(__cxx_lvalue_0) { g_netClientPeer = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_296b548e7bccf882 = i32(2147483647);
function __cxx_static_address_aef90238ba71549da4ab23df() {
  return __cxx_static_address_aef90238ba71549da4ab23df.reference || (__cxx_static_address_aef90238ba71549da4ab23df.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_296b548e7bccf882; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_3c09c851eb75a244 = i32(2147483648);
function __cxx_static_address_98c26f5dd4bff75b77b6976b() {
  return __cxx_static_address_98c26f5dd4bff75b77b6976b.reference || (__cxx_static_address_98c26f5dd4bff75b77b6976b.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_3c09c851eb75a244; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_d2e10a1245658f6e = i32(2147483648);
function __cxx_static_address_1bc904837c577c2670f18f1e() {
  return __cxx_static_address_1bc904837c577c2670f18f1e.reference || (__cxx_static_address_1bc904837c577c2670f18f1e.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_d2e10a1245658f6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_9279fc64f7f174b7 = i32(65536);
function __cxx_static_address_c167c4aae67b3f32bf68bb4a() {
  return __cxx_static_address_c167c4aae67b3f32bf68bb4a.reference || (__cxx_static_address_c167c4aae67b3f32bf68bb4a.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_9279fc64f7f174b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_c0ae9278fc14deb7 = i32(32768);
function __cxx_static_address_75cee3e47d13c055af28fbf5() {
  return __cxx_static_address_75cee3e47d13c055af28fbf5.reference || (__cxx_static_address_75cee3e47d13c055af28fbf5.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_c0ae9278fc14deb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_2a09e2924e045072 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_dba86f607529ee602de18c59() {
  return __cxx_static_address_dba86f607529ee602de18c59.reference || (__cxx_static_address_dba86f607529ee602de18c59.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_2a09e2924e045072; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:48
export let g_netPort = (u32((u32(23513) & 65535)) & 65535);
export function __cxx_global_cell_8ae7c85e4eb0188a9d92564a() {
  return __cxx_global_cell_8ae7c85e4eb0188a9d92564a.reference || (__cxx_global_cell_8ae7c85e4eb0188a9d92564a.reference = {
    __cReference: true,
    get value() { return g_netPort; },
    set value(__cxx_lvalue_0) { g_netPort = (u32(__cxx_lvalue_0) & 65535); }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:49
export let g_netDisconnect = i32(0);
export function __cxx_global_cell_8fc8418a309fcaa17fb11c68() {
  return __cxx_global_cell_8fc8418a309fcaa17fb11c68.reference || (__cxx_global_cell_8fc8418a309fcaa17fb11c68.reference = {
    __cReference: true,
    get value() { return g_netDisconnect; },
    set value(__cxx_lvalue_0) { g_netDisconnect = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:50
export let g_netPassword = new Uint8Array(32);
function __cxx_static_address_b2323f38ea043c02bc23fe59() {
  return __cxx_static_address_b2323f38ea043c02bc23fe59.reference || (__cxx_static_address_b2323f38ea043c02bc23fe59.reference = {
    __cReference: true,
    get value() { return g_netPassword; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:51
export let g_networkMode = i32(0);
export function __cxx_global_cell_141f6cddc1112a188cf6fbdc() {
  return __cxx_global_cell_141f6cddc1112a188cf6fbdc.reference || (__cxx_global_cell_141f6cddc1112a188cf6fbdc.reference = {
    __cReference: true,
    get value() { return g_networkMode; },
    set value(__cxx_lvalue_0) { g_networkMode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/network.cpp:64
export function faketimerhandler() {
  ;
}

// C/C++ source: source/duke3d/src/network.cpp:73
export function Net_GetPackets() {

}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_32b01646bad06e2c = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_d0daeff4872079e93cdc37b4() {
  return __cxx_static_address_d0daeff4872079e93cdc37b4.reference || (__cxx_static_address_d0daeff4872079e93cdc37b4.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_32b01646bad06e2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_d0daeff4872079e93cdc37b4() { return __cxx_static_address_d0daeff4872079e93cdc37b4(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_c511e2d032076ff7 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_d34c71605186c5a470b8236b() {
  return __cxx_static_address_d34c71605186c5a470b8236b.reference || (__cxx_static_address_d34c71605186c5a470b8236b.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_c511e2d032076ff7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_21e71939739912d5 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_dc9a94a9d7ad223ef18a5e99() {
  return __cxx_static_address_dc9a94a9d7ad223ef18a5e99.reference || (__cxx_static_address_dc9a94a9d7ad223ef18a5e99.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_21e71939739912d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_dc9a94a9d7ad223ef18a5e99() { return __cxx_static_address_dc9a94a9d7ad223ef18a5e99(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_69dec627c918a5e5 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_c40025e0f2992f810a64d8b4() {
  return __cxx_static_address_c40025e0f2992f810a64d8b4.reference || (__cxx_static_address_c40025e0f2992f810a64d8b4.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_69dec627c918a5e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_c40025e0f2992f810a64d8b4() { return __cxx_static_address_c40025e0f2992f810a64d8b4(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_fdadce95848c2d4a = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_b50d07c77e21297f1dd24c3c() {
  return __cxx_static_address_b50d07c77e21297f1dd24c3c.reference || (__cxx_static_address_b50d07c77e21297f1dd24c3c.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_fdadce95848c2d4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_b50d07c77e21297f1dd24c3c() { return __cxx_static_address_b50d07c77e21297f1dd24c3c(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_ea19aa9789674603 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_3f5891017e309604c74eb847() {
  return __cxx_static_address_3f5891017e309604c74eb847.reference || (__cxx_static_address_3f5891017e309604c74eb847.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_ea19aa9789674603; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_3f5891017e309604c74eb847() { return __cxx_static_address_3f5891017e309604c74eb847(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_5f9d71a37c0a4b50 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_1706aec1d3e40be2f48dfba9() {
  return __cxx_static_address_1706aec1d3e40be2f48dfba9.reference || (__cxx_static_address_1706aec1d3e40be2f48dfba9.reference = {
    __cReference: true,
    get value() { return pow264__header_global_5f9d71a37c0a4b50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_1706aec1d3e40be2f48dfba9() { return __cxx_static_address_1706aec1d3e40be2f48dfba9(); }

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_f8caf9e4dee263fd = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": (u32(1) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([49, 0]), "sc": (u32(2) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([50, 0]), "sc": (u32(3) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([51, 0]), "sc": (u32(4) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([52, 0]), "sc": (u32(5) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([53, 0]), "sc": (u32(6) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([54, 0]), "sc": (u32(7) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([55, 0]), "sc": (u32(8) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([56, 0]), "sc": (u32(9) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([57, 0]), "sc": (u32(10) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([48, 0]), "sc": (u32(11) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([45, 0]), "sc": (u32(12) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([61, 0]), "sc": (u32(13) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": (u32(14) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 97, 98, 0]), "sc": (u32(15) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([81, 0]), "sc": (u32(16) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([87, 0]), "sc": (u32(17) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 0]), "sc": (u32(18) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 0]), "sc": (u32(19) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 0]), "sc": (u32(20) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([89, 0]), "sc": (u32(21) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 0]), "sc": (u32(22) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 0]), "sc": (u32(23) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([79, 0]), "sc": (u32(24) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 0]), "sc": (u32(25) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([91, 0]), "sc": (u32(26) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([93, 0]), "sc": (u32(27) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": (u32(28) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": (u32(29) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([65, 0]), "sc": (u32(30) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 0]), "sc": (u32(31) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 0]), "sc": (u32(32) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 0]), "sc": (u32(33) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([71, 0]), "sc": (u32(34) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 0]), "sc": (u32(35) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([74, 0]), "sc": (u32(36) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 0]), "sc": (u32(37) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 0]), "sc": (u32(38) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([59, 0]), "sc": (u32(39) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([39, 0]), "sc": (u32(40) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([96, 0]), "sc": (u32(41) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": (u32(42) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": (u32(43) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([90, 0]), "sc": (u32(44) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([88, 0]), "sc": (u32(45) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 0]), "sc": (u32(46) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([86, 0]), "sc": (u32(47) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 0]), "sc": (u32(48) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 0]), "sc": (u32(49) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([77, 0]), "sc": (u32(50) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([44, 0]), "sc": (u32(51) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([46, 0]), "sc": (u32(52) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([47, 0]), "sc": (u32(53) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": (u32(54) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": (u32(55) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": (u32(56) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": (u32(57) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": (u32(58) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 0]), "sc": (u32(59) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 50, 0]), "sc": (u32(60) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 51, 0]), "sc": (u32(61) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 52, 0]), "sc": (u32(62) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 53, 0]), "sc": (u32(63) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 54, 0]), "sc": (u32(64) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 55, 0]), "sc": (u32(65) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 56, 0]), "sc": (u32(66) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 57, 0]), "sc": (u32(67) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 48, 0]), "sc": (u32(68) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": (u32(69) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": (u32(70) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": (u32(71) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": (u32(72) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": (u32(73) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": (u32(74) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": (u32(75) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": (u32(76) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": (u32(77) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": (u32(78) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": (u32(79) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": (u32(80) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": (u32(81) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": (u32(82) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": (u32(83) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": (u32(86) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 49, 0]), "sc": (u32(87) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 50, 0]), "sc": (u32(88) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": (u32(156) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": (u32(157) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": (u32(181) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": (u32(184) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": (u32(183) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": (u32(197) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": (u32(199) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 112, 0]), "sc": (u32(200) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": (u32(201) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": (u32(203) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": (u32(205) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 100, 0]), "sc": (u32(207) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": (u32(208) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": (u32(209) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": (u32(210) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": (u32(211) & 255)}), null, {})]));
function __cxx_static_address_f0b84179de73eb4edd14346d() {
  return __cxx_static_address_f0b84179de73eb4edd14346d.reference || (__cxx_static_address_f0b84179de73eb4edd14346d.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_f8caf9e4dee263fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
