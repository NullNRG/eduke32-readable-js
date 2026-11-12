// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/lz4.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
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
const cPointer = (source,addressOnly=false) => {
  if(source?.__cFunctionAddress===true)throw new TypeError('Function address has no readable data storage');
  if(typeof source==='number'||typeof source==='bigint')return cPointer(cSourceAddresses.decode(source));
  if (source?.__cDeferredPointer === true) return cPointer(addressOnly&&source.resolveAddress?source.resolveAddress():source.resolve(),addressOnly);
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
const cStaticPointer = (resolve,resolveAddress) => ({__cDeferredPointer:true, resolve, ...(resolveAddress?{resolveAddress}:{})});
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
  const initial=cPointer(arrayBytes||source,addressOnly);
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
// A host I/O boundary can marshal an explicitly typed scalar lvalue while
// preserving its original identity and committing writes through its setter.
// This does not grant the lvalue malloc ownership or invent a native buffer.
function cScalarLValueIO(reference, Type) {
  const types=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,BigInt64Array,BigUint64Array,Float32Array,Float64Array];
  if(reference?.__cReference!==true || !types.includes(Type))throw new TypeError('Source scalar I/O requires a typed original lvalue');
  const key=Symbol.for('source-first.scalar-lvalue-io/1'),old=reference[key];
  if(old && (old.abi!=='source-scalar-lvalue-io/1'||old.Type!==Type))throw new TypeError('Conflicting scalar lvalue I/O type');
  if(!old)Object.defineProperty(reference,key,{value:Object.freeze({abi:'source-scalar-lvalue-io/1',Type})});
  return reference;
}
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
  const pointerAddress=value=>cPointer(value?.[Symbol.for('source-first.original-byte-record-storage/1')]?.bytes||value,true);
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
    const p=Array.isArray(value)?{...cPointer(value,true),upper:value.length*stride,stride}:cPointer(value,true);
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
function cObjectFieldRef(owner, field) { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); }
function cRef(read, write) { return ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } }); }
function cArrayRef(array, index) { return cRef(() => array[index], v => { array[index] = v; }); }
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
  if(schema.pointerEncoding && (schema.pointerEncoding!=='source-lp64-addresses/2' ||
      globalThis[Symbol.for('source-first.native-pointer-abi')]!==schema.pointerEncoding))
    throw new TypeError('Overlapping pointer union requires the verified source address ABI');
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
    globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(buffer,start,n);
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
      globalThis[Symbol.for('source-lp64-addresses/2')]?.assert(source.buffer,source.offset,source.upper-source.offset);
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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_clz = x => Math.clz32(Number(x) >>> 0);
const __builtin_clzll = x => clz64(x);
const __builtin_ctz = x => ctz64(BigInt.asUintN(32,BigInt(x)),32);
const __builtin_ctzll = x => ctz64(x,64);
// C/C++ source: source/build/include/lz4.h:728
export function LZ4_stream_u() {
  return LZ4_stream_u.type || (LZ4_stream_u.type = class LZ4_stream_u__implementation { constructor() { return cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}}, {}); } });
}

