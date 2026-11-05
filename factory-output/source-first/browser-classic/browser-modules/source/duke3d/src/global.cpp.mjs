// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/global.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { divtable32 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_a6e3cfd4eba13fb9886cb240 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s32_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { pthread_mutex_lock } from "../../../browser-abi/libc_provider.mjs";
import { pthread_mutex_unlock } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";

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

// Source-level atomics for the selected single-isolate browser configuration.
// Operate on the original lvalue; no shadow atomic state or instruction VM.
// Shared worker storage requires a separate concurrent backend and is rejected.
const cAtomic = (source, Type, operation, order, value=null, expected=null, failure=0, weak=false) => {
  const allowed={load:[0,1,2,5],store:[0,3,5],exchange:[0,1,2,3,4,5],compare:[0,1,2,3,4,5]};
  if(!(allowed[operation]??allowed.exchange).includes(Number(order)))throw new RangeError('Invalid source atomic memory order');
  if(operation==='compare'){
    // Match the selected Clang native contract: success and failure orders
    // are independent. Failure only loads, so release/acq_rel are invalid.
    // Original AtomicSList64::pop uses release/acquire even in gnu++14;
    // Clang emits that exact pair. See WG21 P0418R2 and LLVM cmpxchg.
    if(!allowed.load.includes(Number(failure)))throw new RangeError('Invalid source atomic failure order');
  }
  const pointer=Type===null;
  if(!pointer&&![Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,BigInt64Array,BigUint64Array].includes(Type))
    throw new TypeError('Source atomic requires a proven integral/pointer type');
  const rejectShared=address=>{
    const width=pointer?8:Type.BYTES_PER_ELEMENT;
    const buffer=ArrayBuffer.isView(address)?address.buffer:address?.buffer;
    if(typeof SharedArrayBuffer==='function'&&buffer instanceof SharedArrayBuffer)
      throw new TypeError('Shared source atomics require a concurrent backend');
    if(address?.__cPointer===true&&!address.array&&address.offset%width)
      throw new RangeError('Unaligned source atomic address');
    if(ArrayBuffer.isView(address)&&address.byteOffset%width)
      throw new RangeError('Unaligned source atomic address');
  };
  rejectShared(source);
  const reference=pointer?cPointerElementRef(source,0):cDeref(source,Type);
  const coerce=pointer?x=>x:x=>new Type([x])[0];
  if(operation==='load')return reference.value;
  if(operation==='store'){reference.value=coerce(value);return;}
  const previous=reference.value;
  if(operation==='compare'){
    rejectShared(expected);
    const destination=pointer?cPointerElementRef(expected,0):cDeref(expected,Type);
    const equal=pointer?cPointerCompare(previous,destination.value,'=='):previous===destination.value;
    if(equal)reference.value=coerce(value);else destination.value=previous;
    // Weak comparison may succeed whenever strong comparison succeeds.
    return equal;
  }
  if(operation==='exchange'){reference.value=coerce(value);return previous;}
  if(pointer)throw new TypeError('Source pointer atomic arithmetic requires a proven byte stride');
  const [operator,result]=operation.split(':');let next;
  switch(operator){
    case 'add':next=previous+value;break;
    case 'sub':next=previous-value;break;
    case 'and':next=previous&value;break;
    case 'or':next=previous|value;break;
    case 'xor':next=previous^value;break;
    case 'nand':next=~(previous&value);break;
    default:throw new TypeError('Unsupported source atomic operation: '+operation);
  }
  next=coerce(next);reference.value=next;return result==='new'?next:previous;
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

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));
const i128 = value => BigInt.asIntN(128, BigInt(value));
const u128 = value => BigInt.asUintN(128, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_clz = x => Math.clz32(Number(x) >>> 0);
const __builtin_clzll = x => clz64(x);
const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_d27d2c088a21b126 = i32(32768);
function __cxx_static_address_7a56bff69be8bb4c5c0655b4() {
  return __cxx_static_address_7a56bff69be8bb4c5c0655b4.reference || (__cxx_static_address_7a56bff69be8bb4c5c0655b4.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_d27d2c088a21b126; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_66e9b0f54204b070 = i32(65536);
function __cxx_static_address_2eca15411cf2e8176444e6c5() {
  return __cxx_static_address_2eca15411cf2e8176444e6c5.reference || (__cxx_static_address_2eca15411cf2e8176444e6c5.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_66e9b0f54204b070; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_2dad2158b24bb8ca = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_61b6466e101e577bc424c9f9() {
  return __cxx_static_address_61b6466e101e577bc424c9f9.reference || (__cxx_static_address_61b6466e101e577bc424c9f9.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_2dad2158b24bb8ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:27
export let ud = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 4, "fields": {"althud": {"native": "Int32Array", "offset": 128, "size": 4}, "auto_run": {"native": "Int32Array", "offset": 204, "size": 4}, "automsg": {"native": "Int32Array", "offset": 108, "size": 4}, "autosave": {"native": "Int32Array", "offset": 392, "size": 4}, "autosavedeletion": {"native": "Int32Array", "offset": 396, "size": 4}, "autovote": {"native": "Int32Array", "offset": 104, "size": 4}, "bgstretch": {"native": "Int32Array", "offset": 376, "size": 4}, "brightness": {"native": "Int32Array", "offset": 268, "size": 4}, "camera_time": {"native": "Int32Array", "offset": 20, "size": 4}, "camerapos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "cameraq16ang": {"native": "Int32Array", "offset": 432, "size": 4}, "cameraq16horiz": {"native": "Int32Array", "offset": 436, "size": 4}, "camerasect": {"native": "Int16Array", "offset": 440, "size": 2}, "camerasprite": {"native": "Int16Array", "offset": 446, "size": 2}, "cashman": {"native": "Uint8Array", "offset": 1353, "size": 1}, "color": {"native": "Int32Array", "offset": 84, "size": 4}, "config": {"byteRecord": {"align": 4, "arrayAlign": 4, "fields": {"AmbienceToggle": {"native": "Int32Array", "offset": 808, "size": 4}, "AutoAim": {"native": "Int32Array", "offset": 0, "size": 4}, "CheckForUpdates": {"native": "Int32Array", "offset": 836, "size": 4}, "FXVolume": {"native": "Int32Array", "offset": 780, "size": 4}, "JoystickAimAssist": {"native": "Int32Array", "offset": 20, "size": 4}, "JoystickAimWeight": {"native": "Int32Array", "offset": 12, "size": 4}, "JoystickAnalogueAxes": {"length": 9, "native": "Int32Array", "offset": 468, "size": 36}, "JoystickAnalogueDead": {"length": 9, "native": "Int32Array", "offset": 576, "size": 36}, "JoystickAnalogueInvert": {"length": 9, "native": "Int32Array", "offset": 540, "size": 36}, "JoystickAnalogueSaturate": {"length": 9, "native": "Int32Array", "offset": 612, "size": 36}, "JoystickAnalogueSensitivity": {"length": 9, "native": "Float32Array", "offset": 504, "size": 36}, "JoystickDigitalFunctions": {"dims": [9, 2], "native": "Int32Array", "nativeArray": "Int32Array", "offset": 396, "size": 72}, "JoystickFunctions": {"dims": [36, 2], "native": "Int32Array", "nativeArray": "Int32Array", "offset": 108, "size": 288}, "JoystickViewCentering": {"native": "Int32Array", "offset": 16, "size": 4}, "KeyboardKeys": {"dims": [63, 2], "native": "Uint8Array", "nativeArray": "Uint8Array", "offset": 648, "size": 126}, "LastUpdateCheck": {"native": "Int32Array", "offset": 840, "size": 4}, "MasterVolume": {"native": "Int32Array", "offset": 776, "size": 4}, "MixRate": {"native": "Int32Array", "offset": 824, "size": 4}, "MouseBias": {"native": "Int32Array", "offset": 8, "size": 4}, "MouseFunctions": {"dims": [10, 2], "native": "Int32Array", "nativeArray": "Int32Array", "offset": 28, "size": 80}, "MusicDevice": {"native": "Int32Array", "offset": 788, "size": 4}, "MusicToggle": {"native": "Int32Array", "offset": 800, "size": 4}, "MusicVolume": {"native": "Int32Array", "offset": 792, "size": 4}, "NumBits": {"native": "Int32Array", "offset": 820, "size": 4}, "NumChannels": {"native": "Int32Array", "offset": 816, "size": 4}, "NumVoices": {"native": "Int32Array", "offset": 812, "size": 4}, "ShowWeapons": {"native": "Int32Array", "offset": 4, "size": 4}, "SoundToggle": {"native": "Int32Array", "offset": 796, "size": 4}, "VoiceToggle": {"native": "Int32Array", "offset": 804, "size": 4}, "VoiceVolume": {"native": "Int32Array", "offset": 784, "size": 4}, "controllerRumble": {"native": "Int32Array", "offset": 24, "size": 4}, "scripthandle": {"native": "Int32Array", "offset": 828, "size": 4}, "setupread": {"native": "Int32Array", "offset": 832, "size": 4}, "useprecache": {"native": "Int32Array", "offset": 844, "size": 4}}, "overlaps": false, "size": 848, "union": false}, "offset": 468}, "configversion": {"native": "Int32Array", "offset": 372, "size": 4}, "const_visibility": {"native": "Int32Array", "offset": 12, "size": 4}, "coop": {"native": "Int32Array", "offset": 224, "size": 4}, "coords": {"native": "Int32Array", "offset": 208, "size": 4}, "crosshair": {"native": "Int32Array", "offset": 236, "size": 4}, "crosshairscale": {"native": "Int32Array", "offset": 52, "size": 4}, "default_skill": {"native": "Int32Array", "offset": 388, "size": 4}, "default_volume": {"native": "Int32Array", "offset": 384, "size": 4}, "democams": {"native": "Int32Array", "offset": 80, "size": 4}, "detail": {"native": "Int32Array", "offset": 292, "size": 4}, "display_bonus_screen": {"native": "Uint8Array", "offset": 2015, "size": 1}, "drawweapon": {"native": "Int32Array", "offset": 76, "size": 4}, "entered_name": {"native": "Int32Array", "offset": 184, "size": 4}, "eog": {"native": "Uint8Array", "offset": 1354, "size": 1}, "executions": {"native": "Int32Array", "offset": 200, "size": 4}, "ffire": {"native": "Int32Array", "offset": 300, "size": 4}, "fola": {"native": "Int32Array", "offset": 44, "size": 4}, "folavel": {"native": "Int32Array", "offset": 32, "size": 4}, "folfvel": {"native": "Int32Array", "offset": 24, "size": 4}, "folsvel": {"native": "Int32Array", "offset": 28, "size": 4}, "folx": {"native": "Int32Array", "offset": 36, "size": 4}, "foly": {"native": "Int32Array", "offset": 40, "size": 4}, "fov": {"native": "Int32Array", "offset": 428, "size": 4}, "frameperiod": {"native": "Int32Array", "offset": 380, "size": 4}, "from_bonus": {"native": "Int16Array", "offset": 444, "size": 2}, "fta_on": {"native": "Int32Array", "offset": 196, "size": 4}, "god": {"native": "Uint8Array", "offset": 1351, "size": 1}, "hudontop": {"native": "Int32Array", "offset": 152, "size": 4}, "idplayers": {"native": "Int32Array", "offset": 112, "size": 4}, "kick_mode": {"native": "Int32Array", "offset": 60, "size": 4}, "last_camsprite": {"native": "Int16Array", "offset": 448, "size": 2}, "last_level": {"native": "Int16Array", "offset": 450, "size": 2}, "last_overhead": {"native": "Uint8Array", "offset": 1349, "size": 1}, "last_stateless_level": {"native": "Int32Array", "offset": 460, "size": 4}, "last_stateless_volume": {"native": "Int32Array", "offset": 464, "size": 4}, "level_number": {"native": "Int32Array", "offset": 324, "size": 4}, "levelstats": {"native": "Int32Array", "offset": 216, "size": 4}, "lockout": {"native": "Int32Array", "offset": 232, "size": 4}, "m_coop": {"native": "Int32Array", "offset": 220, "size": 4}, "m_ffire": {"native": "Int32Array", "offset": 296, "size": 4}, "m_level_number": {"native": "Int32Array", "offset": 308, "size": 4}, "m_marker": {"native": "Int32Array", "offset": 332, "size": 4}, "m_monsters_off": {"native": "Int32Array", "offset": 288, "size": 4}, "m_newgamecustom": {"native": "Int32Array", "offset": 356, "size": 4}, "m_newgamecustoml3": {"native": "Int32Array", "offset": 364, "size": 4}, "m_newgamecustomsub": {"native": "Int32Array", "offset": 360, "size": 4}, "m_noexits": {"native": "Int32Array", "offset": 96, "size": 4}, "m_player_skill": {"native": "Int32Array", "offset": 304, "size": 4}, "m_recstat": {"native": "Int32Array", "offset": 284, "size": 4}, "m_respawn_inventory": {"native": "Int32Array", "offset": 280, "size": 4}, "m_respawn_items": {"native": "Int32Array", "offset": 272, "size": 4}, "m_respawn_monsters": {"native": "Int32Array", "offset": 276, "size": 4}, "m_volume_number": {"native": "Int32Array", "offset": 312, "size": 4}, "marker": {"native": "Int32Array", "offset": 336, "size": 4}, "maxautosaves": {"native": "Int32Array", "offset": 400, "size": 4}, "menu_scrollbartilenum": {"native": "Int32Array", "offset": 168, "size": 4}, "menu_scrollbarz": {"native": "Int32Array", "offset": 172, "size": 4}, "menu_scrollcursorz": {"native": "Int32Array", "offset": 176, "size": 4}, "menu_slidebarmargin": {"native": "Int32Array", "offset": 160, "size": 4}, "menu_slidebarz": {"native": "Int32Array", "offset": 156, "size": 4}, "menu_slidecursorz": {"native": "Int32Array", "offset": 164, "size": 4}, "menubackground": {"native": "Uint8Array", "offset": 2032, "size": 1}, "menutitle_pal": {"native": "Int8Array", "offset": 454, "size": 1}, "monsters_off": {"native": "Int32Array", "offset": 264, "size": 4}, "mouseaiming": {"native": "Int32Array", "offset": 68, "size": 4}, "mouseflip": {"native": "Int32Array", "offset": 340, "size": 4}, "msgdisptime": {"native": "Int32Array", "offset": 88, "size": 4}, "multimode": {"native": "Int32Array", "offset": 316, "size": 4}, "music_episode": {"native": "Int32Array", "offset": 344, "size": 4}, "music_level": {"native": "Int32Array", "offset": 348, "size": 4}, "noclip": {"native": "Uint8Array", "offset": 1358, "size": 1}, "noexits": {"native": "Int32Array", "offset": 100, "size": 4}, "obituaries": {"native": "Int32Array", "offset": 244, "size": 4}, "overhead_on": {"native": "Uint8Array", "offset": 1348, "size": 1}, "pause_on": {"native": "Int16Array", "offset": 442, "size": 2}, "player_skill": {"native": "Int32Array", "offset": 320, "size": 4}, "playerai": {"native": "Int32Array", "offset": 240, "size": 4}, "playerbest": {"native": "Int32Array", "offset": 368, "size": 4}, "pwlockout": {"length": 128, "native": "Uint8Array", "offset": 1759, "size": 128}, "quote_yoffset": {"native": "Int32Array", "offset": 180, "size": 4}, "reccnt": {"native": "Int32Array", "offset": 48, "size": 4}, "recstat": {"native": "Int32Array", "offset": 260, "size": 4}, "respawn_inventory": {"native": "Int32Array", "offset": 256, "size": 4}, "respawn_items": {"native": "Int32Array", "offset": 252, "size": 4}, "respawn_monsters": {"native": "Int32Array", "offset": 248, "size": 4}, "returnvar": {"length": 5, "native": "Int32Array", "offset": 404, "size": 20}, "ridecule": {"dims": [10, 40], "native": "Uint8Array", "nativeArray": "Uint8Array", "offset": 1359, "size": 400}, "rtsname": {"length": 128, "native": "Uint8Array", "offset": 1887, "size": 128}, "runkey_mode": {"native": "Int32Array", "offset": 56, "size": 4}, "screen_size": {"native": "Int32Array", "offset": 228, "size": 4}, "screen_tilting": {"native": "Int32Array", "offset": 188, "size": 4}, "screenfade": {"native": "Uint8Array", "offset": 2031, "size": 1}, "scrollmode": {"native": "Uint8Array", "offset": 1357, "size": 1}, "secretlevel": {"native": "Int16Array", "offset": 452, "size": 2}, "setup": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Int32Array", "offset": 20, "size": 4}, "forcesetup": {"native": "Int32Array", "offset": 24, "size": 4}, "fullscreen": {"native": "Int32Array", "offset": 8, "size": 4}, "noautoload": {"native": "Int32Array", "offset": 28, "size": 4}, "usejoystick": {"native": "Int32Array", "offset": 0, "size": 4}, "usemouse": {"native": "Int32Array", "offset": 4, "size": 4}, "xdim": {"native": "Int32Array", "offset": 12, "size": 4}, "ydim": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 32, "union": false}, "offset": 1316}, "shadow_pal": {"native": "Uint8Array", "offset": 2033, "size": 1}, "shadows": {"native": "Int32Array", "offset": 192, "size": 4}, "show_help": {"native": "Uint8Array", "offset": 1356, "size": 1}, "show_level_text": {"native": "Uint8Array", "offset": 2016, "size": 1}, "showallmap": {"native": "Uint8Array", "offset": 1355, "size": 1}, "showfps": {"native": "Int32Array", "offset": 212, "size": 4}, "showweapons": {"native": "Uint8Array", "offset": 1350, "size": 1}, "skill_voice": {"native": "Int32Array", "offset": 352, "size": 4}, "slidebar_paldisabled": {"native": "Int8Array", "offset": 456, "size": 1}, "slidebar_palselected": {"native": "Int8Array", "offset": 455, "size": 1}, "statusbarcustom": {"native": "Int32Array", "offset": 148, "size": 4}, "statusbarflags": {"native": "Int32Array", "offset": 140, "size": 4}, "statusbarmode": {"native": "Int32Array", "offset": 92, "size": 4}, "statusbarrange": {"native": "Int32Array", "offset": 144, "size": 4}, "statusbarscale": {"native": "Int32Array", "offset": 64, "size": 4}, "team": {"native": "Int32Array", "offset": 116, "size": 4}, "textscale": {"native": "Int32Array", "offset": 136, "size": 4}, "user_map": {"native": "Uint8Array", "offset": 2030, "size": 1}, "userbytever": {"native": "Uint32Array", "offset": 424, "size": 4}, "uw_framerate": {"native": "Int32Array", "offset": 16, "size": 4}, "viewbob": {"native": "Int32Array", "offset": 120, "size": 4}, "volume_number": {"native": "Int32Array", "offset": 328, "size": 4}, "warp_on": {"native": "Uint8Array", "offset": 1352, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 2017, "size": 13}, "weaponscale": {"native": "Int32Array", "offset": 132, "size": 4}, "weaponsway": {"native": "Int32Array", "offset": 124, "size": 4}, "weaponswitch": {"native": "Int32Array", "offset": 72, "size": 4}}, "overlaps": true, "size": 2036, "union": false}}, {});
export function __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba() {
  return __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba.reference || (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba.reference = {
    __cReference: true,
    get value() { return ud; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:516
export function __is_constant_evaluated() {
  return Boolean(false);
}

// C/C++ source: source/duke3d/src/global.cpp:230
export function min(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/duke3d/src/global.cpp:2674
export function _mm_and_si128(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/duke3d/src/global.cpp:2709
export function _mm_or_si128(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/duke3d/src/global.cpp:2726
export function _mm_xor_si128(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/duke3d/src/global.cpp:300
export function __gthread_active_p() {
  return i32(1);
}

// C/C++ source: source/duke3d/src/global.cpp:746
export function __gthread_mutex_lock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_lock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/duke3d/src/global.cpp:776
export function __gthread_mutex_unlock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_unlock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/duke3d/src/global.cpp:809
export function __gthread_recursive_mutex_lock(__mutex) {
  return i32(__gthread_mutex_lock(__mutex));
}

// C/C++ source: source/duke3d/src/global.cpp:830
export function __gthread_recursive_mutex_unlock(__mutex) {
  return i32(__gthread_mutex_unlock(__mutex));
}

// C/C++ source: source/duke3d/src/global.cpp:65
export function __exchange_and_add(__mem, __val) {
  return i32(cAtomic(__mem, Int32Array, "add:old", 4, __val));
}

// C/C++ source: source/duke3d/src/global.cpp:70
export function __atomic_add(__mem, __val) {
  i32(cAtomic(__mem, Int32Array, "add:old", 4, __val));
}

// C/C++ source: source/duke3d/src/global.cpp:82
export function __exchange_and_add_single(__mem, __val) {
  let __result = i32((cDeref(__mem, Int32Array).value));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
  return __result;
}

// C/C++ source: source/duke3d/src/global.cpp:91
export function __atomic_add_single(__mem, __val) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
}

// C/C++ source: source/duke3d/src/global.cpp:1378
export function xstrdup(s) {
  let len = i32(u64((BigInt(strlen(s)) + BigInt(u64(1)))));
  let ptr = cTypedPointer(Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, u64(len), u64(16)), Uint8Array);
  if (cPointerCompare(ptr, null, "!=")) {
    strcpy(ptr, s);
    ((cDeref(cPointerOffset(ptr, i32((len - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    return ptr;
  }
  handle_memerr(len);
  __builtin_unreachable();
}

// C/C++ source: source/duke3d/src/global.cpp:1449
export function xfree(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/duke3d/src/global.cpp:308
export function libdivide_mullhi_u16(x, y) {
  let xl = u32(x);
  let yl = u32(y);
  let rl = u32(Math.imul(xl, yl));
  return (u32((u32((u32((rl >>> 16)) & 65535)) & 65535)) & 65535);
}

// C/C++ source: source/duke3d/src/global.cpp:314
export function libdivide_mullhi_s16(x, y) {
  let xl = i32(x);
  let yl = i32(y);
  let rl = i32(Math.imul(xl, yl));
  return ((u32(((u32(((u32(i32((rl >> 16))) << 16) >> 16)) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/duke3d/src/global.cpp:321
export function libdivide_mullhi_u32(x, y) {
  let xl = u64(x);
  let yl = u64(y);
  let rl = u64((BigInt(xl) * BigInt(yl)));
  return u32(u64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/duke3d/src/global.cpp:327
export function libdivide_mullhi_s32(x, y) {
  let xl = i64(x);
  let yl = i64(y);
  let rl = i64((BigInt(xl) * BigInt(yl)));
  return i32(i64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/duke3d/src/global.cpp:334
export function libdivide_mullhi_u64(x, y) {
  let xl = u128(u128(x));
  let yl = u128(u128(y));
  let rl = u128(u128((BigInt(xl) * BigInt(yl))));
  return u64(u128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/duke3d/src/global.cpp:360
export function libdivide_mullhi_s64(x, y) {
  let xl = i128(i128(x));
  let yl = i128(i128(y));
  let rl = i128(i128((BigInt(xl) * BigInt(yl))));
  return i64(i128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/duke3d/src/global.cpp:382
export function libdivide_count_leading_zeros16(val) {
  return ((u32(((u32(i32((__builtin_clz(u32(val)) - 16))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/duke3d/src/global.cpp:412
export function libdivide_count_leading_zeros32(val) {
  return i32(__builtin_clz(val));
}

// C/C++ source: source/duke3d/src/global.cpp:441
export function libdivide_count_leading_zeros64(val) {
  return i32(__builtin_clzll(u64(val)));
}

// C/C++ source: source/duke3d/src/global.cpp:462
export function libdivide_32_div_16_to_16(u1, u0, v, r) {
  let n = u32((u32((u32(u1) << 16)) | u32(u0)));
  let result = (u32((u32((u32(Math.trunc(n / u32(v))) & 65535)) & 65535)) & 65535);
  ((cDeref(r, Uint16Array).value) = (u32((u32((u32((n - u32(Math.imul(u32(result), u32(v))))) & 65535)) & 65535)) & 65535));
  return (u32(result) & 65535);
}

// C/C++ source: source/duke3d/src/global.cpp:606
export function libdivide_128_div_128_to_64(u_hi, u_lo, v_hi, v_lo, r_hi, r_lo) {
  let ufull = u128(u128(u_hi));
  let vfull = u128(u128(v_hi));
  (ufull = u128(u128((BigInt(u128((BigInt(ufull) << BigInt(64)))) | BigInt(u128(u_lo))))));
  (vfull = u128(u128((BigInt(u128((BigInt(vfull) << BigInt(64)))) | BigInt(u128(v_lo))))));
  let res = u64(u128((BigInt(ufull) / BigInt(vfull))));
  let remainder = u128(u128((BigInt(ufull) - BigInt(u128((BigInt(vfull) * BigInt(u128(res))))))));
  ((cDeref(r_lo, BigUint64Array).value) = u64(remainder));
  ((cDeref(r_hi, BigUint64Array).value) = u64(u128((BigInt(remainder) >> BigInt(64)))));
  return u64(res);
}

// C/C++ source: source/duke3d/src/global.cpp:42
export function fix16_to_int(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_d27d2c088a21b126 : (-fix16_half__header_global_d27d2c088a21b126)))) / fix16_one__header_global_66e9b0f54204b070));
}

// C/C++ source: source/duke3d/src/global.cpp:43
export function fix16_to_float(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_2dad2158b24bb8ca)));
}

// C/C++ source: source/duke3d/src/global.cpp:44
export function fix16_to_dbl(a) {
  return (a * flt_f161r__header_global_2dad2158b24bb8ca);
}

// C/C++ source: source/duke3d/src/global.cpp:46
export function fix16_from_int(a) {
  return i32(Math.imul(a, fix16_one__header_global_66e9b0f54204b070));
}

// C/C++ source: source/duke3d/src/global.cpp:47
export function fix16_from_float(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_66e9b0f54204b070))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/duke3d/src/global.cpp:48
export function fix16_from_dbl(a) {
  return i32(((a * fix16_one__header_global_66e9b0f54204b070) + ((a >= 0) ? 0.5 : (-0.5))));
}

// C/C++ source: source/duke3d/src/global.cpp:94
export function fix16_mod(x, y) {
  return i32((x = i32((Number(x) % Number(y)))));
}

// C/C++ source: source/duke3d/src/global.cpp:121
export function tabledivide32(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_a6e3cfd4eba13fb9886cb240().value)) & i32((!(u32(d) < u32(16384)))))))) {
    cAssignAggregate((cPointerElementRef(divtable32, 0).value), libdivide_s32_gen((__cxx_global_cell_a6e3cfd4eba13fb9886cb240().value = i32(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}});
  }
  return i32(libdivide_s32_do(n, cPointerOffset(divtable32, i32(Math.imul(i32((u32(d) < u32(16384))), d)), 5)));
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

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\c++\12/new:180
export function operator_delete___ZdlPvS_(arg0, arg1) {

}

// C/C++ source: C:\Users\andre\Documents\Codex\2026-10-13\master-execution-prompt-complete-eduke32-readable\work\toolchains\linux-sysroot\usr\include\c++\12/new:181
export function operator_delete_array___ZdaPvS_(arg0, arg1) {

}

// Original Clang-generated fragment; imports existing owner storage.
export { g_gametypeFlags, g_mostConcurrentPlayers, __cxx_global_cell_462926f90efdfe463807ff55 } from "./_source_legacy_global_cpp_203cdd26ef71.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { g_player, g_player_s__header_global_b7197fa1f55d8b6b } from "./_source_legacy_global_cpp_7cea82983dac.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { CHAINGUNSPRITE____header_global_9c12cca6f038562f, DEVISTATORAMMO____header_global_a1a5e5a30dc7c727, FIRSTAID____header_global_00486630ed81ef54, FREEZEAMMO____header_global_a6ddc6bafaefda66, FREEZESPRITE____header_global_b492258a356edfb5, JETPACK____header_global_1fa75b398760317c, RPGAMMO____header_global_f24104a903b8deba, RPGSPRITE____header_global_03e7ca5ce3453d3c, SHIELD____header_global_d9c938b9e43ea3ad, STEROIDS____header_global_f4d11f31dd5cb7fd, g_blimpSpawnItems } from "./_source_legacy_global_cpp_9066d9e620fb.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { ACCESSCARD____header_global_c8d165ea6ca47cae, ACCESSSWITCH2____header_global_20066eb18de5d6f1, ACCESSSWITCH____header_global_a1b8cc5e171f0fa1, ACCESS_ICON____header_global_1b962fc05a2b42e8, ACTIVATORLOCKED____header_global_b035d50127870e10, ACTIVATOR____header_global_94d82cfdece79b35, AIRTANK_ICON____header_global_5e8a8a93161bba34, AIRTANK____header_global_d3a985c3eaaefd3c, ALIENSWITCH____header_global_99c3c659ef0fd3a8, ALIEN_SWITCH1____header_global_5845fce2b406df1a, AMMOBOX____header_global_ae3e21befaa9700a, AMMOLOTS____header_global_1827bc0abb026353, AMMO____header_global_39f397da850bca4b, ANTENNA____header_global_3d54a6db1ec1ede6, APLAYERTOP____header_global_95cf3a2e7c173739, APLAYER____header_global_2e20c558d79641e2, ARMJIB1____header_global_4ef99ec1573c085a, ARROW____header_global_3cbaa333c9dc7c41, ATMBROKE____header_global_8ab882983e65d0f4, ATM____header_global_72b247a4fae72917, ATOMICHEALTH____header_global_00ffcc99063d4550, BANNER____header_global_0283eb1ab2934c95, BARBROKE____header_global_e985ed6ff120c22e, BATTERYAMMO____header_global_efc67ab2b5c0b04c, BETASCREEN____header_global_9111947b483dda20, BETAVERSION____header_global_45de5c1ceab6ee98, BGRATE1____header_global_8045b5f534c4b5cd, BIGALPHANUM____header_global_c9366cb01aed70c7, BIGAPPOS____header_global_4ff53215f821f315, BIGBANG____header_global_79b9e8cba7f301a7, BIGCOLIN____header_global_97a34ee869de24e7, BIGCOMMA____header_global_39802e3cc4672b37, BIGFORCE____header_global_5b010ee4486bede1, BIGHOLE____header_global_3ca3332425f2e76f, BIGORBIT1____header_global_74878b90f0be5a16, BIGPERIOD____header_global_fb12024ab9c4f1bb, BIGQ____header_global_2efa5eacee63191b, BIGSEMI____header_global_577a212ad6f05950, BIGX____header_global_2377c9e6c518570c, BLANKSCREEN____header_global_889f9dff2d75f67f, BLIMP____header_global_cfe4d55c8a9cef4c, BLOODPOOL____header_global_0f31d26eb6360a9d, BLOODSPLAT1____header_global_7cb6bb50674b37d0, BLOODSPLAT2____header_global_904b1a4ffaf3d17e, BLOODSPLAT3____header_global_a95412f26d866080, BLOODSPLAT4____header_global_bacdc1f9f9bd48ab, BLOODYPOLE____header_global_84908843e60e8513, BLOOD____header_global_bd680cc7be38fcb9, BOLT1____header_global_01cd40b47acafa91, BONUSMUSIC____header_global_3a494b48f78b31fc, BONUSSCREEN____header_global_58fa2d6478469e99, BONUS_SPEECH1____header_global_5ea6774c597953cf, BONUS_SPEECH2____header_global_c3c96c1872761591, BONUS_SPEECH3____header_global_7a19cf167076c8e8, BONUS_SPEECH4____header_global_c4579f2c13200382, BOOTS____header_global_8b836fef67294455, BOOT_ICON____header_global_da2ec88c05a88bcd, BORNTOBEWILDSCREEN____header_global_98f34d8835b86780, BOS1_RECOG____header_global_b1cb02f8acb38aa0, BOS1_WALK____header_global_f7793a0210fe8a22, BOS2_RECOG____header_global_159c49e87a42119e, BOS3_RECOG____header_global_ec4b36d317bf344e, BOS4_RECOG____header_global_27c236c26639d10f, BOSS1LOB____header_global_a9919ea99ced4749, BOSS1SHOOT____header_global_dc78f60a20dd91c6, BOSS1STAYPUT____header_global_9491899026ba822c, BOSS1____header_global_ab39a4032f54c3c1, BOSS2STAYPUT____header_global_500dd9844a877ae5, BOSS2____header_global_7d10a34adb7782c3, BOSS3STAYPUT____header_global_964734f08ad4ba9d, BOSS3____header_global_820dc0f4e78e5974, BOSS4STAYPUT____header_global_b313490fc25150d6, BOSS4_DEADSPEECH____header_global_9760c3b96df0a8f7, BOSS4_FIRSTSEE____header_global_9b2dc35b28646071, BOSS4____header_global_01057ec653561ea0, BOSS5STAYPUT____header_global_11f47d32ec5e267c, BOSS5____header_global_b9a72a8c6f630de3, BOSSTALKTODUKE____header_global_a5512cd632799bf7, BOSSTOP____header_global_ce37c9e3ec3f1d55, BOTTLE10____header_global_f5d6b56bdcd11680, BOTTLE11____header_global_de842cdac35d8562, BOTTLE12____header_global_f92f42ffdd108a35, BOTTLE13____header_global_df77001231917a8e, BOTTLE14____header_global_58b38d70c3252afa, BOTTLE15____header_global_d66c0aa918266d2a, BOTTLE16____header_global_29ea64b3571d1f6e, BOTTLE17____header_global_c141c9b1f76ef353, BOTTLE18____header_global_5c2ad9e7b6cda4ef, BOTTLE19____header_global_3ef6a418c6c5f8ac, BOTTLE1____header_global_8831ee04b7eb59f1, BOTTLE2____header_global_1d873f94263c8a23, BOTTLE3____header_global_f0ffa139c6b47180, BOTTLE4____header_global_f6b6dcc5f0113149, BOTTLE5____header_global_8789fe990a27f40c, BOTTLE6____header_global_e97076f0943af8bf, BOTTLE7____header_global_ca45739b380b7fa1, BOTTLE8____header_global_16570b348ab8e59a, BOTTOMSTATUSBAR____header_global_776fe3a43eb6ed51, BOUNCEMINE____header_global_4159fcf275d12650, BOX____header_global_0dc885aa90d2b1fe, BPANNEL1____header_global_7cf0b0d76c2a7d0f, BPANNEL3____header_global_4a21f096c7314983, BROKEFIREHYDRENT____header_global_dfcaa02e8147ec5a, BROKEHYDROPLANT____header_global_0a2552014a357308, BROKENCHAIR____header_global_9bfb0b517ee23be4, BULLETHOLE____header_global_835cb944c0e10f1c, BURNEDCORPSE____header_global_c2ceda8bec249e9b, BURNING2____header_global_742436beef0728a1, BURNING____header_global_0125e2d1edb7595c, CACTUSBROKE____header_global_b34c6a1d53d0dd70, CACTUS____header_global_7c1b5c3d39abffd6, CAMCORNER____header_global_cc8ce85028ea04da, CAMERA1____header_global_44c36dd39f480210, CAMERALIGHT____header_global_9fdd9473dea66f0a, CAMERAPOLE____header_global_885bde77f39f7d86, CAMLIGHT____header_global_d3035ee8bac3986d, CANWITHSOMETHING2____header_global_c83b2944368d9cc9, CANWITHSOMETHING3____header_global_2b0ee19845cc7b25, CANWITHSOMETHING4____header_global_583632128687ed03, CANWITHSOMETHING____header_global_ecc1b09b63727094, CAPT_RECOG____header_global_395eb6941ae06401, CAT_FIRE____header_global_6a2990cdf6adae1e, CEILINGSTEAM____header_global_17a51dd970443bf6, CHAINGUN_FIRE____header_global_bd3037803c503335, CHAINGUN____header_global_cbc149751719fd4e, CHAIR1____header_global_c60ae85e9a15a32a, CHAIR2____header_global_eb1f15f01a9390c7, CHAIR3____header_global_66f82751c5be2a05, CIRCLEPANNELBROKE____header_global_429fe61e2cbe3e72, CIRCLEPANNEL____header_global_9bac993fef213d06, CLOUDYOCEAN____header_global_8a56302370967d66, CLOUDYSKIES____header_global_cb1878162e672d11, COLAMACHINE____header_global_6241438520d54c4f, COLA____header_global_2d2786d2704dec1e, COMMANDERSTAYPUT____header_global_0c27b94cb667dab1, COMMANDER____header_global_1b9a1a85cd5d3b67, COMM_RECOG____header_global_5e24dcc0607b16a5, CONE____header_global_9661bab837076fba, COOLEXPLOSION1____header_global_80c27ccc7dca7a76, CRACK1____header_global_c5c016f465f6e7fe, CRACK2____header_global_e2a0c7362e838868, CRACK3____header_global_22591677f81348e3, CRACK4____header_global_b5fa6efcf23a66d3, CRACKKNUCKLESWIDE____header_global_3b82800af6d7a694, CRACKKNUCKLES____header_global_a253d5276238b4bd, CRANEPOLE____header_global_85fa7a90e94a4632, CRANE____header_global_972ee36deee86057, CROSSHAIR____header_global_f715e558efa240b5, CRYSTALAMMO____header_global_adf3f2e1f916dfa5, CYCLER____header_global_1a40ca6785674117, CheatKeys, DEVISTATORSPRITE____header_global_19d65295efa4a8e3, DEVISTATOR____header_global_69dfe280b69edeed, DIGITALNUM____header_global_1ea8e07be03b07e9, DIPSWITCH2____header_global_2f00ff6774da8aef, DIPSWITCH3____header_global_2a1f9eda3015cbdf, DIPSWITCH____header_global_b00a876ffbeec6c3, DOLPHIN1____header_global_411f7d70f5c31c15, DOLPHIN2____header_global_603b34cb7408faa9, DOMELITE____header_global_e0faf8375c266052, DOORSHOCK____header_global_ec5d26880a35a23c, DOORTILE10____header_global_ce92fda4ba7c2f85, DOORTILE11____header_global_ee7ba4b8b2d585bb, DOORTILE12____header_global_51372811e8e5a9b9, DOORTILE14____header_global_a3f5bec7c3f49b0b, DOORTILE15____header_global_ef61dc376b43aec8, DOORTILE16____header_global_ba7a6f18eb6bde8e, DOORTILE17____header_global_5c58e09fb09f4d28, DOORTILE18____header_global_18fcad88be0d9d65, DOORTILE19____header_global_65c738abd9f56bf8, DOORTILE1____header_global_8bffb6651f0702d9, DOORTILE20____header_global_7502441fa3480838, DOORTILE21____header_global_8f0615678c71c40e, DOORTILE22____header_global_448fb97e6ae18d11, DOORTILE23____header_global_0058c5e142b52159, DOORTILE2____header_global_1b34a206ba725d8a, DOORTILE3____header_global_244fd04defd327a2, DOORTILE4____header_global_c3267f8e7bae5cd4, DOORTILE5____header_global_bcdf897807e3ac4c, DOORTILE6____header_global_99ac61df113924ae, DOORTILE7____header_global_43cd5927ff3fb8b3, DOORTILE8____header_global_59905abca0aed30a, DOORTILE9____header_global_0071b7c94f1fea6b, DREALMS____header_global_13825f4f065e987d, DRONE____header_global_76d3b28834811e4a, DRON_RECOG____header_global_25015895dc2b171f, DUCK____header_global_e0231e45e5cad463, DUKECAR____header_global_961ecc825a541e92, DUKEGUN____header_global_19ef8db8d5b2055c, DUKELEG____header_global_fcbc73488cfbefa7, DUKELYINGDEAD____header_global_683f07c0974857db, DUKENUKEM____header_global_ca9efe2f36e0c4ee, DUKETAG____header_global_f64c68dcdf234e2d, DUKETALKTOBOSS____header_global_3224ab02c732e9c8, DUKETORSO____header_global_189a2925a86e51b4, DUKE_CRACK2____header_global_6bc58d362e3c6ae4, DUKE_CRACK_FIRST____header_global_d467c09255bb0339, DUKE_CRACK____header_global_5fe3fec9993e7fa6, DUKE_DRINKING____header_global_0ee1cbb31cf44728, DUKE_GASP____header_global_354c73be92bb1376, DUKE_GETWEAPON2____header_global_ea0aca2c4d8b3d15, DUKE_GETWEAPON6____header_global_4015a660aa78b24b, DUKE_GET____header_global_ebca89d4b0c73227, DUKE_GOTHEALTHATLOW____header_global_b000498b4708d168, DUKE_GRUNT____header_global_e283783df43647e2, DUKE_HARTBEAT____header_global_107e61ea9e6f1388, DUKE_JETPACK_IDLE____header_global_59479a2c0bcb425c, DUKE_JETPACK_OFF____header_global_cf6d3b82c78932ee, DUKE_JETPACK_ON____header_global_0e7aeb1220f9d598, DUKE_LAND_HURT____header_global_ef5c822b60ba69d8, DUKE_LAND____header_global_a6649076db13c297, DUKE_LONGTERM_PAIN____header_global_d9f09a9be3d95723, DUKE_ONWATER____header_global_e9d259cfb57c0e8f, DUKE_PISSRELIEF____header_global_4e30b1650ed9901f, DUKE_SCREAM____header_global_0a4d30fa413e41e6, DUKE_SEARCH2____header_global_111b474243ad3966, DUKE_SEARCH____header_global_40852af749451159, DUKE_TAKEPILLS____header_global_a33358674e6e1965, DUKE_UNDERWATER____header_global_001452b80d76feb9, DUKE_URINATE____header_global_0fa4aad9a1473756, DUKE_USEMEDKIT____header_global_4dc78099ca0b56e3, DUKE_WALKINDUCTS____header_global_d2f14dc0209b4e5b, E32_TILE5736____header_global_4a7bb08e091929a6, E32_TILE5737____header_global_ef0998002bb653d0, E32_TILE5846____header_global_006dd0bdca5e4ef2, E5L7_DUKE_QUIT_YOU____header_global_426ca0fdbfaf35a9, EARTHQUAKE____header_global_38463dd61301e7e5, EGG____header_global_42de06e70740eda5, EJECT_CLIP____header_global_c95df23e3b5cd4fb, ELEVATOR_OFF____header_global_7178dec29fd5f363, ELEVATOR_ON____header_global_01942011d61bbc58, ENDALPHANUM____header_global_3a71a45229e1869c, ENDSEQVOL2SND1____header_global_b2655a5b53e134ed, ENDSEQVOL2SND2____header_global_09d6a00d1439a4de, ENDSEQVOL2SND3____header_global_fe3f5ea23434c9d1, ENDSEQVOL2SND4____header_global_c09e281045842eca, ENDSEQVOL2SND5____header_global_29eaee52502deccb, ENDSEQVOL2SND6____header_global_9dafd8ce5128d3f9, ENDSEQVOL2SND7____header_global_3dff41ff79b59ecd, ENDSEQVOL3SND2____header_global_64425ceb9e2b139f, ENDSEQVOL3SND3____header_global_c861713e489f68f8, ENDSEQVOL3SND4____header_global_0fee35be1606a463, ENDSEQVOL3SND5____header_global_e8e58f0a28d43571, ENDSEQVOL3SND6____header_global_c3e513307b4d432b, ENDSEQVOL3SND7____header_global_ebbeb0d87c5532e8, ENDSEQVOL3SND8____header_global_1b3ac130e1889265, ENDSEQVOL3SND9____header_global_a164119679400190, END_OF_LEVEL_WARN____header_global_ffe0c74d6a3c4fab, EXITMENUSOUND____header_global_a92bf040911689f9, EXPANDERSHOOT____header_global_2229308f9a84c0f1, EXPLODINGBARREL2____header_global_5d7c0214e69a701c, EXPLODINGBARREL____header_global_8f2a38f5e7bb0907, EXPLOSION2BOT____header_global_ed0b69ed70cbbbc8, EXPLOSION2____header_global_7116edfb0ec315b3, F1HELP____header_global_9db9a2475aafe9c4, FANSHADOWBROKE____header_global_065d5461e113c10f, FANSHADOW____header_global_89bf1f14e2718893, FANSPRITEBROKE____header_global_87a73afb5cea0946, FANSPRITE____header_global_f8f5886eb72ee799, FECES____header_global_60e2d98a1cf7c3bf, FEM10____header_global_8b9ec11e5ea12649, FEM1____header_global_5a528765ac409a90, FEM2____header_global_eb4d39761280ecca, FEM3____header_global_f18ae9529cb19c95, FEM4____header_global_d58594d97c8af130, FEM5____header_global_dc439257e6690f8d, FEM6PAD____header_global_81651559eef22b81, FEM6____header_global_466ad0354972c67e, FEM7____header_global_09fd548ec4fa7d72, FEM8____header_global_d9c25d19025f3e0e, FEM9____header_global_0e97c52736126ddd, FEMMAG1____header_global_c96a0949194eb06b, FEMMAG2____header_global_55281b896e3a060f, FEMPIC1____header_global_a37afa20511f6e47, FEMPIC2____header_global_c67c089180d7e30a, FEMPIC3____header_global_a55e744e3a449f5b, FEMPIC4____header_global_783a02488d987598, FEMPIC5____header_global_9d1683280a4763b3, FEMPIC6____header_global_e72e4e4b1acb7527, FEMPIC7____header_global_e2fd1877a8c50f09, FETUSBROKE____header_global_9ceb5f46c3acd230, FETUSJIB____header_global_3b6c8f8c6814f919, FETUS____header_global_2fcfc4b649abc300, FIRE2____header_global_cab8ad51f0ece0f5, FIREBALL____header_global_f06158d46e7278e9, FIREBARREL____header_global_b21d39d452c40c96, FIREEXT____header_global_281b86f8a3ce1846, FIREFLYFLYINGEFFECT____header_global_055da42f47239fe4, FIREFLYGROWEFFECT____header_global_c9643ebf12afca8e, FIREFLYSHRINKEFFECT____header_global_244c920aa0289cf5, FIREFLY____header_global_79f7be637b7aea3a, FIRELASER____header_global_ad4b9bfaf4226aaa, FIREVASE____header_global_75c88bae69c26e21, FIRE____header_global_c6e2072421be0b04, FIRSTAID_ICON____header_global_a164a2e8e2c529b9, FIRSTGUNRELOADWIDE____header_global_4462308ab393fa19, FIRSTGUNRELOAD____header_global_87a3df5e68cc6f91, FIRSTGUNSPRITE____header_global_f73fa0de06b65a6c, FIRSTGUN____header_global_39093cfaf59d6d2d, FIST____header_global_b819847280827bd4, FIX16_MAX__header_global_e0cbb53e729ecc73, FIX16_MIN__header_global_e8dbd713182163c6, FIX16_OVERFLOW__header_global_abf9d101b396620b, FLAMETHROWERAMMO____header_global_87779593ab929f8c, FLAMETHROWERFIRE____header_global_874b4f0213ae3ad5, FLAMETHROWERFLAME____header_global_0682eadf2125c073, FLAMETHROWERPILOT____header_global_aee323e361cd6e51, FLAMETHROWERSPRITE____header_global_435316fc2e163cc2, FLAMETHROWER_END____header_global_9a0ed83d57a4eda1, FLAMETHROWER_INTRO____header_global_eaacd0744348649e, FLAMETHROWER_LOOP____header_global_160b752c7946c46c, FLAMETHROWER____header_global_013b5b10194d965c, FLOORFLAME____header_global_8a43125b250e615f, FLOORPLASMA____header_global_6818d5eb6fe82c1f, FLOORSLIME____header_global_9693d24b827cd427, FLUSH_TOILET____header_global_b00e36beeffa4721, FLY_BY____header_global_852de64496c817ce, FOF____header_global_601d2824d12b7bf5, FOODOBJECT16____header_global_bd9385297bc2e4c5, FOOTPRINTS2____header_global_6bb9d3a749d72fcf, FOOTPRINTS3____header_global_92a45eb38fa595f7, FOOTPRINTS4____header_global_0078d9736b90ae37, FOOTPRINTS____header_global_2117c339d33ff511, FORCERIPPLE____header_global_c8ab4820050397e2, FORCESPHERE____header_global_fd90b31308aea057, FRAGBAR____header_global_b5837fc61fcd2f0e, FRAMEEFFECT1_13____header_global_5c28b99b40563192, FRAMEEFFECT1____header_global_a0cac564365961fb, FRANKENSTINESWITCH____header_global_f892b8c7d8fc6894, FREEZEBLAST____header_global_fb45d803614568ff, FREEZEFIREWIDE____header_global_1b5b1847535e0818, FREEZEWIDE____header_global_8b9ab28f157d44df, FREEZE____header_global_5bb7e11acd718947, FUELPOD____header_global_98a0411cda887c63, GENERICPOLE2____header_global_b0362628ff8925bd, GENERICPOLE____header_global_531f644ff587dc53, GENERIC_AMBIENCE17____header_global_af592007be786e93, GLASS2____header_global_2de4e86262063a1a, GLASSPIECES____header_global_37bc9419d16d9aec, GLASS_BREAKING____header_global_eded6c10bb0b98d8, GLASS_HEAVYBREAK____header_global_3eeee64d463d1def, GLASS____header_global_7bc5fffa04606e2c, GPSPEED____header_global_90b6469e01114da8, GRATE1____header_global_2b1543a5800c38db, GREENSLIME____header_global_9f7d7bc4822d874b, GROWAMMO____header_global_05fd26cca714c84b, GROWSPARK____header_global_aad48fb8668eafb2, GROWSPRITEICON____header_global_4c21c62485320736, HANDHOLDINGACCESS____header_global_000f65f10e41645b, HANDHOLDINGLASER____header_global_3dbfadd626441267, HANDPRINTSWITCH____header_global_97070d4491f6d83d, HANDREMOTE____header_global_c89032e4aba9a9e5, HANDSWITCH____header_global_461c4a2452eb04ec, HANDTHROW____header_global_51bf847d5673f876, HANGLIGHT____header_global_127172032e2fa488, HBOMBAMMO____header_global_a4ab4a0b7c540084, HEADJIB1____header_global_20562db72b5eada4, HEALTHBOX____header_global_e77ce81064ed96af, HEATSENSOR____header_global_e62ac2f7caec8570, HEAT_ICON____header_global_12fb085102f9b4c2, HEAVYHBOMB____header_global_13cfacb0a6130f08, HELECOPT____header_global_c910a40b173f5de8, HOLODUKE_ICON____header_global_7bb96cc92102d75d, HOLODUKE____header_global_ec1ec42a01a11b9f, HORSEONSIDE____header_global_0a73638a4286b09e, HOTMEAT____header_global_336c7e5aab504919, HURTRAIL____header_global_2af95cb6e37251f6, HYDRENT____header_global_bfdb3b27f22e23b3, HYDROPLANT____header_global_d17b61b7c0eb12de, INDY____header_global_b07a905554d6c7d3, INGAMEDUKETHREEDEE____header_global_c2fe60591c514fee, INNERJAW____header_global_246ff77fa190148d, INSERT_CLIP____header_global_9cd9c41f05dc5292, INTRO4_1____header_global_3ff89b004d143bd4, INTRO4_2____header_global_9cdda7e93f804948, INTRO4_3____header_global_4cf4a5540b3d9300, INTRO4_4____header_global_e346d15b3ac4a120, INTRO4_5____header_global_712c2e1f371218a6, INTRO4_6____header_global_fb56192e2dc48b8e, INTRO4_B____header_global_904b90197c260c4f, INVENTORYBOX____header_global_9e4451666b256f4a, ITEM_SPLASH____header_global_7f46e5d4ff6d162e, IVUNIT____header_global_7e87a6449e06a907, JETPACK_ICON____header_global_5f4500c7a229d139, JIBBED_ACTOR5____header_global_e48c1fab24293c02, JIBBED_ACTOR6____header_global_b836a4b5bf551bbe, JIBS1____header_global_1134d9aea45bdef0, JIBS2____header_global_bb9ee47e1ddaaa8e, JIBS3____header_global_6b936e62f22b3399, JIBS4____header_global_b23a888508303e8a, JIBS5____header_global_c58997da2d66498b, JIBS6____header_global_436d76f996fc5d15, JURYGUY____header_global_9ff425de552d4457, KICK_HIT____header_global_346f39066bb77faf, KILLSICON____header_global_5c6203f6497dbb92, KNEE____header_global_9b3fffd2628601cc, LASERLINE____header_global_09fcbc639c113401, LASERSITE____header_global_ebd61c5b3d0a32f4, LASERTRIP_ARMING____header_global_b2fab63d9ae764bc, LASERTRIP_EXPLODE____header_global_d6a90087e9909dc3, LASERTRIP_ONWALL____header_global_63f36f4efa7851f9, LAVAPOOLBUBBLE____header_global_8634042ae3a2bc46, LAVAPOOL____header_global_5ae010697240e6ae, LAVASPLASH____header_global_0a264a113af1b290, LA____header_global_198dde2ed6c704ab, LEGJIB1____header_global_d966bc6d8e9b6f28, LETTER____header_global_1958cc6d9cd1cbb5, LIGHTNING_SLAP____header_global_00cd52100f6d38cb, LIGHTSWITCH2____header_global_61d7662199932920, LIGHTSWITCH____header_global_edcd7f9c30bbb02d, LIZMANARM1____header_global_5b5133662759dc3a, LIZMANFEEDING____header_global_43df20e4776b9a7c, LIZMANHEAD1____header_global_ef6e14a1c9757b53, LIZMANJUMP____header_global_da857bc9f0373691, LIZMANLEG1____header_global_98176b714bdf6ecc, LIZMANSPITTING____header_global_2ce2720aae137708, LIZMANSTAYPUT____header_global_d2557628c3c9d8cc, LIZMAN____header_global_690d095172c5a022, LIZTROOPDUCKING____header_global_fcfe68c2fad7f9cc, LIZTROOPJETPACK____header_global_30d023bdd79adc55, LIZTROOPJUSTSIT____header_global_fac8e4f792178946, LIZTROOPONTOILET____header_global_cd2c02164163dcef, LIZTROOPRUNNING____header_global_587e0cc7f55f5f2c, LIZTROOPSHOOT____header_global_001482f7cf865690, LIZTROOPSTAYPUT____header_global_0c523a2e64a610b3, LIZTROOP____header_global_10800a012846b757, LOADSCREEN____header_global_dbf0fb93068f6b54, LOCATORS____header_global_383bb542fa1320cc, LOCKSWITCH1____header_global_f325cb4dbe8ef721, LOOGIE____header_global_57b44e24d3c63546, LUKE____header_global_4fa1e40fc4ca3c71, MAIL____header_global_0d96cc87631819b0, MAN2____header_global_b26fb46e6eb8d203, MAN____header_global_badefae254639d1b, MASKWALL10____header_global_0af3a83f053b72c9, MASKWALL11____header_global_13cadd8d29bc5661, MASKWALL12____header_global_ab383f6b6699b2eb, MASKWALL13____header_global_7e6035e94a2fc48e, MASKWALL14____header_global_66268a338372ee8a, MASKWALL15____header_global_47c92f51c84e79b0, MASKWALL1____header_global_d90b701be30aac06, MASKWALL2____header_global_fafb052093773c41, MASKWALL3____header_global_f023bdf3679359fe, MASKWALL4____header_global_c87c87490cfe8f58, MASKWALL5____header_global_6197e4f62de034ef, MASKWALL6____header_global_9f775dc8e59d2b77, MASKWALL7____header_global_e55f07b413958598, MASKWALL8____header_global_e95c9a21d16b4c23, MASKWALL9____header_global_c6bbca9626b8cfbc, MASTERSWITCH____header_global_f2a2cca9efa57051, MENUBAR____header_global_fea32e48ba2094e8, MENUSCREEN____header_global_0ca4412d07beab76, MIKE____header_global_7eb423bb077fb61b, MINIFONT____header_global_36a6cd74b2aa88c7, MIRRORBROKE____header_global_88913b8843d68868, MIRROR____header_global_dc257f35f79cfd7a, MONEY____header_global_7d6cd5182ce4585c, MONITOR_ACTIVE____header_global_9ad04cf91d02b59d, MONK____header_global_1f50001a1c89b837, MOONSKY1____header_global_da110be8e0d93ba9, MORTER____header_global_9a9b252a4ebb88a1, MOVIECAMERA____header_global_129f6c1e0d6b01ad, MULTISWITCH____header_global_e51a7d15849043c4, MUSICANDSFX____header_global_8ac64937a5bea8be, NAKED1____header_global_d16110ea57b71b74, NATURALLIGHTNING____header_global_3cdfa72bbbd4df3d, NEON1____header_global_61de97f3a3f4c86f, NEON2____header_global_9e8169821ecc66c4, NEON3____header_global_17ec5c82b0b78eae, NEON4____header_global_425fcdd6ea1ca72c, NEON5____header_global_4a32a06674aef405, NEON6____header_global_201be3de152e8719, NEWBEASTSTAYPUT____header_global_3944005094d7223b, NEWBEAST____header_global_9aafc208697a0b13, NITEVISION_ONOFF____header_global_e7295de1304514c5, NUKEBARRELDENTED____header_global_2195721206dd9786, NUKEBARRELLEAKED____header_global_99614b5117120a04, NUKEBARREL____header_global_e585c239fa3fb7fa, NUKEBUTTON____header_global_4113a67e5f90fdac, OCEANSPRITE1____header_global_03c2dbed4b2cefdb, OCEANSPRITE2____header_global_ad5ab55ed895e35d, OCEANSPRITE3____header_global_feb09b17b52e175a, OCEANSPRITE4____header_global_fc1b54703d26517f, OCEANSPRITE5____header_global_2c48ab623bc251a8, OCTABRAINSTAYPUT____header_global_1614bf8aaff7aef8, OCTABRAIN____header_global_659d37dacf8e21d0, OCTA_RECOG____header_global_82fe697760bf7725, OJ____header_global_73beb0aa2f95f993, ONFIRESMOKE____header_global_2d6891c62359e205, ONFIRE____header_global_0a5c159ad79e86a9, OOZ2____header_global_e7b7e926c2783c83, OOZFILTER____header_global_341f11bb384136fc, OOZ____header_global_d2155cea8248418b, ORDERING____header_global_8774b48c7259f4c9, ORGANTIC____header_global_f4a9bc40a5df8932, PANNEL1____header_global_fe46ee80ea012028, PANNEL2____header_global_7893fa5d2331d6b8, PANNEL3____header_global_eff93c90e55db491, PAPER____header_global_d5c80a2a827e5b3f, PIGCOPDIVE____header_global_caa08bcbbdf69e29, PIGCOPSTAYPUT____header_global_c4a58f3a2fba642a, PIGCOP____header_global_3f3c15a6fa270245, PIG_RECOG____header_global_37fe2f9345a70d8f, PIPE1B____header_global_6ea50e8b01387525, PIPE1____header_global_29ee91e0a173ccb6, PIPE2B____header_global_0da66d5fb840b16e, PIPE2____header_global_d9c31be6b5f600cc, PIPE3B____header_global_4e226ac185b6b52d, PIPE3____header_global_32cb534a585d918a, PIPE4B____header_global_1be85892af8e0897, PIPE4____header_global_317fa932b2283faa, PIPE5B____header_global_29503bbd4145449e, PIPE5____header_global_3dcf2aa2ae8d2aa6, PIPE6B____header_global_0b37c5ebc3d2bf74, PIPE6____header_global_b0a3616b2145459a, PIPEBOMB_BOUNCE____header_global_dccf90785f184614, PIPEBOMB_EXPLODE____header_global_24e553dc0e25ca9a, PISTOL_BODYHIT____header_global_46177d116f4a0348, PISTOL_FIRE____header_global_8745d8f28aa0a346, PISTOL_RICOCHET____header_global_a8b20d2639102e6a, PLAYERONWATER____header_global_665f0a63152f82be, PLUG____header_global_dfa95388af6f5e2f, PLUTOPAKSPRITE____header_global_347cc3f052f3307a, POCKET____header_global_1b9ef54c96d7d6cc, PODFEM1____header_global_8e751f6f300db36b, POOLBALLHIT____header_global_2df9dc57deff11bd, POT1____header_global_cb20c4e3393efb11, POT2____header_global_2f3b511a38fb4d92, POT3____header_global_29d8dde286f71402, POWERSWITCH1____header_global_c1f649f01a81c777, POWERSWITCH2____header_global_4da7a999e059e3aa, PRED_RECOG____header_global_e20d238c69c2f633, PUKE____header_global_0049eb14b455c117, PULLSWITCH____header_global_ba23f009ea52317a, PURPLELAVA____header_global_4cfa255deb1f9d97, QUEBALL____header_global_5446f961886ceab7, RADIUSEXPLOSION____header_global_9f34b50c5ba012cb, RATTY____header_global_aee6a3dc20dfc8c4, RAT____header_global_e41c06751aaace9b, REACTOR2BURNT____header_global_5e4ad97702c30aa9, REACTOR2SPARK____header_global_610db4eddcef9c89, REACTOR2____header_global_f1cdff7931341b65, REACTORBURNT____header_global_6d66da8ede69c593, REACTORSPARK____header_global_9532165cb73a07ba, REACTOR____header_global_a1387b474be29c25, RECON____header_global_c495953042ed3ded, RECO_ATTACK____header_global_e9c8aa4514b2d1ee, RECO_PAIN____header_global_f0f9cbba6e6b71e7, RECO_RECOG____header_global_eb0d681d2e1a8e61, RECO_ROAM____header_global_4f6c46b1ca1caa58, RESPAWNMARKERGREEN____header_global_8eaaba8c6b10feb4, RESPAWNMARKERRED____header_global_c62760938ac614d1, RESPAWNMARKERYELLOW____header_global_f81a18b1ee2c3be6, RESPAWN____header_global_91b52496e55e34c5, RIPHEADNECK____header_global_3423f75cd628f475, ROTATEGUN____header_global_103e35300019ea6e, RPGGUNWIDE____header_global_6b672db6bcf06dd3, RPGGUN____header_global_0c87596a3d7e9081, RPG_EXPLODE____header_global_be60c324c6ec2a30, RPG_SHOOT____header_global_580fbaf30c9c300d, RPG____header_global_913ef88cdb1fac19, RUBBERCAN____header_global_635610f7b2e7849b, SATELITE____header_global_20502f4d33773f9d, SCALE____header_global_05546d44af10bee2, SCRAP1____header_global_814f0ec4a453a481, SCRAP2____header_global_d24c046dae36b15d, SCRAP3____header_global_b99cfc0b500b944d, SCRAP4____header_global_eb036b71033f8bca, SCRAP5____header_global_ece7b519a15ee0a6, SCRAP6____header_global_a7ac3f65ded278aa, SCREENBREAK10____header_global_0eb30ddabe8bcc29, SCREENBREAK11____header_global_72578ca567c04a5d, SCREENBREAK12____header_global_58d3f65951315dc9, SCREENBREAK13____header_global_d10eae10929bfb2a, SCREENBREAK14____header_global_450deaa9c59d18f6, SCREENBREAK15____header_global_84ad3889d2b29f53, SCREENBREAK16____header_global_5bf1ed1360e77ed9, SCREENBREAK17____header_global_aaec7e9ad74975e8, SCREENBREAK18____header_global_887e463e57a3052b, SCREENBREAK19____header_global_b3f47cf04ccbf50e, SCREENBREAK1____header_global_1635871734a77811, SCREENBREAK2____header_global_4eee7109f84362cd, SCREENBREAK3____header_global_74907eb4642fac11, SCREENBREAK4____header_global_34128860c6b108ea, SCREENBREAK5____header_global_b4bfcf76b6560933, SCREENBREAK6____header_global_8cae46b652d91b01, SCREENBREAK7____header_global_29b37be517ded523, SCREENBREAK8____header_global_8e76804c982c0093, SCREENBREAK9____header_global_82f4b5e2bf71fc66, SCUBAMASK____header_global_218dd9c6465ff61a, SECTOREFFECTOR____header_global_30a8e054d1536786, SEENINEDEAD____header_global_380d350e9c87965e, SEENINE____header_global_d2f6479f31e971aa, SELECTDIR____header_global_e112c044b0480afd, SELECT_WEAPON____header_global_41de5209634bbc4a, SHARK____header_global_cd5243ea3b4f5004, SHELL____header_global_8511fb6f6868a0a8, SHORT_CIRCUIT____header_global_f76893711d4977f0, SHOTGUNAMMO____header_global_268afb0047902724, SHOTGUNSHELL____header_global_f7dc32a4ff2f3148, SHOTGUNSPRITE____header_global_e2574678b382672e, SHOTGUN_COCK____header_global_69e958dc5288aeed, SHOTGUN_FIRE____header_global_59b167e595161eee, SHOTGUN____header_global_a50ddffd156f6342, SHOTSPARK1____header_global_442d81031e1715ae, SHRINKEREXPLOSION____header_global_09e8e520b957673b, SHRINKERSPRITE____header_global_5993035546350f40, SHRINKERWIDE____header_global_318d1ca7154c68ca, SHRINKER_FIRE____header_global_cd9036454b010208, SHRINKER_HIT____header_global_1cebef6dc8ae95e8, SHRINKER____header_global_1df741dbdbfd09da, SHRINKSPARK____header_global_418de0907fbb5829, SIDEBOLT1____header_global_5d281031467bb773, SIGN1____header_global_78a5a8f98000e5bb, SIGN2____header_global_4bd681b79d8aae27, SIXPAK____header_global_b90018d034d18983, SLIDEBAR____header_global_c98eb8f9961935bd, SLIM_ATTACK____header_global_4f05100b8e3e1ca1, SLIM_DYING____header_global_a5dc593708c4d948, SLIM_RECOG____header_global_c22df4be8c0088cf, SLIM_ROAM____header_global_9de11945270eaf5e, SLOTDOOR____header_global_d2ece6b22db21146, SMALLFNTCURSOR____header_global_b18f49692f66d796, SMALLSMOKE____header_global_f0b94ff12f3d5af0, SOLARPANNEL____header_global_0c28dbd6d1ce96d9, SOMETHINGFROZE____header_global_26116f377b56b43b, SOMETHINGHITFORCE____header_global_6f45a0eeeed1fad4, SOMETHING_DRIPPING____header_global_65a91e806ffeb45d, SPACEDOORSWITCH____header_global_49437b8c1b889190, SPACELIGHTSWITCH____header_global_69ce5867fd966424, SPACEMARINE____header_global_24922c42b0ebd936, SPEAKER____header_global_7dcd058d99c10fd0, SPINNINGNUKEICON____header_global_15b4cd499d8f3eac, SPIT____header_global_b8568f88f609c278, SPOTLITE____header_global_cfd31b652198fa26, SQUISHED____header_global_c1aa256c5a66328b, STAINGLASS1____header_global_3fae97974d0aa043, STALLBROKE____header_global_aa2603395a7a7de4, STALL____header_global_72deb32c293d6d85, STARTALPHANUM____header_global_f45faae95c4ca130, STATIC____header_global_ad1ba8cc33ac46a3, STATUEFLASH____header_global_0b4e51961b1ecbb6, STATUE____header_global_023473baa8f2ac8f, STEAM____header_global_077237510f7c93a4, STEROIDS_ICON____header_global_86d4e650f5d80d56, STRIPEBALL____header_global_b5b28b82782d4c81, SUBWAY____header_global_a77836c22f44ea83, SUSHIPLATE1____header_global_7e1a4e832051f62b, SUSHIPLATE2____header_global_91aa0854ed58b46a, SUSHIPLATE3____header_global_a93916175cdbf7b2, SUSHIPLATE4____header_global_a5ed550681c0d83f, SUSHIPLATE5____header_global_003b23f9ef1f2e71, SWITCH_ON____header_global_c4f3401a04d282ad, SpriteDeletionQueue, SpriteProjectile, TAMPON____header_global_1fc3729a7edfe03a, TANK____header_global_63863678e1a05f87, TARGET____header_global_04d8c817593fc944, TECHLIGHT2____header_global_a7ae731f1df32822, TECHLIGHT4____header_global_8018ac14b1d8c4ef, TECHLIGHTBUST2____header_global_166a0f035a0e9f3d, TECHLIGHTBUST4____header_global_32c1d154e465c706, TECHSWITCH____header_global_8910f72f8ba14860, TELEPORTER____header_global_b8edcd03b8346266, TENSCREEN____header_global_f08a0d9925586bdd, TEXTBOX____header_global_c130f4b2f7e4cec2, TEXTSTORY____header_global_b41c2c68b4c6a167, THREEBYFIVE____header_global_cbda34d1a537116b, THREEDEE____header_global_12a20665447be3ca, THUD____header_global_587d66e7a5ec0e70, THUNDER____header_global_254ee0c1e60369f0, TIP____header_global_00e014ee5817d8c4, TIRE____header_global_b66cce76370bb4d9, TOILETBROKE____header_global_538edd809220f725, TOILETWATER____header_global_0ce11287bf8a4a82, TOILET____header_global_93732a2429d002f6, TONGUE____header_global_a3ff8c1900ae74e5, TOUCHPLATE____header_global_1aba9333dbd9ff69, TOUGHGAL____header_global_f60a055cb78b7d10, TRANSPORTERBEAM____header_global_91f7a04c07296dff, TRANSPORTERSTAR____header_global_2fb1243873f6fcc8, TRASH____header_global_efda6bbe1eb7a26c, TREE1____header_global_8131b9c30ad10b10, TREE2____header_global_dbc1324a69fa2f67, TRIPBOMBSPRITE____header_global_720dde9f973cb18c, TRIPBOMB____header_global_27794085d9df66ca, TRIPODCAMERA____header_global_841bf22467c81811, TURR_RECOG____header_global_e0884a018481b6cd, VACUUM____header_global_b054eac12142ae66, VASE____header_global_85b97b9b007ac6ba, VENDMACHINE____header_global_010b0dee659bb301, VENT_BUST____header_global_8f3e202aadf62cea, VICTORY1____header_global_4cad1ca630933b8c, VIEWBORDER____header_global_40bee9f053964f2a, VIEWSCREEN2____header_global_ae26f68064da25fd, VIEWSCREEN____header_global_f2f6147b6dc2030d, VOL4ENDSND1____header_global_9145ab32d8fd106b, VOL4ENDSND2____header_global_ebe2997a8d990eca, WAITTOBESEATED____header_global_0ee37a95c295d67d, WALLBLOOD1____header_global_50f3caf35554cc81, WALLBLOOD2____header_global_e8165c3e5ff1a48b, WALLBLOOD3____header_global_53e9fd2e0edced45, WALLBLOOD4____header_global_a9fff475f53264ab, WALLBLOOD5____header_global_1b7508ab9806400b, WALLBLOOD7____header_global_000c55f87119cbc7, WALLBLOOD8____header_global_988f0b83fa7e6876, WALLLIGHT1____header_global_8040ccf205de375c, WALLLIGHT2____header_global_d9f8f7ecb61bb9e2, WALLLIGHT3____header_global_f86de87efbd3f365, WALLLIGHT4____header_global_0946f988e1c1680c, WALLLIGHTBUST1____header_global_7bef44117d8145df, WALLLIGHTBUST2____header_global_e87d895e68eaf204, WALLLIGHTBUST3____header_global_982db66359f0e1e3, WALLLIGHTBUST4____header_global_8a368316706ee8fe, WAR_AMBIENCE2____header_global_13de98c5507f533d, WATERBUBBLEMAKER____header_global_9cc8b2a0a514261e, WATERBUBBLE____header_global_651579de3914603b, WATERDRIPSPLASH____header_global_ad15b2acc8e1b53b, WATERDRIP____header_global_c71fc70fbe2613fb, WATERFOUNTAINBROKE____header_global_9749417c4ae7da6a, WATERFOUNTAIN____header_global_f6c0749795167124, WATERSPLASH2____header_global_aeb6af5725c8dc88, WATERTILE2____header_global_f8282236db91947a, WEATHERWARN____header_global_c18518f966d38b08, WHIPYOURASS____header_global_2987fcbb7c0885b2, WHISPYSMOKE____header_global_b084648be5def47f, WIDESCREENSTATUSBAR____header_global_fc9c06e76d67af8c, WIERDSHOT_FLY____header_global_f8dae0e3ff31a5cc, WINDOWBORDER1____header_global_1a01032620365d5f, WINDOWBORDER2____header_global_89b5b334be0ecbd4, WIND_AMBIENCE____header_global_3274cdd371018ff8, WIND_REPEAT____header_global_cc73a814ebfe2344, WOMAN____header_global_3a13e7ef0b509446, WOODENHORSE____header_global_a2f1bff9327b5513, W_FORCEFIELD____header_global_c5ccdbbf96fd8bb8, W_HITTECHWALL10____header_global_d0e6d51ee8ee3edf, W_HITTECHWALL15____header_global_c989db5556a336c6, W_HITTECHWALL16____header_global_d4abb623b7f62d27, W_HITTECHWALL1____header_global_f04ff9ce0606cf71, W_HITTECHWALL2____header_global_4f8b4f33c7c7b359, W_HITTECHWALL3____header_global_97a00ca679a01a6e, W_HITTECHWALL4____header_global_8baabeb21fd00133, W_MILKSHELFBROKE____header_global_7aec75c8e2e8be3c, W_MILKSHELF____header_global_7b932b38f7f56fd4, W_NUMBERS____header_global_1433925104a59f57, W_SCREENBREAK____header_global_45f30a521d47d0c8, W_TECHWALL10____header_global_6c121cf51b83e543, W_TECHWALL11____header_global_9c46439bf4db72dc, W_TECHWALL12____header_global_b6b30766144d6a50, W_TECHWALL13____header_global_b53bdfa64106ed97, W_TECHWALL14____header_global_a28c921ae62514ea, W_TECHWALL15____header_global_dc66caaaf0598a09, W_TECHWALL16____header_global_0fbeda77beff5ef1, W_TECHWALL1____header_global_20aa2abab9b5da4a, W_TECHWALL2____header_global_bd255c613ad99475, W_TECHWALL3____header_global_ce947323c074e433, W_TECHWALL4____header_global_774e70e94f535cb6, W_TECHWALL5____header_global_af1c2bb702122eff, W_TECHWALL6____header_global_2f700385ee89ebf1, W_TECHWALL7____header_global_0ea605735f63b4b0, W_TECHWALL8____header_global_b18f6b58951f67ef, W_TECHWALL9____header_global_f6d9bd67f436ebdf, XXXSTACY____header_global_3112bf1707621875, actor, animwall, apScript, apStrings, apXStrings, bakipos, buf, cSnapshotMemUsage__header_global_e5edb98c9f80dc8d, curipos, duke3d_globalflags, everyothertime, fix16_deg_to_rad_mult__header_global_3ea979f1c38ad60c, fix16_rad_to_deg_mult__header_global_cad47d444a93091f, g_activeVscrSprite, g_activeVscrTile, g_actorRespawnTime, g_animWallCnt, g_animateCnt, g_animateGoal, g_animatePtr, g_animateSect, g_animateVel, g_bouncemineRadius, g_cloudClock, g_cloudCnt, g_cloudSect, g_cloudX, g_cloudY, g_curViewscreen, g_cyclerCnt, g_cyclers, g_damageCameras, g_defaultVideoModes__header_global_00a685b6003e8958, g_deleteQueueSize, g_doQuickSave, g_earthquakeTime, g_frameCounter, g_frameJustDrawn, g_frameRate, g_frameStackSize, g_freezerSelfDamage, g_gameQuit, g_gameUpdateAndDrawTime, g_gameUpdateAvgTime, g_gameUpdateTime, g_gametypeCnt, g_gametypeNames, g_globalRandom, g_impactDamage, g_interpolationCnt, g_interpolationLock, g_itemRespawnTime, g_keyAsciiTableShift__header_global_5e440bd907d401f1, g_keyAsciiTable__header_global_daa0adad8a147185, g_labelCnt, g_lastFrameDuration, g_lastFrameDuration2, g_lastFrameEndTime, g_lastFrameEndTime2, g_lastFrameStartTime, g_loadFromGroupOnly, g_mapInfo, g_maxDefinedSkill, g_maxPlayerHealth, g_mirrorCount, g_mirrorSector, g_mirrorWall, g_morterRadius, g_moveThingsCount, g_musicIndex, g_musicSize, g_noEnemies, g_numFreezeBounces, g_origins, g_pipebombRadius, g_playerFriction, g_playerSpawnCnt, g_playerSpawnPoints, g_restartFrameRoutine, g_restorePalette, g_rpgRadius, g_screenCapture, g_scriptDebug, g_scriptPtr, g_scriptSize, g_seenineRadius, g_setupFileName, g_showShareware, g_shrinkerRadius, g_skillNames, g_spriteDeleteQueuePos, g_spriteGravity, g_startArmorAmount, g_tile, g_tileLabels, g_timerTicsPerSecond, g_tripbombLaserMode, g_tripbombRadius, g_volumeCnt, g_volumeFlags, g_volumeNames, inputfifo, label, labelcode, labeltype, localInput, lockclock, oldipos, ototalclock, packbuf, pow264__header_global_b4c1254bc89929e9, pow2char__header_global_d87ccb635969905f, pow2long__header_global_ffb0b37ea121c1d0, pow2ulong__header_global_7dfdb64c42c21635, pub, pus, ready2send, recsync, s_buildDate, sbar, screenpeek, sctokeylut__header_global_e39c2f7f087b2393, szPlayerName, tempbuf, typebuf, __cxx_global_cell_38abf48ab8ba3db5fce877d9, __cxx_global_cell_286850f0b72c66d5aae173a9, __cxx_global_cell_aa5b630a7a35e6b022a5f20e, __cxx_global_cell_9cec72372660080d153969ed, __cxx_global_cell_b1cbeb17d4d0dcf0e2c1e4ff, __cxx_global_cell_a2f1fe9eaedb9f9cfd27b0e2, __cxx_global_cell_fa1a761ad63424391ef2eb7e, __cxx_global_cell_134f8f7a37f9a3d5a15b9519, __cxx_global_cell_a822d0436b33da814b8410a2, __cxx_global_cell_13be58e164425bc1433880b5, __cxx_global_cell_cd9e3fd19bbbc2e1259f56a8, __cxx_global_cell_abf365253e4fe443b4315faf, __cxx_global_cell_9d4c552790d42137522a354f, __cxx_global_cell_f0488c3aa4d43399b04094cf, __cxx_global_cell_c7396d09498f79f4675d125b, __cxx_global_cell_409c4df5b79d5f8578029b13, __cxx_global_cell_2d8f6b5f2b460ae822f48a39, __cxx_global_cell_006d2f42978c12e7d8b6a15f, __cxx_global_cell_5130ffed09d9430dd5f32ab6, __cxx_global_cell_af7005133235fcf35d534b57, __cxx_global_cell_a0b473bf061647c0f262ff82, __cxx_global_cell_65816fd170522259e73c192a, __cxx_global_cell_95fa142e229b514815549935, __cxx_global_cell_cb235a69fcd6fb51243af95d, __cxx_global_cell_ed045c198d4ea4d9c696a493, __cxx_global_cell_16c27b81c3ce38223cbeb0b0, __cxx_global_cell_b0597697bdbf1bdf4de5ac94, __cxx_global_cell_9d6515c82c71e88f9c98473e, __cxx_global_cell_35041d56fffbae8d2a330213, __cxx_global_cell_f51bebc92810fbbcedc191bf, __cxx_global_cell_4c2e99926c93297eef1857b2, __cxx_global_cell_98f0b1f570a2f6307c66c6f0, __cxx_private_cell_b69db263dbcac94861e0e664, __cxx_private_cell_bbf3e7eeeb0dc24800ab3809, __cxx_global_cell_6742302ef915e025d82bcd36, __cxx_global_cell_c10bd100c9555dc18d0d8d99, __cxx_global_cell_d0b686eb0915681046d8c846, __cxx_global_cell_982d03e32c69f27b39463a83, __cxx_global_cell_76e4c4038ad7940389bef366, __cxx_global_cell_b299e7de5ba2bf52c127cd92, __cxx_global_cell_603507b56f38a5986b111afe, __cxx_global_cell_e9576a5286a0997ea679c8d5, __cxx_global_cell_e75226e761a45fe1770321b0, __cxx_global_cell_de120b7cdf1fa8f4e75f3b12, __cxx_global_cell_55c709d3278bbdef67186917, __cxx_global_cell_8c6782a4c9205a0e62d08d6b, __cxx_global_cell_621f7119e880a71b275a5bee, __cxx_global_cell_62371091f3ee3ea2b22026d7, __cxx_global_cell_1a2868735eb0bc70fe0a0140, __cxx_global_cell_3b9a6643b5a8adfdd16c2c0e, __cxx_global_cell_164a2be3133df4f0c234cae8, __cxx_global_cell_bc77ba2124d9f9bdbae1a2b2, __cxx_global_cell_723c54e02b4279ab2035081e, __cxx_global_cell_3e65d7d761ef7b69960481e2, __cxx_global_cell_305f0ee39b11eeb0d4e07876, __cxx_global_cell_c725c74fe2c9d83b97894533, __cxx_global_cell_2b417489d42f8eed53787b0e, __cxx_global_cell_428952e2c5a589c67db10fcc, __cxx_global_cell_7c95f40343184c865284ca02, __cxx_global_cell_3a4a097e79a13fa668e3fd57, __cxx_global_cell_af78946ba4f03068d5c18b7b, __cxx_global_cell_640dd220b3f0967469c40b50, __cxx_global_cell_2519a794ef91626313d8500b, __cxx_global_cell_b83ef053117d51017ee6c222, __cxx_global_cell_b1c97a6bfe6b79b1e897a68a, __cxx_global_cell_2bd4d302631cb2e7f9cab27e, __cxx_global_cell_6cd091f46d4420dd6ef3142e, __cxx_global_cell_bb57c023dc177e6059e96f1a, __cxx_global_cell_f06cc89b42ea26c6f8c956f2, __cxx_global_cell_00e4d69d02c23b6c86678573, __cxx_global_cell_1aca80e8b55c802f7b43740d, __cxx_global_cell_bb1aad227706ae6ec200fcf0, __cxx_global_cell_ca786e7ce472b03dc90a2ec6, __cxx_global_cell_0faac5865f4b6f1cc5649ea7, __cxx_global_cell_0f5d76246695f95afb26af0f, __cxx_global_cell_25ebc483826d436da41b0007, __cxx_private_cell_f726f99a84b901c7f92a2286, __cxx_private_cell_dd11ebbd163256f5ccd307f6, __cxx_private_cell_4fc073490d86f49f710c97e6, __cxx_private_cell_beaaed0681083bdccd19781e, __cxx_global_cell_0017dea7770f7ecff7ab3c20, __cxx_global_cell_8d39f72b071341a9545e4b0e, __cxx_global_cell_fcb79810a6ad9af2e41fcedd, __cxx_global_cell_ea1e6827d1df744b092b60e4, __cxx_global_cell_9e3f856e68998313827ff18d, __cxx_global_cell_458f422a7bebe88265e9f694 } from "./_source_legacy_global_cpp_e88163a4b973.mjs";
