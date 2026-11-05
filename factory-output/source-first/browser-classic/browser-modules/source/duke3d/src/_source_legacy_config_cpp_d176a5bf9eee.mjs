// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/config.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Bstrtoken } from "../../build/src/compat.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { OSD_Exec } from "../../build/src/osd.cpp.mjs";
import { fwrite } from "../../../browser-abi/libc_provider.mjs";
import { g_setupFileName } from "./global.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_findcase } from "../../build/src/hash.cpp.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memmove } from "../../../browser-abi/libc_provider.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { stat } from "../../../browser-abi/libc_provider.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strcmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strrchr } from "../../../browser-abi/libc_provider.mjs";
import { tempbuf } from "./global.cpp.mjs";
import { tolower } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";

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


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_f961e5f32b04061e = i32(3754936);
function __cxx_static_address_83062d655f187a41a1ff20a7() {
  return __cxx_static_address_83062d655f187a41a1ff20a7.reference || (__cxx_static_address_83062d655f187a41a1ff20a7.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_f961e5f32b04061e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_5adc50230ce3ff70 = i32(1144);
function __cxx_static_address_ce3cd29397cb7c8bc5c8bf6d() {
  return __cxx_static_address_ce3cd29397cb7c8bc5c8bf6d.reference || (__cxx_static_address_ce3cd29397cb7c8bc5c8bf6d.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_5adc50230ce3ff70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_feffbbcb8b8953d3 = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a31142eb779ad0ee0117249() {
  return __cxx_static_address_4a31142eb779ad0ee0117249.reference || (__cxx_static_address_4a31142eb779ad0ee0117249.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_feffbbcb8b8953d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_a5332e40ace6042d = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fa32559f77b7bf1641c256c() {
  return __cxx_static_address_0fa32559f77b7bf1641c256c.reference || (__cxx_static_address_0fa32559f77b7bf1641c256c.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_a5332e40ace6042d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_5913ca98e5fd9aea = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df6807f7af0b187e3ac4e80d() {
  return __cxx_static_address_df6807f7af0b187e3ac4e80d.reference || (__cxx_static_address_df6807f7af0b187e3ac4e80d.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_5913ca98e5fd9aea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_e695f575e6dcc618 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80672540d68f1961417a34f2() {
  return __cxx_static_address_80672540d68f1961417a34f2.reference || (__cxx_static_address_80672540d68f1961417a34f2.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_e695f575e6dcc618; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_1b3d2f92a3274fbf = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8aa24be16d313ceadcb191f() {
  return __cxx_static_address_a8aa24be16d313ceadcb191f.reference || (__cxx_static_address_a8aa24be16d313ceadcb191f.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_1b3d2f92a3274fbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_706e7dc1abdd59a5 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d262c2ccf5f60b605445acb() {
  return __cxx_static_address_8d262c2ccf5f60b605445acb.reference || (__cxx_static_address_8d262c2ccf5f60b605445acb.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_706e7dc1abdd59a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_63f63ac5976ed210 = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18094a1dfb6b80b208f186f2() {
  return __cxx_static_address_18094a1dfb6b80b208f186f2.reference || (__cxx_static_address_18094a1dfb6b80b208f186f2.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_63f63ac5976ed210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_8776033149ff6966 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b02522ce707338b0ab66e323() {
  return __cxx_static_address_b02522ce707338b0ab66e323.reference || (__cxx_static_address_b02522ce707338b0ab66e323.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_8776033149ff6966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_2a9bf126523c6d10 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ebbe6ef741ca4a69e9e8793() {
  return __cxx_static_address_6ebbe6ef741ca4a69e9e8793.reference || (__cxx_static_address_6ebbe6ef741ca4a69e9e8793.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_2a9bf126523c6d10; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_8e219b83a3311120 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91f1c2a022b447c5638754e3() {
  return __cxx_static_address_91f1c2a022b447c5638754e3.reference || (__cxx_static_address_91f1c2a022b447c5638754e3.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_8e219b83a3311120; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_631d400505f47fb1 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b31cb9aa81b02557ac3bff6b() {
  return __cxx_static_address_b31cb9aa81b02557ac3bff6b.reference || (__cxx_static_address_b31cb9aa81b02557ac3bff6b.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_631d400505f47fb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_1ee8eeca20526ed7 = ((u32(((u32(11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9de44dc38253838bf6cc71f() {
  return __cxx_static_address_a9de44dc38253838bf6cc71f.reference || (__cxx_static_address_a9de44dc38253838bf6cc71f.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_1ee8eeca20526ed7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_0c67e01740827650 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_478e4647c4467f4910480ade() {
  return __cxx_static_address_478e4647c4467f4910480ade.reference || (__cxx_static_address_478e4647c4467f4910480ade.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_0c67e01740827650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_ce4e5ce05c7ed85d = ((u32(((u32(14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cd2ec03a43c47db2eac66bf() {
  return __cxx_static_address_5cd2ec03a43c47db2eac66bf.reference || (__cxx_static_address_5cd2ec03a43c47db2eac66bf.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_ce4e5ce05c7ed85d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_558c965d2c539e6b = ((u32(((u32(15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a8bf9f0e5c2dbf3228d337c() {
  return __cxx_static_address_8a8bf9f0e5c2dbf3228d337c.reference || (__cxx_static_address_8a8bf9f0e5c2dbf3228d337c.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_558c965d2c539e6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_7a61bb93e947523b = ((u32(((u32(16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca1ac105c39686947db4e333() {
  return __cxx_static_address_ca1ac105c39686947db4e333.reference || (__cxx_static_address_ca1ac105c39686947db4e333.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_7a61bb93e947523b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_e6d7a7fa004fed40 = ((u32(((u32(17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c2d3a8a4e6fb78cc580b771() {
  return __cxx_static_address_3c2d3a8a4e6fb78cc580b771.reference || (__cxx_static_address_3c2d3a8a4e6fb78cc580b771.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_e6d7a7fa004fed40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_d8570b426d34b6e6 = ((u32(((u32(18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29316dfae893360298566f6a() {
  return __cxx_static_address_29316dfae893360298566f6a.reference || (__cxx_static_address_29316dfae893360298566f6a.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_d8570b426d34b6e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_2bd8225745a2bedf = ((u32(((u32(19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b958493a3fb0fce96ee6662() {
  return __cxx_static_address_2b958493a3fb0fce96ee6662.reference || (__cxx_static_address_2b958493a3fb0fce96ee6662.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_2bd8225745a2bedf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_3de817f61ff3f329 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7dbec391319c613c19805d7() {
  return __cxx_static_address_b7dbec391319c613c19805d7.reference || (__cxx_static_address_b7dbec391319c613c19805d7.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_3de817f61ff3f329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_dadb3271c64d1ba0 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc00816308b18d68dad4ebd4() {
  return __cxx_static_address_dc00816308b18d68dad4ebd4.reference || (__cxx_static_address_dc00816308b18d68dad4ebd4.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_dadb3271c64d1ba0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_32d0f06d4a3afc34 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1584cb9debc85a0939a6ac9c() {
  return __cxx_static_address_1584cb9debc85a0939a6ac9c.reference || (__cxx_static_address_1584cb9debc85a0939a6ac9c.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_32d0f06d4a3afc34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_f8cfa3df5bad80a8 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9dddea38c88cf94ca3486b1b() {
  return __cxx_static_address_9dddea38c88cf94ca3486b1b.reference || (__cxx_static_address_9dddea38c88cf94ca3486b1b.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_f8cfa3df5bad80a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_cde8b69a1077662b = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_510e4e82b92ddcba4571546a() {
  return __cxx_static_address_510e4e82b92ddcba4571546a.reference || (__cxx_static_address_510e4e82b92ddcba4571546a.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_cde8b69a1077662b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_6e5b820163172aaf = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e265f782c7378d910cb70e6() {
  return __cxx_static_address_8e265f782c7378d910cb70e6.reference || (__cxx_static_address_8e265f782c7378d910cb70e6.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_6e5b820163172aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_ebd5fc7e05eccf54 = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4ed71976588c03793261564() {
  return __cxx_static_address_b4ed71976588c03793261564.reference || (__cxx_static_address_b4ed71976588c03793261564.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_ebd5fc7e05eccf54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_eca1a517793c1ffa = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76ec9ad4386d59cdb94f15b1() {
  return __cxx_static_address_76ec9ad4386d59cdb94f15b1.reference || (__cxx_static_address_76ec9ad4386d59cdb94f15b1.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_eca1a517793c1ffa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_30fe4e5318a9f859 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8be6cf0c9b7234b57aa09c08() {
  return __cxx_static_address_8be6cf0c9b7234b57aa09c08.reference || (__cxx_static_address_8be6cf0c9b7234b57aa09c08.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_30fe4e5318a9f859; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_e90382dd3a85f0ff = ((u32(((u32(34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36cb3b109c1428d31fa4a105() {
  return __cxx_static_address_36cb3b109c1428d31fa4a105.reference || (__cxx_static_address_36cb3b109c1428d31fa4a105.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_e90382dd3a85f0ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_8d318761ce2797b9 = ((u32(((u32(35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2bb105134f1b744b14eba30c() {
  return __cxx_static_address_2bb105134f1b744b14eba30c.reference || (__cxx_static_address_2bb105134f1b744b14eba30c.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_8d318761ce2797b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_c505bb4164892661 = ((u32(((u32(36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef6edd9d349b342dcf439782() {
  return __cxx_static_address_ef6edd9d349b342dcf439782.reference || (__cxx_static_address_ef6edd9d349b342dcf439782.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_c505bb4164892661; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_eafc466ee12ecd66 = ((u32(((u32(38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29ae1ea96d3da7130e39a314() {
  return __cxx_static_address_29ae1ea96d3da7130e39a314.reference || (__cxx_static_address_29ae1ea96d3da7130e39a314.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_eafc466ee12ecd66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_4d68d07e44c6cf3d = ((u32(((u32(39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28cf650af8f3678a6abb5ffe() {
  return __cxx_static_address_28cf650af8f3678a6abb5ffe.reference || (__cxx_static_address_28cf650af8f3678a6abb5ffe.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_4d68d07e44c6cf3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_e50b036fe345a217 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b027c6eeef3d7ac9e9532bb() {
  return __cxx_static_address_0b027c6eeef3d7ac9e9532bb.reference || (__cxx_static_address_0b027c6eeef3d7ac9e9532bb.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_e50b036fe345a217; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_8d6aa7f9e32102f8 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1775e2675b6b4b05a7f5e199() {
  return __cxx_static_address_1775e2675b6b4b05a7f5e199.reference || (__cxx_static_address_1775e2675b6b4b05a7f5e199.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_8d6aa7f9e32102f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_224798a035998ebb = ((u32(((u32(43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6398ae60e4f8612ef102ab3e() {
  return __cxx_static_address_6398ae60e4f8612ef102ab3e.reference || (__cxx_static_address_6398ae60e4f8612ef102ab3e.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_224798a035998ebb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_ff1fb5d1550b14b7 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81c4cacf5c1390ef46c7eb8f() {
  return __cxx_static_address_81c4cacf5c1390ef46c7eb8f.reference || (__cxx_static_address_81c4cacf5c1390ef46c7eb8f.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_ff1fb5d1550b14b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_d8c612d679945142 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84585ec708fb41d30c21ca4a() {
  return __cxx_static_address_84585ec708fb41d30c21ca4a.reference || (__cxx_static_address_84585ec708fb41d30c21ca4a.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_d8c612d679945142; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_8bf9655254330450 = ((u32(((u32(50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aee27a292d642c3af1d1329() {
  return __cxx_static_address_3aee27a292d642c3af1d1329.reference || (__cxx_static_address_3aee27a292d642c3af1d1329.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_8bf9655254330450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_7229f31c56cf4034 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_238f6d753a288631c481cf13() {
  return __cxx_static_address_238f6d753a288631c481cf13.reference || (__cxx_static_address_238f6d753a288631c481cf13.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_7229f31c56cf4034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_4798767e6c3ac006 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1504f4b400f5d901188ff36() {
  return __cxx_static_address_d1504f4b400f5d901188ff36.reference || (__cxx_static_address_d1504f4b400f5d901188ff36.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_4798767e6c3ac006; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_d84fed0972e850a4 = ((u32(((u32(69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfa1d58f5d1a632b063e9922() {
  return __cxx_static_address_cfa1d58f5d1a632b063e9922.reference || (__cxx_static_address_cfa1d58f5d1a632b063e9922.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_d84fed0972e850a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_ee0f46619d63efbe = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b940216e610f4008dd6cf50() {
  return __cxx_static_address_4b940216e610f4008dd6cf50.reference || (__cxx_static_address_4b940216e610f4008dd6cf50.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_ee0f46619d63efbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_f61424a7dcee467f = ((u32(((u32(71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5920704da1a7b86eccb21d0d() {
  return __cxx_static_address_5920704da1a7b86eccb21d0d.reference || (__cxx_static_address_5920704da1a7b86eccb21d0d.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_f61424a7dcee467f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_47515ad5727e8fc5 = ((u32(((u32(73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30eaeb5376d060bb9cd69284() {
  return __cxx_static_address_30eaeb5376d060bb9cd69284.reference || (__cxx_static_address_30eaeb5376d060bb9cd69284.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_47515ad5727e8fc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_5932cf8663127fab = ((u32(((u32(75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b01dff04db942ba1b4277897() {
  return __cxx_static_address_b01dff04db942ba1b4277897.reference || (__cxx_static_address_b01dff04db942ba1b4277897.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_5932cf8663127fab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_3320529924d657d6 = ((u32(((u32(76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a48970ee5b508ae4c0937295() {
  return __cxx_static_address_a48970ee5b508ae4c0937295.reference || (__cxx_static_address_a48970ee5b508ae4c0937295.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_3320529924d657d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_8c7a395525b32dcf = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b62ea459cae128169e9d08bc() {
  return __cxx_static_address_b62ea459cae128169e9d08bc.reference || (__cxx_static_address_b62ea459cae128169e9d08bc.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_8c7a395525b32dcf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_c0a8b97184043efe = ((u32(((u32(81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b498c6bbc2ea543a7781c122() {
  return __cxx_static_address_b498c6bbc2ea543a7781c122.reference || (__cxx_static_address_b498c6bbc2ea543a7781c122.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_c0a8b97184043efe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_997b97c37b636d0c = ((u32(((u32(83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b693b6bcfae66717914977b() {
  return __cxx_static_address_9b693b6bcfae66717914977b.reference || (__cxx_static_address_9b693b6bcfae66717914977b.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_997b97c37b636d0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_735e083a57f49447 = ((u32(((u32(91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d782041c988ff204f36ebd5() {
  return __cxx_static_address_0d782041c988ff204f36ebd5.reference || (__cxx_static_address_0d782041c988ff204f36ebd5.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_735e083a57f49447; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_06e6a88f75c1048c = ((u32(((u32(92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4415047b2dde971806f0b1b() {
  return __cxx_static_address_f4415047b2dde971806f0b1b.reference || (__cxx_static_address_f4415047b2dde971806f0b1b.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_06e6a88f75c1048c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_d7ee4637913ce2e7 = ((u32(((u32(97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0686c02228ee31333f7e85e0() {
  return __cxx_static_address_0686c02228ee31333f7e85e0.reference || (__cxx_static_address_0686c02228ee31333f7e85e0.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_d7ee4637913ce2e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_8b22ce15f8eeb8ba = ((u32(((u32(102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5fc60374a75e22a142f5ecca() {
  return __cxx_static_address_5fc60374a75e22a142f5ecca.reference || (__cxx_static_address_5fc60374a75e22a142f5ecca.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_8b22ce15f8eeb8ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_332ad3efab13e192 = ((u32(((u32(107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31068f10535f35dec1b9fe98() {
  return __cxx_static_address_31068f10535f35dec1b9fe98.reference || (__cxx_static_address_31068f10535f35dec1b9fe98.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_332ad3efab13e192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_801d8bc8d04baa84 = ((u32(((u32(109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a04b9ce97c28fe0acbc633e() {
  return __cxx_static_address_3a04b9ce97c28fe0acbc633e.reference || (__cxx_static_address_3a04b9ce97c28fe0acbc633e.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_801d8bc8d04baa84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_c6f3109b80301f6e = ((u32(((u32(111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83732c8936f50ad892c489e7() {
  return __cxx_static_address_83732c8936f50ad892c489e7.reference || (__cxx_static_address_83732c8936f50ad892c489e7.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_c6f3109b80301f6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_8ed42dfe68fae34e = ((u32(((u32(117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afbaa8ee871b513db05f9a07() {
  return __cxx_static_address_afbaa8ee871b513db05f9a07.reference || (__cxx_static_address_afbaa8ee871b513db05f9a07.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_8ed42dfe68fae34e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_5c04a6f380358980 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce1348040aacc1ffc0b3173a() {
  return __cxx_static_address_ce1348040aacc1ffc0b3173a.reference || (__cxx_static_address_ce1348040aacc1ffc0b3173a.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_5c04a6f380358980; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_a003f220e4945def = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2ed34c15fc843652f003669() {
  return __cxx_static_address_e2ed34c15fc843652f003669.reference || (__cxx_static_address_e2ed34c15fc843652f003669.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_a003f220e4945def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_58a1eaee48e94f57 = ((u32(((u32(126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04b51c8379ba61b16d42b8b3() {
  return __cxx_static_address_04b51c8379ba61b16d42b8b3.reference || (__cxx_static_address_04b51c8379ba61b16d42b8b3.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_58a1eaee48e94f57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_f91b775eea8741c5 = ((u32(((u32(127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b177e02a380017a4ba2aebae() {
  return __cxx_static_address_b177e02a380017a4ba2aebae.reference || (__cxx_static_address_b177e02a380017a4ba2aebae.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_f91b775eea8741c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_2c36be666eb97c6b = ((u32(((u32(128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0624908926428371ac892340() {
  return __cxx_static_address_0624908926428371ac892340.reference || (__cxx_static_address_0624908926428371ac892340.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_2c36be666eb97c6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_347478b436ce3c85 = ((u32(((u32(131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08f1170ac2c2f9a0a8b65f3a() {
  return __cxx_static_address_08f1170ac2c2f9a0a8b65f3a.reference || (__cxx_static_address_08f1170ac2c2f9a0a8b65f3a.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_347478b436ce3c85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_229577efd36d2e59 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e65eff93e333b0007fb8c6ef() {
  return __cxx_static_address_e65eff93e333b0007fb8c6ef.reference || (__cxx_static_address_e65eff93e333b0007fb8c6ef.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_229577efd36d2e59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_8bb262ebe0dd8570 = ((u32(((u32(141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf80f5f480e4db77895a4d85() {
  return __cxx_static_address_cf80f5f480e4db77895a4d85.reference || (__cxx_static_address_cf80f5f480e4db77895a4d85.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_8bb262ebe0dd8570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_dbad47c9f4b7b32f = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63529cdb790b0491734cb52d() {
  return __cxx_static_address_63529cdb790b0491734cb52d.reference || (__cxx_static_address_63529cdb790b0491734cb52d.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_dbad47c9f4b7b32f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_3d9c978d4d631614 = ((u32(((u32(149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b43a3e74f97aa2d801e36ef() {
  return __cxx_static_address_4b43a3e74f97aa2d801e36ef.reference || (__cxx_static_address_4b43a3e74f97aa2d801e36ef.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_3d9c978d4d631614; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_c234b10da8e00a0d = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_386414e3460f537b93cadbd7() {
  return __cxx_static_address_386414e3460f537b93cadbd7.reference || (__cxx_static_address_386414e3460f537b93cadbd7.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_c234b10da8e00a0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_4863eaee7c51e7c9 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4fa8712d9a8787f1d4fc41a() {
  return __cxx_static_address_b4fa8712d9a8787f1d4fc41a.reference || (__cxx_static_address_b4fa8712d9a8787f1d4fc41a.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_4863eaee7c51e7c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_ddc86157256217cc = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cde1a235fc025cb9be85196e() {
  return __cxx_static_address_cde1a235fc025cb9be85196e.reference || (__cxx_static_address_cde1a235fc025cb9be85196e.reference = {
    __cReference: true,
    get value() { return THUD____header_global_ddc86157256217cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_51cdd178c93e0fcd = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a16261091e6f12b592ed3f72() {
  return __cxx_static_address_a16261091e6f12b592ed3f72.reference || (__cxx_static_address_a16261091e6f12b592ed3f72.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_51cdd178c93e0fcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_e731b4236c120498 = ((u32(((u32(163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6fae84e73ce0952000bca18() {
  return __cxx_static_address_c6fae84e73ce0952000bca18.reference || (__cxx_static_address_c6fae84e73ce0952000bca18.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_e731b4236c120498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_85b47630f9109236 = ((u32(((u32(169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5021a56e096b30cc7ef98473() {
  return __cxx_static_address_5021a56e096b30cc7ef98473.reference || (__cxx_static_address_5021a56e096b30cc7ef98473.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_85b47630f9109236; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_2d129ea9f0785e4f = ((u32(((u32(177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5098ee28138f325b5e6096fa() {
  return __cxx_static_address_5098ee28138f325b5e6096fa.reference || (__cxx_static_address_5098ee28138f325b5e6096fa.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_2d129ea9f0785e4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_a11a04b0cbfb382e = ((u32(((u32(195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_587cfa9c71da2c6735780aa4() {
  return __cxx_static_address_587cfa9c71da2c6735780aa4.reference || (__cxx_static_address_587cfa9c71da2c6735780aa4.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_a11a04b0cbfb382e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_07abce5a9f7ab2de = ((u32(((u32(196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa9c8d4e8344aae94da940f9() {
  return __cxx_static_address_aa9c8d4e8344aae94da940f9.reference || (__cxx_static_address_aa9c8d4e8344aae94da940f9.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_07abce5a9f7ab2de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_e59f52abe71c06b0 = ((u32(((u32(197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94dc68e24152221e1b5bad19() {
  return __cxx_static_address_94dc68e24152221e1b5bad19.reference || (__cxx_static_address_94dc68e24152221e1b5bad19.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_e59f52abe71c06b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_c89a7ce1429ed9ba = ((u32(((u32(199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cb788567fde3db6ec607eb5() {
  return __cxx_static_address_1cb788567fde3db6ec607eb5.reference || (__cxx_static_address_1cb788567fde3db6ec607eb5.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_c89a7ce1429ed9ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_cc6b591599c7cf50 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74911b80d0cf9c69f924de79() {
  return __cxx_static_address_74911b80d0cf9c69f924de79.reference || (__cxx_static_address_74911b80d0cf9c69f924de79.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_cc6b591599c7cf50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_dc6c02c9e2b37eb5 = ((u32(((u32(207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_187b642a9137f860fcd3347e() {
  return __cxx_static_address_187b642a9137f860fcd3347e.reference || (__cxx_static_address_187b642a9137f860fcd3347e.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_dc6c02c9e2b37eb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_6d7ddd47edbd018b = ((u32(((u32(208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30ce6ba3f654a341f069bf2c() {
  return __cxx_static_address_30ce6ba3f654a341f069bf2c.reference || (__cxx_static_address_30ce6ba3f654a341f069bf2c.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_6d7ddd47edbd018b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_9c94a8d9fbd148fd = ((u32(((u32(209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1c282efaeae5ce22c35a7aa() {
  return __cxx_static_address_e1c282efaeae5ce22c35a7aa.reference || (__cxx_static_address_e1c282efaeae5ce22c35a7aa.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_9c94a8d9fbd148fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_53d38f713fbbb077 = ((u32(((u32(210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_696b518255055e24447d4393() {
  return __cxx_static_address_696b518255055e24447d4393.reference || (__cxx_static_address_696b518255055e24447d4393.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_53d38f713fbbb077; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_c7342ea744b0ceee = ((u32(((u32(211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_752d7adb58d23e570a241f65() {
  return __cxx_static_address_752d7adb58d23e570a241f65.reference || (__cxx_static_address_752d7adb58d23e570a241f65.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_c7342ea744b0ceee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_f320e0144c900234 = ((u32(((u32(212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b0e88d15edb833b242d7d71() {
  return __cxx_static_address_4b0e88d15edb833b242d7d71.reference || (__cxx_static_address_4b0e88d15edb833b242d7d71.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_f320e0144c900234; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_2ba0ea72665246a5 = ((u32(((u32(213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21dd08a0deefc90a85a216dd() {
  return __cxx_static_address_21dd08a0deefc90a85a216dd.reference || (__cxx_static_address_21dd08a0deefc90a85a216dd.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_2ba0ea72665246a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_d67d92d34866239a = ((u32(((u32(215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb4fc6ee258e511c260133f0() {
  return __cxx_static_address_eb4fc6ee258e511c260133f0.reference || (__cxx_static_address_eb4fc6ee258e511c260133f0.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_d67d92d34866239a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_48a95238f58631aa = ((u32(((u32(216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_616b1c3981eaab5836436202() {
  return __cxx_static_address_616b1c3981eaab5836436202.reference || (__cxx_static_address_616b1c3981eaab5836436202.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_48a95238f58631aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_41aaf068865c0a1d = ((u32(((u32(217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c779014859d49f6021731a52() {
  return __cxx_static_address_c779014859d49f6021731a52.reference || (__cxx_static_address_c779014859d49f6021731a52.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_41aaf068865c0a1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_0b7400ed31de7d7b = ((u32(((u32(218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98eaffc5cf7456d2ab6e4971() {
  return __cxx_static_address_98eaffc5cf7456d2ab6e4971.reference || (__cxx_static_address_98eaffc5cf7456d2ab6e4971.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_0b7400ed31de7d7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_60d13a7026bb6dee = ((u32(((u32(219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84f8a99ef003925f3a1ba3a5() {
  return __cxx_static_address_84f8a99ef003925f3a1ba3a5.reference || (__cxx_static_address_84f8a99ef003925f3a1ba3a5.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_60d13a7026bb6dee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_7bc645668fb4720a = ((u32(((u32(226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a8f316b319c52434dc22d12() {
  return __cxx_static_address_9a8f316b319c52434dc22d12.reference || (__cxx_static_address_9a8f316b319c52434dc22d12.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_7bc645668fb4720a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_ed7961ff95aae70e = ((u32(((u32(227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f49d89cdf3c7dcd032bbab3() {
  return __cxx_static_address_1f49d89cdf3c7dcd032bbab3.reference || (__cxx_static_address_1f49d89cdf3c7dcd032bbab3.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_ed7961ff95aae70e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_528d115c5eb757ff = ((u32(((u32(229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bac561a093d6ecfd6b07151f() {
  return __cxx_static_address_bac561a093d6ecfd6b07151f.reference || (__cxx_static_address_bac561a093d6ecfd6b07151f.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_528d115c5eb757ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_049856bd44018f67 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3229053f414a73cb6c8780ee() {
  return __cxx_static_address_3229053f414a73cb6c8780ee.reference || (__cxx_static_address_3229053f414a73cb6c8780ee.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_049856bd44018f67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_e4bf3162341c723c = ((u32(((u32(232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1103326346af137f5347aea9() {
  return __cxx_static_address_1103326346af137f5347aea9.reference || (__cxx_static_address_1103326346af137f5347aea9.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_e4bf3162341c723c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_fbc3c22be5617053 = ((u32(((u32(243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90685124f3dad41b6e027e37() {
  return __cxx_static_address_90685124f3dad41b6e027e37.reference || (__cxx_static_address_90685124f3dad41b6e027e37.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_fbc3c22be5617053; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_c4846daa9b1c0f87 = ((u32(((u32(244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_400a565ecca7efbc519e24d3() {
  return __cxx_static_address_400a565ecca7efbc519e24d3.reference || (__cxx_static_address_400a565ecca7efbc519e24d3.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_c4846daa9b1c0f87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_36bb9777c7b0d68d = ((u32(((u32(245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0d3dab0a3ed8e2f9978b606() {
  return __cxx_static_address_a0d3dab0a3ed8e2f9978b606.reference || (__cxx_static_address_a0d3dab0a3ed8e2f9978b606.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_36bb9777c7b0d68d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_2be1f7c56a3104dc = ((u32(((u32(246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0edff338e2493a8cf124879c() {
  return __cxx_static_address_0edff338e2493a8cf124879c.reference || (__cxx_static_address_0edff338e2493a8cf124879c.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_2be1f7c56a3104dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_df334783f56d1c43 = ((u32(((u32(247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91bc4a660529a9d2ab64b0d0() {
  return __cxx_static_address_91bc4a660529a9d2ab64b0d0.reference || (__cxx_static_address_91bc4a660529a9d2ab64b0d0.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_df334783f56d1c43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_d05be11614a7fa1e = ((u32(((u32(249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ff33fb4d016116b63accdd0() {
  return __cxx_static_address_9ff33fb4d016116b63accdd0.reference || (__cxx_static_address_9ff33fb4d016116b63accdd0.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_d05be11614a7fa1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_8d2e28b22ee0b389 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bee7760909dc686b33f4b9a() {
  return __cxx_static_address_9bee7760909dc686b33f4b9a.reference || (__cxx_static_address_9bee7760909dc686b33f4b9a.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_8d2e28b22ee0b389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_759e9863b6287e39 = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21228e21d08e4b0539ee8a72() {
  return __cxx_static_address_21228e21d08e4b0539ee8a72.reference || (__cxx_static_address_21228e21d08e4b0539ee8a72.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_759e9863b6287e39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_03931e9396bca4cb = ((u32(((u32(284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fa592fc8608d7bc58bb3754() {
  return __cxx_static_address_1fa592fc8608d7bc58bb3754.reference || (__cxx_static_address_1fa592fc8608d7bc58bb3754.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_03931e9396bca4cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_9a70b787415d5a76 = ((u32(((u32(288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_130cd99aaf644193d225a219() {
  return __cxx_static_address_130cd99aaf644193d225a219.reference || (__cxx_static_address_130cd99aaf644193d225a219.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_9a70b787415d5a76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_4789916094ff2c74 = ((u32(((u32(289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9307d1d3f914cf0af45be01c() {
  return __cxx_static_address_9307d1d3f914cf0af45be01c.reference || (__cxx_static_address_9307d1d3f914cf0af45be01c.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_4789916094ff2c74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_684b234d6c9e11a6 = ((u32(((u32(290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5edaac1978a2f17757d33d37() {
  return __cxx_static_address_5edaac1978a2f17757d33d37.reference || (__cxx_static_address_5edaac1978a2f17757d33d37.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_684b234d6c9e11a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_2371d027cdf46fd2 = ((u32(((u32(291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1e2cc1951e8dd621cb0efbc() {
  return __cxx_static_address_f1e2cc1951e8dd621cb0efbc.reference || (__cxx_static_address_f1e2cc1951e8dd621cb0efbc.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_2371d027cdf46fd2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_9bb30723a7a12e95 = ((u32(((u32(292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c727c4f95e93b11c2ff0d42() {
  return __cxx_static_address_9c727c4f95e93b11c2ff0d42.reference || (__cxx_static_address_9c727c4f95e93b11c2ff0d42.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_9bb30723a7a12e95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_cf11d21945f2dfce = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eba20bfb65df2b2d89da347() {
  return __cxx_static_address_9eba20bfb65df2b2d89da347.reference || (__cxx_static_address_9eba20bfb65df2b2d89da347.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_cf11d21945f2dfce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_06c1fe29db74b434 = ((u32(((u32(294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e308d50f708d3f5f778d362e() {
  return __cxx_static_address_e308d50f708d3f5f778d362e.reference || (__cxx_static_address_e308d50f708d3f5f778d362e.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_06c1fe29db74b434; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_e1fcda12188035f5 = ((u32(((u32(295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e8a4fedb7815e4c37fdaed4() {
  return __cxx_static_address_3e8a4fedb7815e4c37fdaed4.reference || (__cxx_static_address_3e8a4fedb7815e4c37fdaed4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_e1fcda12188035f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_bbac9bd1fb43fd6b = ((u32(((u32(296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09a0d65254d7bee7fa49256b() {
  return __cxx_static_address_09a0d65254d7bee7fa49256b.reference || (__cxx_static_address_09a0d65254d7bee7fa49256b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_bbac9bd1fb43fd6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_e78e39ce2e0bb766 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a280887fa2af5fa7f4339cba() {
  return __cxx_static_address_a280887fa2af5fa7f4339cba.reference || (__cxx_static_address_a280887fa2af5fa7f4339cba.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_e78e39ce2e0bb766; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_08984937d2c69eed = ((u32(((u32(298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68d36dda940f7d839dc53b88() {
  return __cxx_static_address_68d36dda940f7d839dc53b88.reference || (__cxx_static_address_68d36dda940f7d839dc53b88.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_08984937d2c69eed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_62103b902c66ba53 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c24c7e9b0c5bb041b060bb7() {
  return __cxx_static_address_5c24c7e9b0c5bb041b060bb7.reference || (__cxx_static_address_5c24c7e9b0c5bb041b060bb7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_62103b902c66ba53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_a442a305ce7a3abd = ((u32(((u32(300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cec7d9f91c9a3af0536e76c0() {
  return __cxx_static_address_cec7d9f91c9a3af0536e76c0.reference || (__cxx_static_address_cec7d9f91c9a3af0536e76c0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_a442a305ce7a3abd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_4506a1eb6f5a8703 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10d10ce968b950deb74c188d() {
  return __cxx_static_address_10d10ce968b950deb74c188d.reference || (__cxx_static_address_10d10ce968b950deb74c188d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_4506a1eb6f5a8703; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_8025de472b22cc7b = ((u32(((u32(303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2eb4c8cc6083459e04e08c9c() {
  return __cxx_static_address_2eb4c8cc6083459e04e08c9c.reference || (__cxx_static_address_2eb4c8cc6083459e04e08c9c.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_8025de472b22cc7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_ad6fa3c138209cb2 = ((u32(((u32(308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4d876fff19134ce345a98a6() {
  return __cxx_static_address_b4d876fff19134ce345a98a6.reference || (__cxx_static_address_b4d876fff19134ce345a98a6.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_ad6fa3c138209cb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_cab9f1f9f012b261 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7a42a626ef2d17ad80ea20() {
  return __cxx_static_address_8f7a42a626ef2d17ad80ea20.reference || (__cxx_static_address_8f7a42a626ef2d17ad80ea20.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_cab9f1f9f012b261; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_58fdb7145b0aefaa = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d55644e5282e87c3ad7b8fb() {
  return __cxx_static_address_5d55644e5282e87c3ad7b8fb.reference || (__cxx_static_address_5d55644e5282e87c3ad7b8fb.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_58fdb7145b0aefaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_aa223fecf99b5e7e = ((u32(((u32(352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03633ddc3b24fa1f6a439f80() {
  return __cxx_static_address_03633ddc3b24fa1f6a439f80.reference || (__cxx_static_address_03633ddc3b24fa1f6a439f80.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_aa223fecf99b5e7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_12251e1e3c459d2c = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42ab4cdced308047e94f0b7e() {
  return __cxx_static_address_42ab4cdced308047e94f0b7e.reference || (__cxx_static_address_42ab4cdced308047e94f0b7e.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_12251e1e3c459d2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_e12a640f3ce9757f = ((u32(((u32(364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a27cd68f8b6abc0579f0af09() {
  return __cxx_static_address_a27cd68f8b6abc0579f0af09.reference || (__cxx_static_address_a27cd68f8b6abc0579f0af09.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_e12a640f3ce9757f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_85775042ee8b94e6 = ((u32(((u32(365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6a969d56718a252a13d833a() {
  return __cxx_static_address_a6a969d56718a252a13d833a.reference || (__cxx_static_address_a6a969d56718a252a13d833a.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_85775042ee8b94e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_734c414dd4d7c6f6 = ((u32(((u32(366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_264db604b743cae7273f4156() {
  return __cxx_static_address_264db604b743cae7273f4156.reference || (__cxx_static_address_264db604b743cae7273f4156.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_734c414dd4d7c6f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_98052a719fbb4c86 = ((u32(((u32(367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d30f22b85cc3755bd50baa58() {
  return __cxx_static_address_d30f22b85cc3755bd50baa58.reference || (__cxx_static_address_d30f22b85cc3755bd50baa58.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_98052a719fbb4c86; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_415f8769ea42c1f9 = ((u32(((u32(368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_047efdbe887e330d7f5ccb65() {
  return __cxx_static_address_047efdbe887e330d7f5ccb65.reference || (__cxx_static_address_047efdbe887e330d7f5ccb65.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_415f8769ea42c1f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_e7f08899d6dea191 = ((u32(((u32(370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db86b96c97a5806829d27ef9() {
  return __cxx_static_address_db86b96c97a5806829d27ef9.reference || (__cxx_static_address_db86b96c97a5806829d27ef9.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_e7f08899d6dea191; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_f4b2705f3346bd01 = ((u32(((u32(371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_418ab63eb04faa53b7485792() {
  return __cxx_static_address_418ab63eb04faa53b7485792.reference || (__cxx_static_address_418ab63eb04faa53b7485792.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_f4b2705f3346bd01; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_ad316fdf6944083b = ((u32(((u32(384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd39defd4a356b68873a690f() {
  return __cxx_static_address_dd39defd4a356b68873a690f.reference || (__cxx_static_address_dd39defd4a356b68873a690f.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_ad316fdf6944083b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_cac4f22b1ffc07a7 = ((u32(((u32(385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c220d73608fcceb9465397fa() {
  return __cxx_static_address_c220d73608fcceb9465397fa.reference || (__cxx_static_address_c220d73608fcceb9465397fa.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_cac4f22b1ffc07a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_57358add150dc69c = ((u32(((u32(388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1072dcf5d3033e8f0dec8adb() {
  return __cxx_static_address_1072dcf5d3033e8f0dec8adb.reference || (__cxx_static_address_1072dcf5d3033e8f0dec8adb.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_57358add150dc69c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_5e8167c436c530e1 = ((u32(((u32(392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33010512aad6d98dac755dbe() {
  return __cxx_static_address_33010512aad6d98dac755dbe.reference || (__cxx_static_address_33010512aad6d98dac755dbe.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_5e8167c436c530e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_7198ddfe0f3d3340 = ((u32(((u32(393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95799b8f40a2b9bff671eb97() {
  return __cxx_static_address_95799b8f40a2b9bff671eb97.reference || (__cxx_static_address_95799b8f40a2b9bff671eb97.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_7198ddfe0f3d3340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_ce3d9a63c5e7cb56 = ((u32(((u32(398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23f921e6e18cb57eae1b176c() {
  return __cxx_static_address_23f921e6e18cb57eae1b176c.reference || (__cxx_static_address_23f921e6e18cb57eae1b176c.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_ce3d9a63c5e7cb56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_3bf1b83f02526049 = ((u32(((u32(399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de2280dc1749f1e7b2560c3() {
  return __cxx_static_address_7de2280dc1749f1e7b2560c3.reference || (__cxx_static_address_7de2280dc1749f1e7b2560c3.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_3bf1b83f02526049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_ee28ec472578bf83 = ((u32(((u32(400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c20e1dfbbeece5d115d0ca34() {
  return __cxx_static_address_c20e1dfbbeece5d115d0ca34.reference || (__cxx_static_address_c20e1dfbbeece5d115d0ca34.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_ee28ec472578bf83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_5e86051cc819273c = ((u32(((u32(401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42f95e438ff787b4e67cb3e6() {
  return __cxx_static_address_42f95e438ff787b4e67cb3e6.reference || (__cxx_static_address_42f95e438ff787b4e67cb3e6.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_5e86051cc819273c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_73b2f5461937b044 = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de39aad47dfe4ac404bf4daf() {
  return __cxx_static_address_de39aad47dfe4ac404bf4daf.reference || (__cxx_static_address_de39aad47dfe4ac404bf4daf.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_73b2f5461937b044; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_9520f2252f12508e = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab4355cca9cfe9623041fe5a() {
  return __cxx_static_address_ab4355cca9cfe9623041fe5a.reference || (__cxx_static_address_ab4355cca9cfe9623041fe5a.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_9520f2252f12508e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_ceaa414052ab1047 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5e0655dc92c31978468c7b5() {
  return __cxx_static_address_e5e0655dc92c31978468c7b5.reference || (__cxx_static_address_e5e0655dc92c31978468c7b5.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_ceaa414052ab1047; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_0f0110099242888c = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aba7a8a7af25ba113787649b() {
  return __cxx_static_address_aba7a8a7af25ba113787649b.reference || (__cxx_static_address_aba7a8a7af25ba113787649b.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_0f0110099242888c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_ce01c7755628afdb = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4929ea092b2209aa9f44181() {
  return __cxx_static_address_a4929ea092b2209aa9f44181.reference || (__cxx_static_address_a4929ea092b2209aa9f44181.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_ce01c7755628afdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_04933b4610d0bede = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac73bf7322522be1f11d28ba() {
  return __cxx_static_address_ac73bf7322522be1f11d28ba.reference || (__cxx_static_address_ac73bf7322522be1f11d28ba.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_04933b4610d0bede; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_05dc2acf06f68857 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c33740189c050058d2a9b6b() {
  return __cxx_static_address_0c33740189c050058d2a9b6b.reference || (__cxx_static_address_0c33740189c050058d2a9b6b.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_05dc2acf06f68857; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_c386e2776d019c8d = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b49b3c5a2068fbb1ab58595() {
  return __cxx_static_address_9b49b3c5a2068fbb1ab58595.reference || (__cxx_static_address_9b49b3c5a2068fbb1ab58595.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_c386e2776d019c8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_edbfd13e4071009b = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9e99778e0a4d2b0dec46f4b() {
  return __cxx_static_address_d9e99778e0a4d2b0dec46f4b.reference || (__cxx_static_address_d9e99778e0a4d2b0dec46f4b.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_edbfd13e4071009b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_32b9bd2cc722e069 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04573b9ec2440f368c7bda02() {
  return __cxx_static_address_04573b9ec2440f368c7bda02.reference || (__cxx_static_address_04573b9ec2440f368c7bda02.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_32b9bd2cc722e069; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_a10c17e5dcc2d9a8 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffc334f93ded20fd15a232b1() {
  return __cxx_static_address_ffc334f93ded20fd15a232b1.reference || (__cxx_static_address_ffc334f93ded20fd15a232b1.reference = {
    __cReference: true,
    get value() { return FOF____header_global_a10c17e5dcc2d9a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_7e1cf30de599e31a = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_929c3bd1d7e545ef576534c0() {
  return __cxx_static_address_929c3bd1d7e545ef576534c0.reference || (__cxx_static_address_929c3bd1d7e545ef576534c0.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_7e1cf30de599e31a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_b32e77b1a1910ddc = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a65d2128821fcb0181bff5d() {
  return __cxx_static_address_1a65d2128821fcb0181bff5d.reference || (__cxx_static_address_1a65d2128821fcb0181bff5d.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_b32e77b1a1910ddc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_73ecbdea9e18d095 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d5b905c3e848c99dad4adf0() {
  return __cxx_static_address_7d5b905c3e848c99dad4adf0.reference || (__cxx_static_address_7d5b905c3e848c99dad4adf0.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_73ecbdea9e18d095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_3f70fd4cbb2762af = ((u32(((u32(23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60f8fb8257855f3495ec7fdb() {
  return __cxx_static_address_60f8fb8257855f3495ec7fdb.reference || (__cxx_static_address_60f8fb8257855f3495ec7fdb.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_3f70fd4cbb2762af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_8cb64516c9ca99a0 = ((u32(((u32(24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52e9e2161672e435ca0107fe() {
  return __cxx_static_address_52e9e2161672e435ca0107fe.reference || (__cxx_static_address_52e9e2161672e435ca0107fe.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_8cb64516c9ca99a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_a1ab59a9a4f1c3dd = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a67c53c7390cb750ffa30b48() {
  return __cxx_static_address_a67c53c7390cb750ffa30b48.reference || (__cxx_static_address_a67c53c7390cb750ffa30b48.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_a1ab59a9a4f1c3dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_b9e0acaf48864e7f = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f96a62cdb135fd721fea9cb() {
  return __cxx_static_address_0f96a62cdb135fd721fea9cb.reference || (__cxx_static_address_0f96a62cdb135fd721fea9cb.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_b9e0acaf48864e7f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_50483e228c11ed5d = ((u32(((u32(27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a164c0d3b5dc1546eea3918b() {
  return __cxx_static_address_a164c0d3b5dc1546eea3918b.reference || (__cxx_static_address_a164c0d3b5dc1546eea3918b.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_50483e228c11ed5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_eb925965befce6b5 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3089b989478ca5b3b7f61d() {
  return __cxx_static_address_0c3089b989478ca5b3b7f61d.reference || (__cxx_static_address_0c3089b989478ca5b3b7f61d.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_eb925965befce6b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_5a334763e6829d4a = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de485af273f07e2b1d2385ae() {
  return __cxx_static_address_de485af273f07e2b1d2385ae.reference || (__cxx_static_address_de485af273f07e2b1d2385ae.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_5a334763e6829d4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_7fa718e1dcfe3409 = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a89967e8469b9384c4e37e8() {
  return __cxx_static_address_9a89967e8469b9384c4e37e8.reference || (__cxx_static_address_9a89967e8469b9384c4e37e8.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_7fa718e1dcfe3409; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_089405a444b84e34 = ((u32(((u32(31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4ea5d385b00a05b811f2cad() {
  return __cxx_static_address_d4ea5d385b00a05b811f2cad.reference || (__cxx_static_address_d4ea5d385b00a05b811f2cad.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_089405a444b84e34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_cc48ed619bef3dc2 = ((u32(((u32(32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef06780c152be70fdde22bde() {
  return __cxx_static_address_ef06780c152be70fdde22bde.reference || (__cxx_static_address_ef06780c152be70fdde22bde.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_cc48ed619bef3dc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_812d9bc2ef6ac198 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec3121a3a5c5e7afb77dcdd9() {
  return __cxx_static_address_ec3121a3a5c5e7afb77dcdd9.reference || (__cxx_static_address_ec3121a3a5c5e7afb77dcdd9.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_812d9bc2ef6ac198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_fd5ac40db9e8baee = ((u32(((u32(37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3209662f9b0c4eaf3d51e8a8() {
  return __cxx_static_address_3209662f9b0c4eaf3d51e8a8.reference || (__cxx_static_address_3209662f9b0c4eaf3d51e8a8.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_fd5ac40db9e8baee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_c81e564876f53479 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98c3e1715cd0c6e77e9cdb3d() {
  return __cxx_static_address_98c3e1715cd0c6e77e9cdb3d.reference || (__cxx_static_address_98c3e1715cd0c6e77e9cdb3d.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_c81e564876f53479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_5a6dc2b950aa51a8 = ((u32(((u32(41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19da302b3be4003f467eae54() {
  return __cxx_static_address_19da302b3be4003f467eae54.reference || (__cxx_static_address_19da302b3be4003f467eae54.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_5a6dc2b950aa51a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_ef0e897023f764b4 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c378db37a66c1e006394f44() {
  return __cxx_static_address_2c378db37a66c1e006394f44.reference || (__cxx_static_address_2c378db37a66c1e006394f44.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_ef0e897023f764b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_820bf6539beefe39 = ((u32(((u32(44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bad07878b226eee693f8a889() {
  return __cxx_static_address_bad07878b226eee693f8a889.reference || (__cxx_static_address_bad07878b226eee693f8a889.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_820bf6539beefe39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_4856be29441459d1 = ((u32(((u32(45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2999c6c4b465102c8c9f6a98() {
  return __cxx_static_address_2999c6c4b465102c8c9f6a98.reference || (__cxx_static_address_2999c6c4b465102c8c9f6a98.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_4856be29441459d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_95c608daad17a324 = ((u32(((u32(46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcbb50de891326135e15fe87() {
  return __cxx_static_address_dcbb50de891326135e15fe87.reference || (__cxx_static_address_dcbb50de891326135e15fe87.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_95c608daad17a324; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_7618448455c339c3 = ((u32(((u32(47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_657af688352ec7686fae26f5() {
  return __cxx_static_address_657af688352ec7686fae26f5.reference || (__cxx_static_address_657af688352ec7686fae26f5.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_7618448455c339c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_ea9d197fb383e4e0 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6150401684bd053c0e3733fb() {
  return __cxx_static_address_6150401684bd053c0e3733fb.reference || (__cxx_static_address_6150401684bd053c0e3733fb.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_ea9d197fb383e4e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_90b7cb4bb98c5a83 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28edef6837a0397c2fb5f4ee() {
  return __cxx_static_address_28edef6837a0397c2fb5f4ee.reference || (__cxx_static_address_28edef6837a0397c2fb5f4ee.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_90b7cb4bb98c5a83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_ddcd694dad54994f = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8153f3a220067165201a9811() {
  return __cxx_static_address_8153f3a220067165201a9811.reference || (__cxx_static_address_8153f3a220067165201a9811.reference = {
    __cReference: true,
    get value() { return COLA____header_global_ddcd694dad54994f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_7314e24eaaa360e7 = ((u32(((u32(52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ddf551b6355754d7924194a() {
  return __cxx_static_address_2ddf551b6355754d7924194a.reference || (__cxx_static_address_2ddf551b6355754d7924194a.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_7314e24eaaa360e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_67f32eed62fac024 = ((u32(((u32(53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a07c7904765dc22a6a80d9eb() {
  return __cxx_static_address_a07c7904765dc22a6a80d9eb.reference || (__cxx_static_address_a07c7904765dc22a6a80d9eb.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_67f32eed62fac024; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_35448d2a46ecfee1 = ((u32(((u32(54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_886e203eb91a33153b8c12d1() {
  return __cxx_static_address_886e203eb91a33153b8c12d1.reference || (__cxx_static_address_886e203eb91a33153b8c12d1.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_35448d2a46ecfee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_612a91c298c5c675 = ((u32(((u32(55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9c27f9ca00c07f354880766() {
  return __cxx_static_address_a9c27f9ca00c07f354880766.reference || (__cxx_static_address_a9c27f9ca00c07f354880766.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_612a91c298c5c675; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_63c574a75574c0e8 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76c1554a1ebcb3de002cc25f() {
  return __cxx_static_address_76c1554a1ebcb3de002cc25f.reference || (__cxx_static_address_76c1554a1ebcb3de002cc25f.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_63c574a75574c0e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_98e4cf72a8fd6f3d = ((u32(((u32(57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3eb5ff9315bab32fc7e068e4() {
  return __cxx_static_address_3eb5ff9315bab32fc7e068e4.reference || (__cxx_static_address_3eb5ff9315bab32fc7e068e4.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_98e4cf72a8fd6f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_074b52a678ad74c2 = ((u32(((u32(59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b345eb82a44eebdfbdea6047() {
  return __cxx_static_address_b345eb82a44eebdfbdea6047.reference || (__cxx_static_address_b345eb82a44eebdfbdea6047.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_074b52a678ad74c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_d7b20b49f795be75 = ((u32(((u32(60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7890309e201ceaee0bfc2b61() {
  return __cxx_static_address_7890309e201ceaee0bfc2b61.reference || (__cxx_static_address_7890309e201ceaee0bfc2b61.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_d7b20b49f795be75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_42e9fcc4555f633d = ((u32(((u32(61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eae703c5750d358507589ac() {
  return __cxx_static_address_4eae703c5750d358507589ac.reference || (__cxx_static_address_4eae703c5750d358507589ac.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_42e9fcc4555f633d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_7cf94112fa038dba = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75be9eb1b4e80427d78ebf14() {
  return __cxx_static_address_75be9eb1b4e80427d78ebf14.reference || (__cxx_static_address_75be9eb1b4e80427d78ebf14.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_7cf94112fa038dba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_fd086e290c63c5b4 = ((u32(((u32(78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_741a679b3d1aab967d9ac137() {
  return __cxx_static_address_741a679b3d1aab967d9ac137.reference || (__cxx_static_address_741a679b3d1aab967d9ac137.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_fd086e290c63c5b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_271046cca06cf0e6 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_888b767c5188b63cd99e14b6() {
  return __cxx_static_address_888b767c5188b63cd99e14b6.reference || (__cxx_static_address_888b767c5188b63cd99e14b6.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_271046cca06cf0e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_7a1f4085aff68da8 = ((u32(((u32(80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11ee3dbf6e81583a91f87d44() {
  return __cxx_static_address_11ee3dbf6e81583a91f87d44.reference || (__cxx_static_address_11ee3dbf6e81583a91f87d44.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_7a1f4085aff68da8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_5e68bdf4eb4c7cac = ((u32(((u32(84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5044e6811d83ba5c48c84b15() {
  return __cxx_static_address_5044e6811d83ba5c48c84b15.reference || (__cxx_static_address_5044e6811d83ba5c48c84b15.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_5e68bdf4eb4c7cac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_4b769cf4bfd7e7ac = ((u32(((u32(89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e53f4ad82b3f12dd9700c6d() {
  return __cxx_static_address_4e53f4ad82b3f12dd9700c6d.reference || (__cxx_static_address_4e53f4ad82b3f12dd9700c6d.reference = {
    __cReference: true,
    get value() { return LA____header_global_4b769cf4bfd7e7ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_b471b7be255a9d36 = ((u32(((u32(100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c27668ae5397f0daaf38b83b() {
  return __cxx_static_address_c27668ae5397f0daaf38b83b.reference || (__cxx_static_address_c27668ae5397f0daaf38b83b.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_b471b7be255a9d36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_41a0d66899846197 = ((u32(((u32(120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_144725056e5ccd601ea57983() {
  return __cxx_static_address_144725056e5ccd601ea57983.reference || (__cxx_static_address_144725056e5ccd601ea57983.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_41a0d66899846197; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_29a2b25ae4de90d4 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f32a77fc784723cfddd179e() {
  return __cxx_static_address_3f32a77fc784723cfddd179e.reference || (__cxx_static_address_3f32a77fc784723cfddd179e.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_29a2b25ae4de90d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_fc06edcee3bc5f03 = ((u32(((u32(122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c09d0d3efacabf7898aecf4() {
  return __cxx_static_address_8c09d0d3efacabf7898aecf4.reference || (__cxx_static_address_8c09d0d3efacabf7898aecf4.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_fc06edcee3bc5f03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_5a2d0f66ae53c41d = ((u32(((u32(123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b83315b5d9da2458feedf58c() {
  return __cxx_static_address_b83315b5d9da2458feedf58c.reference || (__cxx_static_address_b83315b5d9da2458feedf58c.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_5a2d0f66ae53c41d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_057f8ef20c1672dc = ((u32(((u32(124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1857939d20a7220648310cfb() {
  return __cxx_static_address_1857939d20a7220648310cfb.reference || (__cxx_static_address_1857939d20a7220648310cfb.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_057f8ef20c1672dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_f60701ff60583fa4 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10c250a03c8e24a408041b0c() {
  return __cxx_static_address_10c250a03c8e24a408041b0c.reference || (__cxx_static_address_10c250a03c8e24a408041b0c.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_f60701ff60583fa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_95a61eb86dbd394e = ((u32(((u32(130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a37b462b37ba7de2b99da0c4() {
  return __cxx_static_address_a37b462b37ba7de2b99da0c4.reference || (__cxx_static_address_a37b462b37ba7de2b99da0c4.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_95a61eb86dbd394e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_aaf9120e6aa5f827 = ((u32(((u32(132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94de5e07e42d4e111d8ce86b() {
  return __cxx_static_address_94de5e07e42d4e111d8ce86b.reference || (__cxx_static_address_94de5e07e42d4e111d8ce86b.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_aaf9120e6aa5f827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_873b528d8155d14b = ((u32(((u32(134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c9e8b2fe80515a2f56fa6a3() {
  return __cxx_static_address_5c9e8b2fe80515a2f56fa6a3.reference || (__cxx_static_address_5c9e8b2fe80515a2f56fa6a3.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_873b528d8155d14b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_13a96eca040c4150 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f79563c042045b5a9ef1bcee() {
  return __cxx_static_address_f79563c042045b5a9ef1bcee.reference || (__cxx_static_address_f79563c042045b5a9ef1bcee.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_13a96eca040c4150; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_bf5781b41cc75dac = ((u32(((u32(138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8552332bbbcb66d5a976ad8e() {
  return __cxx_static_address_8552332bbbcb66d5a976ad8e.reference || (__cxx_static_address_8552332bbbcb66d5a976ad8e.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_bf5781b41cc75dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_6f47db6a67ca04c8 = ((u32(((u32(140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92dead5497bc4b786e7e5d8e() {
  return __cxx_static_address_92dead5497bc4b786e7e5d8e.reference || (__cxx_static_address_92dead5497bc4b786e7e5d8e.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_6f47db6a67ca04c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_454969683ccf2526 = ((u32(((u32(142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d93d020744279f7d1eb37274() {
  return __cxx_static_address_d93d020744279f7d1eb37274.reference || (__cxx_static_address_d93d020744279f7d1eb37274.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_454969683ccf2526; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_89ae66cf447bb406 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8dd09c9a3bbf5df03cb4bdd() {
  return __cxx_static_address_e8dd09c9a3bbf5df03cb4bdd.reference || (__cxx_static_address_e8dd09c9a3bbf5df03cb4bdd.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_89ae66cf447bb406; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_716db0edc3a57df1 = ((u32(((u32(150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bbbdd223a850ded605f1c32() {
  return __cxx_static_address_7bbbdd223a850ded605f1c32.reference || (__cxx_static_address_7bbbdd223a850ded605f1c32.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_716db0edc3a57df1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_71868510b31dd286 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74b20cbf130a979a138bfaea() {
  return __cxx_static_address_74b20cbf130a979a138bfaea.reference || (__cxx_static_address_74b20cbf130a979a138bfaea.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_71868510b31dd286; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_a0561bffa3633d5b = ((u32(((u32(152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9abc9b90cfb734762b902bc9() {
  return __cxx_static_address_9abc9b90cfb734762b902bc9.reference || (__cxx_static_address_9abc9b90cfb734762b902bc9.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_a0561bffa3633d5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_4f6aa7ca66f6ef3e = ((u32(((u32(153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19445673380fc254dca95eb9() {
  return __cxx_static_address_19445673380fc254dca95eb9.reference || (__cxx_static_address_19445673380fc254dca95eb9.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_4f6aa7ca66f6ef3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_c982f87a0202251d = ((u32(((u32(154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dea6addf42b7abb9f02bf66() {
  return __cxx_static_address_6dea6addf42b7abb9f02bf66.reference || (__cxx_static_address_6dea6addf42b7abb9f02bf66.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_c982f87a0202251d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_38d4f5b563c69e30 = ((u32(((u32(155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db1b78897f91a5ed8bae1f8f() {
  return __cxx_static_address_db1b78897f91a5ed8bae1f8f.reference || (__cxx_static_address_db1b78897f91a5ed8bae1f8f.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_38d4f5b563c69e30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_c1092c7eb278e6cb = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca6db1d3bccb46a8975b616a() {
  return __cxx_static_address_ca6db1d3bccb46a8975b616a.reference || (__cxx_static_address_ca6db1d3bccb46a8975b616a.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_c1092c7eb278e6cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_0669749b99159fe4 = ((u32(((u32(157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7784b191d4bc8f71fcf13a0b() {
  return __cxx_static_address_7784b191d4bc8f71fcf13a0b.reference || (__cxx_static_address_7784b191d4bc8f71fcf13a0b.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_0669749b99159fe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_d8968941afdc132f = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1cfc1179e0b4ad6480811ff() {
  return __cxx_static_address_c1cfc1179e0b4ad6480811ff.reference || (__cxx_static_address_c1cfc1179e0b4ad6480811ff.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_d8968941afdc132f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_4762da8d6d621f72 = ((u32(((u32(159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f56505a082e1933b5322958e() {
  return __cxx_static_address_f56505a082e1933b5322958e.reference || (__cxx_static_address_f56505a082e1933b5322958e.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_4762da8d6d621f72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_7b3fbfb9dfdc3cc4 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9297a60b8d9b2c39a74302af() {
  return __cxx_static_address_9297a60b8d9b2c39a74302af.reference || (__cxx_static_address_9297a60b8d9b2c39a74302af.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_7b3fbfb9dfdc3cc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_6cc56af23e497f37 = ((u32(((u32(162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3a4817d022ce546c660ec8f() {
  return __cxx_static_address_c3a4817d022ce546c660ec8f.reference || (__cxx_static_address_c3a4817d022ce546c660ec8f.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_6cc56af23e497f37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_9c1467a06e9aebe9 = ((u32(((u32(164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29ab3db030ac18f543e6825d() {
  return __cxx_static_address_29ab3db030ac18f543e6825d.reference || (__cxx_static_address_29ab3db030ac18f543e6825d.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_9c1467a06e9aebe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_ee8a4d836f66fda8 = ((u32(((u32(166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbe6930c8dbe5a4ebc386568() {
  return __cxx_static_address_cbe6930c8dbe5a4ebc386568.reference || (__cxx_static_address_cbe6930c8dbe5a4ebc386568.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_ee8a4d836f66fda8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_ffba6ccfb029faa6 = ((u32(((u32(168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00f73a8f157d6562733861dc() {
  return __cxx_static_address_00f73a8f157d6562733861dc.reference || (__cxx_static_address_00f73a8f157d6562733861dc.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_ffba6ccfb029faa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_07876a0b31510794 = ((u32(((u32(170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a18cf03849ccad52479288db() {
  return __cxx_static_address_a18cf03849ccad52479288db.reference || (__cxx_static_address_a18cf03849ccad52479288db.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_07876a0b31510794; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_e09c422dd7589823 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b0d9693501a378060506582() {
  return __cxx_static_address_7b0d9693501a378060506582.reference || (__cxx_static_address_7b0d9693501a378060506582.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_e09c422dd7589823; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_7c9933550e8c8101 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1771836a2fcbc01f56367585() {
  return __cxx_static_address_1771836a2fcbc01f56367585.reference || (__cxx_static_address_1771836a2fcbc01f56367585.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_7c9933550e8c8101; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_ab989ee3b6019067 = ((u32(((u32(255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a88b5085653e143daf5aa117() {
  return __cxx_static_address_a88b5085653e143daf5aa117.reference || (__cxx_static_address_a88b5085653e143daf5aa117.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_ab989ee3b6019067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_eff34419179dc4a3 = ((u32(((u32(263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a637a3c4c01eea755c112916() {
  return __cxx_static_address_a637a3c4c01eea755c112916.reference || (__cxx_static_address_a637a3c4c01eea755c112916.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_eff34419179dc4a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_d4d1724a0fe835d1 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af6f08578e9930a72583b9e7() {
  return __cxx_static_address_af6f08578e9930a72583b9e7.reference || (__cxx_static_address_af6f08578e9930a72583b9e7.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_d4d1724a0fe835d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_cf7c1c9ed1219309 = ((u32(((u32(265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_109510fe43a6ca87c1325458() {
  return __cxx_static_address_109510fe43a6ca87c1325458.reference || (__cxx_static_address_109510fe43a6ca87c1325458.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_cf7c1c9ed1219309; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_12b327dd302709f4 = ((u32(((u32(266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c7e9a585109db86bfb78d60() {
  return __cxx_static_address_9c7e9a585109db86bfb78d60.reference || (__cxx_static_address_9c7e9a585109db86bfb78d60.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_12b327dd302709f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_df21a7acffcf94a0 = ((u32(((u32(267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d43d4a83367af34ea7c1d6a5() {
  return __cxx_static_address_d43d4a83367af34ea7c1d6a5.reference || (__cxx_static_address_d43d4a83367af34ea7c1d6a5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_df21a7acffcf94a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_4286343fa4d4b0a0 = ((u32(((u32(268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ddaf6b8d1c72b70fcd2c4a6() {
  return __cxx_static_address_5ddaf6b8d1c72b70fcd2c4a6.reference || (__cxx_static_address_5ddaf6b8d1c72b70fcd2c4a6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_4286343fa4d4b0a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_e4baadb60dd4f9b6 = ((u32(((u32(269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ff5c04e470d6781a0e3126c() {
  return __cxx_static_address_9ff5c04e470d6781a0e3126c.reference || (__cxx_static_address_9ff5c04e470d6781a0e3126c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_e4baadb60dd4f9b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_0bb5076ab7677a09 = ((u32(((u32(270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_528ceb40c0fc0609238d8a76() {
  return __cxx_static_address_528ceb40c0fc0609238d8a76.reference || (__cxx_static_address_528ceb40c0fc0609238d8a76.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_0bb5076ab7677a09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_e37d1d4a09d23a40 = ((u32(((u32(271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e42a913b95483577bf5dbc4() {
  return __cxx_static_address_9e42a913b95483577bf5dbc4.reference || (__cxx_static_address_9e42a913b95483577bf5dbc4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_e37d1d4a09d23a40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_23ea6e481696ffee = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d4e57190caeeda4bfef2a62() {
  return __cxx_static_address_0d4e57190caeeda4bfef2a62.reference || (__cxx_static_address_0d4e57190caeeda4bfef2a62.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_23ea6e481696ffee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_98e79b7c519bb896 = ((u32(((u32(273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ced8f4f2aacfa83822a9dee4() {
  return __cxx_static_address_ced8f4f2aacfa83822a9dee4.reference || (__cxx_static_address_ced8f4f2aacfa83822a9dee4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_98e79b7c519bb896; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_0ab7d31d8b5123d6 = ((u32(((u32(274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1c70b8adb94809808166e5a() {
  return __cxx_static_address_c1c70b8adb94809808166e5a.reference || (__cxx_static_address_c1c70b8adb94809808166e5a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_0ab7d31d8b5123d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_ea2a22ac8eb7861c = ((u32(((u32(275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a91595d9d6424301dc3d3c89() {
  return __cxx_static_address_a91595d9d6424301dc3d3c89.reference || (__cxx_static_address_a91595d9d6424301dc3d3c89.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_ea2a22ac8eb7861c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_dd35f8a789b6623a = ((u32(((u32(285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68e22295dfccc5667730cbef() {
  return __cxx_static_address_68e22295dfccc5667730cbef.reference || (__cxx_static_address_68e22295dfccc5667730cbef.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_dd35f8a789b6623a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_e172637175254aaf = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea2f37602489d9f4ffe1ae34() {
  return __cxx_static_address_ea2f37602489d9f4ffe1ae34.reference || (__cxx_static_address_ea2f37602489d9f4ffe1ae34.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_e172637175254aaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_af56603251345542 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2a1af03dcf5daba5783e8b2() {
  return __cxx_static_address_e2a1af03dcf5daba5783e8b2.reference || (__cxx_static_address_e2a1af03dcf5daba5783e8b2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_af56603251345542; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_45675ba2de77ea92 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d9911a517d4cbc7ec634b55() {
  return __cxx_static_address_5d9911a517d4cbc7ec634b55.reference || (__cxx_static_address_5d9911a517d4cbc7ec634b55.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_45675ba2de77ea92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_f0df6eec7d20ed5f = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0862ee7727369ec754080769() {
  return __cxx_static_address_0862ee7727369ec754080769.reference || (__cxx_static_address_0862ee7727369ec754080769.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_f0df6eec7d20ed5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_b3fc3b430a1baae3 = ((u32(((u32(305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fbbd1c22456f32721faefe9() {
  return __cxx_static_address_4fbbd1c22456f32721faefe9.reference || (__cxx_static_address_4fbbd1c22456f32721faefe9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_b3fc3b430a1baae3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_1fea6a38277b8061 = ((u32(((u32(306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42e9b5b4e1223ac1005c0b4a() {
  return __cxx_static_address_42e9b5b4e1223ac1005c0b4a.reference || (__cxx_static_address_42e9b5b4e1223ac1005c0b4a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_1fea6a38277b8061; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_303c530946d090dc = ((u32(((u32(307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb6cae0f39485a6efaf52ba6() {
  return __cxx_static_address_bb6cae0f39485a6efaf52ba6.reference || (__cxx_static_address_bb6cae0f39485a6efaf52ba6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_303c530946d090dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_4ecfc8c6208083ca = ((u32(((u32(336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_659b8b5fe6e64d072a1d3d2f() {
  return __cxx_static_address_659b8b5fe6e64d072a1d3d2f.reference || (__cxx_static_address_659b8b5fe6e64d072a1d3d2f.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_4ecfc8c6208083ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_ecb15cf3b94e7fd6 = ((u32(((u32(341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25391e5c3cfa7f15ff882d49() {
  return __cxx_static_address_25391e5c3cfa7f15ff882d49.reference || (__cxx_static_address_25391e5c3cfa7f15ff882d49.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_ecb15cf3b94e7fd6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_5d2a15b54e78ef76 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c22b1da143d4f8aa3b2f51b3() {
  return __cxx_static_address_c22b1da143d4f8aa3b2f51b3.reference || (__cxx_static_address_c22b1da143d4f8aa3b2f51b3.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_5d2a15b54e78ef76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_dc98e34dae7b487a = ((u32(((u32(343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a44a2591abad491cd28c3bb5() {
  return __cxx_static_address_a44a2591abad491cd28c3bb5.reference || (__cxx_static_address_a44a2591abad491cd28c3bb5.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_dc98e34dae7b487a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_382685246ca68e04 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27263544bcafb2c10f20b86b() {
  return __cxx_static_address_27263544bcafb2c10f20b86b.reference || (__cxx_static_address_27263544bcafb2c10f20b86b.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_382685246ca68e04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_a7d608ea35919c27 = ((u32(((u32(357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c30712002a1bf50822a9303d() {
  return __cxx_static_address_c30712002a1bf50822a9303d.reference || (__cxx_static_address_c30712002a1bf50822a9303d.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_a7d608ea35919c27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_c2cdc002e387285a = ((u32(((u32(360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b798039e14846f7cfc8e83d() {
  return __cxx_static_address_6b798039e14846f7cfc8e83d.reference || (__cxx_static_address_6b798039e14846f7cfc8e83d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_c2cdc002e387285a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_82c4048990461665 = ((u32(((u32(361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8ee7d1f7f0ef22846f30a16() {
  return __cxx_static_address_b8ee7d1f7f0ef22846f30a16.reference || (__cxx_static_address_b8ee7d1f7f0ef22846f30a16.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_82c4048990461665; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_cefccb722771f9f7 = ((u32(((u32(362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77d444c2d52554d549e62f61() {
  return __cxx_static_address_77d444c2d52554d549e62f61.reference || (__cxx_static_address_77d444c2d52554d549e62f61.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_cefccb722771f9f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_c326ebf5b1544eba = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cbdd431eec9f9d36a036842() {
  return __cxx_static_address_5cbdd431eec9f9d36a036842.reference || (__cxx_static_address_5cbdd431eec9f9d36a036842.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_c326ebf5b1544eba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_6167473ac91c30c7 = ((u32(((u32(387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c462592c02844a009bb9d25() {
  return __cxx_static_address_5c462592c02844a009bb9d25.reference || (__cxx_static_address_5c462592c02844a009bb9d25.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_6167473ac91c30c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_104f376c820fa224 = ((u32(((u32(391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4a4c86872ea6fb6145223ca() {
  return __cxx_static_address_f4a4c86872ea6fb6145223ca.reference || (__cxx_static_address_f4a4c86872ea6fb6145223ca.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_104f376c820fa224; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_fb140b8384c2886e = ((u32(((u32(395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7e3fe4beaa7dff939cee5e6() {
  return __cxx_static_address_f7e3fe4beaa7dff939cee5e6.reference || (__cxx_static_address_f7e3fe4beaa7dff939cee5e6.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_fb140b8384c2886e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_bed5a304a0e9895b = ((u32(((u32(407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3106cb12ce67dfaffb935f0() {
  return __cxx_static_address_a3106cb12ce67dfaffb935f0.reference || (__cxx_static_address_a3106cb12ce67dfaffb935f0.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_bed5a304a0e9895b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_005b570373c235de = ((u32(((u32(411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70ae491339b69773b1dcf3fa() {
  return __cxx_static_address_70ae491339b69773b1dcf3fa.reference || (__cxx_static_address_70ae491339b69773b1dcf3fa.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_005b570373c235de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_67407a8499f133fb = ((u32(((u32(412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e49f8b5252e8795e4a9fe333() {
  return __cxx_static_address_e49f8b5252e8795e4a9fe333.reference || (__cxx_static_address_e49f8b5252e8795e4a9fe333.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_67407a8499f133fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_af4401363f7e11e4 = ((u32(((u32(416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_623adb21b6971928abc05648() {
  return __cxx_static_address_623adb21b6971928abc05648.reference || (__cxx_static_address_623adb21b6971928abc05648.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_af4401363f7e11e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_88f1e008404f64ba = ((u32(((u32(447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1507e87a74814ddf08060a7() {
  return __cxx_static_address_b1507e87a74814ddf08060a7.reference || (__cxx_static_address_b1507e87a74814ddf08060a7.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_88f1e008404f64ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_900d18fcb55cea79 = ((u32(((u32(448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15daefcabdf8bc556db3eff2() {
  return __cxx_static_address_15daefcabdf8bc556db3eff2.reference || (__cxx_static_address_15daefcabdf8bc556db3eff2.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_900d18fcb55cea79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_bdc93abef95cded1 = ((u32(((u32(449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fb799c383ec638170d00e49() {
  return __cxx_static_address_2fb799c383ec638170d00e49.reference || (__cxx_static_address_2fb799c383ec638170d00e49.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_bdc93abef95cded1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_97dd40268d54d670 = ((u32(((u32(499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8abf27aaf1ee266d4030db2e() {
  return __cxx_static_address_8abf27aaf1ee266d4030db2e.reference || (__cxx_static_address_8abf27aaf1ee266d4030db2e.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_97dd40268d54d670; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_dffe1a6e3e958666 = ((u32(((u32(502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d3bacb76935d3220753e2f8() {
  return __cxx_static_address_3d3bacb76935d3220753e2f8.reference || (__cxx_static_address_3d3bacb76935d3220753e2f8.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_dffe1a6e3e958666; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_90b430a1a154ded9 = ((u32(((u32(503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b1c78d09942fd7e9eeb1ce7() {
  return __cxx_static_address_1b1c78d09942fd7e9eeb1ce7.reference || (__cxx_static_address_1b1c78d09942fd7e9eeb1ce7.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_90b430a1a154ded9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_0a8e4e118d544b2f = ((u32(((u32(504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d45afd7407c57ad274d515c() {
  return __cxx_static_address_8d45afd7407c57ad274d515c.reference || (__cxx_static_address_8d45afd7407c57ad274d515c.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_0a8e4e118d544b2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_fda03fca43ba913a = ((u32(((u32(510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1607d5762d5bd3be624ec93() {
  return __cxx_static_address_c1607d5762d5bd3be624ec93.reference || (__cxx_static_address_c1607d5762d5bd3be624ec93.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_fda03fca43ba913a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_281b9c9512b1e7c3 = ((u32(((u32(514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1636992fc0822a8de58295e1() {
  return __cxx_static_address_1636992fc0822a8de58295e1.reference || (__cxx_static_address_1636992fc0822a8de58295e1.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_281b9c9512b1e7c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_f52c28c4e986938c = ((u32(((u32(516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7140fe4677128a8ddc91eca() {
  return __cxx_static_address_c7140fe4677128a8ddc91eca.reference || (__cxx_static_address_c7140fe4677128a8ddc91eca.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_f52c28c4e986938c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_618261a04b35f190 = ((u32(((u32(517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0df358688719f7d5570de438() {
  return __cxx_static_address_0df358688719f7d5570de438.reference || (__cxx_static_address_0df358688719f7d5570de438.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_618261a04b35f190; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_ebf89281550741f0 = ((u32(((u32(546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6215d305cef648fc09dd0c4() {
  return __cxx_static_address_f6215d305cef648fc09dd0c4.reference || (__cxx_static_address_f6215d305cef648fc09dd0c4.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_ebf89281550741f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_cf180b2f4ccb2b83 = ((u32(((u32(547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77d74eb73cb41978d9140d79() {
  return __cxx_static_address_77d74eb73cb41978d9140d79.reference || (__cxx_static_address_77d74eb73cb41978d9140d79.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_cf180b2f4ccb2b83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_68ce749ad06c98ae = ((u32(((u32(548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29b3e4f9ef9608e36bbeb758() {
  return __cxx_static_address_29b3e4f9ef9608e36bbeb758.reference || (__cxx_static_address_29b3e4f9ef9608e36bbeb758.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_68ce749ad06c98ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_07d10f98bc088a7d = ((u32(((u32(549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5cc6b64c54fcc0ed206b3af() {
  return __cxx_static_address_b5cc6b64c54fcc0ed206b3af.reference || (__cxx_static_address_b5cc6b64c54fcc0ed206b3af.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_07d10f98bc088a7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_f33a18c3817a2132 = ((u32(((u32(550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c4226542a46a50a08dd4024() {
  return __cxx_static_address_2c4226542a46a50a08dd4024.reference || (__cxx_static_address_2c4226542a46a50a08dd4024.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_f33a18c3817a2132; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_15a344c87437a846 = ((u32(((u32(551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d43ffcfb55ea27bea4f44302() {
  return __cxx_static_address_d43ffcfb55ea27bea4f44302.reference || (__cxx_static_address_d43ffcfb55ea27bea4f44302.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_15a344c87437a846; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_e120787db6e6fa05 = ((u32(((u32(554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_053a9f3c1e21ebe932439c51() {
  return __cxx_static_address_053a9f3c1e21ebe932439c51.reference || (__cxx_static_address_053a9f3c1e21ebe932439c51.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_e120787db6e6fa05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_feb68188e5d91958 = ((u32(((u32(556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5892524919ede46b9e2f01a4() {
  return __cxx_static_address_5892524919ede46b9e2f01a4.reference || (__cxx_static_address_5892524919ede46b9e2f01a4.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_feb68188e5d91958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_e2e3a906d88c54f8 = ((u32(((u32(557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad210161746d4563a20b7776() {
  return __cxx_static_address_ad210161746d4563a20b7776.reference || (__cxx_static_address_ad210161746d4563a20b7776.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_e2e3a906d88c54f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_4fe6c097229eeeca = ((u32(((u32(559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_036f5fe1727c667884a1b0ff() {
  return __cxx_static_address_036f5fe1727c667884a1b0ff.reference || (__cxx_static_address_036f5fe1727c667884a1b0ff.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_4fe6c097229eeeca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_20dd5bae0facbf11 = ((u32(((u32(560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62a8bf85fad8805cf8e494fa() {
  return __cxx_static_address_62a8bf85fad8805cf8e494fa.reference || (__cxx_static_address_62a8bf85fad8805cf8e494fa.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_20dd5bae0facbf11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_e20427183a95bf63 = ((u32(((u32(563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_005a142aebad49b927b3c0da() {
  return __cxx_static_address_005a142aebad49b927b3c0da.reference || (__cxx_static_address_005a142aebad49b927b3c0da.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_e20427183a95bf63; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_fd8dd73984480961 = ((u32(((u32(567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fecd2594bb06766f4334f46() {
  return __cxx_static_address_3fecd2594bb06766f4334f46.reference || (__cxx_static_address_3fecd2594bb06766f4334f46.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_fd8dd73984480961; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_4074ef11f5a3d85f = ((u32(((u32(568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b41a72914701381bcd8cd89c() {
  return __cxx_static_address_b41a72914701381bcd8cd89c.reference || (__cxx_static_address_b41a72914701381bcd8cd89c.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_4074ef11f5a3d85f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_95751f89e4fd0949 = ((u32(((u32(569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92198ecfac7de642608fe23b() {
  return __cxx_static_address_92198ecfac7de642608fe23b.reference || (__cxx_static_address_92198ecfac7de642608fe23b.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_95751f89e4fd0949; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_a450a58c3e6f412c = ((u32(((u32(571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e986a8c55ccb88f53686bff() {
  return __cxx_static_address_4e986a8c55ccb88f53686bff.reference || (__cxx_static_address_4e986a8c55ccb88f53686bff.reference = {
    __cReference: true,
    get value() { return STALL____header_global_a450a58c3e6f412c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_df399bf55d02249e = ((u32(((u32(573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e72bf70a7160ab55b545b4ee() {
  return __cxx_static_address_e72bf70a7160ab55b545b4ee.reference || (__cxx_static_address_e72bf70a7160ab55b545b4ee.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_df399bf55d02249e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_04a814536ba04cb8 = ((u32(((u32(577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53420aa661b257232dae9410() {
  return __cxx_static_address_53420aa661b257232dae9410.reference || (__cxx_static_address_53420aa661b257232dae9410.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_04a814536ba04cb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_2bc2835e8a91fdb9 = ((u32(((u32(578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_343e4a0cf34caba7da2d59eb() {
  return __cxx_static_address_343e4a0cf34caba7da2d59eb.reference || (__cxx_static_address_343e4a0cf34caba7da2d59eb.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_2bc2835e8a91fdb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_afc892dba586d97c = ((u32(((u32(579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9b6e38d55f4463ac1762163() {
  return __cxx_static_address_a9b6e38d55f4463ac1762163.reference || (__cxx_static_address_a9b6e38d55f4463ac1762163.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_afc892dba586d97c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_5ec01a13e2bfd33d = ((u32(((u32(580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1df46392e62196d780d4cf90() {
  return __cxx_static_address_1df46392e62196d780d4cf90.reference || (__cxx_static_address_1df46392e62196d780d4cf90.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_5ec01a13e2bfd33d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_86b98e8600832f65 = ((u32(((u32(595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4fb6ecb0008dd0fca8ab834d() {
  return __cxx_static_address_4fb6ecb0008dd0fca8ab834d.reference || (__cxx_static_address_4fb6ecb0008dd0fca8ab834d.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_86b98e8600832f65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_05168a98b8464e17 = ((u32(((u32(596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0efb64e3b30df9c41941ec21() {
  return __cxx_static_address_0efb64e3b30df9c41941ec21.reference || (__cxx_static_address_0efb64e3b30df9c41941ec21.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_05168a98b8464e17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_c176624ef887665e = ((u32(((u32(602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5105483260baa12b1e00dd4a() {
  return __cxx_static_address_5105483260baa12b1e00dd4a.reference || (__cxx_static_address_5105483260baa12b1e00dd4a.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_c176624ef887665e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_74f02ca343bc5d39 = ((u32(((u32(603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cca47bd08c3475dd44cebd8() {
  return __cxx_static_address_5cca47bd08c3475dd44cebd8.reference || (__cxx_static_address_5cca47bd08c3475dd44cebd8.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_74f02ca343bc5d39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_7d66f37e4076d01a = ((u32(((u32(607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_303b8f75ad2380d457c81fee() {
  return __cxx_static_address_303b8f75ad2380d457c81fee.reference || (__cxx_static_address_303b8f75ad2380d457c81fee.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_7d66f37e4076d01a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_76ee8592728a1790 = ((u32(((u32(609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a4aa3138beb3ca58fe70c97() {
  return __cxx_static_address_5a4aa3138beb3ca58fe70c97.reference || (__cxx_static_address_5a4aa3138beb3ca58fe70c97.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_76ee8592728a1790; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_ccc233cab6611eb1 = ((u32(((u32(615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_705a53c87e7c3aaad8f77dc7() {
  return __cxx_static_address_705a53c87e7c3aaad8f77dc7.reference || (__cxx_static_address_705a53c87e7c3aaad8f77dc7.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_ccc233cab6611eb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_f4931c47283b66c9 = ((u32(((u32(616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b743bb8c8e6bff3174e1c12() {
  return __cxx_static_address_4b743bb8c8e6bff3174e1c12.reference || (__cxx_static_address_4b743bb8c8e6bff3174e1c12.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_f4931c47283b66c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_37b28159ac14cf19 = ((u32(((u32(617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd7072b9aed90b5b9348f1ad() {
  return __cxx_static_address_dd7072b9aed90b5b9348f1ad.reference || (__cxx_static_address_dd7072b9aed90b5b9348f1ad.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_37b28159ac14cf19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_39ef0c4644bd7994 = ((u32(((u32(618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b21943b3853455460f3c43f2() {
  return __cxx_static_address_b21943b3853455460f3c43f2.reference || (__cxx_static_address_b21943b3853455460f3c43f2.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_39ef0c4644bd7994; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_e1b82a66158f22fb = ((u32(((u32(619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a6e633eb0097f8f1854b527() {
  return __cxx_static_address_7a6e633eb0097f8f1854b527.reference || (__cxx_static_address_7a6e633eb0097f8f1854b527.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_e1b82a66158f22fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_a2b5d7670f623a68 = ((u32(((u32(621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b7af3648dcbca32496004e0() {
  return __cxx_static_address_7b7af3648dcbca32496004e0.reference || (__cxx_static_address_7b7af3648dcbca32496004e0.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_a2b5d7670f623a68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_d29ba7a9028bc6d5 = ((u32(((u32(633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2830a9f50f9efed0727f0d1() {
  return __cxx_static_address_f2830a9f50f9efed0727f0d1.reference || (__cxx_static_address_f2830a9f50f9efed0727f0d1.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_d29ba7a9028bc6d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_3a717735f02e6383 = ((u32(((u32(634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0386a21291c76462e7a3126() {
  return __cxx_static_address_d0386a21291c76462e7a3126.reference || (__cxx_static_address_d0386a21291c76462e7a3126.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_3a717735f02e6383; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_f8d20b6a0559978b = ((u32(((u32(640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_893d1e4453de3bd734be12c4() {
  return __cxx_static_address_893d1e4453de3bd734be12c4.reference || (__cxx_static_address_893d1e4453de3bd734be12c4.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_f8d20b6a0559978b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_865b39a9b7641a82 = ((u32(((u32(660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1051b5b91b2e1a4bb0d43e64() {
  return __cxx_static_address_1051b5b91b2e1a4bb0d43e64.reference || (__cxx_static_address_1051b5b91b2e1a4bb0d43e64.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_865b39a9b7641a82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_50fa65bba8e7d78c = ((u32(((u32(661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9c24530e353672cd552fa08() {
  return __cxx_static_address_a9c24530e353672cd552fa08.reference || (__cxx_static_address_a9c24530e353672cd552fa08.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_50fa65bba8e7d78c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_abe46292fa453a73 = ((u32(((u32(662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93cfc7aafb512fc5f271fe25() {
  return __cxx_static_address_93cfc7aafb512fc5f271fe25.reference || (__cxx_static_address_93cfc7aafb512fc5f271fe25.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_abe46292fa453a73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_4e441570f1e9f9fd = ((u32(((u32(663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8821e677ab4a7c8f5afe7175() {
  return __cxx_static_address_8821e677ab4a7c8f5afe7175.reference || (__cxx_static_address_8821e677ab4a7c8f5afe7175.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_4e441570f1e9f9fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_19038a94167c59ff = ((u32(((u32(669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4508ab0d3c33ae06efdd51f3() {
  return __cxx_static_address_4508ab0d3c33ae06efdd51f3.reference || (__cxx_static_address_4508ab0d3c33ae06efdd51f3.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_19038a94167c59ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_33b1ef243d1f2245 = ((u32(((u32(672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41a631105fb384a9fa8c8381() {
  return __cxx_static_address_41a631105fb384a9fa8c8381.reference || (__cxx_static_address_41a631105fb384a9fa8c8381.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_33b1ef243d1f2245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_a996cc5fecff8c94 = ((u32(((u32(673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03e0fb859eb0353549268396() {
  return __cxx_static_address_03e0fb859eb0353549268396.reference || (__cxx_static_address_03e0fb859eb0353549268396.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_a996cc5fecff8c94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_8b5bc74041f4b784 = ((u32(((u32(674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdb03139ab5fff428b285953() {
  return __cxx_static_address_bdb03139ab5fff428b285953.reference || (__cxx_static_address_bdb03139ab5fff428b285953.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_8b5bc74041f4b784; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_fc94100aad83959d = ((u32(((u32(675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_333228281c373e3744bcc2ed() {
  return __cxx_static_address_333228281c373e3744bcc2ed.reference || (__cxx_static_address_333228281c373e3744bcc2ed.reference = {
    __cReference: true,
    get value() { return EGG____header_global_fc94100aad83959d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_fe57c16585034a0d = ((u32(((u32(678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d8c30806a8ae3d0a7188e7f() {
  return __cxx_static_address_2d8c30806a8ae3d0a7188e7f.reference || (__cxx_static_address_2d8c30806a8ae3d0a7188e7f.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_fe57c16585034a0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_a65ae3fc665b9a7e = ((u32(((u32(680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cff2c7db2596d079cc47b43() {
  return __cxx_static_address_8cff2c7db2596d079cc47b43.reference || (__cxx_static_address_8cff2c7db2596d079cc47b43.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_a65ae3fc665b9a7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_cf4e072b18239a85 = ((u32(((u32(685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60b417c007bff7c324c16f02() {
  return __cxx_static_address_60b417c007bff7c324c16f02.reference || (__cxx_static_address_60b417c007bff7c324c16f02.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_cf4e072b18239a85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_486e4bb77242eda5 = ((u32(((u32(686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_443a10fefaefe6bc8970a495() {
  return __cxx_static_address_443a10fefaefe6bc8970a495.reference || (__cxx_static_address_443a10fefaefe6bc8970a495.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_486e4bb77242eda5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_8181c71b2796e0fc = ((u32(((u32(689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b55787c8f74b81543fe644e4() {
  return __cxx_static_address_b55787c8f74b81543fe644e4.reference || (__cxx_static_address_b55787c8f74b81543fe644e4.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_8181c71b2796e0fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_b1333ee7ded061e5 = ((u32(((u32(694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50be88356bcf261e81e3a110() {
  return __cxx_static_address_50be88356bcf261e81e3a110.reference || (__cxx_static_address_50be88356bcf261e81e3a110.reference = {
    __cReference: true,
    get value() { return POT1____header_global_b1333ee7ded061e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_eb98e99ddc00fb9e = ((u32(((u32(695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc361031d0cc5dfdd7243c56() {
  return __cxx_static_address_cc361031d0cc5dfdd7243c56.reference || (__cxx_static_address_cc361031d0cc5dfdd7243c56.reference = {
    __cReference: true,
    get value() { return POT2____header_global_eb98e99ddc00fb9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_aafcb5dbb681f724 = ((u32(((u32(697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbc7315569ba59a4b223e876() {
  return __cxx_static_address_dbc7315569ba59a4b223e876.reference || (__cxx_static_address_dbc7315569ba59a4b223e876.reference = {
    __cReference: true,
    get value() { return POT3____header_global_aafcb5dbb681f724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_3ba09a2ffb7ecf4c = ((u32(((u32(700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa04720cabd985d3bba2ee24() {
  return __cxx_static_address_aa04720cabd985d3bba2ee24.reference || (__cxx_static_address_aa04720cabd985d3bba2ee24.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_3ba09a2ffb7ecf4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_b8c362bbc5e91f0d = ((u32(((u32(701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06007bfc80c380b14a55f585() {
  return __cxx_static_address_06007bfc80c380b14a55f585.reference || (__cxx_static_address_06007bfc80c380b14a55f585.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_b8c362bbc5e91f0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_b7dc6f272d578bc5 = ((u32(((u32(702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93f29ea49289f8823612c389() {
  return __cxx_static_address_93f29ea49289f8823612c389.reference || (__cxx_static_address_93f29ea49289f8823612c389.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_b7dc6f272d578bc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_b7c7cc4ae8f116f9 = ((u32(((u32(703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_795fd5d9c3a4f30f94eb5644() {
  return __cxx_static_address_795fd5d9c3a4f30f94eb5644.reference || (__cxx_static_address_795fd5d9c3a4f30f94eb5644.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_b7c7cc4ae8f116f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_ca045860765c465e = ((u32(((u32(704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_003ee36cb1e876b6e666c210() {
  return __cxx_static_address_003ee36cb1e876b6e666c210.reference || (__cxx_static_address_003ee36cb1e876b6e666c210.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_ca045860765c465e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_77827f4d7aa66069 = ((u32(((u32(705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb690c867de621c06c905a56() {
  return __cxx_static_address_fb690c867de621c06c905a56.reference || (__cxx_static_address_fb690c867de621c06c905a56.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_77827f4d7aa66069; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_bed0144607d35bad = ((u32(((u32(706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e50cc0439afd0f345712b41() {
  return __cxx_static_address_2e50cc0439afd0f345712b41.reference || (__cxx_static_address_2e50cc0439afd0f345712b41.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_bed0144607d35bad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_4bd6a59070ca71b1 = ((u32(((u32(712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_241027a9e13a65daa9cbcc23() {
  return __cxx_static_address_241027a9e13a65daa9cbcc23.reference || (__cxx_static_address_241027a9e13a65daa9cbcc23.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_4bd6a59070ca71b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_dc12e580a2017b5e = ((u32(((u32(716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86edef16fb4bd512ee94fbe() {
  return __cxx_static_address_a86edef16fb4bd512ee94fbe.reference || (__cxx_static_address_a86edef16fb4bd512ee94fbe.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_dc12e580a2017b5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_37fb788f742705b7 = ((u32(((u32(717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbcf6782e825297832c8f179() {
  return __cxx_static_address_dbcf6782e825297832c8f179.reference || (__cxx_static_address_dbcf6782e825297832c8f179.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_37fb788f742705b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_ee10481b83498b80 = ((u32(((u32(753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0a50bb314ef9200150314d6() {
  return __cxx_static_address_e0a50bb314ef9200150314d6.reference || (__cxx_static_address_e0a50bb314ef9200150314d6.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_ee10481b83498b80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_92ede52d71504463 = ((u32(((u32(762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a4f0d71fb24193b5b4a296a() {
  return __cxx_static_address_1a4f0d71fb24193b5b4a296a.reference || (__cxx_static_address_1a4f0d71fb24193b5b4a296a.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_92ede52d71504463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_fe60a077f03b0a67 = ((u32(((u32(765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27ce59127ea13d03e84f6dcc() {
  return __cxx_static_address_27ce59127ea13d03e84f6dcc.reference || (__cxx_static_address_27ce59127ea13d03e84f6dcc.reference = {
    __cReference: true,
    get value() { return VASE____header_global_fe60a077f03b0a67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_1f7b196e90a4b86c = ((u32(((u32(768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6945d698e4a9db87a6568e7() {
  return __cxx_static_address_e6945d698e4a9db87a6568e7.reference || (__cxx_static_address_e6945d698e4a9db87a6568e7.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_1f7b196e90a4b86c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_bb6c389b3ac94593 = ((u32(((u32(769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f32e22b6c2387bc8b0d0c096() {
  return __cxx_static_address_f32e22b6c2387bc8b0d0c096.reference || (__cxx_static_address_f32e22b6c2387bc8b0d0c096.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_bb6c389b3ac94593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_1a6b9e1888b61379 = ((u32(((u32(774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a8a339e49723b38883e9f35() {
  return __cxx_static_address_2a8a339e49723b38883e9f35.reference || (__cxx_static_address_2a8a339e49723b38883e9f35.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_1a6b9e1888b61379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_6cbe485f342994fd = ((u32(((u32(779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d87ed6f87e5dbf3a5a9ec41() {
  return __cxx_static_address_7d87ed6f87e5dbf3a5a9ec41.reference || (__cxx_static_address_7d87ed6f87e5dbf3a5a9ec41.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_6cbe485f342994fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_d579a661ea6e7fd8 = ((u32(((u32(781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_363365b07914ff711297cae0() {
  return __cxx_static_address_363365b07914ff711297cae0.reference || (__cxx_static_address_363365b07914ff711297cae0.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_d579a661ea6e7fd8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_beff67a9d3b52e74 = ((u32(((u32(792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecf92735369702dadbabc93f() {
  return __cxx_static_address_ecf92735369702dadbabc93f.reference || (__cxx_static_address_ecf92735369702dadbabc93f.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_beff67a9d3b52e74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_728c8e0d5725ebf6 = ((u32(((u32(806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98f69b7f29c82afc2beb1c6e() {
  return __cxx_static_address_98f69b7f29c82afc2beb1c6e.reference || (__cxx_static_address_98f69b7f29c82afc2beb1c6e.reference = {
    __cReference: true,
    get value() { return OJ____header_global_728c8e0d5725ebf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_d3231c6749e4d570 = ((u32(((u32(830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9da221d118ea09f71350a4b5() {
  return __cxx_static_address_9da221d118ea09f71350a4b5.reference || (__cxx_static_address_9da221d118ea09f71350a4b5.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_d3231c6749e4d570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_efbf210f8dd5e3c6 = ((u32(((u32(859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9f750eedcecfe5a9041dbd5() {
  return __cxx_static_address_b9f750eedcecfe5a9041dbd5.reference || (__cxx_static_address_b9f750eedcecfe5a9041dbd5.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_efbf210f8dd5e3c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_4b5f593639ed08b5 = ((u32(((u32(860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7c45ed29f809babd9a41df5() {
  return __cxx_static_address_b7c45ed29f809babd9a41df5.reference || (__cxx_static_address_b7c45ed29f809babd9a41df5.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_4b5f593639ed08b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_9b49191f283e682b = ((u32(((u32(862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2557d36e5b3a0b0f5a790dd0() {
  return __cxx_static_address_2557d36e5b3a0b0f5a790dd0.reference || (__cxx_static_address_2557d36e5b3a0b0f5a790dd0.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_9b49191f283e682b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_83b8459a1a49ea71 = ((u32(((u32(864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72585d83e075f322e4ba8d58() {
  return __cxx_static_address_72585d83e075f322e4ba8d58.reference || (__cxx_static_address_72585d83e075f322e4ba8d58.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_83b8459a1a49ea71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_a6ad2fab0934fce8 = ((u32(((u32(867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c3789273d3083a734602166() {
  return __cxx_static_address_9c3789273d3083a734602166.reference || (__cxx_static_address_9c3789273d3083a734602166.reference = {
    __cReference: true,
    get value() { return ATM____header_global_a6ad2fab0934fce8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_0c27c639d51127c2 = ((u32(((u32(869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3979935ceeece62baa7e6b41() {
  return __cxx_static_address_3979935ceeece62baa7e6b41.reference || (__cxx_static_address_3979935ceeece62baa7e6b41.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_0c27c639d51127c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_fdac558a4bc68b75 = ((u32(((u32(888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e9a2005430b2f80466ddaf3() {
  return __cxx_static_address_4e9a2005430b2f80466ddaf3.reference || (__cxx_static_address_4e9a2005430b2f80466ddaf3.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_fdac558a4bc68b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_977fc5df8021b8c0 = ((u32(((u32(901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ad5368bd96e721f5d265de3() {
  return __cxx_static_address_5ad5368bd96e721f5d265de3.reference || (__cxx_static_address_5ad5368bd96e721f5d265de3.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_977fc5df8021b8c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_429f5f9efc69262d = ((u32(((u32(902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ba28aca3f109b1f3051364a() {
  return __cxx_static_address_0ba28aca3f109b1f3051364a.reference || (__cxx_static_address_0ba28aca3f109b1f3051364a.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_429f5f9efc69262d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_c5e13d179f08bad9 = ((u32(((u32(903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_486e6cb855dc07316548573f() {
  return __cxx_static_address_486e6cb855dc07316548573f.reference || (__cxx_static_address_486e6cb855dc07316548573f.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_c5e13d179f08bad9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_d60ea0dbc4fa1f13 = ((u32(((u32(904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01076a3613881255d6e595eb() {
  return __cxx_static_address_01076a3613881255d6e595eb.reference || (__cxx_static_address_01076a3613881255d6e595eb.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_d60ea0dbc4fa1f13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_1c1d24589cd16dfc = ((u32(((u32(908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24779f46e5609fef0a0d073c() {
  return __cxx_static_address_24779f46e5609fef0a0d073c.reference || (__cxx_static_address_24779f46e5609fef0a0d073c.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_1c1d24589cd16dfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_ecb07c7b57b6fe84 = ((u32(((u32(910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_193e9714c6b02a56dc6403a5() {
  return __cxx_static_address_193e9714c6b02a56dc6403a5.reference || (__cxx_static_address_193e9714c6b02a56dc6403a5.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_ecb07c7b57b6fe84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_240f8b0f3ee3e2c5 = ((u32(((u32(911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c10ebb25862366778972c02() {
  return __cxx_static_address_8c10ebb25862366778972c02.reference || (__cxx_static_address_8c10ebb25862366778972c02.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_240f8b0f3ee3e2c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_8ce394e1804206fe = ((u32(((u32(913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e07c325e37ffa5f7eef20a89() {
  return __cxx_static_address_e07c325e37ffa5f7eef20a89.reference || (__cxx_static_address_e07c325e37ffa5f7eef20a89.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_8ce394e1804206fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_e8bfbad63442e907 = ((u32(((u32(914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de95658ed8ba6bb7e28e2c4e() {
  return __cxx_static_address_de95658ed8ba6bb7e28e2c4e.reference || (__cxx_static_address_de95658ed8ba6bb7e28e2c4e.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_e8bfbad63442e907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_3c79e6db274d4210 = ((u32(((u32(915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_502aa3815a354f8c2b6a4c70() {
  return __cxx_static_address_502aa3815a354f8c2b6a4c70.reference || (__cxx_static_address_502aa3815a354f8c2b6a4c70.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_3c79e6db274d4210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_e172d55db14bd6c3 = ((u32(((u32(916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c705a0e765105cb1dee483c4() {
  return __cxx_static_address_c705a0e765105cb1dee483c4.reference || (__cxx_static_address_c705a0e765105cb1dee483c4.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_e172d55db14bd6c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_c20e74d3aaf80c94 = ((u32(((u32(921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_429258b827c653ac55a213c8() {
  return __cxx_static_address_429258b827c653ac55a213c8.reference || (__cxx_static_address_429258b827c653ac55a213c8.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_c20e74d3aaf80c94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_c75ce1a88d9e0127 = ((u32(((u32(925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09a8bc449ab22ccef6d09617() {
  return __cxx_static_address_09a8bc449ab22ccef6d09617.reference || (__cxx_static_address_09a8bc449ab22ccef6d09617.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_c75ce1a88d9e0127; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_a1d7671f401b85a2 = ((u32(((u32(926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_366857024cbc82df9c8b1c38() {
  return __cxx_static_address_366857024cbc82df9c8b1c38.reference || (__cxx_static_address_366857024cbc82df9c8b1c38.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_a1d7671f401b85a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_3bb7b0a94b290e9b = ((u32(((u32(939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4eb0b754c8b5624e1e808ba8() {
  return __cxx_static_address_4eb0b754c8b5624e1e808ba8.reference || (__cxx_static_address_4eb0b754c8b5624e1e808ba8.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_3bb7b0a94b290e9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_65ee1ddeb8ae7056 = ((u32(((u32(940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8b37e395392631289d5c07c() {
  return __cxx_static_address_f8b37e395392631289d5c07c.reference || (__cxx_static_address_f8b37e395392631289d5c07c.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_65ee1ddeb8ae7056; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_9cca996d12aec791 = ((u32(((u32(950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16ef104548d27f73d96e91ce() {
  return __cxx_static_address_16ef104548d27f73d96e91ce.reference || (__cxx_static_address_16ef104548d27f73d96e91ce.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_9cca996d12aec791; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_d518cd5beb89019b = ((u32(((u32(951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89e4386070cbb30e0d3501f9() {
  return __cxx_static_address_89e4386070cbb30e0d3501f9.reference || (__cxx_static_address_89e4386070cbb30e0d3501f9.reference = {
    __cReference: true,
    get value() { return BOX____header_global_d518cd5beb89019b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_852982e8743a799a = ((u32(((u32(952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f14210a1f0dfd00c9d60310() {
  return __cxx_static_address_3f14210a1f0dfd00c9d60310.reference || (__cxx_static_address_3f14210a1f0dfd00c9d60310.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_852982e8743a799a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_44ed8d2341a729fb = ((u32(((u32(954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b849c2c5a3eaf7aee389747() {
  return __cxx_static_address_4b849c2c5a3eaf7aee389747.reference || (__cxx_static_address_4b849c2c5a3eaf7aee389747.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_44ed8d2341a729fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_b3dde5ed2f0cfa39 = ((u32(((u32(955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bbcd942120559ef77378996() {
  return __cxx_static_address_4bbcd942120559ef77378996.reference || (__cxx_static_address_4bbcd942120559ef77378996.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_b3dde5ed2f0cfa39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_c95be0651acf63b6 = ((u32(((u32(956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0fb2f6ba00521bc2282661e() {
  return __cxx_static_address_c0fb2f6ba00521bc2282661e.reference || (__cxx_static_address_c0fb2f6ba00521bc2282661e.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_c95be0651acf63b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_62bfa697a4c35304 = ((u32(((u32(957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3661fe74c9ea66fc844690d() {
  return __cxx_static_address_b3661fe74c9ea66fc844690d.reference || (__cxx_static_address_b3661fe74c9ea66fc844690d.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_62bfa697a4c35304; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_74981dd6f9fb386b = ((u32(((u32(963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f6d7317e07125159a3fa690() {
  return __cxx_static_address_4f6d7317e07125159a3fa690.reference || (__cxx_static_address_4f6d7317e07125159a3fa690.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_74981dd6f9fb386b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_3078d194575ecf47 = ((u32(((u32(964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_926062a700f058453f0cecb4() {
  return __cxx_static_address_926062a700f058453f0cecb4.reference || (__cxx_static_address_926062a700f058453f0cecb4.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_3078d194575ecf47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_d3ed46cf35ab4c60 = ((u32(((u32(965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cf45e19865cd2465b757660() {
  return __cxx_static_address_2cf45e19865cd2465b757660.reference || (__cxx_static_address_2cf45e19865cd2465b757660.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_d3ed46cf35ab4c60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_7df297ef5fca528a = ((u32(((u32(969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ab6511b31bd32d7ec16dfd7() {
  return __cxx_static_address_6ab6511b31bd32d7ec16dfd7.reference || (__cxx_static_address_6ab6511b31bd32d7ec16dfd7.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_7df297ef5fca528a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_ea99d0cc28aa31c3 = ((u32(((u32(971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f9c6c55177d5fd7fe447af6() {
  return __cxx_static_address_6f9c6c55177d5fd7fe447af6.reference || (__cxx_static_address_6f9c6c55177d5fd7fe447af6.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_ea99d0cc28aa31c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_812af76bfbd8c52a = ((u32(((u32(972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e663ae4b072dd32f036149d() {
  return __cxx_static_address_2e663ae4b072dd32f036149d.reference || (__cxx_static_address_2e663ae4b072dd32f036149d.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_812af76bfbd8c52a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_1444ba862a49b6ee = ((u32(((u32(973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5cf4a0e59d952f4fb3629303() {
  return __cxx_static_address_5cf4a0e59d952f4fb3629303.reference || (__cxx_static_address_5cf4a0e59d952f4fb3629303.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_1444ba862a49b6ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_797b67ab204c0b06 = ((u32(((u32(974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5560a6213312dd8675455954() {
  return __cxx_static_address_5560a6213312dd8675455954.reference || (__cxx_static_address_5560a6213312dd8675455954.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_797b67ab204c0b06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_32370ca3baf2736d = ((u32(((u32(975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c861e6f70db6e8aa58535b42() {
  return __cxx_static_address_c861e6f70db6e8aa58535b42.reference || (__cxx_static_address_c861e6f70db6e8aa58535b42.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_32370ca3baf2736d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_2bc8804cd84bad7a = ((u32(((u32(977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20149a922f8c6a54bcb2b4ba() {
  return __cxx_static_address_20149a922f8c6a54bcb2b4ba.reference || (__cxx_static_address_20149a922f8c6a54bcb2b4ba.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_2bc8804cd84bad7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_eb25ecf6be194293 = ((u32(((u32(978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1603231b7a6cd12215ce78a5() {
  return __cxx_static_address_1603231b7a6cd12215ce78a5.reference || (__cxx_static_address_1603231b7a6cd12215ce78a5.reference = {
    __cReference: true,
    get value() { return CONE____header_global_eb25ecf6be194293; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_94ed8d800e826521 = ((u32(((u32(979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d202104d7fe623015188177() {
  return __cxx_static_address_2d202104d7fe623015188177.reference || (__cxx_static_address_2d202104d7fe623015188177.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_94ed8d800e826521; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_8ccf48df87f250f1 = ((u32(((u32(981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe5a4fa6bb771ff36ea69eea() {
  return __cxx_static_address_fe5a4fa6bb771ff36ea69eea.reference || (__cxx_static_address_fe5a4fa6bb771ff36ea69eea.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_8ccf48df87f250f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_c1abd70eb5937a35 = ((u32(((u32(988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_944cffa510e20e2e77be9f9c() {
  return __cxx_static_address_944cffa510e20e2e77be9f9c.reference || (__cxx_static_address_944cffa510e20e2e77be9f9c.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_c1abd70eb5937a35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_f3461690474dbcc7 = ((u32(((u32(990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a190ffe873be7b841549a19d() {
  return __cxx_static_address_a190ffe873be7b841549a19d.reference || (__cxx_static_address_a190ffe873be7b841549a19d.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_f3461690474dbcc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_09b39f3fb82b91c9 = ((u32(((u32(994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a03bd36f81df676d2cf85466() {
  return __cxx_static_address_a03bd36f81df676d2cf85466.reference || (__cxx_static_address_a03bd36f81df676d2cf85466.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_09b39f3fb82b91c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_6e69f30ac3604577 = ((u32(((u32(995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3d43f1d7aa846c51b2951d23() {
  return __cxx_static_address_3d43f1d7aa846c51b2951d23.reference || (__cxx_static_address_3d43f1d7aa846c51b2951d23.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_6e69f30ac3604577; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_218239de7acd5d49 = ((u32(((u32(996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95ada0107596e20d40c4dfc2() {
  return __cxx_static_address_95ada0107596e20d40c4dfc2.reference || (__cxx_static_address_95ada0107596e20d40c4dfc2.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_218239de7acd5d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_16ff583e5f3dafe9 = ((u32(((u32(997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40f2a267df8ac907e01a5f21() {
  return __cxx_static_address_40f2a267df8ac907e01a5f21.reference || (__cxx_static_address_40f2a267df8ac907e01a5f21.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_16ff583e5f3dafe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_562bff2ee0244b8b = ((u32(((u32(1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b30aa9b65f308deb98cff2f() {
  return __cxx_static_address_1b30aa9b65f308deb98cff2f.reference || (__cxx_static_address_1b30aa9b65f308deb98cff2f.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_562bff2ee0244b8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_4602b3b75eb89fca = ((u32(((u32(1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b91d7448bdf2fab5f98ac1c2() {
  return __cxx_static_address_b91d7448bdf2fab5f98ac1c2.reference || (__cxx_static_address_b91d7448bdf2fab5f98ac1c2.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_4602b3b75eb89fca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_c01684729c27779f = ((u32(((u32(1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d079430594bb81cfa1a0e260() {
  return __cxx_static_address_d079430594bb81cfa1a0e260.reference || (__cxx_static_address_d079430594bb81cfa1a0e260.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_c01684729c27779f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_6e61feaf7bee0c6e = ((u32(((u32(1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_341d61298c37a8b80e6a7bb8() {
  return __cxx_static_address_341d61298c37a8b80e6a7bb8.reference || (__cxx_static_address_341d61298c37a8b80e6a7bb8.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_6e61feaf7bee0c6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_d7e5766d7fa7f63b = ((u32(((u32(1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac6eee6617dc93e0543dca4b() {
  return __cxx_static_address_ac6eee6617dc93e0543dca4b.reference || (__cxx_static_address_ac6eee6617dc93e0543dca4b.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_d7e5766d7fa7f63b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_cffd49875d8691d6 = ((u32(((u32(1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbac04b94eac3cf4988468bc() {
  return __cxx_static_address_cbac04b94eac3cf4988468bc.reference || (__cxx_static_address_cbac04b94eac3cf4988468bc.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_cffd49875d8691d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_a9cca1f79e1ac4ae = ((u32(((u32(1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_711b4340b56bad17a0310846() {
  return __cxx_static_address_711b4340b56bad17a0310846.reference || (__cxx_static_address_711b4340b56bad17a0310846.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_a9cca1f79e1ac4ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_9fa366532d63d8f0 = ((u32(((u32(1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa476df84b846da8dc0eea4e() {
  return __cxx_static_address_fa476df84b846da8dc0eea4e.reference || (__cxx_static_address_fa476df84b846da8dc0eea4e.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_9fa366532d63d8f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_152e15d73b25c915 = ((u32(((u32(1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf22cecc27041be5f01f67b4() {
  return __cxx_static_address_bf22cecc27041be5f01f67b4.reference || (__cxx_static_address_bf22cecc27041be5f01f67b4.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_152e15d73b25c915; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_467a7295e8e95e17 = ((u32(((u32(1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0db163cd80a1dae776ba40ab() {
  return __cxx_static_address_0db163cd80a1dae776ba40ab.reference || (__cxx_static_address_0db163cd80a1dae776ba40ab.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_467a7295e8e95e17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_dddafb8641bcc550 = ((u32(((u32(1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be49d95615acb259d7149d35() {
  return __cxx_static_address_be49d95615acb259d7149d35.reference || (__cxx_static_address_be49d95615acb259d7149d35.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_dddafb8641bcc550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_ec5e225667eb0e65 = ((u32(((u32(1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5a4f8524564f2a9bfaff32a() {
  return __cxx_static_address_c5a4f8524564f2a9bfaff32a.reference || (__cxx_static_address_c5a4f8524564f2a9bfaff32a.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_ec5e225667eb0e65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_7f06ebf72cd80723 = ((u32(((u32(1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4fa5495e365e15bf769433c() {
  return __cxx_static_address_d4fa5495e365e15bf769433c.reference || (__cxx_static_address_d4fa5495e365e15bf769433c.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_7f06ebf72cd80723; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_88562d1dde64de37 = ((u32(((u32(1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_376c669e2dd8c63cfa94fd29() {
  return __cxx_static_address_376c669e2dd8c63cfa94fd29.reference || (__cxx_static_address_376c669e2dd8c63cfa94fd29.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_88562d1dde64de37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_1ee89a7a239ffb77 = ((u32(((u32(1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50c274e265928043ed54479e() {
  return __cxx_static_address_50c274e265928043ed54479e.reference || (__cxx_static_address_50c274e265928043ed54479e.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_1ee89a7a239ffb77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_3ae49c8a32196839 = ((u32(((u32(1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d27fc1902638b6198d72c06c() {
  return __cxx_static_address_d27fc1902638b6198d72c06c.reference || (__cxx_static_address_d27fc1902638b6198d72c06c.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_3ae49c8a32196839; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_cfdbe5db95e256d1 = ((u32(((u32(1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06efaa2aa23effb5039f9005() {
  return __cxx_static_address_06efaa2aa23effb5039f9005.reference || (__cxx_static_address_06efaa2aa23effb5039f9005.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_cfdbe5db95e256d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_a67ee51aa9621dac = ((u32(((u32(1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecac34e3fcae970d6016b000() {
  return __cxx_static_address_ecac34e3fcae970d6016b000.reference || (__cxx_static_address_ecac34e3fcae970d6016b000.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_a67ee51aa9621dac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_393656d1b71e89d5 = ((u32(((u32(1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ab46db57c7b430a7e317e15() {
  return __cxx_static_address_0ab46db57c7b430a7e317e15.reference || (__cxx_static_address_0ab46db57c7b430a7e317e15.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_393656d1b71e89d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_4ccbe8d12844dfc1 = ((u32(((u32(1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25e29900c4d4ab5832395b66() {
  return __cxx_static_address_25e29900c4d4ab5832395b66.reference || (__cxx_static_address_25e29900c4d4ab5832395b66.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_4ccbe8d12844dfc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_f8cfd39300b40a22 = ((u32(((u32(1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_067936f044115e6b6fdca8bf() {
  return __cxx_static_address_067936f044115e6b6fdca8bf.reference || (__cxx_static_address_067936f044115e6b6fdca8bf.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_f8cfd39300b40a22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_dc7602c60f2b15e1 = ((u32(((u32(1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1b323732b659cc09e7d7b54() {
  return __cxx_static_address_a1b323732b659cc09e7d7b54.reference || (__cxx_static_address_a1b323732b659cc09e7d7b54.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_dc7602c60f2b15e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_100e7a473a14c33d = ((u32(((u32(1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e29fb35402cabb23ba8beae2() {
  return __cxx_static_address_e29fb35402cabb23ba8beae2.reference || (__cxx_static_address_e29fb35402cabb23ba8beae2.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_100e7a473a14c33d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_4e69ab4cd395f1e2 = ((u32(((u32(1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e179ad71c68ad56cefe3a81() {
  return __cxx_static_address_4e179ad71c68ad56cefe3a81.reference || (__cxx_static_address_4e179ad71c68ad56cefe3a81.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_4e69ab4cd395f1e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_a272951899bc7e69 = ((u32(((u32(1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50f020db6fad053cf823dec6() {
  return __cxx_static_address_50f020db6fad053cf823dec6.reference || (__cxx_static_address_50f020db6fad053cf823dec6.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_a272951899bc7e69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_633fbb3939c254be = ((u32(((u32(1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36f2fbf2218d5824a7c8bbb0() {
  return __cxx_static_address_36f2fbf2218d5824a7c8bbb0.reference || (__cxx_static_address_36f2fbf2218d5824a7c8bbb0.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_633fbb3939c254be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_9f8b75808944801c = ((u32(((u32(1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9f906553642c534b2ab0006() {
  return __cxx_static_address_d9f906553642c534b2ab0006.reference || (__cxx_static_address_d9f906553642c534b2ab0006.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_9f8b75808944801c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_3b0003298bb321aa = ((u32(((u32(1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e80c9a0a1b10f82deb58968() {
  return __cxx_static_address_1e80c9a0a1b10f82deb58968.reference || (__cxx_static_address_1e80c9a0a1b10f82deb58968.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_3b0003298bb321aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_081c039c2fe1e9c8 = ((u32(((u32(1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ffc72e18d50886ea14b9b09() {
  return __cxx_static_address_2ffc72e18d50886ea14b9b09.reference || (__cxx_static_address_2ffc72e18d50886ea14b9b09.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_081c039c2fe1e9c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_b7e48f2ff4952162 = ((u32(((u32(1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4323454571b4697b5f47160() {
  return __cxx_static_address_d4323454571b4697b5f47160.reference || (__cxx_static_address_d4323454571b4697b5f47160.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_b7e48f2ff4952162; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_c81f5a13b6279db2 = ((u32(((u32(1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8427e3101fae5bc7f0cc71da() {
  return __cxx_static_address_8427e3101fae5bc7f0cc71da.reference || (__cxx_static_address_8427e3101fae5bc7f0cc71da.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_c81f5a13b6279db2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_319421d5b97db9f0 = ((u32(((u32(1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3be67714a79142b30b18a7b2() {
  return __cxx_static_address_3be67714a79142b30b18a7b2.reference || (__cxx_static_address_3be67714a79142b30b18a7b2.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_319421d5b97db9f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_6dd50ea38590257e = ((u32(((u32(1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b585112dd91632126c7ca13() {
  return __cxx_static_address_6b585112dd91632126c7ca13.reference || (__cxx_static_address_6b585112dd91632126c7ca13.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_6dd50ea38590257e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_c5dd0407bd900571 = ((u32(((u32(1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37e817632002a9f994faec2b() {
  return __cxx_static_address_37e817632002a9f994faec2b.reference || (__cxx_static_address_37e817632002a9f994faec2b.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_c5dd0407bd900571; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_70c0357c6c6452c3 = ((u32(((u32(1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47bc2722f73f517df08c5b9a() {
  return __cxx_static_address_47bc2722f73f517df08c5b9a.reference || (__cxx_static_address_47bc2722f73f517df08c5b9a.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_70c0357c6c6452c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_f4a0e344c78b8ee9 = ((u32(((u32(1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9a9dea6e7ff103450a464ca() {
  return __cxx_static_address_c9a9dea6e7ff103450a464ca.reference || (__cxx_static_address_c9a9dea6e7ff103450a464ca.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_f4a0e344c78b8ee9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_d119926586799cac = ((u32(((u32(1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1fd4317c4ab966a2a7a8234() {
  return __cxx_static_address_b1fd4317c4ab966a2a7a8234.reference || (__cxx_static_address_b1fd4317c4ab966a2a7a8234.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_d119926586799cac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_0736490cc907b4e4 = ((u32(((u32(1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bea838c7a9cb78d6aa4780d() {
  return __cxx_static_address_3bea838c7a9cb78d6aa4780d.reference || (__cxx_static_address_3bea838c7a9cb78d6aa4780d.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_0736490cc907b4e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_b6a68128ab62d5a5 = ((u32(((u32(1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b71b3bf14e6577ef187ddc6d() {
  return __cxx_static_address_b71b3bf14e6577ef187ddc6d.reference || (__cxx_static_address_b71b3bf14e6577ef187ddc6d.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_b6a68128ab62d5a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_3e66654fa0cf55de = ((u32(((u32(1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9bbe88bb3ef26d961b24407() {
  return __cxx_static_address_a9bbe88bb3ef26d961b24407.reference || (__cxx_static_address_a9bbe88bb3ef26d961b24407.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_3e66654fa0cf55de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_9052ac6e15f0c25c = ((u32(((u32(1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab5cf8ca0f4dd100b4db9d7f() {
  return __cxx_static_address_ab5cf8ca0f4dd100b4db9d7f.reference || (__cxx_static_address_ab5cf8ca0f4dd100b4db9d7f.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_9052ac6e15f0c25c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_e854e5104322b902 = ((u32(((u32(1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ddb25adc20bab58e29f7ea3() {
  return __cxx_static_address_6ddb25adc20bab58e29f7ea3.reference || (__cxx_static_address_6ddb25adc20bab58e29f7ea3.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_e854e5104322b902; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_a4ea0bb0a5fa5d74 = ((u32(((u32(1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31ee9860531a28733bc1efda() {
  return __cxx_static_address_31ee9860531a28733bc1efda.reference || (__cxx_static_address_31ee9860531a28733bc1efda.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_a4ea0bb0a5fa5d74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_a7f106965b0714de = ((u32(((u32(1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c16f78cad1da2e2f973bed9() {
  return __cxx_static_address_2c16f78cad1da2e2f973bed9.reference || (__cxx_static_address_2c16f78cad1da2e2f973bed9.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_a7f106965b0714de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_7a86731989437c8c = ((u32(((u32(1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12b32ae525faa7b98eac01c6() {
  return __cxx_static_address_12b32ae525faa7b98eac01c6.reference || (__cxx_static_address_12b32ae525faa7b98eac01c6.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_7a86731989437c8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_8afd0510f595d98c = ((u32(((u32(1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c538e673a3dc493f0d9e213c() {
  return __cxx_static_address_c538e673a3dc493f0d9e213c.reference || (__cxx_static_address_c538e673a3dc493f0d9e213c.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_8afd0510f595d98c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_3ebcbd4cd5e93939 = ((u32(((u32(1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3721b878df2a7c39d1bdee0b() {
  return __cxx_static_address_3721b878df2a7c39d1bdee0b.reference || (__cxx_static_address_3721b878df2a7c39d1bdee0b.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_3ebcbd4cd5e93939; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_803c9bdafa79d8f0 = ((u32(((u32(1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4483c6a43364e43e06fcbb9() {
  return __cxx_static_address_b4483c6a43364e43e06fcbb9.reference || (__cxx_static_address_b4483c6a43364e43e06fcbb9.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_803c9bdafa79d8f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_c6c51c2a876f40e4 = ((u32(((u32(1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78229f7fbe186dc8454c1063() {
  return __cxx_static_address_78229f7fbe186dc8454c1063.reference || (__cxx_static_address_78229f7fbe186dc8454c1063.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_c6c51c2a876f40e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_373157e75fa0aad2 = ((u32(((u32(1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0714f45df8cc7d038211bcb() {
  return __cxx_static_address_e0714f45df8cc7d038211bcb.reference || (__cxx_static_address_e0714f45df8cc7d038211bcb.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_373157e75fa0aad2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_251bd153287431af = ((u32(((u32(1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b478d04ab5c5beb39d7e3edd() {
  return __cxx_static_address_b478d04ab5c5beb39d7e3edd.reference || (__cxx_static_address_b478d04ab5c5beb39d7e3edd.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_251bd153287431af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_0b1d944072cded9f = ((u32(((u32(1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3abf7e29a806253d764ad15() {
  return __cxx_static_address_c3abf7e29a806253d764ad15.reference || (__cxx_static_address_c3abf7e29a806253d764ad15.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_0b1d944072cded9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_f7ae552c2fe8fbaf = ((u32(((u32(1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9edecf70c741ce50663572b7() {
  return __cxx_static_address_9edecf70c741ce50663572b7.reference || (__cxx_static_address_9edecf70c741ce50663572b7.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_f7ae552c2fe8fbaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_04c69cbf808fa9e0 = ((u32(((u32(1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec2b84443c1190efe5577f25() {
  return __cxx_static_address_ec2b84443c1190efe5577f25.reference || (__cxx_static_address_ec2b84443c1190efe5577f25.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_04c69cbf808fa9e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_b00e2213f17d3626 = ((u32(((u32(1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_882b582bc670047691ca898c() {
  return __cxx_static_address_882b582bc670047691ca898c.reference || (__cxx_static_address_882b582bc670047691ca898c.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_b00e2213f17d3626; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_a22198637a7eb5b1 = ((u32(((u32(1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_714f34d6c34cf4a3767dfe88() {
  return __cxx_static_address_714f34d6c34cf4a3767dfe88.reference || (__cxx_static_address_714f34d6c34cf4a3767dfe88.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_a22198637a7eb5b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_e6573d01b321f9ec = ((u32(((u32(1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6960286f22c3545ee1567a5a() {
  return __cxx_static_address_6960286f22c3545ee1567a5a.reference || (__cxx_static_address_6960286f22c3545ee1567a5a.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_e6573d01b321f9ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_b1f71802d53fe554 = ((u32(((u32(1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90ef5a0609a3a880387d7130() {
  return __cxx_static_address_90ef5a0609a3a880387d7130.reference || (__cxx_static_address_90ef5a0609a3a880387d7130.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_b1f71802d53fe554; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_6f2eed2aaf404658 = ((u32(((u32(1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e64e781d8cd9e030026d4a9() {
  return __cxx_static_address_9e64e781d8cd9e030026d4a9.reference || (__cxx_static_address_9e64e781d8cd9e030026d4a9.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_6f2eed2aaf404658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_86bac86e0b658a54 = ((u32(((u32(1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6d670389e7961a6d068e17a() {
  return __cxx_static_address_a6d670389e7961a6d068e17a.reference || (__cxx_static_address_a6d670389e7961a6d068e17a.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_86bac86e0b658a54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_ed1859aa3ad2b9ed = ((u32(((u32(1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7c6a26d41021b79ac9122c1() {
  return __cxx_static_address_a7c6a26d41021b79ac9122c1.reference || (__cxx_static_address_a7c6a26d41021b79ac9122c1.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_ed1859aa3ad2b9ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_bbeab67532e36d36 = ((u32(((u32(1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08b88b97f3b2795cc6bb2b5c() {
  return __cxx_static_address_08b88b97f3b2795cc6bb2b5c.reference || (__cxx_static_address_08b88b97f3b2795cc6bb2b5c.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_bbeab67532e36d36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_9a30d3494a6b2a2a = ((u32(((u32(1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_655e816e8939a7834a8064e3() {
  return __cxx_static_address_655e816e8939a7834a8064e3.reference || (__cxx_static_address_655e816e8939a7834a8064e3.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_9a30d3494a6b2a2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_ecf60eb1e94fb3a9 = ((u32(((u32(1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acc3750460179697e6606211() {
  return __cxx_static_address_acc3750460179697e6606211.reference || (__cxx_static_address_acc3750460179697e6606211.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_ecf60eb1e94fb3a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_e2a801604b854e77 = ((u32(((u32(1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8418853a9977bc3be099fce() {
  return __cxx_static_address_b8418853a9977bc3be099fce.reference || (__cxx_static_address_b8418853a9977bc3be099fce.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_e2a801604b854e77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_be186afd382bd1fb = ((u32(((u32(1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6bc489862c93ac33946cb13() {
  return __cxx_static_address_a6bc489862c93ac33946cb13.reference || (__cxx_static_address_a6bc489862c93ac33946cb13.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_be186afd382bd1fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_c4ceee3e3652d0c5 = ((u32(((u32(1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d57d3792a30631288ede9dbc() {
  return __cxx_static_address_d57d3792a30631288ede9dbc.reference || (__cxx_static_address_d57d3792a30631288ede9dbc.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_c4ceee3e3652d0c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_c1f1e072115dc763 = ((u32(((u32(1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b661abb2549a15488bed023c() {
  return __cxx_static_address_b661abb2549a15488bed023c.reference || (__cxx_static_address_b661abb2549a15488bed023c.reference = {
    __cReference: true,
    get value() { return RAT____header_global_c1f1e072115dc763; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_8f3becdcba34f215 = ((u32(((u32(1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5d49bbe72bdbc61ad770487() {
  return __cxx_static_address_d5d49bbe72bdbc61ad770487.reference || (__cxx_static_address_d5d49bbe72bdbc61ad770487.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_8f3becdcba34f215; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_2a8bc361666e08f2 = ((u32(((u32(1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d712bfd17036e43d51d073e() {
  return __cxx_static_address_6d712bfd17036e43d51d073e.reference || (__cxx_static_address_6d712bfd17036e43d51d073e.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_2a8bc361666e08f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_e8b08b8d611951c8 = ((u32(((u32(1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9eff9704156c421d1feb51d6() {
  return __cxx_static_address_9eff9704156c421d1feb51d6.reference || (__cxx_static_address_9eff9704156c421d1feb51d6.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_e8b08b8d611951c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_d0a991fe1d802f97 = ((u32(((u32(1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6112973b726b589a9d95dae() {
  return __cxx_static_address_c6112973b726b589a9d95dae.reference || (__cxx_static_address_c6112973b726b589a9d95dae.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_d0a991fe1d802f97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_58630b68b4d576a5 = ((u32(((u32(1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a875883d37c79020a7484ac() {
  return __cxx_static_address_0a875883d37c79020a7484ac.reference || (__cxx_static_address_0a875883d37c79020a7484ac.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_58630b68b4d576a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_00ef2adfca5930c2 = ((u32(((u32(1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec7622874be27c23735f2b5d() {
  return __cxx_static_address_ec7622874be27c23735f2b5d.reference || (__cxx_static_address_ec7622874be27c23735f2b5d.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_00ef2adfca5930c2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_3b1064c5c4f81c12 = ((u32(((u32(1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ac608203e6c429ff70bcb0c() {
  return __cxx_static_address_1ac608203e6c429ff70bcb0c.reference || (__cxx_static_address_1ac608203e6c429ff70bcb0c.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_3b1064c5c4f81c12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_33c40c4dd681d98f = ((u32(((u32(1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8b905de42fef0fa4cb3a8f8() {
  return __cxx_static_address_b8b905de42fef0fa4cb3a8f8.reference || (__cxx_static_address_b8b905de42fef0fa4cb3a8f8.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_33c40c4dd681d98f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_b90a17a0b40e3b1d = ((u32(((u32(1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e22d06769c807a621290b4a() {
  return __cxx_static_address_1e22d06769c807a621290b4a.reference || (__cxx_static_address_1e22d06769c807a621290b4a.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_b90a17a0b40e3b1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_c28bc8fc8419852c = ((u32(((u32(1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c318b3b9878f744a49174715() {
  return __cxx_static_address_c318b3b9878f744a49174715.reference || (__cxx_static_address_c318b3b9878f744a49174715.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_c28bc8fc8419852c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_9adfb287be979405 = ((u32(((u32(1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bdbbd73284837a462c8c881() {
  return __cxx_static_address_5bdbbd73284837a462c8c881.reference || (__cxx_static_address_5bdbbd73284837a462c8c881.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_9adfb287be979405; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_6d89646ade4287d7 = ((u32(((u32(1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_496216913408e16ebdfc15f8() {
  return __cxx_static_address_496216913408e16ebdfc15f8.reference || (__cxx_static_address_496216913408e16ebdfc15f8.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_6d89646ade4287d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_ee3c49608b642535 = ((u32(((u32(1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aefce539ccb0f63653fd40dd() {
  return __cxx_static_address_aefce539ccb0f63653fd40dd.reference || (__cxx_static_address_aefce539ccb0f63653fd40dd.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_ee3c49608b642535; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_24eef0465b9cb5ec = ((u32(((u32(1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0beebebae6a1033311dcbc5e() {
  return __cxx_static_address_0beebebae6a1033311dcbc5e.reference || (__cxx_static_address_0beebebae6a1033311dcbc5e.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_24eef0465b9cb5ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_98ff6165a8ae096c = ((u32(((u32(1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c90d13081170ee1fd189d17a() {
  return __cxx_static_address_c90d13081170ee1fd189d17a.reference || (__cxx_static_address_c90d13081170ee1fd189d17a.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_98ff6165a8ae096c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_af908c07b2768cf4 = ((u32(((u32(1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f99645d7431a6a277c837ce() {
  return __cxx_static_address_0f99645d7431a6a277c837ce.reference || (__cxx_static_address_0f99645d7431a6a277c837ce.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_af908c07b2768cf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_cd8a85a13e82be7b = ((u32(((u32(1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac17b4b6d63685caf5d455bf() {
  return __cxx_static_address_ac17b4b6d63685caf5d455bf.reference || (__cxx_static_address_ac17b4b6d63685caf5d455bf.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_cd8a85a13e82be7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_6de0aa54d4e76604 = ((u32(((u32(1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f4ff6fc63fe2af3948c339c() {
  return __cxx_static_address_2f4ff6fc63fe2af3948c339c.reference || (__cxx_static_address_2f4ff6fc63fe2af3948c339c.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_6de0aa54d4e76604; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_c7639d922d676c6d = ((u32(((u32(1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_724bc2e620904f1027679eca() {
  return __cxx_static_address_724bc2e620904f1027679eca.reference || (__cxx_static_address_724bc2e620904f1027679eca.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_c7639d922d676c6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_4fdffb88c1f64964 = ((u32(((u32(1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e815f836856115cecf08601d() {
  return __cxx_static_address_e815f836856115cecf08601d.reference || (__cxx_static_address_e815f836856115cecf08601d.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_4fdffb88c1f64964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_3cfbd47f2d69c4ce = ((u32(((u32(1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02cb6b03f2ae223d3c74a3a9() {
  return __cxx_static_address_02cb6b03f2ae223d3c74a3a9.reference || (__cxx_static_address_02cb6b03f2ae223d3c74a3a9.reference = {
    __cReference: true,
    get value() { return INDY____header_global_3cfbd47f2d69c4ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_2d5a891b5bbf1054 = ((u32(((u32(1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_954c637c4201eb1688976201() {
  return __cxx_static_address_954c637c4201eb1688976201.reference || (__cxx_static_address_954c637c4201eb1688976201.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_2d5a891b5bbf1054; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_d3369d0cf1f46eb0 = ((u32(((u32(1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f850fe1e3e57c74c3102352() {
  return __cxx_static_address_8f850fe1e3e57c74c3102352.reference || (__cxx_static_address_8f850fe1e3e57c74c3102352.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_d3369d0cf1f46eb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_d1aea5d9e8d40c46 = ((u32(((u32(1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_316d195dd6b4ab562851f1fd() {
  return __cxx_static_address_316d195dd6b4ab562851f1fd.reference || (__cxx_static_address_316d195dd6b4ab562851f1fd.reference = {
    __cReference: true,
    get value() { return MONK____header_global_d1aea5d9e8d40c46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_ce7e044a5ac68999 = ((u32(((u32(1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ec64d30cb681403e274a221() {
  return __cxx_static_address_9ec64d30cb681403e274a221.reference || (__cxx_static_address_9ec64d30cb681403e274a221.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_ce7e044a5ac68999; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_cb6e2c32002b47ee = ((u32(((u32(1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_833146e1182eb6aa01f152cd() {
  return __cxx_static_address_833146e1182eb6aa01f152cd.reference || (__cxx_static_address_833146e1182eb6aa01f152cd.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_cb6e2c32002b47ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_4bd917e6b6d51eb9 = ((u32(((u32(1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b622df7ad2b4863ec2c26313() {
  return __cxx_static_address_b622df7ad2b4863ec2c26313.reference || (__cxx_static_address_b622df7ad2b4863ec2c26313.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_4bd917e6b6d51eb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_33aa5728c56df99b = ((u32(((u32(1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e374b3343eaa5266563c6ea() {
  return __cxx_static_address_9e374b3343eaa5266563c6ea.reference || (__cxx_static_address_9e374b3343eaa5266563c6ea.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_33aa5728c56df99b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_bb76df42b497f2aa = ((u32(((u32(1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29b2aeb5c20bf8caa4eacb8b() {
  return __cxx_static_address_29b2aeb5c20bf8caa4eacb8b.reference || (__cxx_static_address_29b2aeb5c20bf8caa4eacb8b.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_bb76df42b497f2aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_733d1cbcaee62b8d = ((u32(((u32(1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c494b44501834a9455a30b2() {
  return __cxx_static_address_9c494b44501834a9455a30b2.reference || (__cxx_static_address_9c494b44501834a9455a30b2.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_733d1cbcaee62b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_c235f2cd1c3aefa7 = ((u32(((u32(1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c069d113c9123adc00bfc9f0() {
  return __cxx_static_address_c069d113c9123adc00bfc9f0.reference || (__cxx_static_address_c069d113c9123adc00bfc9f0.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_c235f2cd1c3aefa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_3a523824e6520a5f = ((u32(((u32(1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98910897c294a14d3bedb840() {
  return __cxx_static_address_98910897c294a14d3bedb840.reference || (__cxx_static_address_98910897c294a14d3bedb840.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_3a523824e6520a5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_6d59d63d61ad38e7 = ((u32(((u32(1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89db97fbe8df72854ecb67b6() {
  return __cxx_static_address_89db97fbe8df72854ecb67b6.reference || (__cxx_static_address_89db97fbe8df72854ecb67b6.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_6d59d63d61ad38e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_c5f0844c9a3c141f = ((u32(((u32(1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60c813fdc5926e079f03fb64() {
  return __cxx_static_address_60c813fdc5926e079f03fb64.reference || (__cxx_static_address_60c813fdc5926e079f03fb64.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_c5f0844c9a3c141f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_d0a30693c805e5de = ((u32(((u32(1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8704334302972a14debf052() {
  return __cxx_static_address_c8704334302972a14debf052.reference || (__cxx_static_address_c8704334302972a14debf052.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_d0a30693c805e5de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_46186dbcdcd692ff = ((u32(((u32(1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_540da8905d5e29b87f23a882() {
  return __cxx_static_address_540da8905d5e29b87f23a882.reference || (__cxx_static_address_540da8905d5e29b87f23a882.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_46186dbcdcd692ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_6c98603110474478 = ((u32(((u32(1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fc8cc8871c950f917f53230() {
  return __cxx_static_address_6fc8cc8871c950f917f53230.reference || (__cxx_static_address_6fc8cc8871c950f917f53230.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_6c98603110474478; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_b8ff9f9ed6bf0fe1 = ((u32(((u32(1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72e56ea21c53c58c17a882e8() {
  return __cxx_static_address_72e56ea21c53c58c17a882e8.reference || (__cxx_static_address_72e56ea21c53c58c17a882e8.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_b8ff9f9ed6bf0fe1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_a318df79a3d973c9 = ((u32(((u32(1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7a5c0b140c8364e93c430d9() {
  return __cxx_static_address_e7a5c0b140c8364e93c430d9.reference || (__cxx_static_address_e7a5c0b140c8364e93c430d9.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_a318df79a3d973c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_c83fba45445ab8f5 = ((u32(((u32(1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15f3b9cdf09ac7bd5fe94735() {
  return __cxx_static_address_15f3b9cdf09ac7bd5fe94735.reference || (__cxx_static_address_15f3b9cdf09ac7bd5fe94735.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_c83fba45445ab8f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_2cbd4f73c7868abb = ((u32(((u32(1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97e7a495126ce7474c405e04() {
  return __cxx_static_address_97e7a495126ce7474c405e04.reference || (__cxx_static_address_97e7a495126ce7474c405e04.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_2cbd4f73c7868abb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_7c5db1aaaafef246 = ((u32(((u32(1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d06cb317ff8c7c09f808d51e() {
  return __cxx_static_address_d06cb317ff8c7c09f808d51e.reference || (__cxx_static_address_d06cb317ff8c7c09f808d51e.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_7c5db1aaaafef246; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_aedc6fb999adb210 = ((u32(((u32(1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d4c3945c777beab8dab5d6a() {
  return __cxx_static_address_8d4c3945c777beab8dab5d6a.reference || (__cxx_static_address_8d4c3945c777beab8dab5d6a.reference = {
    __cReference: true,
    get value() { return FIST____header_global_aedc6fb999adb210; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_a9c32ca3dde99ef7 = ((u32(((u32(1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_950c277f76eacfa238e89141() {
  return __cxx_static_address_950c277f76eacfa238e89141.reference || (__cxx_static_address_950c277f76eacfa238e89141.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_a9c32ca3dde99ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_6fbbca904349ed22 = ((u32(((u32(1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f93438e3d7341a0c195b978() {
  return __cxx_static_address_2f93438e3d7341a0c195b978.reference || (__cxx_static_address_2f93438e3d7341a0c195b978.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_6fbbca904349ed22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_bd6cfd1a1536aec7 = ((u32(((u32(1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba655174c417a5cdce63f8f8() {
  return __cxx_static_address_ba655174c417a5cdce63f8f8.reference || (__cxx_static_address_ba655174c417a5cdce63f8f8.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_bd6cfd1a1536aec7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_ed98b1ee55399f64 = ((u32(((u32(1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ba7765d00eeedb7a62d79fc() {
  return __cxx_static_address_7ba7765d00eeedb7a62d79fc.reference || (__cxx_static_address_7ba7765d00eeedb7a62d79fc.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_ed98b1ee55399f64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_c1004b3b31e59985 = ((u32(((u32(1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d53119cf2bd0c90ef3cef23() {
  return __cxx_static_address_9d53119cf2bd0c90ef3cef23.reference || (__cxx_static_address_9d53119cf2bd0c90ef3cef23.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_c1004b3b31e59985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_b20a2511035d6d92 = ((u32(((u32(1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ec8f9d3ef260afa5ea9024b() {
  return __cxx_static_address_2ec8f9d3ef260afa5ea9024b.reference || (__cxx_static_address_2ec8f9d3ef260afa5ea9024b.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_b20a2511035d6d92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_b1af9b636b862fc1 = ((u32(((u32(1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e570baeed3d8b0bdb843a277() {
  return __cxx_static_address_e570baeed3d8b0bdb843a277.reference || (__cxx_static_address_e570baeed3d8b0bdb843a277.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_b1af9b636b862fc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_e68d5116941e1d61 = ((u32(((u32(1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ef382f06796b62961c79481() {
  return __cxx_static_address_1ef382f06796b62961c79481.reference || (__cxx_static_address_1ef382f06796b62961c79481.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_e68d5116941e1d61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_6a9042f06bdfee47 = ((u32(((u32(1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae7556013fec50f3b99098d3() {
  return __cxx_static_address_ae7556013fec50f3b99098d3.reference || (__cxx_static_address_ae7556013fec50f3b99098d3.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_6a9042f06bdfee47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_73f960d5975bd860 = ((u32(((u32(1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dffdc9b41efef3e487901fb7() {
  return __cxx_static_address_dffdc9b41efef3e487901fb7.reference || (__cxx_static_address_dffdc9b41efef3e487901fb7.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_73f960d5975bd860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_775cfe389b9fa1f8 = ((u32(((u32(1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26c656424237d782aef9444f() {
  return __cxx_static_address_26c656424237d782aef9444f.reference || (__cxx_static_address_26c656424237d782aef9444f.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_775cfe389b9fa1f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_3dbacd87d5d9f963 = ((u32(((u32(1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80c54fe7d4f6529f64ec0d72() {
  return __cxx_static_address_80c54fe7d4f6529f64ec0d72.reference || (__cxx_static_address_80c54fe7d4f6529f64ec0d72.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_3dbacd87d5d9f963; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_71f6baacc2faa6c6 = ((u32(((u32(1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a8104d41a1106e8eea7961d() {
  return __cxx_static_address_6a8104d41a1106e8eea7961d.reference || (__cxx_static_address_6a8104d41a1106e8eea7961d.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_71f6baacc2faa6c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_a47088960bde35bb = ((u32(((u32(1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d0051f92e2722d9e9c3b3d5() {
  return __cxx_static_address_8d0051f92e2722d9e9c3b3d5.reference || (__cxx_static_address_8d0051f92e2722d9e9c3b3d5.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_a47088960bde35bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_826aa48f60db48e0 = ((u32(((u32(1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c728e2fc3bf64090b5f1b878() {
  return __cxx_static_address_c728e2fc3bf64090b5f1b878.reference || (__cxx_static_address_c728e2fc3bf64090b5f1b878.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_826aa48f60db48e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_1b742de58a5e9882 = ((u32(((u32(1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d49e07f95e31087375f22f1() {
  return __cxx_static_address_5d49e07f95e31087375f22f1.reference || (__cxx_static_address_5d49e07f95e31087375f22f1.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_1b742de58a5e9882; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_c38c96a19a359757 = ((u32(((u32(1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c77ea0eb525e337212356d1() {
  return __cxx_static_address_9c77ea0eb525e337212356d1.reference || (__cxx_static_address_9c77ea0eb525e337212356d1.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_c38c96a19a359757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_c8b99bceb19a4219 = ((u32(((u32(1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e66fba28a31b02cf86620288() {
  return __cxx_static_address_e66fba28a31b02cf86620288.reference || (__cxx_static_address_e66fba28a31b02cf86620288.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_c8b99bceb19a4219; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_3c1840d03f9a100b = ((u32(((u32(1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e64f4516acd98853137ff3d() {
  return __cxx_static_address_1e64f4516acd98853137ff3d.reference || (__cxx_static_address_1e64f4516acd98853137ff3d.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_3c1840d03f9a100b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_2985c60e8b75b68d = ((u32(((u32(1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dd7654f8bd3deb537360ea0() {
  return __cxx_static_address_5dd7654f8bd3deb537360ea0.reference || (__cxx_static_address_5dd7654f8bd3deb537360ea0.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_2985c60e8b75b68d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_47ab258f4a8974c9 = ((u32(((u32(1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4db55c5b427030fe94439871() {
  return __cxx_static_address_4db55c5b427030fe94439871.reference || (__cxx_static_address_4db55c5b427030fe94439871.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_47ab258f4a8974c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_d4a92c4d1e6e9b9c = ((u32(((u32(1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c94bd4bb45bd921983a380e7() {
  return __cxx_static_address_c94bd4bb45bd921983a380e7.reference || (__cxx_static_address_c94bd4bb45bd921983a380e7.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_d4a92c4d1e6e9b9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_ae2e916b1c278371 = ((u32(((u32(1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53315ca5aca6fa97dd79ff9c() {
  return __cxx_static_address_53315ca5aca6fa97dd79ff9c.reference || (__cxx_static_address_53315ca5aca6fa97dd79ff9c.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_ae2e916b1c278371; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_258f16e1ad872be5 = ((u32(((u32(1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30de32844a1385bddfe94855() {
  return __cxx_static_address_30de32844a1385bddfe94855.reference || (__cxx_static_address_30de32844a1385bddfe94855.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_258f16e1ad872be5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_938cd0514a71207d = ((u32(((u32(1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3dad4d283dcbb55c07480d0() {
  return __cxx_static_address_a3dad4d283dcbb55c07480d0.reference || (__cxx_static_address_a3dad4d283dcbb55c07480d0.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_938cd0514a71207d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_2cd6d0d4283ca1ad = ((u32(((u32(1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a344f85f07815753b3b2eafb() {
  return __cxx_static_address_a344f85f07815753b3b2eafb.reference || (__cxx_static_address_a344f85f07815753b3b2eafb.reference = {
    __cReference: true,
    get value() { return RECON____header_global_2cd6d0d4283ca1ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_34e908fa1c192b0e = ((u32(((u32(1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_446dc8fe9473a0605e7608c5() {
  return __cxx_static_address_446dc8fe9473a0605e7608c5.reference || (__cxx_static_address_446dc8fe9473a0605e7608c5.reference = {
    __cReference: true,
    get value() { return TANK____header_global_34e908fa1c192b0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_ef97252cc8836862 = ((u32(((u32(2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f126acdb13a26c3f54ebe1f0() {
  return __cxx_static_address_f126acdb13a26c3f54ebe1f0.reference || (__cxx_static_address_f126acdb13a26c3f54ebe1f0.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_ef97252cc8836862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_085a0012552f9044 = ((u32(((u32(2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_891996b952444c8710c23c6b() {
  return __cxx_static_address_891996b952444c8710c23c6b.reference || (__cxx_static_address_891996b952444c8710c23c6b.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_085a0012552f9044; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_f8019eb2f1985f2a = ((u32(((u32(2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21b04a046925de28297935a8() {
  return __cxx_static_address_21b04a046925de28297935a8.reference || (__cxx_static_address_21b04a046925de28297935a8.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_f8019eb2f1985f2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_de67f03426bd7a29 = ((u32(((u32(2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02eeadd269f4f4cfe835a2b9() {
  return __cxx_static_address_02eeadd269f4f4cfe835a2b9.reference || (__cxx_static_address_02eeadd269f4f4cfe835a2b9.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_de67f03426bd7a29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_b8e47cb017601f11 = ((u32(((u32(2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a7310e849bba9d8adc2832d() {
  return __cxx_static_address_8a7310e849bba9d8adc2832d.reference || (__cxx_static_address_8a7310e849bba9d8adc2832d.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_b8e47cb017601f11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_17a4a9ac2f359f9b = ((u32(((u32(2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69c78f17a02bd38f61ead474() {
  return __cxx_static_address_69c78f17a02bd38f61ead474.reference || (__cxx_static_address_69c78f17a02bd38f61ead474.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_17a4a9ac2f359f9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_d25dc38b57db4cae = ((u32(((u32(2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95968a2e9c1ad69f0468f30d() {
  return __cxx_static_address_95968a2e9c1ad69f0468f30d.reference || (__cxx_static_address_95968a2e9c1ad69f0468f30d.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_d25dc38b57db4cae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_735fbc8d44af1d39 = ((u32(((u32(2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84db517e1e19d08cfcb66573() {
  return __cxx_static_address_84db517e1e19d08cfcb66573.reference || (__cxx_static_address_84db517e1e19d08cfcb66573.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_735fbc8d44af1d39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_41021f3c53d19991 = ((u32(((u32(2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a2a55095275217d0b522c25() {
  return __cxx_static_address_8a2a55095275217d0b522c25.reference || (__cxx_static_address_8a2a55095275217d0b522c25.reference = {
    __cReference: true,
    get value() { return FECES____header_global_41021f3c53d19991; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_56b8e2f3d6a7147b = ((u32(((u32(2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74741a1629ff60d0ce61145f() {
  return __cxx_static_address_74741a1629ff60d0ce61145f.reference || (__cxx_static_address_74741a1629ff60d0ce61145f.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_56b8e2f3d6a7147b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_1e356b0082a5f26a = ((u32(((u32(2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03fe842756af3cb207d2fa88() {
  return __cxx_static_address_03fe842756af3cb207d2fa88.reference || (__cxx_static_address_03fe842756af3cb207d2fa88.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_1e356b0082a5f26a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_ce2f7d67d2c18807 = ((u32(((u32(2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3d0e4aa8dbd0c6e1f73cbc1() {
  return __cxx_static_address_e3d0e4aa8dbd0c6e1f73cbc1.reference || (__cxx_static_address_e3d0e4aa8dbd0c6e1f73cbc1.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_ce2f7d67d2c18807; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_7b48f6844f337d73 = ((u32(((u32(2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bcf4971a64e72aa7806872f() {
  return __cxx_static_address_1bcf4971a64e72aa7806872f.reference || (__cxx_static_address_1bcf4971a64e72aa7806872f.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_7b48f6844f337d73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_5a5234aad9dfc00b = ((u32(((u32(2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b89f011f18afbf07b62a48c() {
  return __cxx_static_address_8b89f011f18afbf07b62a48c.reference || (__cxx_static_address_8b89f011f18afbf07b62a48c.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_5a5234aad9dfc00b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_2fb8e537f9469f89 = ((u32(((u32(2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27eb9da29b1cdd52ba61e7e8() {
  return __cxx_static_address_27eb9da29b1cdd52ba61e7e8.reference || (__cxx_static_address_27eb9da29b1cdd52ba61e7e8.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_2fb8e537f9469f89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_b748962f6bf62172 = ((u32(((u32(2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02770b786bc674ed1668a585() {
  return __cxx_static_address_02770b786bc674ed1668a585.reference || (__cxx_static_address_02770b786bc674ed1668a585.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_b748962f6bf62172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_a29efc02058d8c2f = ((u32(((u32(2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf45f1f36fe8e3cc05c2db9e() {
  return __cxx_static_address_bf45f1f36fe8e3cc05c2db9e.reference || (__cxx_static_address_bf45f1f36fe8e3cc05c2db9e.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_a29efc02058d8c2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_9e920edd7ec6e558 = ((u32(((u32(2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a5f08e94a07d30b7e507e32() {
  return __cxx_static_address_2a5f08e94a07d30b7e507e32.reference || (__cxx_static_address_2a5f08e94a07d30b7e507e32.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_9e920edd7ec6e558; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_63fbcd843698a1e5 = ((u32(((u32(2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_530fc6ea35054e28cc9f154d() {
  return __cxx_static_address_530fc6ea35054e28cc9f154d.reference || (__cxx_static_address_530fc6ea35054e28cc9f154d.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_63fbcd843698a1e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_e40580be47fd7998 = ((u32(((u32(2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e70c371955c51c1f0301763() {
  return __cxx_static_address_5e70c371955c51c1f0301763.reference || (__cxx_static_address_5e70c371955c51c1f0301763.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_e40580be47fd7998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_9d1bc08a83738c0a = ((u32(((u32(2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d13148531ea8e22cc0bdf3fb() {
  return __cxx_static_address_d13148531ea8e22cc0bdf3fb.reference || (__cxx_static_address_d13148531ea8e22cc0bdf3fb.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_9d1bc08a83738c0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_23a4f8810edead4e = ((u32(((u32(2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51d3525ab3647781bdc64045() {
  return __cxx_static_address_51d3525ab3647781bdc64045.reference || (__cxx_static_address_51d3525ab3647781bdc64045.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_23a4f8810edead4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_7190f7907df89172 = ((u32(((u32(2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08449b63f494825c4076fd16() {
  return __cxx_static_address_08449b63f494825c4076fd16.reference || (__cxx_static_address_08449b63f494825c4076fd16.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_7190f7907df89172; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_fe71ff0b4ae78c9c = ((u32(((u32(2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8385f7fdc6a7c3e3f86eff8e() {
  return __cxx_static_address_8385f7fdc6a7c3e3f86eff8e.reference || (__cxx_static_address_8385f7fdc6a7c3e3f86eff8e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_fe71ff0b4ae78c9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_1ecd632df8e4f630 = ((u32(((u32(2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e116f42465add6afdd6da0f() {
  return __cxx_static_address_4e116f42465add6afdd6da0f.reference || (__cxx_static_address_4e116f42465add6afdd6da0f.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_1ecd632df8e4f630; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_4d721453736c9257 = ((u32(((u32(2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0c3ba4fae91a89396d46c47() {
  return __cxx_static_address_d0c3ba4fae91a89396d46c47.reference || (__cxx_static_address_d0c3ba4fae91a89396d46c47.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_4d721453736c9257; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_d680d752386e318b = ((u32(((u32(2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a38646b922a8b839dbba6085() {
  return __cxx_static_address_a38646b922a8b839dbba6085.reference || (__cxx_static_address_a38646b922a8b839dbba6085.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_d680d752386e318b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_88d09fa78d978473 = ((u32(((u32(2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afaf1e9e6ab5700d3df90a80() {
  return __cxx_static_address_afaf1e9e6ab5700d3df90a80.reference || (__cxx_static_address_afaf1e9e6ab5700d3df90a80.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_88d09fa78d978473; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_9000dbab223b5710 = ((u32(((u32(2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ef6619b8889bf6e95132623() {
  return __cxx_static_address_5ef6619b8889bf6e95132623.reference || (__cxx_static_address_5ef6619b8889bf6e95132623.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_9000dbab223b5710; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_29ba54876157c0d2 = ((u32(((u32(2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db005fd45c3932a5000addf1() {
  return __cxx_static_address_db005fd45c3932a5000addf1.reference || (__cxx_static_address_db005fd45c3932a5000addf1.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_29ba54876157c0d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_cfe324e300234642 = ((u32(((u32(2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2db1df1c93baeec73157ec01() {
  return __cxx_static_address_2db1df1c93baeec73157ec01.reference || (__cxx_static_address_2db1df1c93baeec73157ec01.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_cfe324e300234642; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_2f6bba04f084b60c = ((u32(((u32(2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a0e37484787d6ef1e91f37f() {
  return __cxx_static_address_0a0e37484787d6ef1e91f37f.reference || (__cxx_static_address_0a0e37484787d6ef1e91f37f.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_2f6bba04f084b60c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_cf89a8d69b44bb78 = ((u32(((u32(2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5d2141905e878165af7f19c() {
  return __cxx_static_address_c5d2141905e878165af7f19c.reference || (__cxx_static_address_c5d2141905e878165af7f19c.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_cf89a8d69b44bb78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_877e0766bf573788 = ((u32(((u32(2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1172a49bf86af644f25e6e2a() {
  return __cxx_static_address_1172a49bf86af644f25e6e2a.reference || (__cxx_static_address_1172a49bf86af644f25e6e2a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_877e0766bf573788; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_0ad5f56a1b8dcb79 = ((u32(((u32(2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6721d415b9bf4d843a7a5c9d() {
  return __cxx_static_address_6721d415b9bf4d843a7a5c9d.reference || (__cxx_static_address_6721d415b9bf4d843a7a5c9d.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_0ad5f56a1b8dcb79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_c3cc81b98f1f7e45 = ((u32(((u32(2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b7ca7370b012e2223a17d70() {
  return __cxx_static_address_7b7ca7370b012e2223a17d70.reference || (__cxx_static_address_7b7ca7370b012e2223a17d70.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_c3cc81b98f1f7e45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_235098dee2329658 = ((u32(((u32(2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81310d2a6736593e8a0174de() {
  return __cxx_static_address_81310d2a6736593e8a0174de.reference || (__cxx_static_address_81310d2a6736593e8a0174de.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_235098dee2329658; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_c21c4b481b3ad654 = ((u32(((u32(2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a0ee26ddd682b0f3bdc2f95() {
  return __cxx_static_address_3a0ee26ddd682b0f3bdc2f95.reference || (__cxx_static_address_3a0ee26ddd682b0f3bdc2f95.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_c21c4b481b3ad654; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_435b441e5acef9a0 = ((u32(((u32(2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffef355bf26c4427e33181ee() {
  return __cxx_static_address_ffef355bf26c4427e33181ee.reference || (__cxx_static_address_ffef355bf26c4427e33181ee.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_435b441e5acef9a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_ddd5b93159fec399 = ((u32(((u32(2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bac424288f6b0ec6ebf12d09() {
  return __cxx_static_address_bac424288f6b0ec6ebf12d09.reference || (__cxx_static_address_bac424288f6b0ec6ebf12d09.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_ddd5b93159fec399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_404ec91497014c6b = ((u32(((u32(2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71ce9a3a76410cb977e2f10d() {
  return __cxx_static_address_71ce9a3a76410cb977e2f10d.reference || (__cxx_static_address_71ce9a3a76410cb977e2f10d.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_404ec91497014c6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_5a1d27bc383e7178 = ((u32(((u32(2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e7b7570d43bda5a60a57eea() {
  return __cxx_static_address_1e7b7570d43bda5a60a57eea.reference || (__cxx_static_address_1e7b7570d43bda5a60a57eea.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_5a1d27bc383e7178; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_c7727b9e5d453f9a = ((u32(((u32(2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1181e1072fe827bffaedb524() {
  return __cxx_static_address_1181e1072fe827bffaedb524.reference || (__cxx_static_address_1181e1072fe827bffaedb524.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_c7727b9e5d453f9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_9ea71b46193ab215 = ((u32(((u32(2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a388a6a49c99ccc3412429ab() {
  return __cxx_static_address_a388a6a49c99ccc3412429ab.reference || (__cxx_static_address_a388a6a49c99ccc3412429ab.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_9ea71b46193ab215; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_f1dcd772f108cadb = ((u32(((u32(2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e99a3468a22a89cc5d774db5() {
  return __cxx_static_address_e99a3468a22a89cc5d774db5.reference || (__cxx_static_address_e99a3468a22a89cc5d774db5.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_f1dcd772f108cadb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_0dbc74358bde13fa = ((u32(((u32(2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01c9b7dad0d74830b0b14701() {
  return __cxx_static_address_01c9b7dad0d74830b0b14701.reference || (__cxx_static_address_01c9b7dad0d74830b0b14701.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_0dbc74358bde13fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_012b61db7e555d7e = ((u32(((u32(2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b1e889b2c17b78f71ec69d2() {
  return __cxx_static_address_5b1e889b2c17b78f71ec69d2.reference || (__cxx_static_address_5b1e889b2c17b78f71ec69d2.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_012b61db7e555d7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_fe76631021ff1f1d = ((u32(((u32(2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c35916e77de76fb513f9db07() {
  return __cxx_static_address_c35916e77de76fb513f9db07.reference || (__cxx_static_address_c35916e77de76fb513f9db07.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_fe76631021ff1f1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_c0e20dc60a37e0d6 = ((u32(((u32(2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f908c3de5d03edb9e3807753() {
  return __cxx_static_address_f908c3de5d03edb9e3807753.reference || (__cxx_static_address_f908c3de5d03edb9e3807753.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_c0e20dc60a37e0d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_d9c1f8968f65d54f = ((u32(((u32(2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_626f67e218777fa835dbfd3a() {
  return __cxx_static_address_626f67e218777fa835dbfd3a.reference || (__cxx_static_address_626f67e218777fa835dbfd3a.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_d9c1f8968f65d54f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_5cc8be775b77efe8 = ((u32(((u32(2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebc7c2568f0c8d7740089c9a() {
  return __cxx_static_address_ebc7c2568f0c8d7740089c9a.reference || (__cxx_static_address_ebc7c2568f0c8d7740089c9a.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_5cc8be775b77efe8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_4f36dfec4b5fd74f = ((u32(((u32(2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f929b05e7f399a2325073538() {
  return __cxx_static_address_f929b05e7f399a2325073538.reference || (__cxx_static_address_f929b05e7f399a2325073538.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_4f36dfec4b5fd74f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_2d78189db11ac73a = ((u32(((u32(2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3a5f674a1d30eeadeac9e25() {
  return __cxx_static_address_e3a5f674a1d30eeadeac9e25.reference || (__cxx_static_address_e3a5f674a1d30eeadeac9e25.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_2d78189db11ac73a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_fed42c05659bee0a = ((u32(((u32(2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c13dd8f9457126a608abc0f7() {
  return __cxx_static_address_c13dd8f9457126a608abc0f7.reference || (__cxx_static_address_c13dd8f9457126a608abc0f7.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_fed42c05659bee0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_3696257dd040aec4 = ((u32(((u32(2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f969d66f3a7f171bf72c48c7() {
  return __cxx_static_address_f969d66f3a7f171bf72c48c7.reference || (__cxx_static_address_f969d66f3a7f171bf72c48c7.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_3696257dd040aec4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_b3dc9c2a2317d91a = ((u32(((u32(2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbc69c34ac0e13f2cb3dbd98() {
  return __cxx_static_address_cbc69c34ac0e13f2cb3dbd98.reference || (__cxx_static_address_cbc69c34ac0e13f2cb3dbd98.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_b3dc9c2a2317d91a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_0657550f7e48fea9 = ((u32(((u32(2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdf7cc02f7c3a68712db422f() {
  return __cxx_static_address_bdf7cc02f7c3a68712db422f.reference || (__cxx_static_address_bdf7cc02f7c3a68712db422f.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_0657550f7e48fea9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_41d507c0e749991d = ((u32(((u32(2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78e2927982af53da3fed1789() {
  return __cxx_static_address_78e2927982af53da3fed1789.reference || (__cxx_static_address_78e2927982af53da3fed1789.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_41d507c0e749991d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_ccbb51b85adb6fe2 = ((u32(((u32(2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_040af4f960554d3af45ee704() {
  return __cxx_static_address_040af4f960554d3af45ee704.reference || (__cxx_static_address_040af4f960554d3af45ee704.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_ccbb51b85adb6fe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_d48bae04bdb86946 = ((u32(((u32(2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c505ad8bfdcfcee04fbe87c7() {
  return __cxx_static_address_c505ad8bfdcfcee04fbe87c7.reference || (__cxx_static_address_c505ad8bfdcfcee04fbe87c7.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_d48bae04bdb86946; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_01a5b4ce6bc1aaf7 = ((u32(((u32(2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c603fd36d64f88c45c4e03fd() {
  return __cxx_static_address_c603fd36d64f88c45c4e03fd.reference || (__cxx_static_address_c603fd36d64f88c45c4e03fd.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_01a5b4ce6bc1aaf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_adb997742355b863 = ((u32(((u32(2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_995b852ad54a0b86a849b2fa() {
  return __cxx_static_address_995b852ad54a0b86a849b2fa.reference || (__cxx_static_address_995b852ad54a0b86a849b2fa.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_adb997742355b863; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_320b86b68efdbb87 = ((u32(((u32(2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75b8242d56f72952e2fd764c() {
  return __cxx_static_address_75b8242d56f72952e2fd764c.reference || (__cxx_static_address_75b8242d56f72952e2fd764c.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_320b86b68efdbb87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_4d72bd4432e7c239 = ((u32(((u32(2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f395cd3f3a97843b3814735a() {
  return __cxx_static_address_f395cd3f3a97843b3814735a.reference || (__cxx_static_address_f395cd3f3a97843b3814735a.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_4d72bd4432e7c239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_beb9197226c6d796 = ((u32(((u32(2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce699f79a492921d1c2f0134() {
  return __cxx_static_address_ce699f79a492921d1c2f0134.reference || (__cxx_static_address_ce699f79a492921d1c2f0134.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_beb9197226c6d796; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_b9feafcfe4b52842 = ((u32(((u32(2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fad59f85ef044866e89d1e8f() {
  return __cxx_static_address_fad59f85ef044866e89d1e8f.reference || (__cxx_static_address_fad59f85ef044866e89d1e8f.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_b9feafcfe4b52842; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_37a3b243d3ae5fb7 = ((u32(((u32(2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40cdb065f259a4e72962aaf5() {
  return __cxx_static_address_40cdb065f259a4e72962aaf5.reference || (__cxx_static_address_40cdb065f259a4e72962aaf5.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_37a3b243d3ae5fb7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_6b57dd883c11ffc3 = ((u32(((u32(2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46834a779146fed543b35c46() {
  return __cxx_static_address_46834a779146fed543b35c46.reference || (__cxx_static_address_46834a779146fed543b35c46.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_6b57dd883c11ffc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_e8a31fb9027718b5 = ((u32(((u32(2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_148e8a0dcf5fa5162be97683() {
  return __cxx_static_address_148e8a0dcf5fa5162be97683.reference || (__cxx_static_address_148e8a0dcf5fa5162be97683.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_e8a31fb9027718b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_61c9483e770bcf0d = ((u32(((u32(2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5b48dbe697c2d6fed24e36b() {
  return __cxx_static_address_e5b48dbe697c2d6fed24e36b.reference || (__cxx_static_address_e5b48dbe697c2d6fed24e36b.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_61c9483e770bcf0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_c385d9c648a4c340 = ((u32(((u32(2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a1a2d47a743cdb3951ce930() {
  return __cxx_static_address_2a1a2d47a743cdb3951ce930.reference || (__cxx_static_address_2a1a2d47a743cdb3951ce930.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_c385d9c648a4c340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_08dbdb8be28e7a4d = ((u32(((u32(2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cf9e33f9c3f905492e23c81() {
  return __cxx_static_address_4cf9e33f9c3f905492e23c81.reference || (__cxx_static_address_4cf9e33f9c3f905492e23c81.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_08dbdb8be28e7a4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_6f576b5fb628df8c = ((u32(((u32(2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_636755897a62e5c17131235b() {
  return __cxx_static_address_636755897a62e5c17131235b.reference || (__cxx_static_address_636755897a62e5c17131235b.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_6f576b5fb628df8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_722ab7c1fdb50ca3 = ((u32(((u32(2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ff9abd4ecc534f9a60f75f5() {
  return __cxx_static_address_2ff9abd4ecc534f9a60f75f5.reference || (__cxx_static_address_2ff9abd4ecc534f9a60f75f5.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_722ab7c1fdb50ca3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_13b850b1c200dc65 = ((u32(((u32(2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a899c58a0b5837b5a1c3e75() {
  return __cxx_static_address_2a899c58a0b5837b5a1c3e75.reference || (__cxx_static_address_2a899c58a0b5837b5a1c3e75.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_13b850b1c200dc65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_d65b6f5b86202f48 = ((u32(((u32(2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46bc84761b6c3569b363c278() {
  return __cxx_static_address_46bc84761b6c3569b363c278.reference || (__cxx_static_address_46bc84761b6c3569b363c278.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_d65b6f5b86202f48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_d84d85772bce67ff = ((u32(((u32(2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e90b089d799f15fbb75d41fa() {
  return __cxx_static_address_e90b089d799f15fbb75d41fa.reference || (__cxx_static_address_e90b089d799f15fbb75d41fa.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_d84d85772bce67ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_931e67615b45f589 = ((u32(((u32(2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ef9f22d3e3af4520e3c5954() {
  return __cxx_static_address_7ef9f22d3e3af4520e3c5954.reference || (__cxx_static_address_7ef9f22d3e3af4520e3c5954.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_931e67615b45f589; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_910e483ab1e825c6 = ((u32(((u32(2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0857896678edc8bd81969cf() {
  return __cxx_static_address_e0857896678edc8bd81969cf.reference || (__cxx_static_address_e0857896678edc8bd81969cf.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_910e483ab1e825c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_bbad030e1be5db8a = ((u32(((u32(2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f18bf372b1069d8318de7e69() {
  return __cxx_static_address_f18bf372b1069d8318de7e69.reference || (__cxx_static_address_f18bf372b1069d8318de7e69.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_bbad030e1be5db8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_80cbe992552efb96 = ((u32(((u32(2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4550fa1aadb1b89a711af2d() {
  return __cxx_static_address_c4550fa1aadb1b89a711af2d.reference || (__cxx_static_address_c4550fa1aadb1b89a711af2d.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_80cbe992552efb96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_1a86b97a148f1d3c = ((u32(((u32(2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22a74160aaa3be7baa84ea43() {
  return __cxx_static_address_22a74160aaa3be7baa84ea43.reference || (__cxx_static_address_22a74160aaa3be7baa84ea43.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_1a86b97a148f1d3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_f41f3689aa0f5bcb = ((u32(((u32(2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5160c5eb9e0b2ca98d875c79() {
  return __cxx_static_address_5160c5eb9e0b2ca98d875c79.reference || (__cxx_static_address_5160c5eb9e0b2ca98d875c79.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_f41f3689aa0f5bcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_d5457f3b9ad76454 = ((u32(((u32(2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c43be243bd9350b07d39345c() {
  return __cxx_static_address_c43be243bd9350b07d39345c.reference || (__cxx_static_address_c43be243bd9350b07d39345c.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_d5457f3b9ad76454; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_911719122be4f9ba = ((u32(((u32(2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86e73cf8a1e1876841423a8f() {
  return __cxx_static_address_86e73cf8a1e1876841423a8f.reference || (__cxx_static_address_86e73cf8a1e1876841423a8f.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_911719122be4f9ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_d803a4c81c8b8050 = ((u32(((u32(2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8a9498d42ac4f2a38a4a2bc() {
  return __cxx_static_address_f8a9498d42ac4f2a38a4a2bc.reference || (__cxx_static_address_f8a9498d42ac4f2a38a4a2bc.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_d803a4c81c8b8050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_73e1b58f11113db5 = ((u32(((u32(2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfe7e4752f099e190811b054() {
  return __cxx_static_address_dfe7e4752f099e190811b054.reference || (__cxx_static_address_dfe7e4752f099e190811b054.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_73e1b58f11113db5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_24faacfd1d9a5622 = ((u32(((u32(2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1a7699e9cf62654320afef4() {
  return __cxx_static_address_d1a7699e9cf62654320afef4.reference || (__cxx_static_address_d1a7699e9cf62654320afef4.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_24faacfd1d9a5622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_9e236e95253cbd48 = ((u32(((u32(2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5703daa7353a7e461384711() {
  return __cxx_static_address_e5703daa7353a7e461384711.reference || (__cxx_static_address_e5703daa7353a7e461384711.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_9e236e95253cbd48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_938cb3dd9e317b1b = ((u32(((u32(2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f97b699251c3268461d1dc54() {
  return __cxx_static_address_f97b699251c3268461d1dc54.reference || (__cxx_static_address_f97b699251c3268461d1dc54.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_938cb3dd9e317b1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_407a4df7e470518a = ((u32(((u32(2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_747c75c21d2302a8316deee4() {
  return __cxx_static_address_747c75c21d2302a8316deee4.reference || (__cxx_static_address_747c75c21d2302a8316deee4.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_407a4df7e470518a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_8ec97c0ad1eacdee = ((u32(((u32(2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9f235aee940e0e6f2f7864f() {
  return __cxx_static_address_a9f235aee940e0e6f2f7864f.reference || (__cxx_static_address_a9f235aee940e0e6f2f7864f.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_8ec97c0ad1eacdee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_688adcbf26f9b9ec = ((u32(((u32(2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06378dda10b9afe5d5e28e4f() {
  return __cxx_static_address_06378dda10b9afe5d5e28e4f.reference || (__cxx_static_address_06378dda10b9afe5d5e28e4f.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_688adcbf26f9b9ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_12d78881094dc6bc = ((u32(((u32(2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab5dfd32d13b50b576f135ab() {
  return __cxx_static_address_ab5dfd32d13b50b576f135ab.reference || (__cxx_static_address_ab5dfd32d13b50b576f135ab.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_12d78881094dc6bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_bfcbd41fa7391263 = ((u32(((u32(2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40113894257e00170efa2b4c() {
  return __cxx_static_address_40113894257e00170efa2b4c.reference || (__cxx_static_address_40113894257e00170efa2b4c.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_bfcbd41fa7391263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_52f3373787a0e723 = ((u32(((u32(2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9258da58430a1f924108cd03() {
  return __cxx_static_address_9258da58430a1f924108cd03.reference || (__cxx_static_address_9258da58430a1f924108cd03.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_52f3373787a0e723; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_1d5d37f97ff29cf3 = ((u32(((u32(2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76c0911a8c3831dbb582af13() {
  return __cxx_static_address_76c0911a8c3831dbb582af13.reference || (__cxx_static_address_76c0911a8c3831dbb582af13.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_1d5d37f97ff29cf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_993033b46c9c0092 = ((u32(((u32(2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02847cbf0a4a66bc8123f674() {
  return __cxx_static_address_02847cbf0a4a66bc8123f674.reference || (__cxx_static_address_02847cbf0a4a66bc8123f674.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_993033b46c9c0092; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_d2f9e93f322f3b85 = ((u32(((u32(2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81d333c7d2a607f130abe49b() {
  return __cxx_static_address_81d333c7d2a607f130abe49b.reference || (__cxx_static_address_81d333c7d2a607f130abe49b.reference = {
    __cReference: true,
    get value() { return TIP____header_global_d2f9e93f322f3b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_d362f491d089a5fb = ((u32(((u32(2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_474fa2db302d24f326a92a86() {
  return __cxx_static_address_474fa2db302d24f326a92a86.reference || (__cxx_static_address_474fa2db302d24f326a92a86.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_d362f491d089a5fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_310682dae1b2a171 = ((u32(((u32(2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d81044afb0daafeb62882808() {
  return __cxx_static_address_d81044afb0daafeb62882808.reference || (__cxx_static_address_d81044afb0daafeb62882808.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_310682dae1b2a171; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_bc6831e2297d642a = ((u32(((u32(2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0165cefba9917ea108d56d3f() {
  return __cxx_static_address_0165cefba9917ea108d56d3f.reference || (__cxx_static_address_0165cefba9917ea108d56d3f.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_bc6831e2297d642a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_6058c361f4360e79 = ((u32(((u32(2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e4c8a7016537619e71e4e72() {
  return __cxx_static_address_9e4c8a7016537619e71e4e72.reference || (__cxx_static_address_9e4c8a7016537619e71e4e72.reference = {
    __cReference: true,
    get value() { return RPG____header_global_6058c361f4360e79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_6988152251f5753d = ((u32(((u32(2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_485fbf9532a91731400538c6() {
  return __cxx_static_address_485fbf9532a91731400538c6.reference || (__cxx_static_address_485fbf9532a91731400538c6.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_6988152251f5753d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_5b68bf560416e408 = ((u32(((u32(2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0b54e23b2199322d5192c32() {
  return __cxx_static_address_c0b54e23b2199322d5192c32.reference || (__cxx_static_address_c0b54e23b2199322d5192c32.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_5b68bf560416e408; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_ea987735aef6ab42 = ((u32(((u32(2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_945f10853fc6f99868c67ce4() {
  return __cxx_static_address_945f10853fc6f99868c67ce4.reference || (__cxx_static_address_945f10853fc6f99868c67ce4.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_ea987735aef6ab42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_937bf4655b7c4a9a = ((u32(((u32(2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed8cb29d0db4a1c783f7a629() {
  return __cxx_static_address_ed8cb29d0db4a1c783f7a629.reference || (__cxx_static_address_ed8cb29d0db4a1c783f7a629.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_937bf4655b7c4a9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_bfe2d8ec32463d4f = ((u32(((u32(2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e94d9eb78c63d50f9d458eea() {
  return __cxx_static_address_e94d9eb78c63d50f9d458eea.reference || (__cxx_static_address_e94d9eb78c63d50f9d458eea.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_bfe2d8ec32463d4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_ecc6a06878f3cc9a = ((u32(((u32(2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe966ef1b93e657c7e05c3da() {
  return __cxx_static_address_fe966ef1b93e657c7e05c3da.reference || (__cxx_static_address_fe966ef1b93e657c7e05c3da.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_ecc6a06878f3cc9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_128c3a0e8b139a0b = ((u32(((u32(2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_553ed9cfdaf303086ae6c7c6() {
  return __cxx_static_address_553ed9cfdaf303086ae6c7c6.reference || (__cxx_static_address_553ed9cfdaf303086ae6c7c6.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_128c3a0e8b139a0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_31247abb032e00df = ((u32(((u32(2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81f3ae3defc016c96a9c685f() {
  return __cxx_static_address_81f3ae3defc016c96a9c685f.reference || (__cxx_static_address_81f3ae3defc016c96a9c685f.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_31247abb032e00df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_761e97dadd62ebbb = ((u32(((u32(2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cecbfe107a44eccc12b1a11c() {
  return __cxx_static_address_cecbfe107a44eccc12b1a11c.reference || (__cxx_static_address_cecbfe107a44eccc12b1a11c.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_761e97dadd62ebbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_832936b198347db6 = ((u32(((u32(2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5ed1fe22289c45e78bf4398() {
  return __cxx_static_address_e5ed1fe22289c45e78bf4398.reference || (__cxx_static_address_e5ed1fe22289c45e78bf4398.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_832936b198347db6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_c685b5ea37acbd2c = ((u32(((u32(2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccbd0b9a0504c437139e40ce() {
  return __cxx_static_address_ccbd0b9a0504c437139e40ce.reference || (__cxx_static_address_ccbd0b9a0504c437139e40ce.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_c685b5ea37acbd2c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_159129389eee4521 = ((u32(((u32(2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b82d02c6fa5f2ac07858141() {
  return __cxx_static_address_3b82d02c6fa5f2ac07858141.reference || (__cxx_static_address_3b82d02c6fa5f2ac07858141.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_159129389eee4521; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_59e5e37bc5bb8ce1 = ((u32(((u32(2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ebc48a1e886f9425d07e901() {
  return __cxx_static_address_5ebc48a1e886f9425d07e901.reference || (__cxx_static_address_5ebc48a1e886f9425d07e901.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_59e5e37bc5bb8ce1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_3689aabfc916833a = ((u32(((u32(2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28d0577c864318953f4eb998() {
  return __cxx_static_address_28d0577c864318953f4eb998.reference || (__cxx_static_address_28d0577c864318953f4eb998.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_3689aabfc916833a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_fc531ee15bee7063 = ((u32(((u32(3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f68f98a2dd0bdaeb13eedbd4() {
  return __cxx_static_address_f68f98a2dd0bdaeb13eedbd4.reference || (__cxx_static_address_f68f98a2dd0bdaeb13eedbd4.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_fc531ee15bee7063; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_cca6f3a64d9c2129 = ((u32(((u32(3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70877122287561dfe4619261() {
  return __cxx_static_address_70877122287561dfe4619261.reference || (__cxx_static_address_70877122287561dfe4619261.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_cca6f3a64d9c2129; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_f4b7cdf30bfc1518 = ((u32(((u32(3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8630026e7bed7257622af9a1() {
  return __cxx_static_address_8630026e7bed7257622af9a1.reference || (__cxx_static_address_8630026e7bed7257622af9a1.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_f4b7cdf30bfc1518; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_d65e17329b4bc51c = ((u32(((u32(3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_350627ca2f7330d568bf8fe4() {
  return __cxx_static_address_350627ca2f7330d568bf8fe4.reference || (__cxx_static_address_350627ca2f7330d568bf8fe4.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_d65e17329b4bc51c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_a872093e211ae3d8 = ((u32(((u32(3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_430bb0f08d75910007fa8a6e() {
  return __cxx_static_address_430bb0f08d75910007fa8a6e.reference || (__cxx_static_address_430bb0f08d75910007fa8a6e.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_a872093e211ae3d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_bf8e5358040026bb = ((u32(((u32(3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a294c74b6252f48df252a85() {
  return __cxx_static_address_5a294c74b6252f48df252a85.reference || (__cxx_static_address_5a294c74b6252f48df252a85.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_bf8e5358040026bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_eaf67d0eb1488b0b = ((u32(((u32(3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f83ca6b3b49263087a7e279() {
  return __cxx_static_address_8f83ca6b3b49263087a7e279.reference || (__cxx_static_address_8f83ca6b3b49263087a7e279.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_eaf67d0eb1488b0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_a975f9043a2ea906 = ((u32(((u32(3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87136e1bc4c5efb387a61122() {
  return __cxx_static_address_87136e1bc4c5efb387a61122.reference || (__cxx_static_address_87136e1bc4c5efb387a61122.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_a975f9043a2ea906; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_fe067bdc688b1569 = ((u32(((u32(3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cf3eb47297c9a684ba92066() {
  return __cxx_static_address_0cf3eb47297c9a684ba92066.reference || (__cxx_static_address_0cf3eb47297c9a684ba92066.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_fe067bdc688b1569; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_a0103361ce7b8164 = ((u32(((u32(3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e37da051fbec9012a9213f7c() {
  return __cxx_static_address_e37da051fbec9012a9213f7c.reference || (__cxx_static_address_e37da051fbec9012a9213f7c.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_a0103361ce7b8164; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_f6e8a92f9f66a379 = ((u32(((u32(3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebd469ff0612fe9b8fdbe86e() {
  return __cxx_static_address_ebd469ff0612fe9b8fdbe86e.reference || (__cxx_static_address_ebd469ff0612fe9b8fdbe86e.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_f6e8a92f9f66a379; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_bb49df8627613e45 = ((u32(((u32(3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a50e31c978f3fee7eb5afa() {
  return __cxx_static_address_98a50e31c978f3fee7eb5afa.reference || (__cxx_static_address_98a50e31c978f3fee7eb5afa.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_bb49df8627613e45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_9a6c0c1363874ecd = ((u32(((u32(3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc9bea1c5bc2fe4c43ae3b0a() {
  return __cxx_static_address_fc9bea1c5bc2fe4c43ae3b0a.reference || (__cxx_static_address_fc9bea1c5bc2fe4c43ae3b0a.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_9a6c0c1363874ecd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_042032afb6e57a8c = ((u32(((u32(3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7955e62952cd84366050c6b0() {
  return __cxx_static_address_7955e62952cd84366050c6b0.reference || (__cxx_static_address_7955e62952cd84366050c6b0.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_042032afb6e57a8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_e9b0dc9e43bc6303 = ((u32(((u32(3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef58e3e0f2028adb6c388241() {
  return __cxx_static_address_ef58e3e0f2028adb6c388241.reference || (__cxx_static_address_ef58e3e0f2028adb6c388241.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_e9b0dc9e43bc6303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_e97a9e860c6ff6e1 = ((u32(((u32(3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a47807b1b4cef6c92212b771() {
  return __cxx_static_address_a47807b1b4cef6c92212b771.reference || (__cxx_static_address_a47807b1b4cef6c92212b771.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_e97a9e860c6ff6e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_be7ac44ffeeaecf1 = ((u32(((u32(3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab7d69eecaa7086221f53ca3() {
  return __cxx_static_address_ab7d69eecaa7086221f53ca3.reference || (__cxx_static_address_ab7d69eecaa7086221f53ca3.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_be7ac44ffeeaecf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_5b6771105add47c4 = ((u32(((u32(3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1c87510f16bb8325e2b98ec() {
  return __cxx_static_address_d1c87510f16bb8325e2b98ec.reference || (__cxx_static_address_d1c87510f16bb8325e2b98ec.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_5b6771105add47c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_c0b6beadf1e9daa2 = ((u32(((u32(3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_066e4a92d2c458822bfb482f() {
  return __cxx_static_address_066e4a92d2c458822bfb482f.reference || (__cxx_static_address_066e4a92d2c458822bfb482f.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_c0b6beadf1e9daa2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_fc1221c431885089 = ((u32(((u32(3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cef99b5a445f21a17134d590() {
  return __cxx_static_address_cef99b5a445f21a17134d590.reference || (__cxx_static_address_cef99b5a445f21a17134d590.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_fc1221c431885089; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_91c9cdd818a5ec76 = ((u32(((u32(3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21f2b3c0a80964253e9de4a1() {
  return __cxx_static_address_21f2b3c0a80964253e9de4a1.reference || (__cxx_static_address_21f2b3c0a80964253e9de4a1.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_91c9cdd818a5ec76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_60e6cee0a478434a = ((u32(((u32(3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_209a166a6e46646505bf06f1() {
  return __cxx_static_address_209a166a6e46646505bf06f1.reference || (__cxx_static_address_209a166a6e46646505bf06f1.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_60e6cee0a478434a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_52ffedc0087ee276 = ((u32(((u32(4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f5a9e607897ecc892aabfb8() {
  return __cxx_static_address_2f5a9e607897ecc892aabfb8.reference || (__cxx_static_address_2f5a9e607897ecc892aabfb8.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_52ffedc0087ee276; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_0dfb0c1da4e16c98 = ((u32(((u32(4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e33fa432c4b0099a3b73e77() {
  return __cxx_static_address_1e33fa432c4b0099a3b73e77.reference || (__cxx_static_address_1e33fa432c4b0099a3b73e77.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_0dfb0c1da4e16c98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_934ac0d56eacac7c = ((u32(((u32(4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fc4c609fce7e8c66a47d0ed() {
  return __cxx_static_address_3fc4c609fce7e8c66a47d0ed.reference || (__cxx_static_address_3fc4c609fce7e8c66a47d0ed.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_934ac0d56eacac7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_482f1f33cfcbf3de = ((u32(((u32(4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db33c7fe7643a818a5b338ca() {
  return __cxx_static_address_db33c7fe7643a818a5b338ca.reference || (__cxx_static_address_db33c7fe7643a818a5b338ca.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_482f1f33cfcbf3de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_2bca2cc2bb45efe6 = ((u32(((u32(4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22c33a3f37974aacedc34796() {
  return __cxx_static_address_22c33a3f37974aacedc34796.reference || (__cxx_static_address_22c33a3f37974aacedc34796.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_2bca2cc2bb45efe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_8285850a6655f9dc = ((u32(((u32(4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d535270d721b7095a9535efb() {
  return __cxx_static_address_d535270d721b7095a9535efb.reference || (__cxx_static_address_d535270d721b7095a9535efb.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_8285850a6655f9dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_3313c92ca1882432 = ((u32(((u32(4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e09ecbf746539852ce3dfb3() {
  return __cxx_static_address_5e09ecbf746539852ce3dfb3.reference || (__cxx_static_address_5e09ecbf746539852ce3dfb3.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_3313c92ca1882432; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_8d078f92d2cf68f9 = ((u32(((u32(4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7affd26e47f69c24f127bada() {
  return __cxx_static_address_7affd26e47f69c24f127bada.reference || (__cxx_static_address_7affd26e47f69c24f127bada.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_8d078f92d2cf68f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_93344220fd8b09ba = ((u32(((u32(4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25719d327e257fa8d6f5262c() {
  return __cxx_static_address_25719d327e257fa8d6f5262c.reference || (__cxx_static_address_25719d327e257fa8d6f5262c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_93344220fd8b09ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_39786389d0c6258c = ((u32(((u32(4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d4fb310b116442abfa5c37a() {
  return __cxx_static_address_8d4fb310b116442abfa5c37a.reference || (__cxx_static_address_8d4fb310b116442abfa5c37a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_39786389d0c6258c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_b6494e228df20510 = ((u32(((u32(4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75afe360b883ffa7de27b8e3() {
  return __cxx_static_address_75afe360b883ffa7de27b8e3.reference || (__cxx_static_address_75afe360b883ffa7de27b8e3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_b6494e228df20510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_1722951b687e6710 = ((u32(((u32(4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcb300a44a6ea26141c847f8() {
  return __cxx_static_address_dcb300a44a6ea26141c847f8.reference || (__cxx_static_address_dcb300a44a6ea26141c847f8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_1722951b687e6710; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_2fbe8d6758c6a18d = ((u32(((u32(4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa67e9a26fa64c1504b651e5() {
  return __cxx_static_address_fa67e9a26fa64c1504b651e5.reference || (__cxx_static_address_fa67e9a26fa64c1504b651e5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_2fbe8d6758c6a18d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_bd1948f148c91fd4 = ((u32(((u32(4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ee118cbeee9793877f9f311() {
  return __cxx_static_address_4ee118cbeee9793877f9f311.reference || (__cxx_static_address_4ee118cbeee9793877f9f311.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_bd1948f148c91fd4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_d50b8315d4c6e52f = ((u32(((u32(4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90798e8d07deb706f10828b3() {
  return __cxx_static_address_90798e8d07deb706f10828b3.reference || (__cxx_static_address_90798e8d07deb706f10828b3.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_d50b8315d4c6e52f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_d979787ec6d8156f = ((u32(((u32(4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a69179018526dc0499a0d6e9() {
  return __cxx_static_address_a69179018526dc0499a0d6e9.reference || (__cxx_static_address_a69179018526dc0499a0d6e9.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_d979787ec6d8156f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_e4ee89dc2daf70ed = ((u32(((u32(4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e20a10d9102fe9c23df2330d() {
  return __cxx_static_address_e20a10d9102fe9c23df2330d.reference || (__cxx_static_address_e20a10d9102fe9c23df2330d.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_e4ee89dc2daf70ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_8f1a092ef15514f8 = ((u32(((u32(4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c56c828395b33bf92d854332() {
  return __cxx_static_address_c56c828395b33bf92d854332.reference || (__cxx_static_address_c56c828395b33bf92d854332.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_8f1a092ef15514f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_045f9d9dd8e5c7c4 = ((u32(((u32(4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cfec59120e0b5a598e93d88f() {
  return __cxx_static_address_cfec59120e0b5a598e93d88f.reference || (__cxx_static_address_cfec59120e0b5a598e93d88f.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_045f9d9dd8e5c7c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_de83a0aae13f401d = ((u32(((u32(4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0eca92eac9d70164da0069b() {
  return __cxx_static_address_f0eca92eac9d70164da0069b.reference || (__cxx_static_address_f0eca92eac9d70164da0069b.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_de83a0aae13f401d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_b85c90a7631c98e4 = ((u32(((u32(4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6feb48e8e74f2d5949200bf7() {
  return __cxx_static_address_6feb48e8e74f2d5949200bf7.reference || (__cxx_static_address_6feb48e8e74f2d5949200bf7.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_b85c90a7631c98e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_5187dac9ef9ab4a2 = ((u32(((u32(4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a23bbeddbea880d148cd2fa7() {
  return __cxx_static_address_a23bbeddbea880d148cd2fa7.reference || (__cxx_static_address_a23bbeddbea880d148cd2fa7.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_5187dac9ef9ab4a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_8797757eb83b1cb2 = ((u32(((u32(4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e34be48d4fc4de01f57ced9b() {
  return __cxx_static_address_e34be48d4fc4de01f57ced9b.reference || (__cxx_static_address_e34be48d4fc4de01f57ced9b.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_8797757eb83b1cb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_c82427790f58d7d8 = ((u32(((u32(4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9b2c1f5351a123b49e24504() {
  return __cxx_static_address_e9b2c1f5351a123b49e24504.reference || (__cxx_static_address_e9b2c1f5351a123b49e24504.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_c82427790f58d7d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_d2fee45a8b95a8e2 = ((u32(((u32(4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26f7415d98e54fbfeb00d0d8() {
  return __cxx_static_address_26f7415d98e54fbfeb00d0d8.reference || (__cxx_static_address_26f7415d98e54fbfeb00d0d8.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_d2fee45a8b95a8e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_1969918d22c890ed = ((u32(((u32(4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2da3a98aab7293b48f4eded7() {
  return __cxx_static_address_2da3a98aab7293b48f4eded7.reference || (__cxx_static_address_2da3a98aab7293b48f4eded7.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_1969918d22c890ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_3f64964eecbff415 = ((u32(((u32(4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eba3d05e3a232d19ab4019e0() {
  return __cxx_static_address_eba3d05e3a232d19ab4019e0.reference || (__cxx_static_address_eba3d05e3a232d19ab4019e0.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_3f64964eecbff415; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_ac3530f2a7d320e7 = ((u32(((u32(4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d97ad42b209ce2cdbf8ca588() {
  return __cxx_static_address_d97ad42b209ce2cdbf8ca588.reference || (__cxx_static_address_d97ad42b209ce2cdbf8ca588.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_ac3530f2a7d320e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_9a1548872b4e9ad2 = ((u32(((u32(4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a22e2f9980668bfbf3e5a9dd() {
  return __cxx_static_address_a22e2f9980668bfbf3e5a9dd.reference || (__cxx_static_address_a22e2f9980668bfbf3e5a9dd.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_9a1548872b4e9ad2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_ade868af605d6d52 = ((u32(((u32(4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_723bcff1257377488ab0666d() {
  return __cxx_static_address_723bcff1257377488ab0666d.reference || (__cxx_static_address_723bcff1257377488ab0666d.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_ade868af605d6d52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_19cff1ad50bda34a = ((u32(((u32(4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69a7ef4e9e8de706e1b113c4() {
  return __cxx_static_address_69a7ef4e9e8de706e1b113c4.reference || (__cxx_static_address_69a7ef4e9e8de706e1b113c4.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_19cff1ad50bda34a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_85a08d1754e99e9b = ((u32(((u32(4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_412af787db80a0a2058b61b6() {
  return __cxx_static_address_412af787db80a0a2058b61b6.reference || (__cxx_static_address_412af787db80a0a2058b61b6.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_85a08d1754e99e9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_153cacfea35241e7 = ((u32(((u32(4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_866b04ad40db3d0679a3191c() {
  return __cxx_static_address_866b04ad40db3d0679a3191c.reference || (__cxx_static_address_866b04ad40db3d0679a3191c.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_153cacfea35241e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_fc05ba3735b71538 = ((u32(((u32(4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04cbf32bce125636e75a59f4() {
  return __cxx_static_address_04cbf32bce125636e75a59f4.reference || (__cxx_static_address_04cbf32bce125636e75a59f4.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_fc05ba3735b71538; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_f181c7994bcdf06f = ((u32(((u32(4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5201684fbe0cebd3c8aba676() {
  return __cxx_static_address_5201684fbe0cebd3c8aba676.reference || (__cxx_static_address_5201684fbe0cebd3c8aba676.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_f181c7994bcdf06f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_abb60758d8d32854 = ((u32(((u32(4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f9246ceb12c902a240686d0() {
  return __cxx_static_address_9f9246ceb12c902a240686d0.reference || (__cxx_static_address_9f9246ceb12c902a240686d0.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_abb60758d8d32854; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_f2c1881da56bcf26 = ((u32(((u32(4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf2332c660995f985d4155f2() {
  return __cxx_static_address_cf2332c660995f985d4155f2.reference || (__cxx_static_address_cf2332c660995f985d4155f2.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_f2c1881da56bcf26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_c73482c2c4aa3761 = ((u32(((u32(4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a7e01433d6386e50ffd66a6() {
  return __cxx_static_address_7a7e01433d6386e50ffd66a6.reference || (__cxx_static_address_7a7e01433d6386e50ffd66a6.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_c73482c2c4aa3761; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_66f61a4e3da461d7 = ((u32(((u32(4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_064bbd258baf67385a583459() {
  return __cxx_static_address_064bbd258baf67385a583459.reference || (__cxx_static_address_064bbd258baf67385a583459.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_66f61a4e3da461d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_3506b40f96f7a5f0 = ((u32(((u32(4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81675d6d731e052c7be839cc() {
  return __cxx_static_address_81675d6d731e052c7be839cc.reference || (__cxx_static_address_81675d6d731e052c7be839cc.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_3506b40f96f7a5f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_7526f63ea28b6e0f = ((u32(((u32(4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d33bf0af27f899dbe29590b9() {
  return __cxx_static_address_d33bf0af27f899dbe29590b9.reference || (__cxx_static_address_d33bf0af27f899dbe29590b9.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_7526f63ea28b6e0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_a52daf9cd6c6ff5c = ((u32(((u32(4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce15641c5726bc64326ead9() {
  return __cxx_static_address_7ce15641c5726bc64326ead9.reference || (__cxx_static_address_7ce15641c5726bc64326ead9.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_a52daf9cd6c6ff5c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_0b2c668009b799e7 = ((u32(((u32(4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9c9311eb328b1f52d4c0653() {
  return __cxx_static_address_a9c9311eb328b1f52d4c0653.reference || (__cxx_static_address_a9c9311eb328b1f52d4c0653.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_0b2c668009b799e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_6d805be01a5aac24 = ((u32(((u32(4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1070dde420524ba1eeab75f7() {
  return __cxx_static_address_1070dde420524ba1eeab75f7.reference || (__cxx_static_address_1070dde420524ba1eeab75f7.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_6d805be01a5aac24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_24d84584b2cc3c7a = ((u32(((u32(4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f018e3417773590c224075c() {
  return __cxx_static_address_9f018e3417773590c224075c.reference || (__cxx_static_address_9f018e3417773590c224075c.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_24d84584b2cc3c7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_7b2902545ef882ee = ((u32(((u32(4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9362ee082baf12d7c17d84be() {
  return __cxx_static_address_9362ee082baf12d7c17d84be.reference || (__cxx_static_address_9362ee082baf12d7c17d84be.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_7b2902545ef882ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_4f99f0b5198691a3 = ((u32(((u32(4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25ea88d187d4096d4bebaa51() {
  return __cxx_static_address_25ea88d187d4096d4bebaa51.reference || (__cxx_static_address_25ea88d187d4096d4bebaa51.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_4f99f0b5198691a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_ffb7312d1dbbf75a = ((u32(((u32(4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3edc4bed826a87cd994230ce() {
  return __cxx_static_address_3edc4bed826a87cd994230ce.reference || (__cxx_static_address_3edc4bed826a87cd994230ce.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_ffb7312d1dbbf75a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_6d846696f0c6c7b8 = ((u32(((u32(4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b001f708246f8ac824346ef3() {
  return __cxx_static_address_b001f708246f8ac824346ef3.reference || (__cxx_static_address_b001f708246f8ac824346ef3.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_6d846696f0c6c7b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_7afe6ad9d05039b2 = ((u32(((u32(4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f4dc83769e16b9416d4cde8() {
  return __cxx_static_address_1f4dc83769e16b9416d4cde8.reference || (__cxx_static_address_1f4dc83769e16b9416d4cde8.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_7afe6ad9d05039b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_67daf98d6a42fdbf = ((u32(((u32(4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b9c5280f89966f8f24dded7() {
  return __cxx_static_address_0b9c5280f89966f8f24dded7.reference || (__cxx_static_address_0b9c5280f89966f8f24dded7.reference = {
    __cReference: true,
    get value() { return MAN____header_global_67daf98d6a42fdbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_1564af58a159150f = ((u32(((u32(4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d7d393fd37b64404c2e97f4() {
  return __cxx_static_address_9d7d393fd37b64404c2e97f4.reference || (__cxx_static_address_9d7d393fd37b64404c2e97f4.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_1564af58a159150f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_4ccf6be6b1d6c0be = ((u32(((u32(4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ab6805bec0d6f1a15303572() {
  return __cxx_static_address_3ab6805bec0d6f1a15303572.reference || (__cxx_static_address_3ab6805bec0d6f1a15303572.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_4ccf6be6b1d6c0be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_cf34d744369ff9e0 = ((u32(((u32(4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f7e49b9c1cdbfc2c0126a8() {
  return __cxx_static_address_f8f7e49b9c1cdbfc2c0126a8.reference || (__cxx_static_address_f8f7e49b9c1cdbfc2c0126a8.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_cf34d744369ff9e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_19d5e32bd5fb143c = ((u32(((u32(4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f52ccd6030d736b983f77448() {
  return __cxx_static_address_f52ccd6030d736b983f77448.reference || (__cxx_static_address_f52ccd6030d736b983f77448.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_19d5e32bd5fb143c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_6f723825398759ca = ((u32(((u32(4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60dc144488224f993e8dafff() {
  return __cxx_static_address_60dc144488224f993e8dafff.reference || (__cxx_static_address_60dc144488224f993e8dafff.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_6f723825398759ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_c88dbf03ddfd0db7 = ((u32(((u32(4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30498df1c4b9d7261946cca3() {
  return __cxx_static_address_30498df1c4b9d7261946cca3.reference || (__cxx_static_address_30498df1c4b9d7261946cca3.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_c88dbf03ddfd0db7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_d0cdcf48635e9fa8 = ((u32(((u32(4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55ec106f8acf624579f33c76() {
  return __cxx_static_address_55ec106f8acf624579f33c76.reference || (__cxx_static_address_55ec106f8acf624579f33c76.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_d0cdcf48635e9fa8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_69a9d51b5a4dc483 = ((u32(((u32(4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df57d212bbf591d19728525c() {
  return __cxx_static_address_df57d212bbf591d19728525c.reference || (__cxx_static_address_df57d212bbf591d19728525c.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_69a9d51b5a4dc483; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_f21d55458458ef39 = ((u32(((u32(5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_062de1a4bb9c9ef8f7ccfd45() {
  return __cxx_static_address_062de1a4bb9c9ef8f7ccfd45.reference || (__cxx_static_address_062de1a4bb9c9ef8f7ccfd45.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_f21d55458458ef39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_948fde8be6e43a65 = ((u32(((u32(5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9840c892ce10e4d46d09d4c0() {
  return __cxx_static_address_9840c892ce10e4d46d09d4c0.reference || (__cxx_static_address_9840c892ce10e4d46d09d4c0.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_948fde8be6e43a65; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_b9cc5b224cc03d77 = ((u32(((u32(5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a79b628891b83d688a5e7f74() {
  return __cxx_static_address_a79b628891b83d688a5e7f74.reference || (__cxx_static_address_a79b628891b83d688a5e7f74.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_b9cc5b224cc03d77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_898c3f148a660eee = ((u32(((u32(5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5247aa34e5def751259d5de() {
  return __cxx_static_address_b5247aa34e5def751259d5de.reference || (__cxx_static_address_b5247aa34e5def751259d5de.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_898c3f148a660eee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_501da2775905478a = ((u32(((u32(5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54a589900bdba3a5aac48e57() {
  return __cxx_static_address_54a589900bdba3a5aac48e57.reference || (__cxx_static_address_54a589900bdba3a5aac48e57.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_501da2775905478a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_00b470a91b84104b = ((u32(((u32(5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13eb1619f3ab7fb2ab6056a0() {
  return __cxx_static_address_13eb1619f3ab7fb2ab6056a0.reference || (__cxx_static_address_13eb1619f3ab7fb2ab6056a0.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_00b470a91b84104b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_9ec26c005830afff = ((u32(((u32(5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6cd21a6f07a91b405518ef1() {
  return __cxx_static_address_c6cd21a6f07a91b405518ef1.reference || (__cxx_static_address_c6cd21a6f07a91b405518ef1.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_9ec26c005830afff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_5b9a6baff95f4985 = ((u32(((u32(5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2860bfae8e8e54dd3567d16() {
  return __cxx_static_address_b2860bfae8e8e54dd3567d16.reference || (__cxx_static_address_b2860bfae8e8e54dd3567d16.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_5b9a6baff95f4985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_62a54f7655136014 = ((u32(((u32(5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4a937d34343aad344200fe0() {
  return __cxx_static_address_f4a937d34343aad344200fe0.reference || (__cxx_static_address_f4a937d34343aad344200fe0.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_62a54f7655136014; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_58b42171d1f79038 = ((u32(((u32(5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e925aada574f591b05259f9() {
  return __cxx_static_address_5e925aada574f591b05259f9.reference || (__cxx_static_address_5e925aada574f591b05259f9.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_58b42171d1f79038; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_77d6f753fd9ef9f5 = ((u32(((u32(5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9900262067d844529684b12() {
  return __cxx_static_address_e9900262067d844529684b12.reference || (__cxx_static_address_e9900262067d844529684b12.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_77d6f753fd9ef9f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_333a7aad25292fa4 = ((u32(((u32(1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5c6de14a33ceecd47c66d28() {
  return __cxx_static_address_d5c6de14a33ceecd47c66d28.reference || (__cxx_static_address_d5c6de14a33ceecd47c66d28.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_333a7aad25292fa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_e74e3cb332e1332f = ((u32(((u32(5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42565ab8796515b58ed403a7() {
  return __cxx_static_address_42565ab8796515b58ed403a7.reference || (__cxx_static_address_42565ab8796515b58ed403a7.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_e74e3cb332e1332f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_7fddc01aaa4d4541 = ((u32(((u32(5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d09adf3ff4f4e09d7078343() {
  return __cxx_static_address_8d09adf3ff4f4e09d7078343.reference || (__cxx_static_address_8d09adf3ff4f4e09d7078343.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_7fddc01aaa4d4541; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_147b0f946691e4d0 = ((u32(((u32(5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3e173db40f51d7be609d3ff() {
  return __cxx_static_address_d3e173db40f51d7be609d3ff.reference || (__cxx_static_address_d3e173db40f51d7be609d3ff.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_147b0f946691e4d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_180bdfeb01a738d4 = ((u32(((u32(5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5270438c6271bc5e56472ccf() {
  return __cxx_static_address_5270438c6271bc5e56472ccf.reference || (__cxx_static_address_5270438c6271bc5e56472ccf.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_180bdfeb01a738d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_69e04c7ec24dae0c = ((u32(((u32(5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5198a5daba9f061c2c55a52() {
  return __cxx_static_address_d5198a5daba9f061c2c55a52.reference || (__cxx_static_address_d5198a5daba9f061c2c55a52.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_69e04c7ec24dae0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_1f4c702edba6ab97 = ((u32(((u32(5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9308d64b6d86c46682efd0a() {
  return __cxx_static_address_b9308d64b6d86c46682efd0a.reference || (__cxx_static_address_b9308d64b6d86c46682efd0a.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_1f4c702edba6ab97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_c8f008f56ca1604a = ((u32(((u32(5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3030af9e39f5629606f36534() {
  return __cxx_static_address_3030af9e39f5629606f36534.reference || (__cxx_static_address_3030af9e39f5629606f36534.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_c8f008f56ca1604a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_ccd24ae3887a6dc1 = ((u32(((u32(5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_839d78898ea4a3cd13412060() {
  return __cxx_static_address_839d78898ea4a3cd13412060.reference || (__cxx_static_address_839d78898ea4a3cd13412060.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_ccd24ae3887a6dc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_ddb4e9b15341c0d5 = ((u32(((u32(5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de1ea3e0ad497f7fc111ccaa() {
  return __cxx_static_address_de1ea3e0ad497f7fc111ccaa.reference || (__cxx_static_address_de1ea3e0ad497f7fc111ccaa.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_ddb4e9b15341c0d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_a6bf2278f6516f48 = ((u32(((u32(5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e636d35dc0aa1c8d90ffbbda() {
  return __cxx_static_address_e636d35dc0aa1c8d90ffbbda.reference || (__cxx_static_address_e636d35dc0aa1c8d90ffbbda.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_a6bf2278f6516f48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_b68f105a96433c7d = ((u32(((u32(5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02d667658f93b5faed0dacd6() {
  return __cxx_static_address_02d667658f93b5faed0dacd6.reference || (__cxx_static_address_02d667658f93b5faed0dacd6.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_b68f105a96433c7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_229435e9c0efe03c = ((u32(((u32(5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_088b216991a8383060268697() {
  return __cxx_static_address_088b216991a8383060268697.reference || (__cxx_static_address_088b216991a8383060268697.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_229435e9c0efe03c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_a3214de972494367 = ((u32(((u32(5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a41ccd87eeecc8725a0bf96() {
  return __cxx_static_address_0a41ccd87eeecc8725a0bf96.reference || (__cxx_static_address_0a41ccd87eeecc8725a0bf96.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_a3214de972494367; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_736ae5b3ca5fbaa1 = ((u32(((u32(5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6010d852a85d688b3edecd37() {
  return __cxx_static_address_6010d852a85d688b3edecd37.reference || (__cxx_static_address_6010d852a85d688b3edecd37.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_736ae5b3ca5fbaa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_7f57ffb18954d419 = ((u32(((u32(5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de27e59db67061b8858f65e3() {
  return __cxx_static_address_de27e59db67061b8858f65e3.reference || (__cxx_static_address_de27e59db67061b8858f65e3.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_7f57ffb18954d419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_7db35d08fd9dc149 = ((u32(((u32(2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25ac08ae07da9bf31d48ae65() {
  return __cxx_static_address_25ac08ae07da9bf31d48ae65.reference || (__cxx_static_address_25ac08ae07da9bf31d48ae65.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_7db35d08fd9dc149; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_d263d1883ccda2d6 = ((u32(((u32(2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5b90697b298e7469de74dd9() {
  return __cxx_static_address_b5b90697b298e7469de74dd9.reference || (__cxx_static_address_b5b90697b298e7469de74dd9.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_d263d1883ccda2d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_e96bf096f410176d = ((u32(((u32(5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b65cdcf9c284cd5d1adba63() {
  return __cxx_static_address_4b65cdcf9c284cd5d1adba63.reference || (__cxx_static_address_4b65cdcf9c284cd5d1adba63.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_e96bf096f410176d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_635c7f700f7a9adf = ((u32(((u32(5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbdc96535d80371cb9da5c60() {
  return __cxx_static_address_cbdc96535d80371cb9da5c60.reference || (__cxx_static_address_cbdc96535d80371cb9da5c60.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_635c7f700f7a9adf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_d0aff4aa2fa26256 = ((u32(((u32(5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed41ca04f433e13b33ab5fbc() {
  return __cxx_static_address_ed41ca04f433e13b33ab5fbc.reference || (__cxx_static_address_ed41ca04f433e13b33ab5fbc.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_d0aff4aa2fa26256; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_e44f896bdba6f6bd = u64((BigInt(u64(64)) * BigInt(u64((BigInt(u64((BigInt(u64((BigInt(72) * BigInt(u64(16384))))) + BigInt(u64((BigInt(96) * BigInt(u64(4096)))))))) + BigInt(u64((BigInt(296) * BigInt(u64(16384))))))))));
function __cxx_static_address_2bc04ae08bedfb47c4f9050b() {
  return __cxx_static_address_2bc04ae08bedfb47c4f9050b.reference || (__cxx_static_address_2bc04ae08bedfb47c4f9050b.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_e44f896bdba6f6bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_0041460a902f3c26 = i32(2147483647);
function __cxx_static_address_a83d03f0c06ebc510b47f71b() {
  return __cxx_static_address_a83d03f0c06ebc510b47f71b.reference || (__cxx_static_address_a83d03f0c06ebc510b47f71b.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_0041460a902f3c26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_039cb0eabdde75dc = i32(2147483648);
function __cxx_static_address_803f3eb3c989bf09a22e29c7() {
  return __cxx_static_address_803f3eb3c989bf09a22e29c7.reference || (__cxx_static_address_803f3eb3c989bf09a22e29c7.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_039cb0eabdde75dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_2f514bc0568378bc = i32(2147483648);
function __cxx_static_address_570857314a599cca9c6c56b5() {
  return __cxx_static_address_570857314a599cca9c6c56b5.reference || (__cxx_static_address_570857314a599cca9c6c56b5.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_2f514bc0568378bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_f520ac50e1cf4ec4 = i32(65536);
function __cxx_static_address_d87253d0cf22cba8ba66bc39() {
  return __cxx_static_address_d87253d0cf22cba8ba66bc39.reference || (__cxx_static_address_d87253d0cf22cba8ba66bc39.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_f520ac50e1cf4ec4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_54cd93ebc2393232 = i32(32768);
function __cxx_static_address_cd7c855b1fb5327108d96fca() {
  return __cxx_static_address_cd7c855b1fb5327108d96fca.reference || (__cxx_static_address_cd7c855b1fb5327108d96fca.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_54cd93ebc2393232; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_83f410d02f689be7 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_732e723a96c6edd5ba729bf7() {
  return __cxx_static_address_732e723a96c6edd5ba729bf7.reference || (__cxx_static_address_732e723a96c6edd5ba729bf7.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_83f410d02f689be7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/config.cpp:45
export let h_gamefuncs = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(63) << 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_3f867168dc2e6af035c1cc31() {
  return __cxx_global_cell_3f867168dc2e6af035c1cc31.reference || (__cxx_global_cell_3f867168dc2e6af035c1cc31.reference = {
    __cReference: true,
    get value() { return h_gamefuncs; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/config.cpp:47
export function CONFIG_FunctionNameToNum(func) {
  if (((!func) || (i32((cDeref(cPointerOffset(func, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(0)))) {
    return i32((-1));
  }
  return i32(hash_findcase(h_gamefuncs, func));
}

// C/C++ source: source/duke3d/src/config.cpp:56
const __cxx_literal_7b8b6f60968d4a46b000 = Uint8Array.from([0]);
export function CONFIG_FunctionNumToName(func) {
  if ((u32(func) >= u32(63))) {
    return __cxx_literal_7b8b6f60968d4a46b000;
  }
  return (cPointerElementRef(gamefunctions, func).value);
}

// C/C++ source: source/duke3d/src/config.cpp:64
const __cxx_literal_d6b65dddff5350a7c4e7 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 116, 117, 114, 110, 105, 110, 103, 0]);
const __cxx_literal_40819b44cda10d84c614 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 115, 116, 114, 97, 102, 105, 110, 103, 0]);
const __cxx_literal_91b3f4b144f6a8d2377a = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 109, 111, 118, 105, 110, 103, 0]);
const __cxx_literal_c0de7fb8c73a69b0d7c1 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 108, 111, 111, 107, 105, 110, 103, 117, 112, 97, 110, 100, 100, 111, 119, 110, 0]);
export function CONFIG_AnalogNameToNum(func) {
  if ((!func)) {
    return i32((-1));
  } else {
    if ((!Boolean(strcasecmp(func, __cxx_literal_d6b65dddff5350a7c4e7)))) {
      return i32(0);
    } else {
      if ((!Boolean(strcasecmp(func, __cxx_literal_40819b44cda10d84c614)))) {
        return i32(1);
      } else {
        if ((!Boolean(strcasecmp(func, __cxx_literal_91b3f4b144f6a8d2377a)))) {
          return i32(5);
        } else {
          if ((!Boolean(strcasecmp(func, __cxx_literal_c0de7fb8c73a69b0d7c1)))) {
            return i32(2);
          } else {
            return i32((-1));
          }
        }
      }
    }
  }
}

// C/C++ source: source/duke3d/src/config.cpp:81
const __cxx_literal_e0380ecc78a5df7690e4 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 116, 117, 114, 110, 105, 110, 103, 0]);
const __cxx_literal_3f945b3d55a999d26efd = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 115, 116, 114, 97, 102, 105, 110, 103, 0]);
const __cxx_literal_3cf556ef269a324d53e8 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 109, 111, 118, 105, 110, 103, 0]);
const __cxx_literal_d55a503711decddccfe0 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 108, 111, 111, 107, 105, 110, 103, 117, 112, 97, 110, 100, 100, 111, 119, 110, 0]);
const __cxx_literal_e75a128233e6c1e964cd = Uint8Array.from([0]);
export function CONFIG_AnalogNumToName(func) {
  switch (func) {
    case i32(0): {
      return __cxx_literal_e0380ecc78a5df7690e4;
    }
    case i32(1): {
      return __cxx_literal_3f945b3d55a999d26efd;
    }
    case i32(5): {
      return __cxx_literal_3cf556ef269a324d53e8;
    }
    case i32(2): {
      return __cxx_literal_d55a503711decddccfe0;
    }
  }
  return __cxx_literal_e75a128233e6c1e964cd;
}

// C/C++ source: source/duke3d/src/config.cpp:823
const __cxx_literal_836ed191d43d29f86d4d = Uint8Array.from([46, 0]);
const __cxx_literal_42a35e9f4fd7981910bc = Uint8Array.from([101, 100, 117, 107, 101, 51, 50, 46, 99, 102, 103, 0]);
const __cxx_literal_0f0cdd5cabc895632825 = Uint8Array.from([115, 101, 116, 116, 105, 110, 103, 115, 46, 99, 102, 103, 0]);
const __cxx_literal_1720a7a7b6dbd616190b = Uint8Array.from([37, 115, 95, 115, 101, 116, 116, 105, 110, 103, 115, 46, 99, 102, 103, 0]);
export function CONFIG_ReadSettings() {
  let dummy = null;
  const __cxx_lvalue_0 = cRef(() => dummy, __cxx_lvalue_1 => { dummy = __cxx_lvalue_1; });
  let setupFileName = xstrdup__header_a474e7e95220(g_setupFileName);
  let p = Bstrtoken(setupFileName, __cxx_literal_836ed191d43d29f86d4d, __cxx_lvalue_0, 1);
  if (((!p) || (!Boolean(strcmp(g_setupFileName, __cxx_literal_42a35e9f4fd7981910bc))))) {
    sprintf(tempbuf, __cxx_literal_0f0cdd5cabc895632825);
  } else {
    sprintf(tempbuf, __cxx_literal_1720a7a7b6dbd616190b, p);
  }
  xfree__header_70b65f06af72(setupFileName);
  OSD_Exec(tempbuf);
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.setupread = i32(2));
  return;
}

// C/C++ source: source/duke3d/src/config.cpp:1054
export const mbtn_to_name = cNativeArray("Uint8Array", [10, 2, 32], [[(() => { const row = new Uint8Array(32); row.set([76, 101, 102, 116, 32, 77, 111, 117, 115, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 76, 101, 102, 116, 32, 77, 111, 117, 115, 101]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([82, 105, 103, 104, 116, 32, 77, 111, 117, 115, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 82, 105, 103, 104, 116, 32, 77, 111, 117, 115, 101]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([77, 105, 100, 100, 108, 101, 32, 77, 111, 117, 115, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 77, 105, 100, 100, 108, 101, 32, 77, 111, 117, 115, 101]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([77, 111, 117, 115, 101, 32, 52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 77, 111, 117, 115, 101, 32, 52]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([87, 104, 101, 101, 108, 32, 85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([87, 104, 101, 101, 108, 32, 68, 111, 119, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([77, 111, 117, 115, 101, 32, 53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 77, 111, 117, 115, 101, 32, 53]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([77, 111, 117, 115, 101, 32, 54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 77, 111, 117, 115, 101, 32, 54]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([77, 111, 117, 115, 101, 32, 55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 77, 111, 117, 115, 101, 32, 55]); return row; })()], [(() => { const row = new Uint8Array(32); row.set([77, 111, 117, 115, 101, 32, 56]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 117, 98, 108, 101, 32, 77, 111, 117, 115, 101, 32, 56]); return row; })()]]);
function __cxx_static_address_3a5a9664f546762c7cfad3da() {
  return __cxx_static_address_3a5a9664f546762c7cfad3da.reference || (__cxx_static_address_3a5a9664f546762c7cfad3da.reference = {
    __cReference: true,
    get value() { return mbtn_to_name; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/config.cpp:1067
const __cxx_literal_84bcbab28148e3f6890c = Uint8Array.from([0]);
export function CONFIG_GetGameFuncOnMouse(gameFunc) {
  for (let j = i32(0); (j < 2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    for (let i = i32(0); (i < 10); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      if (((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.MouseFunctions, i).value), j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == gameFunc)) {
        return (cPointerElementRef((cPointerElementRef(mbtn_to_name, i).value), j).value);
      }
    }
  }
  return __cxx_literal_84bcbab28148e3f6890c;
}

// C/C++ source: source/duke3d/src/config.cpp:1092
export function CONFIG_GetMapEntryName(m, mapname) {
  strcpy(m, mapname);
  let p = strrchr(m, i32(47));
  if ((!p)) {
    (p = strrchr(m, i32(92)));
  }
  if (p) {
    memmove(m, p, u64((BigInt(strlen(p)) + BigInt(u64(1)))));
  }
  for ((p = m); Boolean((cDeref(p, Uint8Array).value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => p, __cxx_lvalue_1 => { p = __cxx_lvalue_1; }))) {
    ((cDeref(p, Uint8Array).value) = (u32((u32(tolower(i32((cDeref(p, Uint8Array).value)))) & 255)) & 255));
  }
  (p = m);
  while ((i32((cDeref(p, Uint8Array).value)) == i32(47))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; }));
  }
  return p;
}

// C/C++ source: source/duke3d/src/config.cpp:1108
const __cxx_literal_899730c5276e5a5d8ba1 = Uint8Array.from([77, 68, 52, 95, 37, 48, 56, 120, 37, 48, 56, 120, 37, 48, 56, 120, 37, 48, 56, 120, 0]);
export function CONFIG_GetMD4EntryName(m, md4) {
  sprintf(m, __cxx_literal_899730c5276e5a5d8ba1, B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 0, Uint8Array.BYTES_PER_ELEMENT))), B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 4, Uint8Array.BYTES_PER_ELEMENT))), B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 8, Uint8Array.BYTES_PER_ELEMENT))), B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 12, Uint8Array.BYTES_PER_ELEMENT))));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_7947d70684e1d3a3 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_162a98f870ad8f42bbfe35ac() {
  return __cxx_static_address_162a98f870ad8f42bbfe35ac.reference || (__cxx_static_address_162a98f870ad8f42bbfe35ac.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_7947d70684e1d3a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_162a98f870ad8f42bbfe35ac() { return __cxx_static_address_162a98f870ad8f42bbfe35ac(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_e7836ae1e3ac7eb8 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_1a6ddbcef4959824733c6a30() {
  return __cxx_static_address_1a6ddbcef4959824733c6a30.reference || (__cxx_static_address_1a6ddbcef4959824733c6a30.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_e7836ae1e3ac7eb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_fdfa270ce975fb39 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_fd63d494b8b1ca18061e2554() {
  return __cxx_static_address_fd63d494b8b1ca18061e2554.reference || (__cxx_static_address_fd63d494b8b1ca18061e2554.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_fdfa270ce975fb39; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_fd63d494b8b1ca18061e2554() { return __cxx_static_address_fd63d494b8b1ca18061e2554(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_1d2bda03206c65c1 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_705f7ee749d0cfce046e849f() {
  return __cxx_static_address_705f7ee749d0cfce046e849f.reference || (__cxx_static_address_705f7ee749d0cfce046e849f.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_1d2bda03206c65c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_705f7ee749d0cfce046e849f() { return __cxx_static_address_705f7ee749d0cfce046e849f(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_150a13e56ea07c04 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_426e1c87c5a13dc19aeaa40a() {
  return __cxx_static_address_426e1c87c5a13dc19aeaa40a.reference || (__cxx_static_address_426e1c87c5a13dc19aeaa40a.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_150a13e56ea07c04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_426e1c87c5a13dc19aeaa40a() { return __cxx_static_address_426e1c87c5a13dc19aeaa40a(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_c0a49ffaf1cd48fe = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_0083529e71a823515b2a4f6f() {
  return __cxx_static_address_0083529e71a823515b2a4f6f.reference || (__cxx_static_address_0083529e71a823515b2a4f6f.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_c0a49ffaf1cd48fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_0083529e71a823515b2a4f6f() { return __cxx_static_address_0083529e71a823515b2a4f6f(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_2dae65184bbd0095 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_51a580eef5248431b0d0e571() {
  return __cxx_static_address_51a580eef5248431b0d0e571.reference || (__cxx_static_address_51a580eef5248431b0d0e571.reference = {
    __cReference: true,
    get value() { return pow264__header_global_2dae65184bbd0095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_51a580eef5248431b0d0e571() { return __cxx_static_address_51a580eef5248431b0d0e571(); }

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_c278a7b696219d09 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": (u32(1) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([49, 0]), "sc": (u32(2) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([50, 0]), "sc": (u32(3) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([51, 0]), "sc": (u32(4) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([52, 0]), "sc": (u32(5) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([53, 0]), "sc": (u32(6) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([54, 0]), "sc": (u32(7) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([55, 0]), "sc": (u32(8) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([56, 0]), "sc": (u32(9) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([57, 0]), "sc": (u32(10) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([48, 0]), "sc": (u32(11) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([45, 0]), "sc": (u32(12) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([61, 0]), "sc": (u32(13) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": (u32(14) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 97, 98, 0]), "sc": (u32(15) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([81, 0]), "sc": (u32(16) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([87, 0]), "sc": (u32(17) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 0]), "sc": (u32(18) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 0]), "sc": (u32(19) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 0]), "sc": (u32(20) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([89, 0]), "sc": (u32(21) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 0]), "sc": (u32(22) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 0]), "sc": (u32(23) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([79, 0]), "sc": (u32(24) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 0]), "sc": (u32(25) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([91, 0]), "sc": (u32(26) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([93, 0]), "sc": (u32(27) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": (u32(28) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": (u32(29) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([65, 0]), "sc": (u32(30) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 0]), "sc": (u32(31) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 0]), "sc": (u32(32) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 0]), "sc": (u32(33) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([71, 0]), "sc": (u32(34) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 0]), "sc": (u32(35) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([74, 0]), "sc": (u32(36) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 0]), "sc": (u32(37) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 0]), "sc": (u32(38) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([59, 0]), "sc": (u32(39) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([39, 0]), "sc": (u32(40) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([96, 0]), "sc": (u32(41) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": (u32(42) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": (u32(43) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([90, 0]), "sc": (u32(44) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([88, 0]), "sc": (u32(45) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 0]), "sc": (u32(46) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([86, 0]), "sc": (u32(47) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 0]), "sc": (u32(48) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 0]), "sc": (u32(49) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([77, 0]), "sc": (u32(50) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([44, 0]), "sc": (u32(51) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([46, 0]), "sc": (u32(52) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([47, 0]), "sc": (u32(53) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": (u32(54) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": (u32(55) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": (u32(56) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": (u32(57) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": (u32(58) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 0]), "sc": (u32(59) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 50, 0]), "sc": (u32(60) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 51, 0]), "sc": (u32(61) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 52, 0]), "sc": (u32(62) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 53, 0]), "sc": (u32(63) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 54, 0]), "sc": (u32(64) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 55, 0]), "sc": (u32(65) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 56, 0]), "sc": (u32(66) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 57, 0]), "sc": (u32(67) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 48, 0]), "sc": (u32(68) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": (u32(69) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": (u32(70) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": (u32(71) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": (u32(72) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": (u32(73) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": (u32(74) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": (u32(75) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": (u32(76) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": (u32(77) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": (u32(78) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": (u32(79) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": (u32(80) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": (u32(81) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": (u32(82) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": (u32(83) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": (u32(86) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 49, 0]), "sc": (u32(87) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 50, 0]), "sc": (u32(88) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": (u32(156) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": (u32(157) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": (u32(181) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": (u32(184) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": (u32(183) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": (u32(197) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": (u32(199) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 112, 0]), "sc": (u32(200) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": (u32(201) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": (u32(203) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": (u32(205) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 100, 0]), "sc": (u32(207) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": (u32(208) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": (u32(209) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": (u32(210) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": (u32(211) & 255)}), null, {})]));
function __cxx_static_address_260f8b9af3ea408c7ba56e6f() {
  return __cxx_static_address_260f8b9af3ea408c7ba56e6f.reference || (__cxx_static_address_260f8b9af3ea408c7ba56e6f.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_c278a7b696219d09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:38
export let gamefunctions = cNativeArray("Uint8Array", [63, 32], [(() => { const row = new Uint8Array(32); row.set([77, 111, 118, 101, 95, 70, 111, 114, 119, 97, 114, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([77, 111, 118, 101, 95, 66, 97, 99, 107, 119, 97, 114, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 117, 114, 110, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 117, 114, 110, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 116, 114, 97, 102, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70, 105, 114, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([79, 112, 101, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 117, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([65, 108, 116, 95, 70, 105, 114, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([74, 117, 109, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([67, 114, 111, 117, 99, 104]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 111, 111, 107, 95, 85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 111, 111, 107, 95, 68, 111, 119, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 111, 111, 107, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 111, 111, 107, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 116, 114, 97, 102, 101, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 116, 114, 97, 102, 101, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([65, 105, 109, 95, 85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([65, 105, 109, 95, 68, 111, 119, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 49]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 50]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 51]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 56]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87, 101, 97, 112, 111, 110, 95, 49, 48]); return row; })(), (() => { const row = new Uint8Array(32); row.set([73, 110, 118, 101, 110, 116, 111, 114, 121]); return row; })(), (() => { const row = new Uint8Array(32); row.set([73, 110, 118, 101, 110, 116, 111, 114, 121, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([73, 110, 118, 101, 110, 116, 111, 114, 121, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([72, 111, 108, 111, 95, 68, 117, 107, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([74, 101, 116, 112, 97, 99, 107]); return row; })(), (() => { const row = new Uint8Array(32); row.set([78, 105, 103, 104, 116, 86, 105, 115, 105, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([77, 101, 100, 75, 105, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 117, 114, 110, 65, 114, 111, 117, 110, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 101, 110, 100, 77, 101, 115, 115, 97, 103, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([77, 97, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 104, 114, 105, 110, 107, 95, 83, 99, 114, 101, 101, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([69, 110, 108, 97, 114, 103, 101, 95, 83, 99, 114, 101, 101, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([67, 101, 110, 116, 101, 114, 95, 86, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(32); row.set([72, 111, 108, 115, 116, 101, 114, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 104, 111, 119, 95, 79, 112, 112, 111, 110, 101, 110, 116, 115, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([77, 97, 112, 95, 70, 111, 108, 108, 111, 119, 95, 77, 111, 100, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 101, 101, 95, 67, 111, 111, 112, 95, 86, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(32); row.set([77, 111, 117, 115, 101, 95, 65, 105, 109, 105, 110, 103]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 111, 103, 103, 108, 101, 95, 67, 114, 111, 115, 115, 104, 97, 105, 114]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 116, 101, 114, 111, 105, 100, 115]); return row; })(), (() => { const row = new Uint8Array(32); row.set([81, 117, 105, 99, 107, 95, 75, 105, 99, 107]); return row; })(), (() => { const row = new Uint8Array(32); row.set([78, 101, 120, 116, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([80, 114, 101, 118, 105, 111, 117, 115, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 104, 111, 119, 95, 67, 111, 110, 115, 111, 108, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 104, 111, 119, 95, 83, 99, 111, 114, 101, 98, 111, 97, 114, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 112, 97, 100, 95, 83, 101, 108, 101, 99, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 112, 97, 100, 95, 65, 105, 109, 105, 110, 103]); return row; })(), (() => { const row = new Uint8Array(32); row.set([65, 117, 116, 111, 82, 117, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 97, 115, 116, 95, 85, 115, 101, 100, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([81, 117, 105, 99, 107, 95, 83, 97, 118, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([81, 117, 105, 99, 107, 95, 76, 111, 97, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([65, 108, 116, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 104, 105, 114, 100, 95, 80, 101, 114, 115, 111, 110, 95, 86, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 111, 103, 103, 108, 101, 95, 67, 114, 111, 117, 99, 104]); return row; })()]);
function __cxx_static_address_fa453d9eebd90e83fe60753b() {
  return __cxx_static_address_fa453d9eebd90e83fe60753b.reference || (__cxx_static_address_fa453d9eebd90e83fe60753b.reference = {
    __cReference: true,
    get value() { return gamefunctions; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:118
export const gamefunc_symbol_names = cNativeArray("Uint8Array", [63, 32], [(() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 77, 111, 118, 101, 95, 70, 111, 114, 119, 97, 114, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 77, 111, 118, 101, 95, 66, 97, 99, 107, 119, 97, 114, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 84, 117, 114, 110, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 84, 117, 114, 110, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 116, 114, 97, 102, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 70, 105, 114, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 79, 112, 101, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 82, 117, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 65, 108, 116, 95, 70, 105, 114, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 74, 117, 109, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 67, 114, 111, 117, 99, 104]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 76, 111, 111, 107, 95, 85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 76, 111, 111, 107, 95, 68, 111, 119, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 76, 111, 111, 107, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 76, 111, 111, 107, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 116, 114, 97, 102, 101, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 116, 114, 97, 102, 101, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 65, 105, 109, 95, 85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 65, 105, 109, 95, 68, 111, 119, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 49]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 50]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 51]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 56]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 87, 101, 97, 112, 111, 110, 95, 49, 48]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 110, 118, 101, 110, 116, 111, 114, 121]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 110, 118, 101, 110, 116, 111, 114, 121, 95, 76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 110, 118, 101, 110, 116, 111, 114, 121, 95, 82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 116, 101, 109, 95, 49]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 116, 101, 109, 95, 50]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 116, 101, 109, 95, 51]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 116, 101, 109, 95, 52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 84, 117, 114, 110, 65, 114, 111, 117, 110, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 101, 110, 100, 77, 101, 115, 115, 97, 103, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 77, 97, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 104, 114, 105, 110, 107, 95, 83, 99, 114, 101, 101, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 69, 110, 108, 97, 114, 103, 101, 95, 83, 99, 114, 101, 101, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 67, 101, 110, 116, 101, 114, 95, 86, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 72, 111, 108, 115, 116, 101, 114, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 104, 111, 119, 95, 79, 112, 112, 111, 110, 101, 110, 116, 115, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 77, 97, 112, 95, 70, 111, 108, 108, 111, 119, 95, 77, 111, 100, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 101, 101, 95, 67, 111, 111, 112, 95, 86, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 77, 111, 117, 115, 101, 95, 65, 105, 109, 105, 110, 103]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 84, 111, 103, 103, 108, 101, 95, 67, 114, 111, 115, 115, 104, 97, 105, 114]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 73, 116, 101, 109, 95, 53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 77, 101, 108, 101, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 78, 101, 120, 116, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 80, 114, 101, 118, 105, 111, 117, 115, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 104, 111, 119, 95, 67, 111, 110, 115, 111, 108, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 104, 111, 119, 95, 83, 99, 111, 114, 101, 98, 111, 97, 114, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 68, 112, 97, 100, 95, 83, 101, 108, 101, 99, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 68, 112, 97, 100, 95, 65, 105, 109, 105, 110, 103]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 65, 117, 116, 111, 82, 117, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 76, 97, 115, 116, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 81, 117, 105, 99, 107, 95, 83, 97, 118, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 81, 117, 105, 99, 107, 95, 76, 111, 97, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 65, 108, 116, 95, 87, 101, 97, 112, 111, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 84, 104, 105, 114, 100, 95, 80, 101, 114, 115, 111, 110, 95, 86, 105, 101, 119]); return row; })(), (() => { const row = new Uint8Array(32); row.set([103, 97, 109, 101, 102, 117, 110, 99, 95, 84, 111, 103, 103, 108, 101, 95, 67, 114, 111, 117, 99, 104]); return row; })()]);
function __cxx_static_address_471c28a00d2b688b1c5edcd4() {
  return __cxx_static_address_471c28a00d2b688b1c5edcd4.reference || (__cxx_static_address_471c28a00d2b688b1c5edcd4.reference = {
    __cReference: true,
    get value() { return gamefunc_symbol_names; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:187
export const keybind_order_modern = new Int32Array([i32(0), i32(1), i32(15), i32(16), i32(5), i32(8), i32(49), i32(6), i32(9), i32(10), i32(62), i32(7), i32(29), i32(30), i32(31), i32(35), i32(33), i32(48), i32(34), i32(32), i32(50), i32(51), i32(57), i32(19), i32(20), i32(21), i32(22), i32(23), i32(24), i32(25), i32(26), i32(27), i32(28), i32(38), i32(44), i32(61), i32(58), i32(59), i32(42), i32(60), i32(17), i32(18), i32(2), i32(3), i32(41), i32(11), i32(12), i32(13), i32(14), i32(36), i32(54), i32(55), i32(39), i32(40), i32(4), i32(46), i32(47), i32(56), i32(37), i32(43), i32(45), i32(53), i32(52)]);
function __cxx_static_address_d965761a863b383d7a8081e9() {
  return __cxx_static_address_d965761a863b383d7a8081e9.reference || (__cxx_static_address_d965761a863b383d7a8081e9.reference = {
    __cReference: true,
    get value() { return keybind_order_modern; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:263
export let keybind_order_custom = (() => { const items = new Int32Array(63); items.set([(-1)]); return items; })();
function __cxx_static_address_a774be862bd27b1d186ca875() {
  return __cxx_static_address_a774be862bd27b1d186ca875.reference || (__cxx_static_address_a774be862bd27b1d186ca875.reference = {
    __cReference: true,
    get value() { return keybind_order_custom; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:267
export const keydefaults = cNativeArray("Uint8Array", [126, 32], [(() => { const row = new Uint8Array(32); row.set([87]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 56]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 50]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 80, 97, 100, 54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 65, 108, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 65, 108, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 67, 116, 114, 108]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([69]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 83, 104, 105, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 83, 104, 105, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 112, 97, 99, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([47]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 67, 116, 114, 108]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([80, 103, 85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([80, 103, 68, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 51]); return row; })(), (() => { const row = new Uint8Array(32); row.set([73, 110, 115, 101, 114, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 48]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 101, 108, 101, 116, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 46]); return row; })(), (() => { const row = new Uint8Array(32); row.set([65]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([72, 111, 109, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 80, 97, 100, 55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([69, 110, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 49]); return row; })(), (() => { const row = new Uint8Array(32); row.set([49]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([50]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([51]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([56]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([48]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([69, 110, 116, 101, 114]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 100, 69, 110, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([91]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([93]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([72]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([74]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([78]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([77]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([66, 97, 107, 83, 112, 99]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 97, 98]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([45]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 45]); return row; })(), (() => { const row = new Uint8Array(32); row.set([61]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 43]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 80, 97, 100, 53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 99, 114, 76, 99, 107]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([89]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([81]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([39]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([59]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([96]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([67, 97, 112, 76, 99, 107]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([88]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70, 54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70, 57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70, 55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([67]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })()]);
function __cxx_static_address_0f871dbd40511709390dc466() {
  return __cxx_static_address_0f871dbd40511709390dc466.reference || (__cxx_static_address_0f871dbd40511709390dc466.reference = {
    __cReference: true,
    get value() { return keydefaults; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:334
export const oldkeydefaults = cNativeArray("Uint8Array", [126, 32], [(() => { const row = new Uint8Array(32); row.set([85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 56]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 111, 119, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 50]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 101, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 105, 103, 104, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 80, 97, 100, 54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 65, 108, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 65, 108, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 67, 116, 114, 108]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 67, 116, 114, 108]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 112, 97, 99, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([76, 83, 104, 105, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82, 83, 104, 105, 102, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([65]); return row; })(), (() => { const row = new Uint8Array(32); row.set([47]); return row; })(), (() => { const row = new Uint8Array(32); row.set([90]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([80, 103, 85, 112]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([80, 103, 68, 110]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 51]); return row; })(), (() => { const row = new Uint8Array(32); row.set([73, 110, 115, 101, 114, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 48]); return row; })(), (() => { const row = new Uint8Array(32); row.set([68, 101, 108, 101, 116, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 46]); return row; })(), (() => { const row = new Uint8Array(32); row.set([44]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([46]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([72, 111, 109, 101]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 80, 97, 100, 55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([69, 110, 100]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 49]); return row; })(), (() => { const row = new Uint8Array(32); row.set([49]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([50]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([51]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([52]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([56]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([48]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([69, 110, 116, 101, 114]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 100, 69, 110, 116]); return row; })(), (() => { const row = new Uint8Array(32); row.set([91]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([93]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([72]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([74]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([78]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([77]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([66, 97, 107, 83, 112, 99]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([84, 97, 98]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([45]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 45]); return row; })(), (() => { const row = new Uint8Array(32); row.set([61]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 112, 97, 100, 43]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75, 80, 97, 100, 53]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([83, 99, 114, 76, 99, 107]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([87]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([75]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([85]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([73]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([82]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([96]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([39]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([59]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([67]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([67, 97, 112, 76, 99, 107]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70, 54]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70, 57]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([70, 55]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })(), (() => { const row = new Uint8Array(32); row.set([]); return row; })()]);
function __cxx_static_address_e55fa70da554bd44719197ca() {
  return __cxx_static_address_e55fa70da554bd44719197ca.reference || (__cxx_static_address_e55fa70da554bd44719197ca.reference = {
    __cReference: true,
    get value() { return oldkeydefaults; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:401
export const mousedefaults__header_global_2a314d0a573b1c00 = cPointerArray(10, () => [Uint8Array.from([70, 105, 114, 101, 0]), Uint8Array.from([65, 108, 116, 95, 70, 105, 114, 101, 0]), Uint8Array.from([77, 101, 100, 75, 105, 116, 0]), Uint8Array.from([0]), Uint8Array.from([80, 114, 101, 118, 105, 111, 117, 115, 95, 87, 101, 97, 112, 111, 110, 0]), Uint8Array.from([78, 101, 120, 116, 95, 87, 101, 97, 112, 111, 110, 0])]);
function __cxx_static_address_72cc23430bb3c259d7995fd3() {
  return __cxx_static_address_72cc23430bb3c259d7995fd3.reference || (__cxx_static_address_72cc23430bb3c259d7995fd3.reference = {
    __cReference: true,
    get value() { return mousedefaults__header_global_2a314d0a573b1c00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/_functio.h:412
export const mouseclickeddefaults__header_global_df8e9aa737ba0b20 = cPointerArray(10, () => []);
function __cxx_static_address_3df601a9cbd8dd5972cd06a2() {
  return __cxx_static_address_3df601a9cbd8dd5972cd06a2.reference || (__cxx_static_address_3df601a9cbd8dd5972cd06a2.reference = {
    __cReference: true,
    get value() { return mouseclickeddefaults__header_global_df8e9aa737ba0b20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_4bd4efb10165(arg0) {
  return u64(10n);
}

export function ARRAY_SIZE__header_624fefad79ed(arg0) {
  return u64(63n);
}

export function ARRAY_SIZE__header_18686f250d67(arg0) {
  return u64(4n);
}

export function ARRAY_SIZE__header_81b12eec007e(arg0) {
  return u64(102n);
}

// C/C++ source: source/build/include/vfs.h:140
export function buildvfs_exists__header_49b76bad5204(path) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  return i32((!Boolean(stat(path, st))));
}

// C/C++ source: source/build/include/compat.h:1235
export function Bstrncpyz__header_07089d4af71d(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

// C/C++ source: source/build/include/vfs.h:150
export function buildvfs_isdir__header_b21392ddd57c(path) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  return i32((Boolean(stat(path, st)) ? 0 : i32((u32((st.st_mode & u32(16384))) == u32(16384)))));
}

// C/C++ source: source/build/include/common.h:76
export function dup_filename__header_c4ce12f5d726(fn) {
  let buf = cTypedPointer(xmalloc__header_52d5c68b0c18(u64(256)), Uint8Array);
  return Bstrncpyz__header_07089d4af71d(buf, fn, u64(256));
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup__header_a474e7e95220(s) {
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

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_70b65f06af72(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function buildvfs_fputstr__header_894d7acf3b1c(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(44n)) - BigInt(u64(1)))), fp);
  }
}

// C/C++ source: source/build/include/vfs.h:163
export function buildvfs_fputstrptr__header_5c75b54544b7(fp, str) {
  if (fp) {
    fwrite(str, u64(1), strlen(str), fp);
  }
}

export function buildvfs_fputstr__header_829d08dc3ee2(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(12n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_245ff0c09c38(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(7n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_854d92be64d5(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(4n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_ddca9f6a708d(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(13n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_ca7e133a7c30(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(3n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_32b646f8ccdd(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(9n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_1f5473693100(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(2n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_a319820a732b(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(16n)) - BigInt(u64(1)))), fp);
  }
}

export function B_SWAP32__header_306703534b37(x) {
  return u32(B_SWAP32_impl__header_90fb8dbc8c63(u32(x)));
}

// C/C++ source: source/build/include/compat.h:1036
export function B_UNBUF32__header_345da132edac(buf) {
  return u32((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_52d5c68b0c18(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:948
export function B_SWAP32_impl__header_90fb8dbc8c63(value) {
  return u32((u32((u32(((u32((value & 4278190080)) >>> 24) | (u32((value & 16711680)) >>> 8))) | u32((u32((value & 65280)) << 8)))) | u32((u32((value & 255)) << 24))));
}