// C/C++ source: source/build/src/lz4.c:249
export const LZ4_minLength = i32((12 + 1));
function __cxx_static_address_bee375b0e5ce052ae6c14518() {
  return __cxx_static_address_bee375b0e5ce052ae6c14518.reference || (__cxx_static_address_bee375b0e5ce052ae6c14518.reference = {
    __cReference: true,
    get value() { return LZ4_minLength; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:292
export function LZ4_isAligned(ptr, alignment) {
  return i32((u64((BigInt(u64(cSourceAddresses.encode(ptr))) & BigInt(u64((BigInt(alignment) - BigInt(u64(1))))))) == u64(0)));
}

// C/C++ source: source/build/src/lz4.c:363
export function LZ4_isLittleEndian() {

  let one = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"c": {"length": 4, "native": "Uint8Array", "offset": 0, "size": 4}, "u": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 4, "union": true}, {"u": u32(1)}, null, {});
  return u32((cDeref(cPointerOffset(one.c, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
}

// C/C++ source: source/build/src/lz4.c:393
export function LZ4_read16(ptr) {
  return cRecordObject(cRecordPointer(cRecordPointer(ptr, {"align": 1, "arrayAlign": 1, "fields": {"u16": {"native": "Uint16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 2, "union": false}, {}), {"align": 1, "arrayAlign": 1, "fields": {"u16": {"native": "Uint16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 2, "union": false}, {})).u16;
}

// C/C++ source: source/build/src/lz4.c:394
export function LZ4_read32(ptr) {
  return cRecordObject(cRecordPointer(cRecordPointer(ptr, {"align": 1, "arrayAlign": 1, "fields": {"u32": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {}), {"align": 1, "arrayAlign": 1, "fields": {"u32": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {})).u32;
}

// C/C++ source: source/build/src/lz4.c:395
export function LZ4_read_ARCH(ptr) {
  return cRecordObject(cRecordPointer(cRecordPointer(ptr, {"align": 1, "arrayAlign": 1, "fields": {"uArch": {"native": "BigUint64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {}), {"align": 1, "arrayAlign": 1, "fields": {"uArch": {"native": "BigUint64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 8, "union": false}, {})).uArch;
}

// C/C++ source: source/build/src/lz4.c:397
export function LZ4_write16(memPtr, value) {
  (cRecordObject(cRecordPointer(cRecordPointer(memPtr, {"align": 1, "arrayAlign": 1, "fields": {"u16": {"native": "Uint16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 2, "union": false}, {}), {"align": 1, "arrayAlign": 1, "fields": {"u16": {"native": "Uint16Array", "offset": 0, "size": 2}}, "overlaps": false, "size": 2, "union": false}, {})).u16 = (u32(value) & 65535));
}

// C/C++ source: source/build/src/lz4.c:398
export function LZ4_write32(memPtr, value) {
  (cRecordObject(cRecordPointer(cRecordPointer(memPtr, {"align": 1, "arrayAlign": 1, "fields": {"u32": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {}), {"align": 1, "arrayAlign": 1, "fields": {"u32": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 4, "union": false}, {})).u32 = u32(value));
}

// C/C++ source: source/build/src/lz4.c:430
export function LZ4_readLE16(memPtr) {
  if (Boolean(LZ4_isLittleEndian())) {
    return LZ4_read16(memPtr);
  } else {
    let p = cTypedPointer(memPtr, Uint8Array);
    return (u32((u32(i32((i32((u32((u32((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 65535)) & 65535)) | i32((i32((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << 8))))) & 65535)) & 65535);
  }
}

// C/C++ source: source/build/src/lz4.c:452
export function LZ4_writeLE16(memPtr, value) {
  if (Boolean(LZ4_isLittleEndian())) {
    LZ4_write16(memPtr, value);
  } else {
    let p = cTypedPointer(memPtr, Uint8Array);
    ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(value) & 255)) & 255)) & 255));
    ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32((u32(i32((i32(value) >> 8))) & 255)) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/lz4.c:465
export function LZ4_wildCopy8(dstPtr, srcPtr, dstEnd) {
  let d = cTypedPointer(dstPtr, Uint8Array);
  let s = cTypedPointer(srcPtr, Uint8Array);
  let e = cTypedPointer(dstEnd, Uint8Array);
  do {
    cByteMemory.memcpy(d, s, u64(8));
    (d = cPointerOffset(d, 8, Uint8Array.BYTES_PER_ELEMENT));
    (s = cPointerOffset(s, 8, Uint8Array.BYTES_PER_ELEMENT));
  } while (cPointerCompare(d, e, "<"));
}

// C/C++ source: source/build/src/lz4.c:474
export const inc32table = new Uint32Array([u32(0), u32(1), u32(2), u32(1), u32(0), u32(4), u32(4), u32(4)]);
function __cxx_static_address_f78572ce39d8f17ed1236330() {
  return __cxx_static_address_f78572ce39d8f17ed1236330.reference || (__cxx_static_address_f78572ce39d8f17ed1236330.reference = {
    __cReference: true,
    get value() { return inc32table; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f78572ce39d8f17ed1236330() { return __cxx_static_address_f78572ce39d8f17ed1236330(); }

// C/C++ source: source/build/src/lz4.c:475
export const dec64table = new Int32Array([0, 0, 0, (-1), (-4), 1, 2, 3]);
function __cxx_static_address_8c16797373e68664dfc186f3() {
  return __cxx_static_address_8c16797373e68664dfc186f3.reference || (__cxx_static_address_8c16797373e68664dfc186f3.reference = {
    __cReference: true,
    get value() { return dec64table; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_8c16797373e68664dfc186f3() { return __cxx_static_address_8c16797373e68664dfc186f3(); }

// C/C++ source: source/build/src/lz4.c:579
export function LZ4_NbCommonBytes(val) {
  void 0;
  if (Boolean(LZ4_isLittleEndian())) {
    if ((8 == u64(8))) {
      return u32((u32(__builtin_ctzll(u64(val))) >>> 3));
    } else {
      return u32((u32(__builtin_ctz(u32(val))) >>> 3));
    }
  } else {
    if ((8 == u64(8))) {
      return u32((u32(__builtin_clzll(u64(val))) >>> 3));
    } else {
      return u32((u32(__builtin_clz(u32(val))) >>> 3));
    }
  }
}

// C/C++ source: source/build/src/lz4.c:680
export function LZ4_count(pIn, pMatch, pInLimit) {
  let pStart = pIn;
  if (Boolean(i64((i32(cPointerCompare(pIn, cPointerOffset(pInLimit, -(u64((BigInt(8) - BigInt(u64(1))))), Uint8Array.BYTES_PER_ELEMENT, true), "<")) != 0)))) {
    let diff = u64((BigInt(LZ4_read_ARCH(pMatch)) ^ BigInt(LZ4_read_ARCH(pIn))));
    if ((!Boolean(diff))) {
      (pIn = cPointerOffset(pIn, 8, Uint8Array.BYTES_PER_ELEMENT));
      (pMatch = cPointerOffset(pMatch, 8, Uint8Array.BYTES_PER_ELEMENT));
    } else {
      return u32(LZ4_NbCommonBytes(diff));
    }
  }
  while (Boolean(i64((i32(cPointerCompare(pIn, cPointerOffset(pInLimit, -(u64((BigInt(8) - BigInt(u64(1))))), Uint8Array.BYTES_PER_ELEMENT, true), "<")) != 0)))) {
    let diff = u64((BigInt(LZ4_read_ARCH(pMatch)) ^ BigInt(LZ4_read_ARCH(pIn))));
    if ((!Boolean(diff))) {
      (pIn = cPointerOffset(pIn, 8, Uint8Array.BYTES_PER_ELEMENT));
      (pMatch = cPointerOffset(pMatch, 8, Uint8Array.BYTES_PER_ELEMENT));
      continue;
    }
    (pIn = cPointerOffset(pIn, LZ4_NbCommonBytes(diff), Uint8Array.BYTES_PER_ELEMENT));
    return u32(cPointerDiff(pIn, pStart, Uint8Array.BYTES_PER_ELEMENT));
  }
  if ((((8 == u64(8)) && cPointerCompare(pIn, cPointerOffset(pInLimit, -(3), Uint8Array.BYTES_PER_ELEMENT, true), "<")) && (LZ4_read32(pMatch) == LZ4_read32(pIn)))) {
    (pIn = cPointerOffset(pIn, 4, Uint8Array.BYTES_PER_ELEMENT));
    (pMatch = cPointerOffset(pMatch, 4, Uint8Array.BYTES_PER_ELEMENT));
  }
  if ((cPointerCompare(pIn, cPointerOffset(pInLimit, -(1), Uint8Array.BYTES_PER_ELEMENT, true), "<") && (i32(LZ4_read16(pMatch)) == i32(LZ4_read16(pIn))))) {
    (pIn = cPointerOffset(pIn, 2, Uint8Array.BYTES_PER_ELEMENT));
    (pMatch = cPointerOffset(pMatch, 2, Uint8Array.BYTES_PER_ELEMENT));
  }
  if ((cPointerCompare(pIn, pInLimit, "<") && (i32((cDeref(pMatch, Uint8Array).value)) == i32((cDeref(pIn, Uint8Array).value))))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => pIn, __cxx_lvalue_1 => { pIn = __cxx_lvalue_1; }));
  }
  return u32(cPointerDiff(pIn, pStart, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/src/lz4.c:710
export const LZ4_64Klimit = i32((i32(Math.imul(64, i32((1 << 10)))) + i32((12 - 1))));
function __cxx_static_address_6265b60f6ff3e7ae4c63dfd0() {
  return __cxx_static_address_6265b60f6ff3e7ae4c63dfd0.reference || (__cxx_static_address_6265b60f6ff3e7ae4c63dfd0.reference = {
    __cReference: true,
    get value() { return LZ4_64Klimit; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:711
export const LZ4_skipTrigger = u32(6);
function __cxx_static_address_2f0ce3b3a5b7700280faa244() {
  return __cxx_static_address_2f0ce3b3a5b7700280faa244.reference || (__cxx_static_address_2f0ce3b3a5b7700280faa244.reference = {
    __cReference: true,
    get value() { return LZ4_skipTrigger; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:749
export function LZ4_versionNumber() {
  return i32((i32((i32(Math.imul(i32(Math.imul(1, 100)), 100)) + i32(Math.imul(9, 100)))) + 5));
}

// C/C++ source: source/build/src/lz4.c:750
const __cxx_literal_297bdd437bf6fb110578 = Uint8Array.from([49, 46, 57, 46, 53, 0]);
export function LZ4_versionString() {
  return __cxx_literal_297bdd437bf6fb110578;
}

// C/C++ source: source/build/src/lz4.c:751
export function LZ4_compressBound(isize) {
  return i32(((u32(isize) > u32(2113929216)) ? 0 : i32((i32((isize + Math.trunc(isize / 255))) + 16))));
}

// C/C++ source: source/build/src/lz4.c:752
export function LZ4_sizeofState() {
  return i32(16416);
}

// C/C++ source: source/build/src/lz4.c:777
export function LZ4_hash4(sequence, tableType) {
  if ((i32(tableType) == i32(3))) {
    return (u32(Math.imul(sequence, 2654435761)) >>> i32((i32(Math.imul(4, 8)) - i32((i32((14 - 2)) + 1)))));
  } else {
    return (u32(Math.imul(sequence, 2654435761)) >>> i32((i32(Math.imul(4, 8)) - i32((14 - 2)))));
  }
}

// C/C++ source: source/build/src/lz4.c:785
export function LZ4_hash5(sequence, tableType) {
  let hashLog = u32(((i32(tableType) == i32(3)) ? i32((i32((14 - 2)) + 1)) : i32((14 - 2))));
  if (Boolean(LZ4_isLittleEndian())) {
    let prime5bytes = u64(889523592379n);
    return u32(u64((BigInt(u64((BigInt(u64((BigInt(sequence) << BigInt(24)))) * BigInt(prime5bytes)))) >> BigInt(u32((u32(64) - hashLog))))));
  } else {
    let prime8bytes = u64(11400714785074694791n);
    return u32(u64((BigInt(u64((BigInt(u64((BigInt(sequence) >> BigInt(24)))) * BigInt(prime8bytes)))) >> BigInt(u32((u32(64) - hashLog))))));
  }
}

// C/C++ source: source/build/src/lz4.c:797
export function LZ4_hashPosition(p, tableType) {
  if (((8 == u64(8)) && (i32(tableType) != i32(3)))) {
    return LZ4_hash5(LZ4_read_ARCH(p), tableType);
  }
  return LZ4_hash4(LZ4_read32(p), tableType);
}

// C/C++ source: source/build/src/lz4.c:808
export function LZ4_clearHash(h, tableBase, tableType) {
  switch (i32(tableType)) {
    default:
    case i32(0): {
      void 0;
      return;
    }
    case i32(1): {
      let hashTable = tableBase;
      ((cPointerElementRef(hashTable, h).value) = null);
      return;
    }
    case i32(2): {
      let hashTable = cTypedPointer(tableBase, Uint32Array);
      ((cDeref(cPointerOffset(hashTable, h, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(0));
      return;
    }
    case i32(3): {
      let hashTable = cTypedPointer(tableBase, Uint16Array);
      ((cDeref(cPointerOffset(hashTable, h, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (u32((u32(0) & 65535)) & 65535));
      return;
    }
  }
}

// C/C++ source: source/build/src/lz4.c:820
export function LZ4_putIndexOnHash(idx, h, tableBase, tableType) {
  switch (i32(tableType)) {
    default:
    case i32(0):
    case i32(1): {
      void 0;
      return;
    }
    case i32(2): {
      let hashTable = cTypedPointer(tableBase, Uint32Array);
      ((cDeref(cPointerOffset(hashTable, h, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(idx));
      return;
    }
    case i32(3): {
      let hashTable = cTypedPointer(tableBase, Uint16Array);
      void 0;
      ((cDeref(cPointerOffset(hashTable, h, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (u32((u32((u32(idx) & 65535)) & 65535)) & 65535));
      return;
    }
  }
}

// C/C++ source: source/build/src/lz4.c:833
export function LZ4_putPositionOnHash(p, h, tableBase, tableType) {
  let hashTable = tableBase;
  void 0;
  void 0;
  ((cPointerElementRef(hashTable, h).value) = p);
}

// C/C++ source: source/build/src/lz4.c:841
export function LZ4_putPosition(p, tableBase, tableType) {
  let h = u32(LZ4_hashPosition(p, tableType));
  LZ4_putPositionOnHash(p, h, tableBase, tableType);
}

// C/C++ source: source/build/src/lz4.c:853
export function LZ4_getIndexOnHash(h, tableBase, tableType) {
  {

  }
  ;
  if ((i32(tableType) == i32(2))) {
    let hashTable = cTypedPointer(tableBase, Uint32Array);
    void 0;
    return (cDeref(cPointerOffset(hashTable, h, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value);
  }
  if ((i32(tableType) == i32(3))) {
    let hashTable = cTypedPointer(tableBase, Uint16Array);
    void 0;
    return u32((cDeref(cPointerOffset(hashTable, h, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value));
  }
  void 0;
  return u32(0);
}

// C/C++ source: source/build/src/lz4.c:869
export function LZ4_getPositionOnHash(h, tableBase, tableType) {
  void 0;
  void 0;
  {
    let hashTable = tableBase;
    return (cPointerElementRef(hashTable, h).value);
  }
}

// C/C++ source: source/build/src/lz4.c:876
export function LZ4_getPosition(p, tableBase, tableType) {
  let h = u32(LZ4_hashPosition(p, tableType));
  return LZ4_getPositionOnHash(h, tableBase, tableType);
}

// C/C++ source: source/build/src/lz4.c:884
export function LZ4_prepareTable(cctx, inputSize, tableType) {
  if ((i32(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).tableType) != i32(0))) {
    void 0;
    if ((((((i32(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).tableType) != i32(tableType)) || ((i32(tableType) == i32(3)) && (u32((cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset + u32(inputSize))) >= 65535))) || ((i32(tableType) == i32(2)) && (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset > u32(Math.imul(u32(1), u32((1 << 30))))))) || (i32(tableType) == i32(1))) || (inputSize >= i32(Math.imul(4, i32((1 << 10))))))) {
      {

      }
      ;
      memset(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, 0, u64(i32((1 << 14))));
      (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset = u32(0));
      (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).tableType = u32(0));
    } else {
      {

      }
      ;
    }
  }
  if (((cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset != u32(0)) && (i32(tableType) == i32(2)))) {
    {

    }
    ;
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32(i32(Math.imul(64, i32((1 << 10))))))))))(cObjectFieldRef(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})), "currentOffset"));
  }
  (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictCtx = null);
  (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = null);
  (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(0));
}

// C/C++ source: source/build/src/lz4.c:930
export function LZ4_compress_generic_validated(cctx, source, dest, inputSize, inputConsumed, maxOutputSize, outputDirective, tableType, dictDirective, dictIssue, acceleration) {
  let result, ip, startIndex, base, lowLimit, dictCtx, dictionary, dictSize, dictDelta, maybe_extMem, prefixIdxLimit, dictEnd, anchor, iend, mflimitPlusOne, matchlimit, dictBase, op, olimit, offset, forwardH, h, match, token, filledIp, forwardIp, step, searchMatchNb, __cxx_scope_28_h, __cxx_scope_29_forwardIp, __cxx_scope_30_step, __cxx_scope_31_searchMatchNb, __cxx_scope_32_h, current, matchIndex, litLength, len, matchCode, limit, more, newMatchCode, ptr, __cxx_scope_42_h, __cxx_scope_43_h, idx, __cxx_scope_45_h, __cxx_scope_46_current, __cxx_scope_47_matchIndex, lastRun, accumulator;
  ip = cTypedPointer(source, Uint8Array);
  startIndex = u32(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset);
  base = cPointerOffset(cTypedPointer(source, Uint8Array), -(startIndex), Uint8Array.BYTES_PER_ELEMENT);
  dictCtx = cRecordPointer(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {});
  dictionary = ((i32(dictDirective) == i32(3)) ? cRecordObject(cRecordPointer(dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary : cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary);
  dictSize = u32(((i32(dictDirective) == i32(3)) ? cRecordObject(cRecordPointer(dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize : cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize));
  dictDelta = u32(((i32(dictDirective) == i32(3)) ? u32((startIndex - cRecordObject(cRecordPointer(dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset)) : u32(0)));
  maybe_extMem = i32(((i32(dictDirective) == i32(2)) || (i32(dictDirective) == i32(3))));
  prefixIdxLimit = u32((startIndex - dictSize));
  dictEnd = (dictionary ? cPointerOffset(dictionary, dictSize, Uint8Array.BYTES_PER_ELEMENT) : dictionary);
  anchor = cTypedPointer(source, Uint8Array);
  iend = cPointerOffset(ip, inputSize, Uint8Array.BYTES_PER_ELEMENT);
  mflimitPlusOne = ((__cxx_lvalue_1) => cStaticPointer(() => cPointerOffset(cPointerOffset(__cxx_lvalue_1, -(12), Uint8Array.BYTES_PER_ELEMENT), 1, Uint8Array.BYTES_PER_ELEMENT), () => cPointerOffset(cPointerOffset(__cxx_lvalue_1, -(12), Uint8Array.BYTES_PER_ELEMENT, true), 1, Uint8Array.BYTES_PER_ELEMENT, true)))(iend);
  matchlimit = ((__cxx_lvalue_2) => cStaticPointer(() => cPointerOffset(__cxx_lvalue_2, -(5), Uint8Array.BYTES_PER_ELEMENT), () => cPointerOffset(__cxx_lvalue_2, -(5), Uint8Array.BYTES_PER_ELEMENT, true)))(iend);
  dictBase = (cPointerCompare(dictionary, null, "==") ? null : ((i32(dictDirective) == i32(3)) ? cPointerOffset(cPointerOffset(dictionary, dictSize, Uint8Array.BYTES_PER_ELEMENT), -(cRecordObject(cRecordPointer(dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset), Uint8Array.BYTES_PER_ELEMENT) : cPointerOffset(cPointerOffset(dictionary, dictSize, Uint8Array.BYTES_PER_ELEMENT), -(startIndex), Uint8Array.BYTES_PER_ELEMENT)));
  op = cTypedPointer(dest, Uint8Array);
  olimit = cPointerOffset(op, maxOutputSize, Uint8Array.BYTES_PER_ELEMENT, true);
  offset = u32(0);
  {

  }
  ;
  void 0;
  if ((i32(tableType) == i32(3))) {
    void 0;
  }
  if ((i32(tableType) == i32(1))) {
    void 0;
  }
  if (((i32(outputDirective) == i32(2)) && (maxOutputSize < 1))) {
    return i32(0);
  }
  void 0;
  (lowLimit = cPointerOffset(cTypedPointer(source, Uint8Array), -(((i32(dictDirective) == i32(1)) ? dictSize : u32(0))), Uint8Array.BYTES_PER_ELEMENT, true));
  if ((i32(dictDirective) == i32(3))) {
    (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictCtx = null);
    (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(inputSize));
  } else {
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((Number(__cxx_lvalue_3.value) + Number(u32(inputSize))))))(cObjectFieldRef(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})), "dictSize"));
  }
  ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = u32((Number(__cxx_lvalue_4.value) + Number(u32(inputSize))))))(cObjectFieldRef(cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})), "currentOffset"));
  (cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).tableType = u32(tableType));
  __source_exit__last_literals: {
    if ((inputSize < LZ4_minLength)) {
      break __source_exit__last_literals;
    }
    {
      h = u32(LZ4_hashPosition(ip, tableType));
      if ((i32(tableType) == i32(1))) {
        LZ4_putPositionOnHash(ip, h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, 1);
      } else {
        LZ4_putIndexOnHash(startIndex, h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
      }
    }
    ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_5.value = next; return previous; })(cRef(() => ip, __cxx_lvalue_6 => { ip = __cxx_lvalue_6; }));
    (forwardH = u32(LZ4_hashPosition(ip, tableType)));
    __source_control_0: for (; ; ) {
      if ((i32(tableType) == i32(1))) {
        forwardIp = ip;
        step = i32(1);
        searchMatchNb = i32((acceleration << LZ4_skipTrigger));
        __source_control_1: do {
          __cxx_scope_28_h = u32(forwardH);
          (ip = forwardIp);
          (forwardIp = cPointerOffset(forwardIp, step, Uint8Array.BYTES_PER_ELEMENT));
          (step = i32((((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i32((previous + 1)); __cxx_lvalue_7.value = next; return previous; })(cRef(() => searchMatchNb, __cxx_lvalue_8 => { searchMatchNb = __cxx_lvalue_8; })) >> LZ4_skipTrigger)));
          if (Boolean(i64((i32(cPointerCompare(forwardIp, mflimitPlusOne, ">")) != 0)))) {
            break __source_exit__last_literals;
          }
          void 0;
          (match = LZ4_getPositionOnHash(__cxx_scope_28_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType));
          (forwardH = u32(LZ4_hashPosition(forwardIp, tableType)));
          LZ4_putPositionOnHash(ip, __cxx_scope_28_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
        } while ((cPointerCompare(cPointerOffset(match, 65535, Uint8Array.BYTES_PER_ELEMENT, true), ip, "<") || (LZ4_read32(match) != LZ4_read32(ip))));
      } else {
        __cxx_scope_29_forwardIp = ip;
        __cxx_scope_30_step = i32(1);
        __cxx_scope_31_searchMatchNb = i32((acceleration << LZ4_skipTrigger));
        __source_control_2: do {
          __cxx_scope_32_h = u32(forwardH);
          current = u32(cPointerDiff(__cxx_scope_29_forwardIp, base, Uint8Array.BYTES_PER_ELEMENT));
          matchIndex = u32(LZ4_getIndexOnHash(__cxx_scope_32_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType));
          void 0;
          void 0;
          (ip = __cxx_scope_29_forwardIp);
          (__cxx_scope_29_forwardIp = cPointerOffset(__cxx_scope_29_forwardIp, __cxx_scope_30_step, Uint8Array.BYTES_PER_ELEMENT));
          (__cxx_scope_30_step = i32((((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = i32((previous + 1)); __cxx_lvalue_9.value = next; return previous; })(cRef(() => __cxx_scope_31_searchMatchNb, __cxx_lvalue_10 => { __cxx_scope_31_searchMatchNb = __cxx_lvalue_10; })) >> LZ4_skipTrigger)));
          if (Boolean(i64((i32(cPointerCompare(__cxx_scope_29_forwardIp, mflimitPlusOne, ">")) != 0)))) {
            break __source_exit__last_literals;
          }
          void 0;
          if ((i32(dictDirective) == i32(3))) {
            if ((matchIndex < startIndex)) {
              void 0;
              (matchIndex = u32(LZ4_getIndexOnHash(__cxx_scope_32_h, cRecordObject(cRecordPointer(dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, 2)));
              (match = cPointerOffset(dictBase, matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
              (matchIndex = u32((Number(matchIndex) + Number(dictDelta))));
              (lowLimit = dictionary);
            } else {
              (match = cPointerOffset(base, matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
              (lowLimit = cTypedPointer(source, Uint8Array));
            }
          } else {
            if ((i32(dictDirective) == i32(2))) {
              if ((matchIndex < startIndex)) {
                {

                }
                ;
                void 0;
                void 0;
                (match = cPointerOffset(dictBase, matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
                (lowLimit = dictionary);
              } else {
                (match = cPointerOffset(base, matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
                (lowLimit = cTypedPointer(source, Uint8Array));
              }
            } else {
              (match = cPointerOffset(base, matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
            }
          }
          (forwardH = u32(LZ4_hashPosition(__cxx_scope_29_forwardIp, tableType)));
          LZ4_putIndexOnHash(current, __cxx_scope_32_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
          {

          }
          ;
          if (((i32(dictIssue) == i32(1)) && (matchIndex < prefixIdxLimit))) {
            continue __source_control_2;
          }
          void 0;
          if ((((i32(tableType) != i32(3)) || (65535 < 65535)) && (u32((matchIndex + u32(65535))) < current))) {
            continue __source_control_2;
          }
          void 0;
          if ((LZ4_read32(match) == LZ4_read32(ip))) {
            if (Boolean(maybe_extMem)) {
              (offset = u32((current - matchIndex)));
            }
            break __source_control_2;
          }
        } while (Boolean(1));
      }
      (filledIp = ip);
      void 0;
      if ((cPointerCompare(match, lowLimit, ">") && Boolean(i64((i32((i32((cDeref(cPointerOffset(ip, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32((cDeref(cPointerOffset(match, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) != 0))))) {
        __source_control_3: do {
          ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_11.value = next; return previous; })(cRef(() => ip, __cxx_lvalue_12 => { ip = __cxx_lvalue_12; }));
          ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_13.value = next; return previous; })(cRef(() => match, __cxx_lvalue_14 => { match = __cxx_lvalue_14; }));
        } while ((Boolean(i32((i32(cPointerCompare(ip, anchor, ">")) & i32(cPointerCompare(match, lowLimit, ">"))))) && Boolean(i64((i32((i32((cDeref(cPointerOffset(ip, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32((cDeref(cPointerOffset(match, (-1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) != 0)))));
      }
      {
        litLength = u32(cPointerDiff(ip, anchor, Uint8Array.BYTES_PER_ELEMENT));
        (token = ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_15.value = next; return previous; })(cRef(() => op, __cxx_lvalue_16 => { op = __cxx_lvalue_16; })));
        if (((i32(outputDirective) == i32(1)) && Boolean(i64((i32(cPointerCompare(cPointerOffset(cPointerOffset(cPointerOffset(op, litLength, Uint8Array.BYTES_PER_ELEMENT, true), i32((i32((2 + 1)) + 5)), Uint8Array.BYTES_PER_ELEMENT, true), Math.trunc(litLength / u32(255)), Uint8Array.BYTES_PER_ELEMENT, true), olimit, ">")) != 0))))) {
          return i32(0);
        }
        if (((i32(outputDirective) == i32(2)) && Boolean(i64((i32(cPointerCompare(cPointerOffset(cPointerOffset(cPointerOffset(cPointerOffset(cPointerOffset(cPointerOffset(op, Math.trunc(u32((litLength + u32(240))) / u32(255)), Uint8Array.BYTES_PER_ELEMENT, true), litLength, Uint8Array.BYTES_PER_ELEMENT, true), 2, Uint8Array.BYTES_PER_ELEMENT, true), 1, Uint8Array.BYTES_PER_ELEMENT, true), 12, Uint8Array.BYTES_PER_ELEMENT, true), -(4), Uint8Array.BYTES_PER_ELEMENT, true), olimit, ">")) != 0))))) {
          ((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_17.value = next; return previous; })(cRef(() => op, __cxx_lvalue_18 => { op = __cxx_lvalue_18; }));
          break __source_exit__last_literals;
        }
        if ((litLength >= u32((u32((1 << i32((8 - 4)))) - u32(1))))) {
          len = u32((litLength - u32((u32((1 << i32((8 - 4)))) - u32(1)))));
          ((cDeref(token, Uint8Array).value) = (u32((u32((u32((u32((1 << i32((8 - 4)))) - u32(1))) << 4)) & 255)) & 255));
          __source_control_4: for (; (len >= u32(255)); (len = u32((Number(len) - Number(u32(255)))))) {
            ((cDeref(((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_19.value = next; return previous; })(cRef(() => op, __cxx_lvalue_20 => { op = __cxx_lvalue_20; })), Uint8Array).value) = (u32((u32(255) & 255)) & 255));
          }
          ((cDeref(((__cxx_lvalue_21) => { const previous = __cxx_lvalue_21.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_21.value = next; return previous; })(cRef(() => op, __cxx_lvalue_22 => { op = __cxx_lvalue_22; })), Uint8Array).value) = (u32((u32((u32(len) & 255)) & 255)) & 255));
        } else {
          ((cDeref(token, Uint8Array).value) = (u32((u32((u32((litLength << 4)) & 255)) & 255)) & 255));
        }
        LZ4_wildCopy8(op, anchor, cPointerOffset(op, litLength, Uint8Array.BYTES_PER_ELEMENT));
        (op = cPointerOffset(op, litLength, Uint8Array.BYTES_PER_ELEMENT));
        {

        }
        ;
      }
      __source_loop__next_match: while (true) {
        if (((i32(outputDirective) == i32(2)) && cPointerCompare(cPointerOffset(cPointerOffset(cPointerOffset(cPointerOffset(op, 2, Uint8Array.BYTES_PER_ELEMENT, true), 1, Uint8Array.BYTES_PER_ELEMENT, true), 12, Uint8Array.BYTES_PER_ELEMENT, true), -(4), Uint8Array.BYTES_PER_ELEMENT, true), olimit, ">"))) {
          (op = token);
          break __source_exit__last_literals;
        }
        if (Boolean(maybe_extMem)) {
          {

          }
          ;
          void 0;
          LZ4_writeLE16(op, (u32((u32(offset) & 65535)) & 65535));
          (op = cPointerOffset(op, 2, Uint8Array.BYTES_PER_ELEMENT));
        } else {
          {

          }
          ;
          void 0;
          LZ4_writeLE16(op, (u32((u32(cPointerDiff(ip, match, Uint8Array.BYTES_PER_ELEMENT)) & 65535)) & 65535));
          (op = cPointerOffset(op, 2, Uint8Array.BYTES_PER_ELEMENT));
        }
        {

          if ((((i32(dictDirective) == i32(2)) || (i32(dictDirective) == i32(3))) && cPointerCompare(lowLimit, dictionary, "=="))) {
            limit = cPointerOffset(ip, cPointerDiff(dictEnd, match, Uint8Array.BYTES_PER_ELEMENT), Uint8Array.BYTES_PER_ELEMENT, true);
            void 0;
            if (cPointerCompare(limit, matchlimit, ">")) {
              (limit = matchlimit);
            }
            (matchCode = u32(LZ4_count(cPointerOffset(ip, 4, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(match, 4, Uint8Array.BYTES_PER_ELEMENT), limit)));
            (ip = cPointerOffset(ip, u64((BigInt(u64(matchCode)) + BigInt(u64(4)))), Uint8Array.BYTES_PER_ELEMENT));
            if (cPointerCompare(ip, limit, "==")) {
              more = u32(LZ4_count(limit, cTypedPointer(source, Uint8Array), matchlimit));
              (matchCode = u32((Number(matchCode) + Number(more))));
              (ip = cPointerOffset(ip, more, Uint8Array.BYTES_PER_ELEMENT));
            }
            {

            }
            ;
          } else {
            (matchCode = u32(LZ4_count(cPointerOffset(ip, 4, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(match, 4, Uint8Array.BYTES_PER_ELEMENT), matchlimit)));
            (ip = cPointerOffset(ip, u64((BigInt(u64(matchCode)) + BigInt(u64(4)))), Uint8Array.BYTES_PER_ELEMENT));
            {

            }
            ;
          }
          if ((Boolean(outputDirective) && Boolean(i64((i32(cPointerCompare(cPointerOffset(cPointerOffset(op, i32((1 + 5)), Uint8Array.BYTES_PER_ELEMENT, true), Math.trunc(u32((matchCode + u32(240))) / u32(255)), Uint8Array.BYTES_PER_ELEMENT, true), olimit, ">")) != 0))))) {
            if ((i32(outputDirective) == i32(2))) {
              newMatchCode = u32((u32(i32((15 - 1))) + u32(Math.imul(u32((u32((u32(cPointerDiff(olimit, op, Uint8Array.BYTES_PER_ELEMENT)) - u32(1))) - u32(5))), u32(255)))));
              (ip = cPointerOffset(ip, -(u32((matchCode - newMatchCode))), Uint8Array.BYTES_PER_ELEMENT));
              void 0;
              (matchCode = u32(newMatchCode));
              if (Boolean(i64((i32(cPointerCompare(ip, filledIp, "<=")) != 0)))) {

                {

                }
                ;
                __source_control_5: for ((ptr = ip); cPointerCompare(ptr, filledIp, "<="); ((__cxx_lvalue_23) => { const previous = __cxx_lvalue_23.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_23.value = next; return next; })(cRef(() => ptr, __cxx_lvalue_24 => { ptr = __cxx_lvalue_24; }))) {
                  __cxx_scope_42_h = u32(LZ4_hashPosition(ptr, tableType));
                  LZ4_clearHash(__cxx_scope_42_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
                }
              }
            } else {
              void 0;
              return i32(0);
            }
          }
          if ((matchCode >= u32((u32((1 << 4)) - u32(1))))) {
            ((__cxx_lvalue_25) => (__cxx_lvalue_25.value = (u32((__cxx_lvalue_25.value + u32((u32((1 << 4)) - u32(1))))) & 255)))(cDeref(token, Uint8Array));
            (matchCode = u32((Number(matchCode) - Number(u32((u32((1 << 4)) - u32(1)))))));
            LZ4_write32(op, 4294967295);
            __source_control_6: while ((matchCode >= u32(i32(Math.imul(4, 255))))) {
              (op = cPointerOffset(op, 4, Uint8Array.BYTES_PER_ELEMENT));
              LZ4_write32(op, 4294967295);
              (matchCode = u32((Number(matchCode) - Number(u32(i32(Math.imul(4, 255)))))));
            }
            (op = cPointerOffset(op, Math.trunc(matchCode / u32(255)), Uint8Array.BYTES_PER_ELEMENT));
            ((cDeref(((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_26.value = next; return previous; })(cRef(() => op, __cxx_lvalue_27 => { op = __cxx_lvalue_27; })), Uint8Array).value) = (u32((u32((u32((matchCode % u32(255))) & 255)) & 255)) & 255));
          } else {
            ((__cxx_lvalue_28) => (__cxx_lvalue_28.value = (u32((__cxx_lvalue_28.value + i32((u32((u32(matchCode) & 255)) & 255)))) & 255)))(cDeref(token, Uint8Array));
          }
        }
        void 0;
        (anchor = ip);
        if (cPointerCompare(ip, mflimitPlusOne, ">=")) {
          break __source_control_0;
        }
        {
          __cxx_scope_43_h = u32(LZ4_hashPosition(cPointerOffset(ip, -(2), Uint8Array.BYTES_PER_ELEMENT), tableType));
          if ((i32(tableType) == i32(1))) {
            LZ4_putPositionOnHash(cPointerOffset(ip, -(2), Uint8Array.BYTES_PER_ELEMENT), __cxx_scope_43_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, 1);
          } else {
            idx = u32(cPointerDiff(cPointerOffset(ip, -(2), Uint8Array.BYTES_PER_ELEMENT), base, Uint8Array.BYTES_PER_ELEMENT));
            LZ4_putIndexOnHash(idx, __cxx_scope_43_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
          }
        }
        if ((i32(tableType) == i32(1))) {
          (match = LZ4_getPosition(ip, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType));
          LZ4_putPosition(ip, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
          if ((cPointerCompare(cPointerOffset(match, 65535, Uint8Array.BYTES_PER_ELEMENT, true), ip, ">=") && (LZ4_read32(match) == LZ4_read32(ip)))) {
            (token = ((__cxx_lvalue_29) => { const previous = __cxx_lvalue_29.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_29.value = next; return previous; })(cRef(() => op, __cxx_lvalue_30 => { op = __cxx_lvalue_30; })));
            ((cDeref(token, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
            continue __source_loop__next_match;
          }
        } else {
          __cxx_scope_45_h = u32(LZ4_hashPosition(ip, tableType));
          __cxx_scope_46_current = u32(cPointerDiff(ip, base, Uint8Array.BYTES_PER_ELEMENT));
          __cxx_scope_47_matchIndex = u32(LZ4_getIndexOnHash(__cxx_scope_45_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType));
          void 0;
          if ((i32(dictDirective) == i32(3))) {
            if ((__cxx_scope_47_matchIndex < startIndex)) {
              void 0;
              (__cxx_scope_47_matchIndex = u32(LZ4_getIndexOnHash(__cxx_scope_45_h, cRecordObject(cRecordPointer(dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, 2)));
              (match = cPointerOffset(dictBase, __cxx_scope_47_matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
              (lowLimit = dictionary);
              (__cxx_scope_47_matchIndex = u32((Number(__cxx_scope_47_matchIndex) + Number(dictDelta))));
            } else {
              (match = cPointerOffset(base, __cxx_scope_47_matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
              (lowLimit = cTypedPointer(source, Uint8Array));
            }
          } else {
            if ((i32(dictDirective) == i32(2))) {
              if ((__cxx_scope_47_matchIndex < startIndex)) {
                void 0;
                (match = cPointerOffset(dictBase, __cxx_scope_47_matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
                (lowLimit = dictionary);
              } else {
                (match = cPointerOffset(base, __cxx_scope_47_matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
                (lowLimit = cTypedPointer(source, Uint8Array));
              }
            } else {
              (match = cPointerOffset(base, __cxx_scope_47_matchIndex, Uint8Array.BYTES_PER_ELEMENT, true));
            }
          }
          LZ4_putIndexOnHash(__cxx_scope_46_current, __cxx_scope_45_h, cRecordObject(cRecordPointer(cctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
          void 0;
          if (((Boolean(((i32(dictIssue) == i32(1)) ? i32((__cxx_scope_47_matchIndex >= prefixIdxLimit)) : 1)) && Boolean((((i32(tableType) == i32(3)) && (65535 == 65535)) ? 1 : i32((u32((__cxx_scope_47_matchIndex + u32(65535))) >= __cxx_scope_46_current))))) && (LZ4_read32(match) == LZ4_read32(ip)))) {
            (token = ((__cxx_lvalue_31) => { const previous = __cxx_lvalue_31.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_31.value = next; return previous; })(cRef(() => op, __cxx_lvalue_32 => { op = __cxx_lvalue_32; })));
            ((cDeref(token, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
            if (Boolean(maybe_extMem)) {
              (offset = u32((__cxx_scope_46_current - __cxx_scope_47_matchIndex)));
            }
            {

            }
            ;
            continue __source_loop__next_match;
          }
        }
        break;
      }
      (forwardH = u32(LZ4_hashPosition(((__cxx_lvalue_33) => { const previous = __cxx_lvalue_33.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_33.value = next; return next; })(cRef(() => ip, __cxx_lvalue_34 => { ip = __cxx_lvalue_34; })), tableType)));
    }
  }
  {
    lastRun = u64(cPointerDiff(iend, anchor, Uint8Array.BYTES_PER_ELEMENT));
    if ((Boolean(outputDirective) && cPointerCompare(cPointerOffset(cPointerOffset(cPointerOffset(op, lastRun, Uint8Array.BYTES_PER_ELEMENT, true), 1, Uint8Array.BYTES_PER_ELEMENT, true), u64((BigInt(u64((BigInt(u64((BigInt(lastRun) + BigInt(u64(255))))) - BigInt(u64(u32((u32((1 << i32((8 - 4)))) - u32(1)))))))) / BigInt(u64(255)))), Uint8Array.BYTES_PER_ELEMENT, true), olimit, ">"))) {
      if ((i32(outputDirective) == i32(2))) {
        void 0;
        (lastRun = u64((BigInt(u64(cPointerDiff(olimit, op, Uint8Array.BYTES_PER_ELEMENT))) - BigInt(u64(1)))));
        (lastRun = u64((BigInt(lastRun) - BigInt(u64((BigInt(u64((BigInt(u64((BigInt(lastRun) + BigInt(u64(256))))) - BigInt(u64(u32((u32((1 << i32((8 - 4)))) - u32(1)))))))) / BigInt(u64(256))))))));
      } else {
        void 0;
        return i32(0);
      }
    }
    {

    }
    ;
    if ((lastRun >= u64(u32((u32((1 << i32((8 - 4)))) - u32(1)))))) {
      accumulator = u64((BigInt(lastRun) - BigInt(u64(u32((u32((1 << i32((8 - 4)))) - u32(1)))))));
      ((cDeref(((__cxx_lvalue_35) => { const previous = __cxx_lvalue_35.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_35.value = next; return previous; })(cRef(() => op, __cxx_lvalue_36 => { op = __cxx_lvalue_36; })), Uint8Array).value) = (u32((u32((u32((u32((1 << i32((8 - 4)))) - u32(1))) << 4)) & 255)) & 255));
      __source_control_7: for (; (accumulator >= u64(255)); (accumulator = u64((BigInt(accumulator) - BigInt(u64(255)))))) {
        ((cDeref(((__cxx_lvalue_37) => { const previous = __cxx_lvalue_37.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_37.value = next; return previous; })(cRef(() => op, __cxx_lvalue_38 => { op = __cxx_lvalue_38; })), Uint8Array).value) = (u32((u32(255) & 255)) & 255));
      }
      ((cDeref(((__cxx_lvalue_39) => { const previous = __cxx_lvalue_39.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_39.value = next; return previous; })(cRef(() => op, __cxx_lvalue_40 => { op = __cxx_lvalue_40; })), Uint8Array).value) = (u32((u32((u32(accumulator) & 255)) & 255)) & 255));
    } else {
      ((cDeref(((__cxx_lvalue_41) => { const previous = __cxx_lvalue_41.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_41.value = next; return previous; })(cRef(() => op, __cxx_lvalue_42 => { op = __cxx_lvalue_42; })), Uint8Array).value) = (u32((u32((u32(u64((BigInt(lastRun) << BigInt(4)))) & 255)) & 255)) & 255));
    }
    cByteMemory.memcpy(op, anchor, lastRun);
    (ip = cPointerOffset(anchor, lastRun, Uint8Array.BYTES_PER_ELEMENT, true));
    (op = cPointerOffset(op, lastRun, Uint8Array.BYTES_PER_ELEMENT));
  }
  if ((i32(outputDirective) == i32(2))) {
    ((cDeref(inputConsumed, Int32Array).value) = i32(cPointerDiff(cTypedPointer(ip, Uint8Array), source, Uint8Array.BYTES_PER_ELEMENT)));
  }
  (result = i32(cPointerDiff(cTypedPointer(op, Uint8Array), dest, Uint8Array.BYTES_PER_ELEMENT)));
  void 0;
  {

  }
  ;
  return i32(result);
}

// C/C++ source: source/build/src/lz4.c:1344
export function LZ4_compress_generic(cctx, src, dst, srcSize, inputConsumed, dstCapacity, outputDirective, tableType, dictDirective, dictIssue, acceleration) {
  {

  }
  ;
  if ((u32(srcSize) > u32(2113929216))) {
    return i32(0);
  }
  if ((srcSize == 0)) {
    if (((i32(outputDirective) != i32(0)) && (dstCapacity <= 0))) {
      return i32(0);
    }
    {

    }
    ;
    void 0;
    void 0;
    ((cDeref(cPointerOffset(dst, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((i32(outputDirective) == i32(2))) {
      void 0;
      ((cDeref(inputConsumed, Int32Array).value) = i32(0));
    }
    return i32(1);
  }
  void 0;
  return i32(LZ4_compress_generic_validated(cctx, src, dst, srcSize, inputConsumed, dstCapacity, outputDirective, tableType, dictDirective, dictIssue, acceleration));
}

// C/C++ source: source/build/src/lz4.c:1382
export function LZ4_compress_fast_extState(state, source, dest, inputSize, maxOutputSize, acceleration) {
  let ctx = cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_initStream(state, 16416), {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse");
  void 0;
  if ((acceleration < 1)) {
    (acceleration = i32(1));
  }
  if ((acceleration > 65537)) {
    (acceleration = i32(65537));
  }
  if ((maxOutputSize >= LZ4_compressBound(inputSize))) {
    if ((inputSize < LZ4_64Klimit)) {
      return i32(LZ4_compress_generic(ctx, source, dest, inputSize, null, 0, 0, 3, 0, 0, acceleration));
    } else {
      let tableType = (((8 == u64(4)) && (u64(cSourceAddresses.encode(source)) > u64(65535))) ? 1 : 2);
      return i32(LZ4_compress_generic(ctx, source, dest, inputSize, null, 0, 0, tableType, 0, 0, acceleration));
    }
  } else {
    if ((inputSize < LZ4_64Klimit)) {
      return i32(LZ4_compress_generic(ctx, source, dest, inputSize, null, maxOutputSize, 1, 3, 0, 0, acceleration));
    } else {
      let tableType = (((8 == u64(4)) && (u64(cSourceAddresses.encode(source)) > u64(65535))) ? 1 : 2);
      return i32(LZ4_compress_generic(ctx, source, dest, inputSize, null, maxOutputSize, 1, tableType, 0, 0, acceleration));
    }
  }
}

// C/C++ source: source/build/src/lz4.c:1414
export function LZ4_compress_fast_extState_fastReset(state, src, dst, srcSize, dstCapacity, acceleration) {
  let ctx = cObjectFieldRef(cRecordObject(cRecordPointer(cRecordPointer(state, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {}), {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse");
  if ((acceleration < 1)) {
    (acceleration = i32(1));
  }
  if ((acceleration > 65537)) {
    (acceleration = i32(65537));
  }
  void 0;
  if ((dstCapacity >= LZ4_compressBound(srcSize))) {
    if ((srcSize < LZ4_64Klimit)) {
      let tableType = 3;
      LZ4_prepareTable(ctx, srcSize, tableType);
      if (Boolean(cRecordObject(cRecordPointer(ctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset)) {
        return i32(LZ4_compress_generic(ctx, src, dst, srcSize, null, 0, 0, tableType, 0, 1, acceleration));
      } else {
        return i32(LZ4_compress_generic(ctx, src, dst, srcSize, null, 0, 0, tableType, 0, 0, acceleration));
      }
    } else {
      let tableType = (((8 == u64(4)) && (u64(cSourceAddresses.encode(src)) > u64(65535))) ? 1 : 2);
      LZ4_prepareTable(ctx, srcSize, tableType);
      return i32(LZ4_compress_generic(ctx, src, dst, srcSize, null, 0, 0, tableType, 0, 0, acceleration));
    }
  } else {
    if ((srcSize < LZ4_64Klimit)) {
      let tableType = 3;
      LZ4_prepareTable(ctx, srcSize, tableType);
      if (Boolean(cRecordObject(cRecordPointer(ctx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset)) {
        return i32(LZ4_compress_generic(ctx, src, dst, srcSize, null, dstCapacity, 1, tableType, 0, 1, acceleration));
      } else {
        return i32(LZ4_compress_generic(ctx, src, dst, srcSize, null, dstCapacity, 1, tableType, 0, 0, acceleration));
      }
    } else {
      let tableType = (((8 == u64(4)) && (u64(cSourceAddresses.encode(src)) > u64(65535))) ? 1 : 2);
      LZ4_prepareTable(ctx, srcSize, tableType);
      return i32(LZ4_compress_generic(ctx, src, dst, srcSize, null, dstCapacity, 1, tableType, 0, 0, acceleration));
    }
  }
}

// C/C++ source: source/build/src/lz4.c:1453
export function LZ4_compress_fast(src, dest, srcSize, dstCapacity, acceleration) {
  let result;
  let ctx = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}}, {});
  let ctxPtr = ctx;
  (result = i32(LZ4_compress_fast_extState(ctxPtr, src, dest, srcSize, dstCapacity, acceleration)));
  return i32(result);
}

// C/C++ source: source/build/src/lz4.c:1472
export function LZ4_compress_default(src, dst, srcSize, dstCapacity) {
  return i32(LZ4_compress_fast(src, dst, srcSize, dstCapacity, 1));
}

// C/C++ source: source/build/src/lz4.c:1481
export function LZ4_compress_destSize_extState_internal(state, src, dst, srcSizePtr, targetDstSize, acceleration) {
  let s = LZ4_initStream(state, 16416);
  void 0;
  void 0;
  if ((targetDstSize >= LZ4_compressBound((cDeref(srcSizePtr, Int32Array).value)))) {
    return i32(LZ4_compress_fast_extState(state, src, dst, (cDeref(srcSizePtr, Int32Array).value), targetDstSize, acceleration));
  } else {
    if (((cDeref(srcSizePtr, Int32Array).value) < LZ4_64Klimit)) {
      return i32(LZ4_compress_generic(cObjectFieldRef(cRecordObject(cRecordPointer(state, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse"), src, dst, (cDeref(srcSizePtr, Int32Array).value), srcSizePtr, targetDstSize, 2, 3, 0, 0, acceleration));
    } else {
      let addrMode = (((8 == u64(4)) && (u64(cSourceAddresses.encode(src)) > u64(65535))) ? 1 : 2);
      return i32(LZ4_compress_generic(cObjectFieldRef(cRecordObject(cRecordPointer(state, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse"), src, dst, (cDeref(srcSizePtr, Int32Array).value), srcSizePtr, targetDstSize, 2, addrMode, 0, 0, acceleration));
    }
  }
}

// C/C++ source: source/build/src/lz4.c:1497
export function LZ4_compress_destSize_extState(state, src, dst, srcSizePtr, targetDstSize, acceleration) {
  let r = i32(LZ4_compress_destSize_extState_internal(cRecordPointer(state, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {}), src, dst, srcSizePtr, targetDstSize, acceleration));
  LZ4_initStream(state, 16416);
  return i32(r);
}

// C/C++ source: source/build/src/lz4.c:1506
export function LZ4_compress_destSize(src, dst, srcSizePtr, targetDstSize) {
  let ctxBody = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}}, {});
  let ctx = ctxBody;
  let result = i32(LZ4_compress_destSize_extState_internal(ctx, src, dst, srcSizePtr, targetDstSize, 1));
  return i32(result);
}

// C/C++ source: source/build/src/lz4.c:1542
export function LZ4_stream_t_alignment() {


  return u64((BigInt(16424) - BigInt(16416)));
}

// C/C++ source: source/build/src/lz4.c:1552
export function LZ4_initStream(buffer, size) {
  {

  }
  ;
  if (cPointerCompare(buffer, null, "==")) {
    return null;
  }
  if ((size < 16416)) {
    return null;
  }
  if ((!Boolean(LZ4_isAligned(buffer, LZ4_stream_t_alignment())))) {
    return null;
  }
  memset(buffer, 0, 16416);
  return cRecordPointer(buffer, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {});
}

// C/C++ source: source/build/src/lz4.c:1564
export function LZ4_resetStream(LZ4_stream) {
  {

  }
  ;
  memset(LZ4_stream, 0, 16416);
}

// C/C++ source: source/build/src/lz4.c:1570
export function LZ4_resetStream_fast(ctx) {
  LZ4_prepareTable(cObjectFieldRef(cRecordObject(cRecordPointer(ctx, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse"), 0, 2);
}

// C/C++ source: source/build/src/lz4.c:1587
export function LZ4_loadDict_internal(LZ4_dict, dictionary, dictSize, _ld) {
  let dict = cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse");
  let tableType = 2;
  let p = cTypedPointer(dictionary, Uint8Array);
  let dictEnd = cPointerOffset(p, dictSize, Uint8Array.BYTES_PER_ELEMENT);
  let idx32;
  {

  }
  ;
  LZ4_resetStream(LZ4_dict);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32(i32(Math.imul(64, i32((1 << 10))))))))))(cObjectFieldRef(cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})), "currentOffset"));
  if ((dictSize < i32(8))) {
    return i32(0);
  }
  if ((cPointerDiff(dictEnd, p, Uint8Array.BYTES_PER_ELEMENT) > i64(i32(Math.imul(64, i32((1 << 10))))))) {
    (p = cPointerOffset(dictEnd, -(i32(Math.imul(64, i32((1 << 10))))), Uint8Array.BYTES_PER_ELEMENT, true));
  }
  (cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = p);
  (cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(cPointerDiff(dictEnd, p, Uint8Array.BYTES_PER_ELEMENT)));
  (cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).tableType = u32(tableType));
  (idx32 = u32((cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset - cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize)));
  while (cPointerCompare(p, cPointerOffset(dictEnd, -(8), Uint8Array.BYTES_PER_ELEMENT, true), "<=")) {
    let h = u32(LZ4_hashPosition(p, tableType));
    LZ4_putIndexOnHash(idx32, h, cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
    (p = cPointerOffset(p, 3, Uint8Array.BYTES_PER_ELEMENT));
    (idx32 = u32((Number(idx32) + Number(u32(3)))));
  }
  if ((i32(_ld) == i32(1))) {
    (p = cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary);
    (idx32 = u32((cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset - cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize)));
    while (cPointerCompare(p, cPointerOffset(dictEnd, -(8), Uint8Array.BYTES_PER_ELEMENT, true), "<=")) {
      let h = u32(LZ4_hashPosition(p, tableType));
      let limit = u32((cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset - u32(i32(Math.imul(64, i32((1 << 10)))))));
      if ((LZ4_getIndexOnHash(h, cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType) <= limit)) {
        LZ4_putIndexOnHash(idx32, h, cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, tableType);
      }
      ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(cRef(() => p, __cxx_lvalue_2 => { p = __cxx_lvalue_2; }));
      ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = u32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => idx32, __cxx_lvalue_4 => { idx32 = __cxx_lvalue_4; }));
    }
  }
  return i32(cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize);
}

// C/C++ source: source/build/src/lz4.c:1648
export function LZ4_loadDict(LZ4_dict, dictionary, dictSize) {
  return i32(LZ4_loadDict_internal(LZ4_dict, dictionary, dictSize, 0));
}

// C/C++ source: source/build/src/lz4.c:1653
export function LZ4_loadDictSlow(LZ4_dict, dictionary, dictSize) {
  return i32(LZ4_loadDict_internal(LZ4_dict, dictionary, dictSize, 1));
}

// C/C++ source: source/build/src/lz4.c:1658
export function LZ4_attach_dictionary(workingStream, dictionaryStream) {
  let dictCtx = (cPointerCompare(dictionaryStream, null, "==") ? null : cObjectFieldRef(cRecordObject(cRecordPointer(dictionaryStream, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse"));
  {

  }
  ;
  if (cPointerCompare(dictCtx, null, "!=")) {
    if ((cRecordObject(cRecordPointer(workingStream, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})).internal_donotuse.currentOffset == u32(0))) {
      (cRecordObject(cRecordPointer(workingStream, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})).internal_donotuse.currentOffset = u32(i32(Math.imul(64, i32((1 << 10))))));
    }
    if ((cRecordObject(cRecordPointer(dictCtx, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize == u32(0))) {
      (dictCtx = null);
    }
  }
  (cRecordObject(cRecordPointer(workingStream, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})).internal_donotuse.dictCtx = dictCtx);
}

// C/C++ source: source/build/src/lz4.c:1687
export function LZ4_renormDictT(LZ4_dict, nextSize) {
  void 0;
  if ((u32((cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset + u32(nextSize))) > 2147483648)) {
    let delta = u32((cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset - u32(i32(Math.imul(64, i32((1 << 10)))))));
    let dictEnd = cPointerOffset(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary, cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize, Uint8Array.BYTES_PER_ELEMENT);
    let i;
    {

    }
    ;
    for ((i = i32(0)); (i < i32((1 << i32((14 - 2))))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      if (((cDeref(cPointerOffset(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < delta)) {
        ((cDeref(cPointerOffset(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32(0));
      } else {
        ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((Number(__cxx_lvalue_2.value) - Number(delta)))))(cDeref(cPointerOffset(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).hashTable, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      }
    }
    (cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset = u32(i32(Math.imul(64, i32((1 << 10))))));
    if ((cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize > u32(i32(Math.imul(64, i32((1 << 10))))))) {
      (cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(i32(Math.imul(64, i32((1 << 10))))));
    }
    (cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = cPointerOffset(dictEnd, -(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize), Uint8Array.BYTES_PER_ELEMENT));
  }
}

// C/C++ source: source/build/src/lz4.c:1707
export function LZ4_compress_fast_continue(LZ4_stream, source, dest, inputSize, maxOutputSize, acceleration) {
  let tableType = 2;
  let streamPtr = cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_stream, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse");
  let dictEnd = (Boolean(cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize) ? cPointerOffset(cTypedPointer(cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary, Uint8Array), cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize, Uint8Array.BYTES_PER_ELEMENT) : null);
  {

  }
  ;
  LZ4_renormDictT(streamPtr, inputSize);
  if ((acceleration < 1)) {
    (acceleration = i32(1));
  }
  if ((acceleration > 65537)) {
    (acceleration = i32(65537));
  }
  if (((((cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < u32(4)) && cPointerCompare(dictEnd, source, "!=")) && (inputSize > 0)) && cPointerCompare(cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictCtx, null, "=="))) {
    {

    }
    ;
    (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(0));
    (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = cTypedPointer(source, Uint8Array));
    (dictEnd = source);
  }
  {
    let sourceEnd = cPointerOffset(source, inputSize, Uint8Array.BYTES_PER_ELEMENT, true);
    if ((cPointerCompare(sourceEnd, cTypedPointer(cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary, Uint8Array), ">") && cPointerCompare(sourceEnd, dictEnd, "<"))) {
      (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(cPointerDiff(dictEnd, sourceEnd, Uint8Array.BYTES_PER_ELEMENT)));
      if ((cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize > u32(i32(Math.imul(64, i32((1 << 10))))))) {
        (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(i32(Math.imul(64, i32((1 << 10))))));
      }
      if ((cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < u32(4))) {
        (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(0));
      }
      (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = cPointerOffset(cTypedPointer(dictEnd, Uint8Array), -(cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize), Uint8Array.BYTES_PER_ELEMENT));
    }
  }
  if (cPointerCompare(dictEnd, source, "==")) {
    if (((cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < u32(i32(Math.imul(64, i32((1 << 10)))))) && (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset))) {
      return i32(LZ4_compress_generic(streamPtr, source, dest, inputSize, null, maxOutputSize, 1, tableType, 1, 1, acceleration));
    } else {
      return i32(LZ4_compress_generic(streamPtr, source, dest, inputSize, null, maxOutputSize, 1, tableType, 1, 0, acceleration));
    }
  }
  {
    let result;
    if (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictCtx) {
      if ((inputSize > i32(Math.imul(4, i32((1 << 10)))))) {
        cByteMemory.memcpy(streamPtr, cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictCtx, 16416);
        (result = i32(LZ4_compress_generic(streamPtr, source, dest, inputSize, null, maxOutputSize, 1, tableType, 2, 0, acceleration)));
      } else {
        (result = i32(LZ4_compress_generic(streamPtr, source, dest, inputSize, null, maxOutputSize, 1, tableType, 3, 0, acceleration)));
      }
    } else {
      if (((cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < u32(i32(Math.imul(64, i32((1 << 10)))))) && (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset))) {
        (result = i32(LZ4_compress_generic(streamPtr, source, dest, inputSize, null, maxOutputSize, 1, tableType, 2, 1, acceleration)));
      } else {
        (result = i32(LZ4_compress_generic(streamPtr, source, dest, inputSize, null, maxOutputSize, 1, tableType, 2, 0, acceleration)));
      }
    }
    (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = cTypedPointer(source, Uint8Array));
    (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(inputSize));
    return i32(result);
  }
}

// C/C++ source: source/build/src/lz4.c:1787
export function LZ4_compress_forceExtDict(LZ4_dict, source, dest, srcSize) {
  let streamPtr = cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse");
  let result;
  LZ4_renormDictT(streamPtr, srcSize);
  if (((cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < u32(i32(Math.imul(64, i32((1 << 10)))))) && (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize < cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).currentOffset))) {
    (result = i32(LZ4_compress_generic(streamPtr, source, dest, srcSize, null, 0, 0, 2, 2, 1, 1)));
  } else {
    (result = i32(LZ4_compress_generic(streamPtr, source, dest, srcSize, null, 0, 0, 2, 2, 0, 1)));
  }
  (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = cTypedPointer(source, Uint8Array));
  (cRecordObject(cRecordPointer(streamPtr, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(srcSize));
  return i32(result);
}

// C/C++ source: source/build/src/lz4.c:1814
export function LZ4_saveDict(LZ4_dict, safeBuffer, dictSize) {
  let dict = cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_dict, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})), "internal_donotuse");
  {

  }
  ;
  if ((u32(dictSize) > u32(i32(Math.imul(64, i32((1 << 10))))))) {
    (dictSize = i32(Math.imul(64, i32((1 << 10)))));
  }
  if ((u32(dictSize) > cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize)) {
    (dictSize = i32(cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize));
  }
  if (cPointerCompare(safeBuffer, null, "==")) {
    void 0;
  }
  if ((dictSize > 0)) {
    let previousDictEnd = cPointerOffset(cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary, cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize, Uint8Array.BYTES_PER_ELEMENT);
    void 0;
    cByteMemory.memmove(safeBuffer, cPointerOffset(previousDictEnd, -(dictSize), Uint8Array.BYTES_PER_ELEMENT), u64(dictSize));
  }
  (cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictionary = cTypedPointer(safeBuffer, Uint8Array));
  (cRecordObject(cRecordPointer(dict, {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, {})).dictSize = u32(dictSize));
  return i32(dictSize);
}

// C/C++ source: source/build/src/lz4.c:1852
export function read_long_length_no_check(pp) {
  let b;
  let l = u64(0);
  do {
    (b = u64((cDeref((cPointerElementRef(pp, 0).value), Uint8Array).value)));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cPointerElementRef(pp, 0));
    (l = u64((BigInt(l) + BigInt(b))));
  } while ((b == u64(255)));
  {

  }
  return u64(l);
}

// C/C++ source: source/build/src/lz4.c:1870
export function LZ4_decompress_unsafe_generic(istart, ostart, decompressedSize, prefixSize, dictStart, dictSize) {
  let ip = istart;
  const __cxx_lvalue_0 = cRef(() => ip, __cxx_lvalue_1 => { ip = __cxx_lvalue_1; });
  let op = cTypedPointer(ostart, Uint8Array);
  let oend = cPointerOffset(ostart, decompressedSize, Uint8Array.BYTES_PER_ELEMENT);
  let prefixStart = cPointerOffset(ostart, -(prefixSize), Uint8Array.BYTES_PER_ELEMENT);
  {

  }
  ;
  if (cPointerCompare(dictStart, null, "==")) {
    void 0;
  }
  while (Boolean(1)) {
    let token = u32((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(__cxx_lvalue_0), Uint8Array).value));
    {
      let ll = u64((token >>> 4));
      if ((ll == u64(15))) {
        (ll = u64((BigInt(ll) + BigInt(read_long_length_no_check(__cxx_lvalue_0)))));
      }
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < ll)) {
        return i32((-1));
      }
      cByteMemory.memmove(op, ip, ll);
      (op = cPointerOffset(op, ll, Uint8Array.BYTES_PER_ELEMENT));
      (ip = cPointerOffset(ip, ll, Uint8Array.BYTES_PER_ELEMENT));
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < u64(12))) {
        if (cPointerCompare(op, oend, "==")) {
          break;
        }
        {

        }
        ;
        return i32((-1));
      }
    }
    {
      let ml = u64(u32((token & u32(15))));
      let offset = u64(LZ4_readLE16(ip));
      (ip = cPointerOffset(ip, 2, Uint8Array.BYTES_PER_ELEMENT));
      if ((ml == u64(15))) {
        (ml = u64((BigInt(ml) + BigInt(read_long_length_no_check(__cxx_lvalue_0)))));
      }
      (ml = u64((BigInt(ml) + BigInt(u64(4)))));
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < ml)) {
        return i32((-1));
      }
      {
        let match = cPointerOffset(op, -(offset), Uint8Array.BYTES_PER_ELEMENT);
        if ((offset > u64((BigInt(u64(cPointerDiff(op, prefixStart, Uint8Array.BYTES_PER_ELEMENT))) + BigInt(dictSize))))) {
          {

          }
          ;
          return i32((-1));
        }
        if ((offset > u64(cPointerDiff(op, prefixStart, Uint8Array.BYTES_PER_ELEMENT)))) {
          let dictEnd = cPointerOffset(dictStart, dictSize, Uint8Array.BYTES_PER_ELEMENT);
          let extMatch = cPointerOffset(dictEnd, -(u64((BigInt(offset) - BigInt(u64(cPointerDiff(op, prefixStart, Uint8Array.BYTES_PER_ELEMENT)))))), Uint8Array.BYTES_PER_ELEMENT);
          let extml = u64(cPointerDiff(dictEnd, extMatch, Uint8Array.BYTES_PER_ELEMENT));
          if ((extml > ml)) {
            cByteMemory.memmove(op, extMatch, ml);
            (op = cPointerOffset(op, ml, Uint8Array.BYTES_PER_ELEMENT));
            (ml = u64(0));
          } else {
            cByteMemory.memmove(op, extMatch, extml);
            (op = cPointerOffset(op, extml, Uint8Array.BYTES_PER_ELEMENT));
            (ml = u64((BigInt(ml) - BigInt(extml))));
          }
          (match = prefixStart);
        }
        {
          let u;
          for ((u = u64(0)); (u < ml); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = u64((previous + 1n)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => u, __cxx_lvalue_4 => { u = __cxx_lvalue_4; }))) {
            ((cDeref(cPointerOffset(op, u, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(match, u, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
          }
        }
      }
      (op = cPointerOffset(op, ml, Uint8Array.BYTES_PER_ELEMENT));
      if ((u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)) < u64(5))) {
        {

        }
        ;
        return i32((-1));
      }
    }
  }
  return i32(cPointerDiff(ip, istart, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/build/src/lz4.c:1977
export const rvl_error = u64((-1));
function __cxx_static_address_84124cb440a56a255d2d81a7() {
  return __cxx_static_address_84124cb440a56a255d2d81a7.reference || (__cxx_static_address_84124cb440a56a255d2d81a7.reference = {
    __cReference: true,
    get value() { return rvl_error; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/lz4.c:1979
export function read_variable_length(ip, ilimit, initial_check) {
  let s;
  let length = u64(0);
  void 0;
  void 0;
  void 0;
  if ((Boolean(initial_check) && Boolean(i64((i32(cPointerCompare((cPointerElementRef(ip, 0).value), ilimit, ">=")) != 0))))) {
    return rvl_error;
  }
  (s = u64((cDeref((cPointerElementRef(ip, 0).value), Uint8Array).value)));
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cPointerElementRef(ip, 0));
  (length = u64((BigInt(length) + BigInt(s))));
  if (Boolean(i64((i32(cPointerCompare((cPointerElementRef(ip, 0).value), ilimit, ">")) != 0)))) {
    return rvl_error;
  }
  if (((8 < u64(8)) && Boolean(i64((i32((length > u64((BigInt(u64((-1))) / BigInt(u64(2)))))) != 0))))) {
    return rvl_error;
  }
  if (Boolean(i64((i32((s != u64(255))) != 0)))) {
    return length;
  }
  do {
    (s = u64((cDeref((cPointerElementRef(ip, 0).value), Uint8Array).value)));
    ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_1.value = next; return previous; })(cPointerElementRef(ip, 0));
    (length = u64((BigInt(length) + BigInt(s))));
    if (Boolean(i64((i32(cPointerCompare((cPointerElementRef(ip, 0).value), ilimit, ">")) != 0)))) {
      return rvl_error;
    }
    if (((8 < u64(8)) && Boolean(i64((i32((length > u64((BigInt(u64((-1))) / BigInt(u64(2)))))) != 0))))) {
      return rvl_error;
    }
  } while ((s == u64(255)));
  return length;
}

// C/C++ source: source/build/src/lz4.c:2023
export function LZ4_decompress_generic(src, dst, srcSize, outputSize, partialDecoding, dict, lowPrefix, dictStart, dictSize) {
  let ip, iend, op, oend, cpy, dictEnd, checkOffset, shortiend, shortoend, match, offset, token, length, addl, __cxx_scope_14_addl, copySize, restSize, endOfMatch, copyFrom, mlen, matchEnd, copyEnd, oCopyLimit, __cxx_lvalue_0;
  if ((cPointerCompare(src, null, "==") || (outputSize < 0))) {
    return i32((-1));
  }
  {
    ip = cTypedPointer(src, Uint8Array);
    __cxx_lvalue_0 = cRef(() => ip, __cxx_lvalue_2 => { ip = __cxx_lvalue_2; });
    iend = cPointerOffset(ip, srcSize, Uint8Array.BYTES_PER_ELEMENT, true);
    op = cTypedPointer(dst, Uint8Array);
    oend = cPointerOffset(op, outputSize, Uint8Array.BYTES_PER_ELEMENT, true);

    dictEnd = (cPointerCompare(dictStart, null, "==") ? null : cPointerOffset(dictStart, dictSize, Uint8Array.BYTES_PER_ELEMENT));
    checkOffset = i32((dictSize < u64(i32(Math.imul(64, i32((1 << 10)))))));
    shortiend = ((__cxx_lvalue_3) => cStaticPointer(() => cPointerOffset(cPointerOffset(__cxx_lvalue_3, -(14), Uint8Array.BYTES_PER_ELEMENT), -(2), Uint8Array.BYTES_PER_ELEMENT), () => cPointerOffset(cPointerOffset(__cxx_lvalue_3, -(14), Uint8Array.BYTES_PER_ELEMENT, true), -(2), Uint8Array.BYTES_PER_ELEMENT, true)))(iend);
    shortoend = ((__cxx_lvalue_4) => cStaticPointer(() => cPointerOffset(cPointerOffset(__cxx_lvalue_4, -(14), Uint8Array.BYTES_PER_ELEMENT), -(18), Uint8Array.BYTES_PER_ELEMENT), () => cPointerOffset(cPointerOffset(__cxx_lvalue_4, -(14), Uint8Array.BYTES_PER_ELEMENT, true), -(18), Uint8Array.BYTES_PER_ELEMENT, true)))(oend);




    {

    }
    ;
    void 0;
    if (Boolean(i64((i32((outputSize == 0)) != 0)))) {
      if (Boolean(partialDecoding)) {
        return i32(0);
      }
      return i32((((srcSize == 1) && (i32((cDeref(ip, Uint8Array).value)) == 0)) ? 0 : (-1)));
    }
    if (Boolean(i64((i32((srcSize == 0)) != 0)))) {
      return i32((-1));
    }
    {

    }
    ;
    __source_control_0: while (Boolean(1)) {
      void 0;
      (token = u32((cDeref(((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_5.value = next; return previous; })(__cxx_lvalue_0), Uint8Array).value)));
      (length = u64((token >>> 4)));
      {

      }
      ;
      __source_exit__copy_match: {
        if (((length != u64(u32((u32((1 << i32((8 - 4)))) - u32(1))))) && Boolean(i64((i32((i32(cPointerCompare(ip, shortiend, "<")) & i32(cPointerCompare(op, shortoend, "<=")))) != 0))))) {
          cByteMemory.memcpy(op, ip, u64(16));
          (op = cPointerOffset(op, length, Uint8Array.BYTES_PER_ELEMENT));
          (ip = cPointerOffset(ip, length, Uint8Array.BYTES_PER_ELEMENT));
          (length = u64(u32((token & u32((u32((1 << 4)) - u32(1)))))));
          {

          }
          ;
          (offset = u64(LZ4_readLE16(ip)));
          (ip = cPointerOffset(ip, 2, Uint8Array.BYTES_PER_ELEMENT));
          (match = cPointerOffset(op, -(offset), Uint8Array.BYTES_PER_ELEMENT, true));
          void 0;
          if ((((length != u64(u32((u32((1 << 4)) - u32(1))))) && (offset >= u64(8))) && ((i32(dict) == i32(1)) || cPointerCompare(match, lowPrefix, ">=")))) {
            cByteMemory.memcpy(cPointerOffset(op, 0, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(match, 0, Uint8Array.BYTES_PER_ELEMENT), u64(8));
            cByteMemory.memcpy(cPointerOffset(op, 8, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(match, 8, Uint8Array.BYTES_PER_ELEMENT), u64(8));
            cByteMemory.memcpy(cPointerOffset(op, 16, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(match, 16, Uint8Array.BYTES_PER_ELEMENT), u64(2));
            (op = cPointerOffset(op, u64((BigInt(length) + BigInt(u64(4)))), Uint8Array.BYTES_PER_ELEMENT));
            continue __source_control_0;
          }
          break __source_exit__copy_match;
        }
        if ((length == u64(u32((u32((1 << i32((8 - 4)))) - u32(1)))))) {
          addl = u64(read_variable_length(__cxx_lvalue_0, cPointerOffset(iend, -(u32((u32((1 << i32((8 - 4)))) - u32(1)))), Uint8Array.BYTES_PER_ELEMENT), 1));
          if ((addl == rvl_error)) {
            return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
          }
          (length = u64((BigInt(length) + BigInt(addl))));
          if (Boolean(i64((i32((u64((BigInt(u64(cSourceAddresses.encode(op))) + BigInt(length))) < u64(cSourceAddresses.encode(op)))) != 0)))) {
            return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
          }
          if (Boolean(i64((i32((u64((BigInt(u64(cSourceAddresses.encode(ip))) + BigInt(length))) < u64(cSourceAddresses.encode(ip)))) != 0)))) {
            return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
          }
        }
        (cpy = cPointerOffset(op, length, Uint8Array.BYTES_PER_ELEMENT, true));
        {

        }
        ;
        if ((cPointerCompare(cpy, cPointerOffset(oend, -(12), Uint8Array.BYTES_PER_ELEMENT, true), ">") || cPointerCompare(cPointerOffset(ip, length, Uint8Array.BYTES_PER_ELEMENT, true), cPointerOffset(iend, -(i32((i32((2 + 1)) + 5))), Uint8Array.BYTES_PER_ELEMENT, true), ">"))) {
          if (Boolean(partialDecoding)) {
            {

            }
            {

            }
            ;
            {

            }
            ;
            {

            }
            ;
            if (cPointerCompare(cPointerOffset(ip, length, Uint8Array.BYTES_PER_ELEMENT, true), iend, ">")) {
              (length = u64(cPointerDiff(iend, ip, Uint8Array.BYTES_PER_ELEMENT)));
              (cpy = cPointerOffset(op, length, Uint8Array.BYTES_PER_ELEMENT, true));
            }
            if (cPointerCompare(cpy, oend, ">")) {
              (cpy = oend);
              void 0;
              (length = u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)));
            }
          } else {
            if ((cPointerCompare(cPointerOffset(ip, length, Uint8Array.BYTES_PER_ELEMENT, true), iend, "!=") || cPointerCompare(cpy, oend, ">"))) {
              {

              }
              {

              }
              ;
              {

              }
              ;
              {

              }
              ;
              return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
            }
          }
          cByteMemory.memmove(op, ip, length);
          (ip = cPointerOffset(ip, length, Uint8Array.BYTES_PER_ELEMENT));
          (op = cPointerOffset(op, length, Uint8Array.BYTES_PER_ELEMENT));
          if ((((!Boolean(partialDecoding)) || cPointerCompare(cpy, oend, "==")) || cPointerCompare(ip, cPointerOffset(iend, -(2), Uint8Array.BYTES_PER_ELEMENT, true), ">="))) {
            break __source_control_0;
          }
        } else {
          LZ4_wildCopy8(op, ip, cpy);
          (ip = cPointerOffset(ip, length, Uint8Array.BYTES_PER_ELEMENT));
          (op = cpy);
        }
        (offset = u64(LZ4_readLE16(ip)));
        (ip = cPointerOffset(ip, 2, Uint8Array.BYTES_PER_ELEMENT));
        (match = cPointerOffset(op, -(offset), Uint8Array.BYTES_PER_ELEMENT, true));
        (length = u64(u32((token & u32((u32((1 << 4)) - u32(1)))))));
        {

        }
        ;
      }
      if ((length == u64(u32((u32((1 << 4)) - u32(1)))))) {
        __cxx_scope_14_addl = u64(read_variable_length(__cxx_lvalue_0, cPointerOffset(cPointerOffset(iend, -(5), Uint8Array.BYTES_PER_ELEMENT), 1, Uint8Array.BYTES_PER_ELEMENT), 0));
        if ((__cxx_scope_14_addl == rvl_error)) {
          return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
        }
        (length = u64((BigInt(length) + BigInt(__cxx_scope_14_addl))));
        if (Boolean(i64((i32((u64((BigInt(u64(cSourceAddresses.encode(op))) + BigInt(length))) < u64(cSourceAddresses.encode(op)))) != 0)))) {
          return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
        }
      }
      (length = u64((BigInt(length) + BigInt(u64(4)))));
      if ((Boolean(checkOffset) && Boolean(i64((i32(cPointerCompare(cPointerOffset(match, dictSize, Uint8Array.BYTES_PER_ELEMENT, true), lowPrefix, "<")) != 0))))) {
        return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
      }
      if (((i32(dict) == i32(2)) && cPointerCompare(match, lowPrefix, "<"))) {
        void 0;
        if (Boolean(i64((i32(cPointerCompare(cPointerOffset(op, length, Uint8Array.BYTES_PER_ELEMENT, true), cPointerOffset(oend, -(5), Uint8Array.BYTES_PER_ELEMENT, true), ">")) != 0)))) {
          if (Boolean(partialDecoding)) {
            (length = u64(((length < u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT))) ? length : u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT)))));
          } else {
            return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
          }
        }
        if ((length <= u64(cPointerDiff(lowPrefix, match, Uint8Array.BYTES_PER_ELEMENT)))) {
          cByteMemory.memmove(op, cPointerOffset(dictEnd, -(cPointerDiff(lowPrefix, match, Uint8Array.BYTES_PER_ELEMENT)), Uint8Array.BYTES_PER_ELEMENT), length);
          (op = cPointerOffset(op, length, Uint8Array.BYTES_PER_ELEMENT));
        } else {
          copySize = u64(cPointerDiff(lowPrefix, match, Uint8Array.BYTES_PER_ELEMENT));
          restSize = u64((BigInt(length) - BigInt(copySize)));
          cByteMemory.memcpy(op, cPointerOffset(dictEnd, -(copySize), Uint8Array.BYTES_PER_ELEMENT), copySize);
          (op = cPointerOffset(op, copySize, Uint8Array.BYTES_PER_ELEMENT));
          if ((restSize > u64(cPointerDiff(op, lowPrefix, Uint8Array.BYTES_PER_ELEMENT)))) {
            endOfMatch = cPointerOffset(op, restSize, Uint8Array.BYTES_PER_ELEMENT, true);
            copyFrom = lowPrefix;
            __source_control_1: while (cPointerCompare(op, endOfMatch, "<")) {
              ((cDeref(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(cRef(() => op, __cxx_lvalue_7 => { op = __cxx_lvalue_7; })), Uint8Array).value) = (u32((cDeref(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => copyFrom, __cxx_lvalue_9 => { copyFrom = __cxx_lvalue_9; })), Uint8Array).value)) & 255));
            }
          } else {
            cByteMemory.memcpy(op, lowPrefix, restSize);
            (op = cPointerOffset(op, restSize, Uint8Array.BYTES_PER_ELEMENT));
          }
        }
        continue __source_control_0;
      }
      void 0;
      (cpy = cPointerOffset(op, length, Uint8Array.BYTES_PER_ELEMENT, true));
      void 0;
      if ((Boolean(partialDecoding) && cPointerCompare(cpy, cPointerOffset(oend, -(i32((i32(Math.imul(2, 8)) - 4))), Uint8Array.BYTES_PER_ELEMENT, true), ">"))) {
        mlen = u64(((length < u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT))) ? length : u64(cPointerDiff(oend, op, Uint8Array.BYTES_PER_ELEMENT))));
        matchEnd = cPointerOffset(match, mlen, Uint8Array.BYTES_PER_ELEMENT, true);
        copyEnd = cPointerOffset(op, mlen, Uint8Array.BYTES_PER_ELEMENT, true);
        if (cPointerCompare(matchEnd, op, ">")) {
          __source_control_2: while (cPointerCompare(op, copyEnd, "<")) {
            ((cDeref(((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_10.value = next; return previous; })(cRef(() => op, __cxx_lvalue_11 => { op = __cxx_lvalue_11; })), Uint8Array).value) = (u32((cDeref(((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_12.value = next; return previous; })(cRef(() => match, __cxx_lvalue_13 => { match = __cxx_lvalue_13; })), Uint8Array).value)) & 255));
          }
        } else {
          cByteMemory.memcpy(op, match, mlen);
        }
        (op = copyEnd);
        if (cPointerCompare(op, oend, "==")) {
          break __source_control_0;
        }
        continue __source_control_0;
      }
      if (Boolean(i64((i32((offset < u64(8))) != 0)))) {
        LZ4_write32(op, u32(0));
        ((cDeref(cPointerOffset(op, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(match, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
        ((cDeref(cPointerOffset(op, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(match, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
        ((cDeref(cPointerOffset(op, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(match, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
        ((cDeref(cPointerOffset(op, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(match, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
        (match = cPointerOffset(match, (cDeref(cPointerOffset(inc32table, offset, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), Uint8Array.BYTES_PER_ELEMENT));
        cByteMemory.memcpy(cPointerOffset(op, 4, Uint8Array.BYTES_PER_ELEMENT), match, u64(4));
        (match = cPointerOffset(match, -((cDeref(cPointerOffset(dec64table, offset, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)), Uint8Array.BYTES_PER_ELEMENT));
      } else {
        cByteMemory.memcpy(op, match, u64(8));
        (match = cPointerOffset(match, 8, Uint8Array.BYTES_PER_ELEMENT));
      }
      (op = cPointerOffset(op, 8, Uint8Array.BYTES_PER_ELEMENT));
      if (Boolean(i64((i32(cPointerCompare(cpy, cPointerOffset(oend, -(i32((i32(Math.imul(2, 8)) - 4))), Uint8Array.BYTES_PER_ELEMENT, true), ">")) != 0)))) {
        oCopyLimit = ((__cxx_lvalue_14) => cStaticPointer(() => cPointerOffset(__cxx_lvalue_14, -(i32((8 - 1))), Uint8Array.BYTES_PER_ELEMENT), () => cPointerOffset(__cxx_lvalue_14, -(i32((8 - 1))), Uint8Array.BYTES_PER_ELEMENT, true)))(oend);
        if (cPointerCompare(cpy, cPointerOffset(oend, -(5), Uint8Array.BYTES_PER_ELEMENT, true), ">")) {
          return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
        }
        if (cPointerCompare(op, oCopyLimit, "<")) {
          LZ4_wildCopy8(op, match, oCopyLimit);
          (match = cPointerOffset(match, cPointerDiff(oCopyLimit, op, Uint8Array.BYTES_PER_ELEMENT), Uint8Array.BYTES_PER_ELEMENT));
          (op = oCopyLimit);
        }
        __source_control_3: while (cPointerCompare(op, cpy, "<")) {
          ((cDeref(((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_15.value = next; return previous; })(cRef(() => op, __cxx_lvalue_16 => { op = __cxx_lvalue_16; })), Uint8Array).value) = (u32((cDeref(((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_17.value = next; return previous; })(cRef(() => match, __cxx_lvalue_18 => { match = __cxx_lvalue_18; })), Uint8Array).value)) & 255));
        }
      } else {
        cByteMemory.memcpy(op, match, u64(8));
        if ((length > u64(16))) {
          LZ4_wildCopy8(cPointerOffset(op, 8, Uint8Array.BYTES_PER_ELEMENT), cPointerOffset(match, 8, Uint8Array.BYTES_PER_ELEMENT), cpy);
        }
      }
      (op = cpy);
    }
    {

    }
    ;
    return i32(cPointerDiff(cTypedPointer(op, Uint8Array), dst, Uint8Array.BYTES_PER_ELEMENT));
    return i32((i32(i64((-cPointerDiff(cTypedPointer(ip, Uint8Array), src, Uint8Array.BYTES_PER_ELEMENT)))) - 1));
  }
}

// C/C++ source: source/build/src/lz4.c:2451
export function LZ4_decompress_safe(source, dest, compressedSize, maxDecompressedSize) {
  return i32(LZ4_decompress_generic(source, dest, compressedSize, maxDecompressedSize, 0, 0, cTypedPointer(dest, Uint8Array), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2459
export function LZ4_decompress_safe_partial(src, dst, compressedSize, targetOutputSize, dstCapacity) {
  (dstCapacity = i32(((targetOutputSize < dstCapacity) ? targetOutputSize : dstCapacity)));
  return i32(LZ4_decompress_generic(src, dst, compressedSize, dstCapacity, 1, 0, cTypedPointer(dst, Uint8Array), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2468
export function LZ4_decompress_fast(source, dest, originalSize) {
  {

  }
  ;
  return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(0), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2479
export function LZ4_decompress_safe_withPrefix64k(source, dest, compressedSize, maxOutputSize) {
  return i32(LZ4_decompress_generic(source, dest, compressedSize, maxOutputSize, 0, 1, cPointerOffset(cTypedPointer(dest, Uint8Array), -(i32(Math.imul(64, i32((1 << 10))))), Uint8Array.BYTES_PER_ELEMENT), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2487
export function LZ4_decompress_safe_partial_withPrefix64k(source, dest, compressedSize, targetOutputSize, dstCapacity) {
  (dstCapacity = i32(((targetOutputSize < dstCapacity) ? targetOutputSize : dstCapacity)));
  return i32(LZ4_decompress_generic(source, dest, compressedSize, dstCapacity, 1, 1, cPointerOffset(cTypedPointer(dest, Uint8Array), -(i32(Math.imul(64, i32((1 << 10))))), Uint8Array.BYTES_PER_ELEMENT), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2496
export function LZ4_decompress_fast_withPrefix64k(source, dest, originalSize) {
  return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(i32(Math.imul(64, i32((1 << 10))))), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2504
export function LZ4_decompress_safe_withSmallPrefix(source, dest, compressedSize, maxOutputSize, prefixSize) {
  return i32(LZ4_decompress_generic(source, dest, compressedSize, maxOutputSize, 0, 0, cPointerOffset(cTypedPointer(dest, Uint8Array), -(prefixSize), Uint8Array.BYTES_PER_ELEMENT), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2513
export function LZ4_decompress_safe_partial_withSmallPrefix(source, dest, compressedSize, targetOutputSize, dstCapacity, prefixSize) {
  (dstCapacity = i32(((targetOutputSize < dstCapacity) ? targetOutputSize : dstCapacity)));
  return i32(LZ4_decompress_generic(source, dest, compressedSize, dstCapacity, 1, 0, cPointerOffset(cTypedPointer(dest, Uint8Array), -(prefixSize), Uint8Array.BYTES_PER_ELEMENT), null, u64(0)));
}

// C/C++ source: source/build/src/lz4.c:2523
export function LZ4_decompress_safe_forceExtDict(source, dest, compressedSize, maxOutputSize, dictStart, dictSize) {
  {

  }
  ;
  return i32(LZ4_decompress_generic(source, dest, compressedSize, maxOutputSize, 0, 2, cTypedPointer(dest, Uint8Array), cTypedPointer(dictStart, Uint8Array), dictSize));
}

// C/C++ source: source/build/src/lz4.c:2534
export function LZ4_decompress_safe_partial_forceExtDict(source, dest, compressedSize, targetOutputSize, dstCapacity, dictStart, dictSize) {
  (dstCapacity = i32(((targetOutputSize < dstCapacity) ? targetOutputSize : dstCapacity)));
  return i32(LZ4_decompress_generic(source, dest, compressedSize, dstCapacity, 1, 2, cTypedPointer(dest, Uint8Array), cTypedPointer(dictStart, Uint8Array), dictSize));
}

// C/C++ source: source/build/src/lz4.c:2545
export function LZ4_decompress_fast_extDict(source, dest, originalSize, dictStart, dictSize) {
  return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(0), cTypedPointer(dictStart, Uint8Array), dictSize));
}

// C/C++ source: source/build/src/lz4.c:2558
export function LZ4_decompress_safe_doubleDict(source, dest, compressedSize, maxOutputSize, prefixSize, dictStart, dictSize) {
  return i32(LZ4_decompress_generic(source, dest, compressedSize, maxOutputSize, 0, 2, cPointerOffset(cTypedPointer(dest, Uint8Array), -(prefixSize), Uint8Array.BYTES_PER_ELEMENT), cTypedPointer(dictStart, Uint8Array), dictSize));
}

// C/C++ source: source/build/src/lz4.c:2589
export function LZ4_setStreamDecode(LZ4_streamDecode, dictionary, dictSize) {
  let lz4sd = cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_streamDecode, {"align": 8, "arrayAlign": 1, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, "offset": 0}, "minStateSize": {"length": 32, "native": "Uint8Array", "offset": 0, "size": 32}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 32, "union": true}, {})), "internal_donotuse");
  (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize = u64(dictSize));
  if (Boolean(dictSize)) {
    void 0;
    (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd = cPointerOffset(cTypedPointer(dictionary, Uint8Array), dictSize, Uint8Array.BYTES_PER_ELEMENT));
  } else {
    (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd = cTypedPointer(dictionary, Uint8Array));
  }
  (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).externalDict = null);
  (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize = u64(0));
  return i32(1);
}

// C/C++ source: source/build/src/lz4.c:2615
export function LZ4_decoderRingBufferSize(maxBlockSize) {
  if ((maxBlockSize < 0)) {
    return i32(0);
  }
  if ((maxBlockSize > 2113929216)) {
    return i32(0);
  }
  if ((maxBlockSize < 16)) {
    (maxBlockSize = i32(16));
  }
  return i32((i32((65536 + 14)) + maxBlockSize));
}

// C/C++ source: source/build/src/lz4.c:2631
export function LZ4_decompress_safe_continue(LZ4_streamDecode, source, dest, compressedSize, maxOutputSize) {
  let lz4sd = cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_streamDecode, {"align": 8, "arrayAlign": 1, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, "offset": 0}, "minStateSize": {"length": 32, "native": "Uint8Array", "offset": 0, "size": 32}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 32, "union": true}, {})), "internal_donotuse");
  let result;
  if ((cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize == u64(0))) {
    void 0;
    (result = i32(LZ4_decompress_safe(source, dest, compressedSize, maxOutputSize)));
    if ((result <= 0)) {
      return i32(result);
    }
    (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize = u64(result));
    (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd = cPointerOffset(cTypedPointer(dest, Uint8Array), result, Uint8Array.BYTES_PER_ELEMENT));
  } else {
    if (cPointerCompare(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd, cTypedPointer(dest, Uint8Array), "==")) {
      if ((cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize >= u64(i32((i32(Math.imul(64, i32((1 << 10)))) - 1))))) {
        (result = i32(LZ4_decompress_safe_withPrefix64k(source, dest, compressedSize, maxOutputSize)));
      } else {
        if ((cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize == u64(0))) {
          (result = i32(LZ4_decompress_safe_withSmallPrefix(source, dest, compressedSize, maxOutputSize, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize)));
        } else {
          (result = i32(LZ4_decompress_safe_doubleDict(source, dest, compressedSize, maxOutputSize, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).externalDict, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize)));
        }
      }
      if ((result <= 0)) {
        return i32(result);
      }
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u64((BigInt(__cxx_lvalue_0.value) + BigInt(u64(result))))))(cObjectFieldRef(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})), "prefixSize"));
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = cPointerOffset(__cxx_lvalue_1.value, result, Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})), "prefixEnd"));
    } else {
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize = u64(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize));
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).externalDict = cPointerOffset(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd, -(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize), Uint8Array.BYTES_PER_ELEMENT));
      (result = i32(LZ4_decompress_safe_forceExtDict(source, dest, compressedSize, maxOutputSize, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).externalDict, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize)));
      if ((result <= 0)) {
        return i32(result);
      }
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize = u64(result));
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd = cPointerOffset(cTypedPointer(dest, Uint8Array), result, Uint8Array.BYTES_PER_ELEMENT));
    }
  }
  return i32(result);
}

// C/C++ source: source/build/src/lz4.c:2671
export function LZ4_decompress_fast_continue(LZ4_streamDecode, source, dest, originalSize) {
  let lz4sd = (void 0, cObjectFieldRef(cRecordObject(cRecordPointer(LZ4_streamDecode, {"align": 8, "arrayAlign": 1, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, "offset": 0}, "minStateSize": {"length": 32, "native": "Uint8Array", "offset": 0, "size": 32}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 32, "union": true}, {})), "internal_donotuse"));
  let result;
  {

  }
  ;
  void 0;
  if ((cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize == u64(0))) {
    {

    }
    ;
    void 0;
    (result = i32(LZ4_decompress_fast(source, dest, originalSize)));
    if ((result <= 0)) {
      return i32(result);
    }
    (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize = u64(originalSize));
    (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd = cPointerOffset(cTypedPointer(dest, Uint8Array), originalSize, Uint8Array.BYTES_PER_ELEMENT));
  } else {
    if (cPointerCompare(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd, cTypedPointer(dest, Uint8Array), "==")) {
      {

      }
      ;
      (result = i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).externalDict, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize)));
      if ((result <= 0)) {
        return i32(result);
      }
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u64((BigInt(__cxx_lvalue_0.value) + BigInt(u64(originalSize))))))(cObjectFieldRef(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})), "prefixSize"));
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = cPointerOffset(__cxx_lvalue_1.value, originalSize, Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})), "prefixEnd"));
    } else {
      {

      }
      ;
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize = u64(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize));
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).externalDict = cPointerOffset(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd, -(cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize), Uint8Array.BYTES_PER_ELEMENT));
      (result = i32(LZ4_decompress_fast_extDict(source, dest, originalSize, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).externalDict, cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).extDictSize)));
      if ((result <= 0)) {
        return i32(result);
      }
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixSize = u64(originalSize));
      (cRecordObject(cRecordPointer(lz4sd, {"align": 8, "arrayAlign": 1, "fields": {"extDictSize": {"native": "BigUint64Array", "offset": 16, "size": 8}, "externalDict": {"offset": 0, "pointer": true, "size": 8}, "prefixEnd": {"offset": 8, "pointer": true, "size": 8}, "prefixSize": {"native": "BigUint64Array", "offset": 24, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).prefixEnd = cPointerOffset(cTypedPointer(dest, Uint8Array), originalSize, Uint8Array.BYTES_PER_ELEMENT));
    }
  }
  return i32(result);
}

// C/C++ source: source/build/src/lz4.c:2719
export function LZ4_decompress_safe_usingDict(source, dest, compressedSize, maxOutputSize, dictStart, dictSize) {
  if ((dictSize == 0)) {
    return i32(LZ4_decompress_safe(source, dest, compressedSize, maxOutputSize));
  }
  if (cPointerCompare(cPointerOffset(dictStart, dictSize, Uint8Array.BYTES_PER_ELEMENT, true), dest, "==")) {
    if ((dictSize >= i32((i32(Math.imul(64, i32((1 << 10)))) - 1)))) {
      return i32(LZ4_decompress_safe_withPrefix64k(source, dest, compressedSize, maxOutputSize));
    }
    void 0;
    return i32(LZ4_decompress_safe_withSmallPrefix(source, dest, compressedSize, maxOutputSize, u64(dictSize)));
  }
  void 0;
  return i32(LZ4_decompress_safe_forceExtDict(source, dest, compressedSize, maxOutputSize, dictStart, u64(dictSize)));
}

// C/C++ source: source/build/src/lz4.c:2734
export function LZ4_decompress_safe_partial_usingDict(source, dest, compressedSize, targetOutputSize, dstCapacity, dictStart, dictSize) {
  if ((dictSize == 0)) {
    return i32(LZ4_decompress_safe_partial(source, dest, compressedSize, targetOutputSize, dstCapacity));
  }
  if (cPointerCompare(cPointerOffset(dictStart, dictSize, Uint8Array.BYTES_PER_ELEMENT, true), dest, "==")) {
    if ((dictSize >= i32((i32(Math.imul(64, i32((1 << 10)))) - 1)))) {
      return i32(LZ4_decompress_safe_partial_withPrefix64k(source, dest, compressedSize, targetOutputSize, dstCapacity));
    }
    void 0;
    return i32(LZ4_decompress_safe_partial_withSmallPrefix(source, dest, compressedSize, targetOutputSize, dstCapacity, u64(dictSize)));
  }
  void 0;
  return i32(LZ4_decompress_safe_partial_forceExtDict(source, dest, compressedSize, targetOutputSize, dstCapacity, dictStart, u64(dictSize)));
}

// C/C++ source: source/build/src/lz4.c:2749
export function LZ4_decompress_fast_usingDict(source, dest, originalSize, dictStart, dictSize) {
  if (((dictSize == 0) || cPointerCompare(cPointerOffset(dictStart, dictSize, Uint8Array.BYTES_PER_ELEMENT, true), dest, "=="))) {
    return i32(LZ4_decompress_unsafe_generic(cTypedPointer(source, Uint8Array), cTypedPointer(dest, Uint8Array), originalSize, u64(dictSize), null, u64(0)));
  }
  void 0;
  return i32(LZ4_decompress_fast_extDict(source, dest, originalSize, dictStart, u64(dictSize)));
}

// C/C++ source: source/build/src/lz4.c:2764
export function LZ4_compress_limitedOutput(source, dest, inputSize, maxOutputSize) {
  return i32(LZ4_compress_default(source, dest, inputSize, maxOutputSize));
}

// C/C++ source: source/build/src/lz4.c:2768
export function LZ4_compress(src, dest, srcSize) {
  return i32(LZ4_compress_default(src, dest, srcSize, LZ4_compressBound(srcSize)));
}

// C/C++ source: source/build/src/lz4.c:2772
export function LZ4_compress_limitedOutput_withState(state, src, dst, srcSize, dstSize) {
  return i32(LZ4_compress_fast_extState(state, src, dst, srcSize, dstSize, 1));
}

// C/C++ source: source/build/src/lz4.c:2776
export function LZ4_compress_withState(state, src, dst, srcSize) {
  return i32(LZ4_compress_fast_extState(state, src, dst, srcSize, LZ4_compressBound(srcSize), 1));
}

// C/C++ source: source/build/src/lz4.c:2780
export function LZ4_compress_limitedOutput_continue(LZ4_stream, src, dst, srcSize, dstCapacity) {
  return i32(LZ4_compress_fast_continue(LZ4_stream, src, dst, srcSize, dstCapacity, 1));
}

// C/C++ source: source/build/src/lz4.c:2784
export function LZ4_compress_continue(LZ4_stream, source, dest, inputSize) {
  return i32(LZ4_compress_fast_continue(LZ4_stream, source, dest, inputSize, LZ4_compressBound(inputSize), 1));
}

// C/C++ source: source/build/src/lz4.c:2795
export function LZ4_uncompress(source, dest, outputSize) {
  return i32(LZ4_decompress_fast(source, dest, outputSize));
}

// C/C++ source: source/build/src/lz4.c:2799
export function LZ4_uncompress_unknownOutputSize(source, dest, isize, maxOutputSize) {
  return i32(LZ4_decompress_safe(source, dest, isize, maxOutputSize));
}

// C/C++ source: source/build/src/lz4.c:2806
export function LZ4_sizeofStreamState() {
  return i32(16416);
}

// C/C++ source: source/build/src/lz4.c:2808
export function LZ4_resetStreamState(state, inputBuffer) {
  void 0;
  LZ4_resetStream(cRecordPointer(state, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {}));
  return i32(0);
}

// C/C++ source: source/build/src/lz4.c:2823
export function LZ4_slideInputBuffer(state) {
  return cTypedPointer(cSourceAddresses.decode(u64(cSourceAddresses.encode(cRecordObject(cRecordPointer(cRecordPointer(state, {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {}), {"align": 8, "arrayAlign": 4, "fields": {"internal_donotuse": {"byteRecord": {"align": 8, "arrayAlign": 4, "fields": {"currentOffset": {"native": "Uint32Array", "offset": 16400, "size": 4}, "dictCtx": {"offset": 16392, "pointer": true, "size": 8}, "dictSize": {"native": "Uint32Array", "offset": 16408, "size": 4}, "dictionary": {"offset": 16384, "pointer": true, "size": 8}, "hashTable": {"length": 4096, "native": "Uint32Array", "offset": 0, "size": 16384}, "tableType": {"native": "Uint32Array", "offset": 16404, "size": 4}}, "overlaps": false, "size": 16416, "union": false}, "offset": 0}, "minStateSize": {"length": 16416, "native": "Uint8Array", "offset": 0, "size": 16416}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 16416, "union": true}, {})).internal_donotuse.dictionary))), Uint8Array);
}
