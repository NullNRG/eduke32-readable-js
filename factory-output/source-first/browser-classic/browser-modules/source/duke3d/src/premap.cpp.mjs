// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/premap.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { divtable32 } from "../../build/src/pragmas.cpp.mjs";
import { divtable64 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_a6e3cfd4eba13fb9886cb240 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_f8287b2e627d0e3f51b90c55 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s32_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { libdivide_s64_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s64_gen } from "../../../browser-abi/libdivide_provider.mjs";
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
export const fix16_half__header_global_a38bd6397241b43f = i32(32768);
function __cxx_static_address_aa9ef8825b89ee9de433efdf() {
  return __cxx_static_address_aa9ef8825b89ee9de433efdf.reference || (__cxx_static_address_aa9ef8825b89ee9de433efdf.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_a38bd6397241b43f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_6881ab7737c3bc6a = i32(65536);
function __cxx_static_address_b167b9296e9508768e897b0d() {
  return __cxx_static_address_b167b9296e9508768e897b0d.reference || (__cxx_static_address_b167b9296e9508768e897b0d.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_6881ab7737c3bc6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_44ac221e6c369feb = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_cebe661053872d838ac21778() {
  return __cxx_static_address_cebe661053872d838ac21778.reference || (__cxx_static_address_cebe661053872d838ac21778.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_44ac221e6c369feb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/premap.cpp:516
export function __is_constant_evaluated() {
  return Boolean(false);
}

// C/C++ source: source/duke3d/src/premap.cpp:230
export function min(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/duke3d/src/premap.cpp:2674
export function _mm_and_si128(__a, __b) {
  return (__a & __b);
}

// C/C++ source: source/duke3d/src/premap.cpp:2709
export function _mm_or_si128(__a, __b) {
  return (__a | __b);
}

// C/C++ source: source/duke3d/src/premap.cpp:2726
export function _mm_xor_si128(__a, __b) {
  return (__a ^ __b);
}

// C/C++ source: source/duke3d/src/premap.cpp:300
export function __gthread_active_p() {
  return i32(1);
}

// C/C++ source: source/duke3d/src/premap.cpp:746
export function __gthread_mutex_lock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_lock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/duke3d/src/premap.cpp:776
export function __gthread_mutex_unlock(__mutex) {
  if (Boolean(__gthread_active_p())) {
    return i32(pthread_mutex_unlock(__mutex));
  } else {
    return i32(0);
  }
}

// C/C++ source: source/duke3d/src/premap.cpp:809
export function __gthread_recursive_mutex_lock(__mutex) {
  return i32(__gthread_mutex_lock(__mutex));
}

// C/C++ source: source/duke3d/src/premap.cpp:830
export function __gthread_recursive_mutex_unlock(__mutex) {
  return i32(__gthread_mutex_unlock(__mutex));
}

// C/C++ source: source/duke3d/src/premap.cpp:65
export function __exchange_and_add(__mem, __val) {
  return i32(cAtomic(__mem, Int32Array, "add:old", 4, __val));
}

// C/C++ source: source/duke3d/src/premap.cpp:70
export function __atomic_add(__mem, __val) {
  i32(cAtomic(__mem, Int32Array, "add:old", 4, __val));
}

// C/C++ source: source/duke3d/src/premap.cpp:82
export function __exchange_and_add_single(__mem, __val) {
  let __result = i32((cDeref(__mem, Int32Array).value));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
  return __result;
}

// C/C++ source: source/duke3d/src/premap.cpp:91
export function __atomic_add_single(__mem, __val) {
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(__val)))))(cDeref(__mem, Int32Array));
}

// C/C++ source: source/duke3d/src/premap.cpp:1378
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

// C/C++ source: source/duke3d/src/premap.cpp:1449
export function xfree(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/duke3d/src/premap.cpp:308
export function libdivide_mullhi_u16(x, y) {
  let xl = u32(x);
  let yl = u32(y);
  let rl = u32(Math.imul(xl, yl));
  return (u32((u32((u32((rl >>> 16)) & 65535)) & 65535)) & 65535);
}

// C/C++ source: source/duke3d/src/premap.cpp:314
export function libdivide_mullhi_s16(x, y) {
  let xl = i32(x);
  let yl = i32(y);
  let rl = i32(Math.imul(xl, yl));
  return ((u32(((u32(((u32(i32((rl >> 16))) << 16) >> 16)) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/duke3d/src/premap.cpp:321
export function libdivide_mullhi_u32(x, y) {
  let xl = u64(x);
  let yl = u64(y);
  let rl = u64((BigInt(xl) * BigInt(yl)));
  return u32(u64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/duke3d/src/premap.cpp:327
export function libdivide_mullhi_s32(x, y) {
  let xl = i64(x);
  let yl = i64(y);
  let rl = i64((BigInt(xl) * BigInt(yl)));
  return i32(i64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/duke3d/src/premap.cpp:334
export function libdivide_mullhi_u64(x, y) {
  let xl = u128(u128(x));
  let yl = u128(u128(y));
  let rl = u128(u128((BigInt(xl) * BigInt(yl))));
  return u64(u128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/duke3d/src/premap.cpp:360
export function libdivide_mullhi_s64(x, y) {
  let xl = i128(i128(x));
  let yl = i128(i128(y));
  let rl = i128(i128((BigInt(xl) * BigInt(yl))));
  return i64(i128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/duke3d/src/premap.cpp:382
export function libdivide_count_leading_zeros16(val) {
  return ((u32(((u32(i32((__builtin_clz(u32(val)) - 16))) << 16) >> 16)) << 16) >> 16);
}

// C/C++ source: source/duke3d/src/premap.cpp:412
export function libdivide_count_leading_zeros32(val) {
  return i32(__builtin_clz(val));
}

// C/C++ source: source/duke3d/src/premap.cpp:441
export function libdivide_count_leading_zeros64(val) {
  return i32(__builtin_clzll(u64(val)));
}

// C/C++ source: source/duke3d/src/premap.cpp:462
export function libdivide_32_div_16_to_16(u1, u0, v, r) {
  let n = u32((u32((u32(u1) << 16)) | u32(u0)));
  let result = (u32((u32((u32(Math.trunc(n / u32(v))) & 65535)) & 65535)) & 65535);
  ((cDeref(r, Uint16Array).value) = (u32((u32((u32((n - u32(Math.imul(u32(result), u32(v))))) & 65535)) & 65535)) & 65535));
  return (u32(result) & 65535);
}

// C/C++ source: source/duke3d/src/premap.cpp:606
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

// C/C++ source: source/duke3d/src/premap.cpp:42
export function fix16_to_int(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_a38bd6397241b43f : (-fix16_half__header_global_a38bd6397241b43f)))) / fix16_one__header_global_6881ab7737c3bc6a));
}

// C/C++ source: source/duke3d/src/premap.cpp:43
export function fix16_to_float(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_44ac221e6c369feb)));
}

// C/C++ source: source/duke3d/src/premap.cpp:44
export function fix16_to_dbl(a) {
  return (a * flt_f161r__header_global_44ac221e6c369feb);
}

// C/C++ source: source/duke3d/src/premap.cpp:46
export function fix16_from_int(a) {
  return i32(Math.imul(a, fix16_one__header_global_6881ab7737c3bc6a));
}

// C/C++ source: source/duke3d/src/premap.cpp:47
export function fix16_from_float(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_6881ab7737c3bc6a))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/duke3d/src/premap.cpp:48
export function fix16_from_dbl(a) {
  return i32(((a * fix16_one__header_global_6881ab7737c3bc6a) + ((a >= 0) ? 0.5 : (-0.5))));
}

// C/C++ source: source/duke3d/src/premap.cpp:94
export function fix16_mod(x, y) {
  return i32((x = i32((Number(x) % Number(y)))));
}

// C/C++ source: source/duke3d/src/premap.cpp:121
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

// C/C++ source: source/build/include/pragmas.h:174
export function scale(eax, edx, ecx) {
  return i32(tabledivide64(i64((BigInt(i64(eax)) * BigInt(i64(edx)))), i64(ecx)));
}

// C/C++ source: source/build/include/pragmas.h:111
export function tabledivide64(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_f8287b2e627d0e3f51b90c55().value)) & i32((!(u64(d) < u64(16384)))))))) {
    cAssignAggregate((cPointerElementRef(divtable64, 0).value), libdivide_s64_gen((__cxx_global_cell_f8287b2e627d0e3f51b90c55().value = i64(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}});
  }
  return i64(libdivide_s64_do(n, cPointerOffset(divtable64, i64((BigInt(i64((u64(d) < u64(16384)))) * BigInt(d))), 9)));
}

export function clamp__header_1f67e8bf1acd(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_b1cfaf2244c73238(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

// Original Clang-generated fragment; imports existing owner storage.
export { ACCESSCARD____header_global_32ad913a678022b0, ACCESSSWITCH2____header_global_d475416ffa748c8b, ACCESSSWITCH____header_global_43edccbb18c748af, ACCESS_ICON____header_global_57cfd74c8761966b, ACTIVATORLOCKED____header_global_13bf5080abf00242, ACTIVATOR____header_global_8c677d1684601898, AIRTANK_ICON____header_global_ff745d0d3165d0f1, AIRTANK____header_global_75c1762d815a3895, ALIENSWITCH____header_global_2f6d19ee998b30fd, ALIEN_SWITCH1____header_global_74b2293b9884d6fe, AMMOBOX____header_global_8373c58d09e5e6d0, AMMOLOTS____header_global_577e630e0c29ff1f, AMMO____header_global_123319fe0c66f4dd, ANTENNA____header_global_85caca7ac05457e7, APLAYERTOP____header_global_6048c21a889ca3a1, APLAYER____header_global_04ff51bc5bef4a15, ARMJIB1____header_global_c7945ec83adc2984, ARRAY_SIZE__header_0a2637d8cf91, ARRAY_SIZE__header_4392c52062c0, ARRAY_SIZE__header_dc2fb562868b, ARROW____header_global_0cd46d8667b1c601, ATMBROKE____header_global_8953442fc26cc7fc, ATM____header_global_8415e9457e4725c1, ATOMICHEALTH____header_global_6e9160ba0c4e7461, A_CheckEnemySprite__header_89d56e52ba00, A_CheckEnemyTile__header_c27f32e4869b, A_ResetVars__header_6cd3fef1b3ca, BANNER____header_global_e99a4db58a77190d, BARBROKE____header_global_a12ab50a9b096d36, BATTERYAMMO____header_global_a5e1254966b254bd, BETASCREEN____header_global_1d5bbc3b2f9e859a, BETAVERSION____header_global_1b74d16ca255f100, BGRATE1____header_global_a24018e56a796bc3, BIGALPHANUM____header_global_ccb729c50905409f, BIGAPPOS____header_global_8f7ee8f368070daa, BIGBANG____header_global_39296e7c2e816f9f, BIGCOLIN____header_global_0d43ec565fdd42da, BIGCOMMA____header_global_12b12d041418a0d1, BIGFORCE____header_global_8906387737cb101a, BIGHOLE____header_global_df5b0633d0600c92, BIGORBIT1____header_global_7f7581232b2f8766, BIGPERIOD____header_global_296e433f42b1f548, BIGQ____header_global_ddfcf27704effdee, BIGSEMI____header_global_0d50bf2c149b4afe, BIGX____header_global_0a5f7448a7c1b03f, BLANKSCREEN____header_global_956d85d264f06ed2, BLIMP____header_global_f0015fba719185a9, BLOODPOOL____header_global_b6d7cd7ca73f3639, BLOODSPLAT1____header_global_3dfb6b25f3e45dbf, BLOODSPLAT2____header_global_2713490e1425d870, BLOODSPLAT3____header_global_6572176795b957d0, BLOODSPLAT4____header_global_8bf87003a4e5b792, BLOODYPOLE____header_global_01747dd95e7f13be, BLOOD____header_global_6eea5c30c868d7fa, BOLT1____header_global_8af016bd41ef810e, BONUSMUSIC____header_global_c8646153bfff83a2, BONUSSCREEN____header_global_099dbb9bc5a0f417, BONUS_SPEECH1____header_global_3bf285adbd91a967, BONUS_SPEECH2____header_global_7f3c0e7c570f2c88, BONUS_SPEECH3____header_global_e9edd7a807c1e883, BONUS_SPEECH4____header_global_6cac53ee20a14228, BOOTS____header_global_edadf120042c3a47, BOOT_ICON____header_global_4c4e087aa7769299, BORNTOBEWILDSCREEN____header_global_900abe0d0c3c1fa7, BOS1_RECOG____header_global_e4ad1e21ce4a5f8d, BOS1_WALK____header_global_bf48a6ea7573459d, BOS2_RECOG____header_global_0efae632a4ea2821, BOS3_RECOG____header_global_a86a0259ff2f5e7f, BOS4_RECOG____header_global_1a53e9b05b20d598, BOSS1LOB____header_global_6fd9a9ff8c62ec7b, BOSS1SHOOT____header_global_dcd61ee179d05f71, BOSS1STAYPUT____header_global_382dbbd0b3d1ec1d, BOSS1____header_global_1c970140290a24dc, BOSS2STAYPUT____header_global_eaec9ad87db8aad1, BOSS2____header_global_218b3b5c9b5e738d, BOSS3STAYPUT____header_global_010c8ccf4a4a69a9, BOSS3____header_global_d32ab7486a36eef7, BOSS4STAYPUT____header_global_1a8a5b348ee9fa64, BOSS4_DEADSPEECH____header_global_e4fa351c025fa4b0, BOSS4_FIRSTSEE____header_global_9bf1de6b2b881274, BOSS4____header_global_16d6b9400293aeb5, BOSS5STAYPUT____header_global_98749c50b383f114, BOSS5____header_global_b7d47e10f317f2d3, BOSSTALKTODUKE____header_global_b93d95162a42a3ba, BOSSTOP____header_global_6c558c3d32b4b10a, BOTTLE10____header_global_0ec1a7055df93b10, BOTTLE11____header_global_7b7717aa3cc61766, BOTTLE12____header_global_7ab276f14c92a1e2, BOTTLE13____header_global_70d3bbbd545c4304, BOTTLE14____header_global_a0700534fc28373f, BOTTLE15____header_global_bf6b98f0a40ba6b6, BOTTLE16____header_global_fbdc68a8dd6849b6, BOTTLE17____header_global_d5e3d0301b3d41b3, BOTTLE18____header_global_e60d70839915dfb8, BOTTLE19____header_global_57c1c8d2026a8832, BOTTLE1____header_global_e78eed5c23b7ee9f, BOTTLE2____header_global_9f3f073f4e9aa83f, BOTTLE3____header_global_118e07e2fdad3ac9, BOTTLE4____header_global_b8d679eb5f97b844, BOTTLE5____header_global_8ae15c684162ecd8, BOTTLE6____header_global_47d2a3de5b75ef1b, BOTTLE7____header_global_289d995b5533aab1, BOTTLE8____header_global_34cce48972dce05f, BOTTOMSTATUSBAR____header_global_a3d9d1ef88380270, BOUNCEMINE____header_global_4518638ef7da5b3d, BOX____header_global_71c7a2b61c93cfb1, BPANNEL1____header_global_62815f10b113d058, BPANNEL3____header_global_bc216c92b5fb9697, BROKEFIREHYDRENT____header_global_376a21062977f99c, BROKEHYDROPLANT____header_global_b5a6f8ddaaf7449c, BROKENCHAIR____header_global_60abeafdb0d8dc07, BULLETHOLE____header_global_b463b68b841a5f8c, BURNEDCORPSE____header_global_57817c73754d7866, BURNING2____header_global_0f7064ac99eca95e, BURNING____header_global_277f089079c6075b, CACTUSBROKE____header_global_d99a3ecade01f7f4, CACTUS____header_global_3dca58903b5966a4, CAMCORNER____header_global_f2c3032bee2cb6df, CAMERA1____header_global_7aa08ecd9c9a2aca, CAMERALIGHT____header_global_841a1e6758f3eaab, CAMERAPOLE____header_global_33a9e53e4c753a61, CAMLIGHT____header_global_4e94e5ae4d91044f, CANWITHSOMETHING2____header_global_871c6f9490ce5beb, CANWITHSOMETHING3____header_global_ecc1cd4b5cfa6963, CANWITHSOMETHING4____header_global_2a5cc9706c2c134f, CANWITHSOMETHING____header_global_fda7b66ac896a4a5, CAPT_RECOG____header_global_6178a476c0290c8b, CAT_FIRE____header_global_d0b7e9bc8c1f954a, CEILINGSTEAM____header_global_36e297e1efbe8a41, CHAINGUNSPRITE____header_global_d37d7e13f48d5ef2, CHAINGUN_FIRE____header_global_5726a0325a0d15c7, CHAINGUN____header_global_43ae3084b9f508bd, CHAIR1____header_global_9194caa668d48f48, CHAIR2____header_global_730a7ffdaa03f7c3, CHAIR3____header_global_066b4c75b9056bd0, CIRCLEPANNELBROKE____header_global_b525afb9eb7925d8, CIRCLEPANNEL____header_global_4b62081841b77767, CLOUDYOCEAN____header_global_c9c3d56873d8a79e, CLOUDYSKIES____header_global_afa8aa78c421fa04, COLAMACHINE____header_global_229044c382bf1aa0, COLA____header_global_c53ea1e00130ca1a, COMMANDERSTAYPUT____header_global_ad5a092bb2b9715b, COMMANDER____header_global_715d840b8ddaf0ac, COMM_RECOG____header_global_a84ab2000cebdd9e, CONE____header_global_f3e5324116decde8, COOLEXPLOSION1____header_global_3e0f6a82d3d97682, CRACK1____header_global_53e1b9e3bf5b5ab7, CRACK2____header_global_e9bf540467034014, CRACK3____header_global_63a6b7631317a003, CRACK4____header_global_d508f999e2a75e3c, CRACKKNUCKLESWIDE____header_global_e5343e15a4868ddd, CRACKKNUCKLES____header_global_59575dd80e9167fe, CRANEPOLE____header_global_11921e1a75b82d20, CRANE____header_global_c59f4b3f5e091a3e, CROSSHAIR____header_global_f0bade7ea5c4725b, CRYSTALAMMO____header_global_257320a410e99d1f, CYCLER____header_global_9e361d248ba9b860, ClockTicks, DEVISTATORAMMO____header_global_81ef140e4af8dcb5, DEVISTATORSPRITE____header_global_cbde8299850b9be3, DEVISTATOR____header_global_e90270c1afb3d019, DIGITALNUM____header_global_19e2611d2da686ac, DIPSWITCH2____header_global_85ac53055c73eb30, DIPSWITCH3____header_global_89bc9633e0468613, DIPSWITCH____header_global_86be21ba5e8f6b87, DOLPHIN1____header_global_708a8f1a16af835d, DOLPHIN2____header_global_e383f21c759e7228, DOMELITE____header_global_c9e6e0d3c18e3d1d, DOORSHOCK____header_global_56f16927a40d017d, DOORTILE10____header_global_28e4a352d267a663, DOORTILE11____header_global_23d69044e905d010, DOORTILE12____header_global_b46fc8c9b7bef436, DOORTILE14____header_global_c182f7d371b004ed, DOORTILE15____header_global_a147e4caafd2e0f8, DOORTILE16____header_global_f90fc7e5e510dc0f, DOORTILE17____header_global_69490e98ba5cd5c0, DOORTILE18____header_global_3be790a47d0cb185, DOORTILE19____header_global_d6a27ab9c2f6d740, DOORTILE1____header_global_69dfc78ce44f4ec1, DOORTILE20____header_global_c615c7249551ba24, DOORTILE21____header_global_24b53044a8b93cf1, DOORTILE22____header_global_21fc8e03bb3910d1, DOORTILE23____header_global_ae361eff9ebc10e0, DOORTILE2____header_global_ad701c80a2b99f1a, DOORTILE3____header_global_560f7d08b4e67729, DOORTILE4____header_global_578fa0c5764419d5, DOORTILE5____header_global_1570b2e1ac79f415, DOORTILE6____header_global_d8774e6904553603, DOORTILE7____header_global_84a79a1f836a02bb, DOORTILE8____header_global_3bd03360e9e49c2a, DOORTILE9____header_global_a34f0fd4560e4eba, DREALMS____header_global_d7079d4e2c50b9e0, DRONE____header_global_bd4a3b1587008412, DRON_RECOG____header_global_d06b461c180b8157, DUCK____header_global_ea1ceaf8f1e8feaf, DUKECAR____header_global_e8cd82b7bad64aaf, DUKEGUN____header_global_43750f6a52e947a2, DUKELEG____header_global_c1d99ca87830014a, DUKELYINGDEAD____header_global_5838974ed2db99fa, DUKENUKEM____header_global_b4e20a17005ddaf6, DUKETAG____header_global_f1867f4be2f0f0a5, DUKETALKTOBOSS____header_global_6c807735093f815d, DUKETORSO____header_global_f67c7ba46191192f, DUKE_CRACK2____header_global_ca62e2f231276498, DUKE_CRACK_FIRST____header_global_94e0d7fed27f1445, DUKE_CRACK____header_global_7e48f962b789e949, DUKE_DRINKING____header_global_55d34000133c1ef6, DUKE_GASP____header_global_1d6d96cca55f269c, DUKE_GETWEAPON2____header_global_b721ce83920a930e, DUKE_GETWEAPON6____header_global_d2384ba8468fb5bf, DUKE_GET____header_global_df45e725ede79f38, DUKE_GOTHEALTHATLOW____header_global_aecf235a0fb1bc15, DUKE_GRUNT____header_global_36bfc9fc839d55a5, DUKE_HARTBEAT____header_global_b7531de9ee05add0, DUKE_JETPACK_IDLE____header_global_06047831ded88986, DUKE_JETPACK_OFF____header_global_7e3ce7dd3a63a739, DUKE_JETPACK_ON____header_global_a4849c0e481f038d, DUKE_LAND_HURT____header_global_f86b0b47bf9c4fad, DUKE_LAND____header_global_b28b6c4e86300d83, DUKE_LONGTERM_PAIN____header_global_36091a6e5c1d1a12, DUKE_ONWATER____header_global_2f0f1218930e68cb, DUKE_PISSRELIEF____header_global_4294595b5edfc1f7, DUKE_SCREAM____header_global_df8c3028263e28af, DUKE_SEARCH2____header_global_0da75e6cb8650915, DUKE_SEARCH____header_global_bedffc9f70e95f8f, DUKE_TAKEPILLS____header_global_99da3caa724eb272, DUKE_UNDERWATER____header_global_87d080ca8780cdb5, DUKE_URINATE____header_global_8ae104ca605fe8e7, DUKE_USEMEDKIT____header_global_20b4acd1c93c305b, DUKE_WALKINDUCTS____header_global_c723ee2a5c01d289, E32_TILE5736____header_global_118075c724a78a6a, E32_TILE5737____header_global_4c0bd51c530fdd00, E32_TILE5846____header_global_a9e00e8644a60291, E5L7_DUKE_QUIT_YOU____header_global_8dbacb46d512a7b2, EARTHQUAKE____header_global_a12f1ef852ec7f64, EGG____header_global_c1eea801dbd8dbfd, EJECT_CLIP____header_global_5e76c303f89bc7b2, ELEVATOR_OFF____header_global_f05277acfcc8cbf3, ELEVATOR_ON____header_global_a68b45c3ea41377e, ENDALPHANUM____header_global_901983f5590b5978, ENDSEQVOL2SND1____header_global_784c8c070926b2a8, ENDSEQVOL2SND2____header_global_0d432e0eca2b6df9, ENDSEQVOL2SND3____header_global_18aa4e4fbcd65417, ENDSEQVOL2SND4____header_global_43b94f4172dea888, ENDSEQVOL2SND5____header_global_6367886dc7461fe3, ENDSEQVOL2SND6____header_global_f6fe6e8eb2b6269f, ENDSEQVOL2SND7____header_global_09874cf13b023ded, ENDSEQVOL3SND2____header_global_84957eb03201c615, ENDSEQVOL3SND3____header_global_d772ef4bf65c4b61, ENDSEQVOL3SND4____header_global_ce5276f7a88b609b, ENDSEQVOL3SND5____header_global_6887f09db406c567, ENDSEQVOL3SND6____header_global_999a766e355d79ef, ENDSEQVOL3SND7____header_global_c402f7f5ceaf2bb3, ENDSEQVOL3SND8____header_global_7535208233a3b5b5, ENDSEQVOL3SND9____header_global_6b0dc0fd94774297, END_OF_LEVEL_WARN____header_global_b955ed5ce5370b76, EXITMENUSOUND____header_global_404b84028e888bbd, EXPANDERSHOOT____header_global_4e633a79bbce3262, EXPLODINGBARREL2____header_global_2257598e3d9bc2ac, EXPLODINGBARREL____header_global_f1074f07da432250, EXPLOSION2BOT____header_global_de9de4cdd8017c9c, EXPLOSION2____header_global_9e5f3eafdb6db719, F1HELP____header_global_2f6f1f2c7f85d273, FANSHADOWBROKE____header_global_046439a30dc8d6c4, FANSHADOW____header_global_3738b5c43a960ca8, FANSPRITEBROKE____header_global_b729fae8ad384bd6, FANSPRITE____header_global_80248fbc64cca364, FECES____header_global_d993a05aaf6d2d4a, FEM10____header_global_5f8055602e656dcd, FEM1____header_global_586a15e46f491678, FEM2____header_global_f96a3d0810a064ee, FEM3____header_global_95cd62835f108731, FEM4____header_global_535de928a6dd4694, FEM5____header_global_1db0a413cf3d7b1e, FEM6PAD____header_global_e2ceb7b0fddf2827, FEM6____header_global_2560cf88cec57c6f, FEM7____header_global_20c77ce663ca5dd6, FEM8____header_global_be498bc4e87382bc, FEM9____header_global_f6d028594ce4c36f, FEMMAG1____header_global_b2b211ef796a7814, FEMMAG2____header_global_4df23b33570559fd, FEMPIC1____header_global_5b3b0c117f251ad6, FEMPIC2____header_global_77a3a2eb981bd43a, FEMPIC3____header_global_f25b3c2b571e7a2d, FEMPIC4____header_global_895e8809e4a0901c, FEMPIC5____header_global_77194115204c0bc6, FEMPIC6____header_global_3eb5dddd5e44c6a0, FEMPIC7____header_global_440351f573486a25, FETUSBROKE____header_global_df5886e616e21ebf, FETUSJIB____header_global_1d31c8bc79dc9d78, FETUS____header_global_9469ce8314e01b8e, FIRE2____header_global_4b1c864bb3b94f34, FIREBALL____header_global_527647fc7f1c216d, FIREBARREL____header_global_c4d333f731cce9d8, FIREEXT____header_global_34cf93da82529edb, FIREFLYFLYINGEFFECT____header_global_529a084f58e0aa5d, FIREFLYGROWEFFECT____header_global_7d37af6bdbbbfe8b, FIREFLYSHRINKEFFECT____header_global_597327f9ebbd6e25, FIREFLY____header_global_cc80b811f95aa4ad, FIRELASER____header_global_769da0785325a957, FIREVASE____header_global_1a1441459ee86842, FIRE____header_global_498a7d902706eb22, FIRSTAID_ICON____header_global_cbda914490d90081, FIRSTAID____header_global_05ad39f57e9c05a7, FIRSTGUNRELOADWIDE____header_global_b669d62abd9837b5, FIRSTGUNRELOAD____header_global_570ef580fa0b340f, FIRSTGUNSPRITE____header_global_e51f2923b85ddc3a, FIRSTGUN____header_global_378a5ac6e1bf6c35, FIST____header_global_e02b3953fa07402b, FIX16_MAX__header_global_31929c19e6d238b0, FIX16_MIN__header_global_35a35e0afdcf1a40, FIX16_OVERFLOW__header_global_24603dcd93ba1a22, FLAMETHROWERAMMO____header_global_76fe6f43a5399d72, FLAMETHROWERFIRE____header_global_a59bddfc5fcc3ee3, FLAMETHROWERFLAME____header_global_9a4d381597d08f81, FLAMETHROWERPILOT____header_global_0041b673c91b6c47, FLAMETHROWERSPRITE____header_global_b6a3c6e39282cade, FLAMETHROWER_END____header_global_1d64400c790f2ae7, FLAMETHROWER_INTRO____header_global_288ab5400cd99b77, FLAMETHROWER_LOOP____header_global_23097fcb857e2939, FLAMETHROWER____header_global_b1c9244016dd1f55, FLOORFLAME____header_global_16ea566219ae3e82, FLOORPLASMA____header_global_fc68a609b7905d3b, FLOORSLIME____header_global_a309847d1c60ddca, FLUSH_TOILET____header_global_169ec96ffa63e34d, FLY_BY____header_global_879c9f6ecf8ad41f, FOF____header_global_70846ba31e5c1afb, FOODOBJECT16____header_global_d1b4e0c6cfcf7253, FOOTPRINTS2____header_global_ddb35be6cdbf6602, FOOTPRINTS3____header_global_0cd057ce81e5c5a4, FOOTPRINTS4____header_global_87d8e8268db17a78, FOOTPRINTS____header_global_41ffef8968b66e65, FORCERIPPLE____header_global_d771e6ca0be55baf, FORCESPHERE____header_global_06bb176b2a8d880c, FRAGBAR____header_global_1d6834ca72e9203e, FRAMEEFFECT1_13____header_global_a3d4993dabef7c3f, FRAMEEFFECT1____header_global_c59402ea152282fa, FRANKENSTINESWITCH____header_global_863412e5298f5446, FREEZEAMMO____header_global_8d8b13335cd81c5d, FREEZEBLAST____header_global_e684f7b00cacc8bf, FREEZEFIREWIDE____header_global_5923e9dad7985dc0, FREEZESPRITE____header_global_2f0e764f6e25069d, FREEZEWIDE____header_global_900e1da3eb82b1c0, FREEZE____header_global_e9f1a0da5347071f, FUELPOD____header_global_4065deaeac60aef1, GENERICPOLE2____header_global_bbfcaa019e9b8f40, GENERICPOLE____header_global_f3061bedf4df049c, GENERIC_AMBIENCE17____header_global_2d2569fd2567a637, GLASS2____header_global_ccaf4610953e8abc, GLASSPIECES____header_global_49c1ba8978b86f16, GLASS_BREAKING____header_global_88894ca37f1c40fc, GLASS_HEAVYBREAK____header_global_e1cc7ac17e066c75, GLASS____header_global_b7eccedc886ffb2b, GPSPEED____header_global_2ff6c403e77365ae, GRATE1____header_global_3f91c38d8bdfc905, GREENSLIME____header_global_150b465a251a133a, GROWAMMO____header_global_0a7f74c66d692fb5, GROWSPARK____header_global_b9915a8d2a055f36, GROWSPRITEICON____header_global_144a59e7a3892d50, G_CheckIfStateless, G_FindLevelByFile, G_GetForcefieldPicnum__header_8ae53199bfc4, G_GetLogoFlags__header_b4ce13e78add, G_GetTeamPalette__header_9032b7745b64, G_HaveUserMap__header_ba279f927531, G_ResetViewScreenData, G_SetupFilenameBasedMusic, G_SetupLightSwitches, G_SetupRotfixedSprites, HANDHOLDINGACCESS____header_global_e4469ef7ab6bcaa4, HANDHOLDINGLASER____header_global_9794c9d8846304c1, HANDPRINTSWITCH____header_global_e158d131483cce36, HANDREMOTE____header_global_78ddb217127a679d, HANDSWITCH____header_global_f93d1ab618ea3ee8, HANDTHROW____header_global_196a5e113828ba30, HANGLIGHT____header_global_6c2252129dfae2e8, HBOMBAMMO____header_global_43ae0f9da947926d, HEADJIB1____header_global_3feebb1caecd4588, HEALTHBOX____header_global_68796fe0a659d471, HEATSENSOR____header_global_edcfeae3dc2d4eed, HEAT_ICON____header_global_f8d8c3cd4ccae9df, HEAVYHBOMB____header_global_5a4ab7f1f5ff0277, HELECOPT____header_global_2dae6a8b168e7a95, HOLODUKE_ICON____header_global_fc24e34862ad0cdd, HOLODUKE____header_global_c85fc2035b6d7f18, HORSEONSIDE____header_global_480be3c931a49b81, HOTMEAT____header_global_be20182ec1bd32d2, HURTRAIL____header_global_40a3776d76fbc2dc, HYDRENT____header_global_87ed7cd6d909085d, HYDROPLANT____header_global_023136066e2eb0f0, INDY____header_global_4c07dd11d06767f7, INGAMEDUKETHREEDEE____header_global_6b2f508621b7498c, INNERJAW____header_global_3aff4404ad8c8c60, INSERT_CLIP____header_global_29018ee295617277, INTRO4_1____header_global_0389d0542778ba1d, INTRO4_2____header_global_46b285a229163364, INTRO4_3____header_global_9c97c2e4fcea6edd, INTRO4_4____header_global_665d3947d3617679, INTRO4_5____header_global_c41c807b891e5c9f, INTRO4_6____header_global_3da43baf7fdc5111, INTRO4_B____header_global_977bab816236e551, INVENTORYBOX____header_global_1a52cf04e87c5f2c, ITEM_SPLASH____header_global_d477a74290e4b2c9, IVUNIT____header_global_4b1c67b0130b533f, JETPACK_ICON____header_global_3428dca677282a1c, JETPACK____header_global_a3d89485081cdab4, JIBBED_ACTOR5____header_global_a61a5a2dbda76004, JIBBED_ACTOR6____header_global_5abc59ff770ab384, JIBS1____header_global_40b1ae3c9f919725, JIBS2____header_global_942268356aad5d12, JIBS3____header_global_68479ca777f8ee40, JIBS4____header_global_1bf739927f7f8d5c, JIBS5____header_global_6a55d0aa3273c271, JIBS6____header_global_a2570fc7a53602cf, JURYGUY____header_global_f7fc66036904e040, KICK_HIT____header_global_f1886938265ed52a, KILLSICON____header_global_41d64b31c4bf3245, KNEE____header_global_e07e0e7793f27033, LASERLINE____header_global_bf75fb4729a80255, LASERSITE____header_global_ba1591b14add024c, LASERTRIP_ARMING____header_global_cd0a585ce0315f4d, LASERTRIP_EXPLODE____header_global_38f0709cd4de0da1, LASERTRIP_ONWALL____header_global_6642e2fb7344f8b0, LAVAPOOLBUBBLE____header_global_63573b7f55a304b7, LAVAPOOL____header_global_d6daec9085ecca41, LAVASPLASH____header_global_ac17cb1c32b74e7e, LA____header_global_e584b85de1185526, LEGJIB1____header_global_8d4fef0d4ca7f329, LETTER____header_global_70562eb6449bea95, LIGHTNING_SLAP____header_global_b5f21a41b2dd2ccf, LIGHTSWITCH2____header_global_6357212fa205b625, LIGHTSWITCH____header_global_b34f103a26dab3a8, LIZMANARM1____header_global_ba57fd10b065db8f, LIZMANFEEDING____header_global_8ecc99d8ce56e1c3, LIZMANHEAD1____header_global_5e26ba1d7ea0d2a2, LIZMANJUMP____header_global_4cdb62beca173dfe, LIZMANLEG1____header_global_e29879071479d8b4, LIZMANSPITTING____header_global_03715fca07d27cb2, LIZMANSTAYPUT____header_global_521cbf730e301b5f, LIZMAN____header_global_ca39696268727119, LIZTROOPDUCKING____header_global_a9e4f18ef6038dfc, LIZTROOPJETPACK____header_global_8897a488b9064db6, LIZTROOPJUSTSIT____header_global_8c749b8b6225bbb2, LIZTROOPONTOILET____header_global_ec9b832cf632d40c, LIZTROOPRUNNING____header_global_443d2605f7f7962d, LIZTROOPSHOOT____header_global_b1822b18afcd84ce, LIZTROOPSTAYPUT____header_global_304d096bfb35b6e1, LIZTROOP____header_global_c52cabf2d5613557, LOADSCREEN____header_global_77ec193d05c03e5b, LOCATORS____header_global_c8de75f7f52f61ed, LOCKSWITCH1____header_global_3ea45d29d0398635, LOOGIE____header_global_e56d5111c1ad7917, LUKE____header_global_49c3ef88905952a4, MAIL____header_global_153a7df21304f27f, MAN2____header_global_42c179f01954f82e, MAN____header_global_6bb1015bf95e05da, MASKWALL10____header_global_376f1304dcc2dee8, MASKWALL11____header_global_606d62987ccbca0a, MASKWALL12____header_global_5471beb7d2c4b3dc, MASKWALL13____header_global_bdfdfc1284e67a3f, MASKWALL14____header_global_b8184d175f575191, MASKWALL15____header_global_a6cde170f1d1a626, MASKWALL1____header_global_e0f3aff4e1f313a8, MASKWALL2____header_global_9d775ca25c878b84, MASKWALL3____header_global_5da6054989cbea90, MASKWALL4____header_global_c54356181a16c0f8, MASKWALL5____header_global_0254bea1eff03e19, MASKWALL6____header_global_f6ddbcd06c8db9ef, MASKWALL7____header_global_0902cef41124eaa7, MASKWALL8____header_global_a9daf8b3e8308da9, MASKWALL9____header_global_9564a1a266ae462a, MASTERSWITCH____header_global_b44963355e440b23, MENUBAR____header_global_f1da73396f0d4357, MENUSCREEN____header_global_416802853c803415, MIKE____header_global_b14c50f05464fc71, MINIFONT____header_global_7f749e266116a6ba, MIRRORBROKE____header_global_670763f98b48c665, MIRROR____header_global_63964daea0c492e0, MONEY____header_global_7a240e1b01ded0f7, MONITOR_ACTIVE____header_global_a3fa52fe19674b18, MONK____header_global_3cde3f6c38992f60, MOONSKY1____header_global_7d5ae73cce02af0a, MORTER____header_global_765be2d0d86a3132, MOVIECAMERA____header_global_24a0f7ca9b50cd3c, MULTISWITCH____header_global_620d0f91b2899dfa, MUSICANDSFX____header_global_af7f8e97e84e780f, Menu_HaveUserMap__header_21261874c0c9, NAKED1____header_global_b823eabf77b1e82d, NATURALLIGHTNING____header_global_faf6d879f2f8b992, NEON1____header_global_bc324eff11ae6d00, NEON2____header_global_de6d105ec71ae53d, NEON3____header_global_2fee7bc0fa846a13, NEON4____header_global_7b7bba098e63ee7c, NEON5____header_global_0184cd5055f56acb, NEON6____header_global_0755c08ecfd3f0b6, NET_75_CHECK, NEWBEASTSTAYPUT____header_global_49a750f112860e4a, NEWBEAST____header_global_4c03c5adc55c4068, NITEVISION_ONOFF____header_global_f9cb120a9a2bb017, NUKEBARRELDENTED____header_global_12eac8448bb2b128, NUKEBARRELLEAKED____header_global_4a4b432d0500fce3, NUKEBARREL____header_global_8b36a449c9ce0ec1, NUKEBUTTON____header_global_675aed1838ee589b, OCEANSPRITE1____header_global_62d26a24cec2cdd8, OCEANSPRITE2____header_global_d3af2d7b11af24d6, OCEANSPRITE3____header_global_0a7126e2685198e9, OCEANSPRITE4____header_global_8e4372eb23d90c96, OCEANSPRITE5____header_global_1e8f86f80bfe264c, OCTABRAINSTAYPUT____header_global_cf1da6608760a647, OCTABRAIN____header_global_689a6a1af7ed45f8, OCTA_RECOG____header_global_3f406810f620d597, OJ____header_global_f71383e25fae66c2, ONFIRESMOKE____header_global_03d01c16197756d0, ONFIRE____header_global_87e9e190fef5d308, OOZ2____header_global_46a23a03b4d617cc, OOZFILTER____header_global_36aab99e7d1ad4de, OOZ____header_global_b33bf0b8e2290087, ORDERING____header_global_aa6c473fbcce3ff4, ORGANTIC____header_global_db2ae67a6c9e1454, PANNEL1____header_global_5725df7aff024992, PANNEL2____header_global_04cf0289d51bccb2, PANNEL3____header_global_d7a63d406ad430f2, PAPER____header_global_4297e7880f3f8932, PIGCOPDIVE____header_global_cba7285a0b061c90, PIGCOPSTAYPUT____header_global_82c7081954693eaf, PIGCOP____header_global_45f55c8a84570a94, PIG_RECOG____header_global_7f85ea156e18ce86, PIPE1B____header_global_ec7384ebfbd11dd6, PIPE1____header_global_2ec14cc4dd5a7b6c, PIPE2B____header_global_bb09e895f7992f47, PIPE2____header_global_2c4c97ebcf106c63, PIPE3B____header_global_883d4250797f56ce, PIPE3____header_global_760ecc18891d1410, PIPE4B____header_global_7b645029cb7242d9, PIPE4____header_global_9f38335e63410438, PIPE5B____header_global_c8b95b7eb8e85278, PIPE5____header_global_33cd35287a0d60b0, PIPE6B____header_global_74b237681cbc7bbe, PIPE6____header_global_9c66107f76c6b331, PIPEBOMB_BOUNCE____header_global_69edee59278b1e11, PIPEBOMB_EXPLODE____header_global_57370f2349b668cd, PISTOL_BODYHIT____header_global_71cbfccd74ee7cfc, PISTOL_FIRE____header_global_71e7b1f2104c3ed0, PISTOL_RICOCHET____header_global_94da6ae15e88d16b, PLAYERONWATER____header_global_5827aa4380361cfb, PLUG____header_global_9806d187de08239b, PLUTOPAKSPRITE____header_global_a9273f4f09881107, POCKET____header_global_225d2e7163af52a9, PODFEM1____header_global_218188ff8d8520e7, POOLBALLHIT____header_global_0c782bb34abb349f, POT1____header_global_adbcc40ba8889a2f, POT2____header_global_0f99cf3fff73f41f, POT3____header_global_369acfbfb7f0b64b, POWERSWITCH1____header_global_374323185635c763, POWERSWITCH2____header_global_119fafb52517645b, PRED_RECOG____header_global_a552818e7765f1ad, PUKE____header_global_4689847db6372a81, PULLSWITCH____header_global_5bd00b6fec1c4e96, PURPLELAVA____header_global_4b1b01f5876fbf62, P_MoveToRandomSpawnPoint, P_ResetExtents, P_ResetOffsets, P_ResetTintFade, QUEBALL____header_global_39316bcfbfdf8aeb, RADIUSEXPLOSION____header_global_d430b4023deabfe3, RATTY____header_global_55a01d6c4ae44abd, RAT____header_global_08a6874cd8b9adc2, REACTOR2BURNT____header_global_5788a635bd0d0e43, REACTOR2SPARK____header_global_1e827e5ac2bd569e, REACTOR2____header_global_f99f1a2338ad2652, REACTORBURNT____header_global_6b82422bed7d4286, REACTORSPARK____header_global_cadad14591534e2e, REACTOR____header_global_7fd6eab1d3a3554f, RECON____header_global_0377532aa2bc1deb, RECO_ATTACK____header_global_bb13bdf94f43829c, RECO_PAIN____header_global_5fae54e07ec7fe1f, RECO_RECOG____header_global_af0895904511f49c, RECO_ROAM____header_global_39c9ca85872d1460, RESPAWNMARKERGREEN____header_global_234d8b27aa97cdfc, RESPAWNMARKERRED____header_global_8d2aedc0e10e359a, RESPAWNMARKERYELLOW____header_global_187d9fafdc008a5d, RESPAWN____header_global_3adeb6ffd63fe5c7, RIPHEADNECK____header_global_3cb5667b57c594fb, ROTATEGUN____header_global_cb19d98916acab4c, RPGAMMO____header_global_d80e5b211c5a7eff, RPGGUNWIDE____header_global_1542c2901aa8628f, RPGGUN____header_global_6b68179d4c3686cc, RPGSPRITE____header_global_066c410c336420e5, RPG_EXPLODE____header_global_6dc84850631c11ac, RPG_SHOOT____header_global_15c5d2da0ab83355, RPG____header_global_e6ae97f0975c9752, RUBBERCAN____header_global_7de9e9c10066e4e8, SATELITE____header_global_fe7fb8260aabd95e, SCALE____header_global_8d232557646395c8, SCRAP1____header_global_5a8b6df4b3932ce0, SCRAP2____header_global_038e92f21290b7b2, SCRAP3____header_global_663b23b51bbc3495, SCRAP4____header_global_9b46f32b2b68af5f, SCRAP5____header_global_cc2859e1250f1e6b, SCRAP6____header_global_5bca600054d3f3eb, SCREENBREAK10____header_global_158fcaf4a77fa2d8, SCREENBREAK11____header_global_ca1652402b37b66a, SCREENBREAK12____header_global_9a76f5bfddd76f9f, SCREENBREAK13____header_global_754d1e504465ce36, SCREENBREAK14____header_global_41f425dabab44175, SCREENBREAK15____header_global_50239001a9598efc, SCREENBREAK16____header_global_e3343998ff5badc6, SCREENBREAK17____header_global_d464183b1aecbe65, SCREENBREAK18____header_global_bc5559f4d3f753bf, SCREENBREAK19____header_global_6bc53dcd9dade5d4, SCREENBREAK1____header_global_a1a1007b07c8c0cb, SCREENBREAK2____header_global_4b4d8c1ff67cfc0d, SCREENBREAK3____header_global_eab638b9b025a86b, SCREENBREAK4____header_global_240bbb72fdde7018, SCREENBREAK5____header_global_77a6488db7c1ad47, SCREENBREAK6____header_global_3480b05af46c2c21, SCREENBREAK7____header_global_35f54a2cee8ffa47, SCREENBREAK8____header_global_dd7593fe9610dbf7, SCREENBREAK9____header_global_c7da1c7be4447b1d, SCUBAMASK____header_global_8b2c9a671e7b3546, SECTOREFFECTOR____header_global_03a16c280a8abab3, SEENINEDEAD____header_global_fda1fd00cbe1fa23, SEENINE____header_global_055b5db8cd1774b4, SELECTDIR____header_global_869ceac4b372667b, SELECT_WEAPON____header_global_173896b2f5f08b3c, SHARK____header_global_e17aa52659119941, SHELL____header_global_163fedabb21d83ff, SHIELD____header_global_b4865114d7520acd, SHORT_CIRCUIT____header_global_818df68f2b3ae19e, SHOTGUNAMMO____header_global_fbcfc634d34d33fa, SHOTGUNSHELL____header_global_54b356f45c9e129c, SHOTGUNSPRITE____header_global_4f34f54c276001ef, SHOTGUN_COCK____header_global_8df9b45f91583aba, SHOTGUN_FIRE____header_global_5bf1ee263d1e9236, SHOTGUN____header_global_f2ec2c88e43f9962, SHOTSPARK1____header_global_b7baae06d23bcada, SHRINKEREXPLOSION____header_global_2238d10c38c862ec, SHRINKERSPRITE____header_global_7c2ecee5231e301a, SHRINKERWIDE____header_global_2e342725f3b1e9bb, SHRINKER_FIRE____header_global_4a7b7802b3641995, SHRINKER_HIT____header_global_de461022b1999aa9, SHRINKER____header_global_767d453e6bd50378, SHRINKSPARK____header_global_7d09eeb31f12c806, SIDEBOLT1____header_global_f1593b196c32cc3b, SIGN1____header_global_a0094d53367a7104, SIGN2____header_global_17906b1329b50d16, SIXPAK____header_global_515427fb1ff17693, SLIDEBAR____header_global_56370bb551235dda, SLIM_ATTACK____header_global_7e2770a17dd0458a, SLIM_DYING____header_global_44e714a27acb5314, SLIM_RECOG____header_global_ec8b125808a63238, SLIM_ROAM____header_global_a90f6c745fb2f3be, SLOTDOOR____header_global_b745b3d622f2a5ce, SMALLFNTCURSOR____header_global_446b7a8233daad05, SMALLSMOKE____header_global_4cba86cbcb5872ed, SOLARPANNEL____header_global_b4bef1817caac5ab, SOMETHINGFROZE____header_global_b4fc586c38b3496f, SOMETHINGHITFORCE____header_global_2a1e5976ed9c1b44, SOMETHING_DRIPPING____header_global_1d4b680759d2d36b, SPACEDOORSWITCH____header_global_440262ccfa772baa, SPACELIGHTSWITCH____header_global_dfa3c006108f04a8, SPACEMARINE____header_global_a399096608e1bd93, SPEAKER____header_global_749be4727573e998, SPINNINGNUKEICON____header_global_4d9df4dca7093b2c, SPIT____header_global_d4be24365a8ba4be, SPOTLITE____header_global_492c3155524ca15b, SQUISHED____header_global_e8e1e41623c98cdc, STAINGLASS1____header_global_3611614fa85da7b9, STALLBROKE____header_global_43d62576696ada28, STALL____header_global_2a45e2fb451315d5, STARTALPHANUM____header_global_1adbd20003238135, STATIC____header_global_508c1cf74a37a47c, STATUEFLASH____header_global_85a59840fe9adaf0, STATUE____header_global_758131df71b033a5, STEAM____header_global_02b746abdb2aadfc, STEROIDS_ICON____header_global_2ebec0519a5a8428, STEROIDS____header_global_7bfc10f66c37fd77, STRIPEBALL____header_global_8a27693729d9eb6e, SUBWAY____header_global_3920de5cd190349a, SUSHIPLATE1____header_global_f3770638ba91047b, SUSHIPLATE2____header_global_b2389f265dec6f93, SUSHIPLATE3____header_global_8578bf674b6c8117, SUSHIPLATE4____header_global_15818c4be4dd06be, SUSHIPLATE5____header_global_0dc2f53017a82eb3, SWITCH_ON____header_global_9071455f2f662246, TAMPON____header_global_3fe015aabe24f1d9, TANK____header_global_72787e91467c7250, TARGET____header_global_5f7e041852cdc9e8, TECHLIGHT2____header_global_b1a313113592ed6a, TECHLIGHT4____header_global_2e7d1982cb557305, TECHLIGHTBUST2____header_global_b786d3f5960e7542, TECHLIGHTBUST4____header_global_7d30e9d79592cfcd, TECHSWITCH____header_global_3f3b584abebc257f, TELEPORTER____header_global_563a7a5ae7c53c5c, TENSCREEN____header_global_12b11fe79e855d19, TEXTBOX____header_global_4cfc0db8cd82ee2d, TEXTSTORY____header_global_57cd23ae8a187ec8, THREEBYFIVE____header_global_9d4e207d37af692a, THREEDEE____header_global_8712d2ac3e41868d, THUD____header_global_bc7073e70a9fdecb, THUNDER____header_global_9e9f58c64fd3bdb3, TIP____header_global_1045db46b315e187, TIRE____header_global_0ab870bfcb2c3261, TOILETBROKE____header_global_5c05dcf2eb7db05f, TOILETWATER____header_global_24add7a840d056a8, TOILET____header_global_26d4be4f96b56aa6, TONGUE____header_global_094ff9065edd4758, TOUCHPLATE____header_global_78a08cc8400decdd, TOUGHGAL____header_global_bb1c42daffcfb6df, TRANSPORTERBEAM____header_global_d24bd5e8444f1958, TRANSPORTERSTAR____header_global_905125acefc41254, TRASH____header_global_75a084830112022d, TREE1____header_global_2e5f0605903a66b5, TREE2____header_global_a857244bb1a0b364, TRIPBOMBSPRITE____header_global_3f9abf3ea7ea5ea3, TRIPBOMB____header_global_09f4dbd690e68543, TRIPODCAMERA____header_global_494a194411ade905, TURR_RECOG____header_global_8ba4155cfa365807, VACUUM____header_global_3903578dbcae3140, VASE____header_global_46468af195ca635f, VENDMACHINE____header_global_a234ee852d637fce, VENT_BUST____header_global_2f1e2e98743fd2fd, VICTORY1____header_global_d288ee5d3324ff07, VIEWBORDER____header_global_f4e2d547a88f7fe3, VIEWSCREEN2____header_global_bb8eed027c0bff12, VIEWSCREEN____header_global_102ccbec89c3fe0a, VM_HaveEvent__header_321e83e452fc, VOL4ENDSND1____header_global_7697644fd8af8195, VOL4ENDSND2____header_global_645f4317ba88824e, WAITTOBESEATED____header_global_baa19f228c5b5703, WALLBLOOD1____header_global_bffaba3981fca488, WALLBLOOD2____header_global_57249b9c24aa1dad, WALLBLOOD3____header_global_a22cf469a033dae0, WALLBLOOD4____header_global_f3ad8f0479e7f59e, WALLBLOOD5____header_global_69c9206e3fcfe55f, WALLBLOOD7____header_global_25eb78e700b4a895, WALLBLOOD8____header_global_f3d990ceb83e5a6d, WALLLIGHT1____header_global_529444676d3c3a0e, WALLLIGHT2____header_global_c9bff19872f606ae, WALLLIGHT3____header_global_671c3a296c644e8b, WALLLIGHT4____header_global_10a57b16321e3b7a, WALLLIGHTBUST1____header_global_dab0aa5e05b3ecef, WALLLIGHTBUST2____header_global_5b05dafe90090f73, WALLLIGHTBUST3____header_global_e04536a91c30d2a2, WALLLIGHTBUST4____header_global_f05b1536309796a6, WAR_AMBIENCE2____header_global_0406cade4fc51862, WATERBUBBLEMAKER____header_global_fd456fa135b94192, WATERBUBBLE____header_global_3da1f0d4023f6084, WATERDRIPSPLASH____header_global_79bca6e49277858b, WATERDRIP____header_global_65d757a07f9447cf, WATERFOUNTAINBROKE____header_global_982a6f3fa11a2f2c, WATERFOUNTAIN____header_global_517b67936c3a89db, WATERSPLASH2____header_global_51d2190a321d7f4f, WATERTILE2____header_global_ad673590fefbce84, WEATHERWARN____header_global_6ab56803451b944e, WHIPYOURASS____header_global_a128b848d4b9491c, WHISPYSMOKE____header_global_d79cd83f0c54cb9a, WIDESCREENSTATUSBAR____header_global_11ab4aa6855278bc, WIERDSHOT_FLY____header_global_e3dfe0801990bebc, WINDOWBORDER1____header_global_6c72a17f60fd35d2, WINDOWBORDER2____header_global_196339e1d6a46fd2, WIND_AMBIENCE____header_global_acb4005e4b0c805e, WIND_REPEAT____header_global_88e3c043a81fd4dc, WOMAN____header_global_635b66364413ace8, WOODENHORSE____header_global_b1d26eabc3959639, W_FORCEFIELD____header_global_4a223166ae1b8358, W_HITTECHWALL10____header_global_4e18c6c2b6ca5ab6, W_HITTECHWALL15____header_global_e62e28a1ed91e33f, W_HITTECHWALL16____header_global_ed8ea37297a0eae3, W_HITTECHWALL1____header_global_55bfa1904b40e5a4, W_HITTECHWALL2____header_global_eec6474293e9a11d, W_HITTECHWALL3____header_global_1c5c1bbb7de2f169, W_HITTECHWALL4____header_global_013984bed6c0475b, W_MILKSHELFBROKE____header_global_da3327308aabc0b3, W_MILKSHELF____header_global_c33fd562e7bf6cc4, W_NUMBERS____header_global_299c860ab6827aa1, W_SCREENBREAK____header_global_60dc12dbdd061658, W_TECHWALL10____header_global_084a38454c865dfe, W_TECHWALL11____header_global_9b3013a8d4b5a438, W_TECHWALL12____header_global_589cd56062032b01, W_TECHWALL13____header_global_2804087acae63dbc, W_TECHWALL14____header_global_336346e5b767fde7, W_TECHWALL15____header_global_6d0b92abaf81058f, W_TECHWALL16____header_global_bf19baf917875064, W_TECHWALL1____header_global_d1021465709c78b0, W_TECHWALL2____header_global_abc5861e404ca69f, W_TECHWALL3____header_global_984b458a1353e8c9, W_TECHWALL4____header_global_7c66a8fc3ad9cb71, W_TECHWALL5____header_global_ba08470ffdde1095, W_TECHWALL6____header_global_92d13634e8c78e0a, W_TECHWALL7____header_global_180c22cd540442dc, W_TECHWALL8____header_global_c1dccd07637f5d00, W_TECHWALL9____header_global_018e85bb05554a46, XXXSTACY____header_global_dc4667cd3c00d5a4, __cxx_operator_761c63d1e16e183f, append_ext_UNSAFE__header_4882c27490bc, bitmap_set__header_79aaebae34ed, bitmap_set__header_a48cebb6e453, bitmap_test__header_45b8709cd7a8, bitmap_test__header_d869bd17728c, cSnapshotMemUsage__header_global_481b141b134ce1a1, cacheDukeTiles, cacheExtraTextureMaps, cacheFlaggedTiles, cacheTilesForSprite, fix16_deg_to_rad_mult__header_global_447e21be18358bee, fix16_from_int__header_e77ac09a7002, fix16_rad_to_deg_mult__header_global_dfc156bd568bcf3a, fix16_to_int__header_071167bba591, flag_precache, fragbarheight, g_defaultVideoModes__header_global_9ac09c1796286d70, g_keyAsciiTableShift__header_global_17034bc69589494f, g_keyAsciiTable__header_global_b7db3754a17b897a, g_precacheCount, krand__header_07fd4cc4d42f, logapproach__header_8521df926f00, min__template_16d592da45d1e47f, min__template_774131ccff66371d, pow264__header_global_159c8a13266a86f4, pow2char__header_global_33bfb448c11fbddb, pow2long__header_global_4da2c6d34107c4c6, pow2ulong__header_global_49de829ce10699b5, precachehightile, realloc_copy__header_f0673a3a749d, sbartile__header_516caeee4069, scale__header_3edbfbddf0bf, sctokeylut__header_global_a9f3b8039fe6dcfa, tabledivide32__header_d6645e893f65, tabledivide64__header_b1730683865f, tileGetMapping__header_5c2e2e9336d3, tloadtile, videoGetRenderMode__header_6000bd412bd0, xaligned_free__header_97ffab372aa3, xcalloc__header_0bfcd5d006b2, xfree__header_a102e5cc69b6, xrealloc__header_ea69ce67e19f, __cxx_private_cell_fd3490ebfdb15ddb9272b81e, __cxx_private_cell_f19e32d1babf4958017490b9, __cxx_private_cell_42a32d7d2de35b25af9c5c25, __cxx_private_cell_205a0089da357ef0b8c198c5, __cxx_private_cell_d89f614e9e02baf78c1d2801, __cxx_private_cell_3873c20dee556162a4b4f1ae, __cxx_private_cell_4ccff4382bb46745bcb28369, __cxx_private_cell_6f0e2ace9b8b727be0926b34, __cxx_private_cell_150c1e3000f614335e147fdf } from "./_source_legacy_premap_cpp_449b0a8d280f.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { G_FreeMapState } from "./_source_legacy_premap_cpp_d5a53643d288.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { FX_CheckMVErr__header_27c2c5a34cc6, FX_SetErrorCode__header_865055474cdf, FX_SoundActive__header_7103d17c9fb1 } from "./_source_legacy_premap_cpp_535e4f426b51.mjs";
