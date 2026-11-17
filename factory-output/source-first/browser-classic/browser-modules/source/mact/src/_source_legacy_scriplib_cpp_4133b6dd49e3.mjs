// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/mact/src/scriplib.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { close } from "../../../browser-abi/libc_provider.mjs";
import { fclose } from "../../../browser-abi/libc_provider.mjs";
import { fopen } from "../../../browser-abi/libc_provider.mjs";
import { fputc } from "../../../browser-abi/libc_provider.mjs";
import { fstat } from "../../../browser-abi/libc_provider.mjs";
import { fwrite } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { isalpha } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { open } from "../../../browser-abi/libc_provider.mjs";
import { read } from "../../../browser-abi/libc_provider.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strncasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strncpy } from "../../../browser-abi/libc_provider.mjs";
import { strtod } from "../../../browser-abi/libc_provider.mjs";
import { strtol } from "../../../browser-abi/libc_provider.mjs";

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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_9d2334e00c2411d8 = i32(3754936);
function __cxx_static_address_7fb7a8ca9356af38c25446c5() {
  return __cxx_static_address_7fb7a8ca9356af38c25446c5.reference || (__cxx_static_address_7fb7a8ca9356af38c25446c5.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_9d2334e00c2411d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_442568919e600465 = i32(1144);
function __cxx_static_address_44cba1d16e9ec0285a28d6f4() {
  return __cxx_static_address_44cba1d16e9ec0285a28d6f4.reference || (__cxx_static_address_44cba1d16e9ec0285a28d6f4.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_442568919e600465; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_d817a4d62d6aa105 = i32(2147483647);
function __cxx_static_address_7fd95475471db099ac4b77df() {
  return __cxx_static_address_7fd95475471db099ac4b77df.reference || (__cxx_static_address_7fd95475471db099ac4b77df.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_d817a4d62d6aa105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_1e689e7762608357 = i32(2147483648);
function __cxx_static_address_c705e59170f95bc1c857d7cd() {
  return __cxx_static_address_c705e59170f95bc1c857d7cd.reference || (__cxx_static_address_c705e59170f95bc1c857d7cd.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_1e689e7762608357; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_a2e2721c51b413e3 = i32(2147483648);
function __cxx_static_address_9209d70b7ac29787ed0ae973() {
  return __cxx_static_address_9209d70b7ac29787ed0ae973.reference || (__cxx_static_address_9209d70b7ac29787ed0ae973.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_a2e2721c51b413e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_5c01341d23bf48c4 = i32(65536);
function __cxx_static_address_7585156449234a5179e7ffdd() {
  return __cxx_static_address_7585156449234a5179e7ffdd.reference || (__cxx_static_address_7585156449234a5179e7ffdd.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_5c01341d23bf48c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_f4620d5034a83178 = i32(32768);
function __cxx_static_address_8e09ee33d25f00245f9683bd() {
  return __cxx_static_address_8e09ee33d25f00245f9683bd.reference || (__cxx_static_address_8e09ee33d25f00245f9683bd.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_f4620d5034a83178; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_b259229a24fb6e13 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_c319d1ae59533eb3ad47d4dc() {
  return __cxx_static_address_c319d1ae59533eb3ad47d4dc.reference || (__cxx_static_address_c319d1ae59533eb3ad47d4dc.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_b259229a24fb6e13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/scriplib.cpp:43
export let scriptfiles = cPointerArray(20);
function __cxx_static_address_320846031e357fe8903f3332() {
  return __cxx_static_address_320846031e357fe8903f3332.reference || (__cxx_static_address_320846031e357fe8903f3332.reference = {
    __cReference: true,
    get value() { return scriptfiles; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/mact/src/scriplib.cpp:49
export function SCRIPT_New() {
  let i;
  for ((i = i32(0)); (i < 20); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((!(cPointerElementRef(scriptfiles, i).value))) {
      ((cPointerElementRef(scriptfiles, i).value) = cRecordPointer(xmalloc__header_355dc28d92b2(280), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {}));
      memset((cPointerElementRef(scriptfiles, i).value), 0, 280);
      return i32(i);
    }
  }
  return i32((-1));
}

// C/C++ source: source/mact/src/scriplib.cpp:66
export function SCRIPT_Delete(scripthandle) {
  let s;
  if (((scripthandle < 0) || (scripthandle >= 20))) {
    return;
  }
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return;
  }
  if (cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript) {
    while (cPointerCompare(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection, cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript, "!=")) {
      (s = cRecordObject(cRecordPointer(cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection);
      SCRIPT_FreeSection(cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript);
      xfree__header_583636515fc6(cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript);
      (cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript = s);
    }
    SCRIPT_FreeSection(cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript);
    xfree__header_583636515fc6(cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript);
  }
  xfree__header_583636515fc6((cPointerElementRef(scriptfiles, scripthandle).value));
  ((cPointerElementRef(scriptfiles, scripthandle).value) = null);
}

// C/C++ source: source/mact/src/scriplib.cpp:92
export function SCRIPT_FreeSection(section) {
  let e;
  if ((!section)) {
    return;
  }
  if ((!cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries)) {
    return;
  }
  while (cPointerCompare(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry, cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries, "!=")) {
    (e = cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry);
    xfree__header_583636515fc6(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name);
    xfree__header_583636515fc6(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value);
    xfree__header_583636515fc6(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries);
    (cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries = e);
  }
  xfree__header_583636515fc6(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name);
  xfree__header_583636515fc6(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value);
  xfree__header_583636515fc6(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries);
  xfree__header_583636515fc6(cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).name);
}

// C/C++ source: source/mact/src/scriplib.cpp:133
export function SCRIPT_SectionExists(scripthandle, sectionname) {
  let s;
  let ls = null;
  if (((scripthandle < 0) || (scripthandle >= 20))) {
    return null;
  }
  if ((!sectionname)) {
    return null;
  }
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return null;
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return null;
  }
  for ((s = cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript); cPointerCompare(ls, s, "!="); ((ls = s), (s = cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection))) {
    if ((!Boolean(strcasecmp(cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).name, sectionname)))) {
      return s;
    }
  }
  return null;
}

// C/C++ source: source/mact/src/scriplib.cpp:148
export function SCRIPT_AddSection(scripthandle, sectionname) {
  let s;
  let s2;
  if (((scripthandle < 0) || (scripthandle >= 20))) {
    return null;
  }
  if ((!sectionname)) {
    return null;
  }
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return null;
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  if (s) {
    return s;
  }
  {
    (s = cRecordPointer(xmalloc__header_355dc28d92b2(40), {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {}));
    (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).name = null);
    (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries = null);
    (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).lastline = null);
    (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection = s);
    (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).prevsection = s);
  }
  ;
  (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).name = xstrdup__header_7467580091fb(sectionname));
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    (cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript = s);
  } else {
    (s2 = cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript);
    while (cPointerCompare(cRecordObject(cRecordPointer(s2, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection, s2, "!=")) {
      (s2 = cRecordObject(cRecordPointer(s2, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection);
    }
    (cRecordObject(cRecordPointer(s2, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection = s);
    (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).prevsection = s2);
  }
  return s;
}

// C/C++ source: source/mact/src/scriplib.cpp:176
export function SCRIPT_EntryExists(section, entryname) {
  let e;
  let le = null;
  if ((!section)) {
    return null;
  }
  if ((!entryname)) {
    return null;
  }
  if ((!cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries)) {
    return null;
  }
  for ((e = cRecordObject(cRecordPointer(section, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries); cPointerCompare(le, e, "!="); ((le = e), (e = cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry))) {
    if ((!Boolean(strcasecmp(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name, entryname)))) {
      return e;
    }
  }
  return null;
}

// C/C++ source: source/mact/src/scriplib.cpp:190
export function SCRIPT_AddEntry(scripthandle, sectionname, entryname, entryvalue) {
  let s;
  let e;
  let e2;
  if (((scripthandle < 0) || (scripthandle >= 20))) {
    return;
  }
  if ((((!sectionname) || (!entryname)) || (!entryvalue))) {
    return;
  }
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return;
  }
  (s = SCRIPT_AddSection(scripthandle, sectionname));
  if ((!s)) {
    return;
  }
  (e = SCRIPT_EntryExists(s, entryname));
  if ((!e)) {
    {
      (e = cRecordPointer(xmalloc__header_355dc28d92b2(32), {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {}));
      (cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name = null);
      (cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value = null);
      (cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry = e);
      (cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).preventry = e);
    }
    ;
    (cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name = xstrdup__header_7467580091fb(entryname));
    if ((!cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries)) {
      (cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries = e);
    } else {
      (e2 = cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries);
      while (cPointerCompare(cRecordObject(cRecordPointer(e2, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry, e2, "!=")) {
        (e2 = cRecordObject(cRecordPointer(e2, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry);
      }
      (cRecordObject(cRecordPointer(e2, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry = e);
      (cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).preventry = e2);
    }
  }
  xfree__header_583636515fc6(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value);
  (cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value = xstrdup__header_7467580091fb(entryvalue));
}

// C/C++ source: source/mact/src/scriplib.cpp:228
const __cxx_literal_79671cabfdc889f0e14f = Uint8Array.from([0]);
export function SCRIPT_ParseBuffer(scripthandle, data, length) {
  if (((!data) || (length < 0))) {
    return i32(1);
  }
  let currentsection = __cxx_literal_79671cabfdc889f0e14f;
  let currententry = null;
  let currentvalue = null;
  let fence = cPointerOffset(data, length, Uint8Array.BYTES_PER_ELEMENT);
  let ch = (u32((u32(0) & 255)) & 255);
  const __cxx_lvalue_0 = cRef(() => ch, __cxx_lvalue_2 => { ch = (u32(__cxx_lvalue_2) & 255); });
  let lastch = (u32((u32(0) & 255)) & 255);


  let sp = data;
  let dp = data;
  let state = i32(0);
  let expect = i32((i32(1) | i32(2)));
  let linenum = i32(1);
  const __cxx_lvalue_1 = cRef(() => linenum, __cxx_lvalue_3 => { linenum = i32(__cxx_lvalue_3); });
  let errlevel = i32(0);
  while ((length > 0)) {
    switch (state) {
      case i32(0): {
        (lastch = (u32(ch) & 255));
        (ch = (u32((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_5 => { sp = __cxx_lvalue_5; })), Uint8Array).value)) & 255));
        ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous - 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => length, __cxx_lvalue_7 => { length = __cxx_lvalue_7; }));
      }
      ;
      switch (i32(ch)) {
        case i32(32):
        case i32(9): {
          continue;
        }
        case i32(10): {
          if ((i32(lastch) == i32(13))) {
            continue;
          }
        }
        ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(__cxx_lvalue_1);
        continue;
        case i32(13): {
          ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = i32((previous + 1)); __cxx_lvalue_9.value = next; return previous; })(__cxx_lvalue_1);
        }
        continue;
        case i32(59): {
          while ((((length > 0) && (i32((cDeref(sp, Uint8Array).value)) != i32(10))) && (i32((cDeref(sp, Uint8Array).value)) != i32(13)))) {
            ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_10.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_11 => { sp = __cxx_lvalue_11; }));
            ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = i32((previous - 1)); __cxx_lvalue_12.value = next; return previous; })(cRef(() => length, __cxx_lvalue_13 => { length = __cxx_lvalue_13; }));
          }
        }
        ;
        continue;
        case i32(91): {
          if ((!Boolean(i32((expect & i32(1)))))) {
            do {
              SILENCE_UNUSED__header_734de4679518("Unexpected start of section on line %d.", __cxx_lvalue_1);
            } while (Boolean(0));
            do {
              if ((((-1) > errlevel) || (errlevel == 0))) {
                (errlevel = i32((-1)));
              }
            } while (Boolean(0));
            while ((((length > 0) && (i32((cDeref(sp, Uint8Array).value)) != i32(10))) && (i32((cDeref(sp, Uint8Array).value)) != i32(13)))) {
              ((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_15 => { sp = __cxx_lvalue_15; }));
              ((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = i32((previous - 1)); __cxx_lvalue_16.value = next; return previous; })(cRef(() => length, __cxx_lvalue_17 => { length = __cxx_lvalue_17; }));
            }
            ;
            continue;
          } else {
            (state = i32(1));
            continue;
          }
        }
        default: {
          if (Boolean(isalpha(i32(ch)))) {
            if ((!Boolean(i32((expect & i32(2)))))) {
              do {
                SILENCE_UNUSED__header_ec2349501768("Unexpected entry LabelText on line %d.", __cxx_lvalue_1);
              } while (Boolean(0));
              do {
                if ((((-1) > errlevel) || (errlevel == 0))) {
                  (errlevel = i32((-1)));
                }
              } while (Boolean(0));
              while ((((length > 0) && (i32((cDeref(sp, Uint8Array).value)) != i32(10))) && (i32((cDeref(sp, Uint8Array).value)) != i32(13)))) {
                ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_18.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_19 => { sp = __cxx_lvalue_19; }));
                ((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = i32((previous - 1)); __cxx_lvalue_20.value = next; return previous; })(cRef(() => length, __cxx_lvalue_21 => { length = __cxx_lvalue_21; }));
              }
              ;
              continue;
            } else {
              (currententry = (dp = cPointerOffset(sp, -(1), Uint8Array.BYTES_PER_ELEMENT)));
              (state = i32(3));
              continue;
            }
          } else {
            do {
              SILENCE_UNUSED__header_bcc14d043222("Illegal character (ASCII %d) on line %d.", __cxx_lvalue_0, __cxx_lvalue_1);
            } while (Boolean(0));
            do {
              if ((((-1) > errlevel) || (errlevel == 0))) {
                (errlevel = i32((-1)));
              }
            } while (Boolean(0));
            while ((((length > 0) && (i32((cDeref(sp, Uint8Array).value)) != i32(10))) && (i32((cDeref(sp, Uint8Array).value)) != i32(13)))) {
              ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_22.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_23 => { sp = __cxx_lvalue_23; }));
              ((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = i32((previous - 1)); __cxx_lvalue_24.value = next; return previous; })(cRef(() => length, __cxx_lvalue_25 => { length = __cxx_lvalue_25; }));
            }
            ;
            continue;
          }
        }
      }
      case i32(1): {
        (currentsection = (dp = sp));
      }
      (state = i32(2));
      ;
      case i32(2): {
        (lastch = (u32(ch) & 255));
        (ch = (u32((cDeref(((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_26.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_27 => { sp = __cxx_lvalue_27; })), Uint8Array).value)) & 255));
        ((__cxx_lvalue_28) => { const previous = __cxx_lvalue_28.value; const next = i32((previous - 1)); __cxx_lvalue_28.value = next; return previous; })(cRef(() => length, __cxx_lvalue_29 => { length = __cxx_lvalue_29; }));
      }
      ;
      switch (i32(ch)) {
        case i32(10):
        case i32(13): {
          do {
            SILENCE_UNUSED__header_e8eecde66517("Unexpected newline on line %d.", __cxx_lvalue_1);
          } while (Boolean(0));
        }
        do {
          if ((((-1) > errlevel) || (errlevel == 0))) {
            (errlevel = i32((-1)));
          }
        } while (Boolean(0));
        (state = i32(0));
        ((__cxx_lvalue_30) => { const previous = __cxx_lvalue_30.value; const next = i32((previous + 1)); __cxx_lvalue_30.value = next; return previous; })(__cxx_lvalue_1);
        continue;
        case i32(93): {
          ((cDeref(dp, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        }
        (expect = i32((i32(1) | i32(2))));
        (state = i32(0));
        while ((((length > 0) && (i32((cDeref(sp, Uint8Array).value)) != i32(10))) && (i32((cDeref(sp, Uint8Array).value)) != i32(13)))) {
          ((__cxx_lvalue_31) => { const previous = __cxx_lvalue_31.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_31.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_32 => { sp = __cxx_lvalue_32; }));
          ((__cxx_lvalue_33) => { const previous = __cxx_lvalue_33.value; const next = i32((previous - 1)); __cxx_lvalue_33.value = next; return previous; })(cRef(() => length, __cxx_lvalue_34 => { length = __cxx_lvalue_34; }));
        }
        ;
        continue;
        default: {
          ((__cxx_lvalue_35) => { const previous = __cxx_lvalue_35.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_35.value = next; return previous; })(cRef(() => dp, __cxx_lvalue_36 => { dp = __cxx_lvalue_36; }));
        }
        continue;
      }
      case i32(3): {
        (lastch = (u32(ch) & 255));
        (ch = (u32((cDeref(((__cxx_lvalue_37) => { const previous = __cxx_lvalue_37.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_37.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_38 => { sp = __cxx_lvalue_38; })), Uint8Array).value)) & 255));
        ((__cxx_lvalue_39) => { const previous = __cxx_lvalue_39.value; const next = i32((previous - 1)); __cxx_lvalue_39.value = next; return previous; })(cRef(() => length, __cxx_lvalue_40 => { length = __cxx_lvalue_40; }));
      }
      ;
      switch (i32(ch)) {
        case i32(59): {
          while ((((length > 0) && (i32((cDeref(sp, Uint8Array).value)) != i32(10))) && (i32((cDeref(sp, Uint8Array).value)) != i32(13)))) {
            ((__cxx_lvalue_41) => { const previous = __cxx_lvalue_41.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_41.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_42 => { sp = __cxx_lvalue_42; }));
            ((__cxx_lvalue_43) => { const previous = __cxx_lvalue_43.value; const next = i32((previous - 1)); __cxx_lvalue_43.value = next; return previous; })(cRef(() => length, __cxx_lvalue_44 => { length = __cxx_lvalue_44; }));
          }
        }
        ;
        do {
          SILENCE_UNUSED__header_e8eecde66517("Unexpected comment on line %d.", __cxx_lvalue_1);
        } while (Boolean(0));
        do {
          if ((((-1) > errlevel) || (errlevel == 0))) {
            (errlevel = i32((-1)));
          }
        } while (Boolean(0));
        ;
        case i32(10):
        case i32(13): {
          do {
            SILENCE_UNUSED__header_e8eecde66517("Unexpected newline on line %d.", __cxx_lvalue_1);
          } while (Boolean(0));
        }
        do {
          if ((((-1) > errlevel) || (errlevel == 0))) {
            (errlevel = i32((-1)));
          }
        } while (Boolean(0));
        (expect = i32((i32(1) | i32(2))));
        (state = i32(0));
        ((__cxx_lvalue_45) => { const previous = __cxx_lvalue_45.value; const next = i32((previous + 1)); __cxx_lvalue_45.value = next; return previous; })(__cxx_lvalue_1);
        continue;
        case i32(61): {
          while (((i32((cDeref(dp, Uint8Array).value)) == i32(32)) || (i32((cDeref(dp, Uint8Array).value)) == i32(9)))) {
            ((__cxx_lvalue_46) => { const previous = __cxx_lvalue_46.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_46.value = next; return previous; })(cRef(() => dp, __cxx_lvalue_47 => { dp = __cxx_lvalue_47; }));
          }
        }
        ((cDeref(((__cxx_lvalue_48) => { const previous = __cxx_lvalue_48.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_48.value = next; return next; })(cRef(() => dp, __cxx_lvalue_49 => { dp = __cxx_lvalue_49; })), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        (state = i32(4));
        continue;
        default: {
          ((__cxx_lvalue_50) => { const previous = __cxx_lvalue_50.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_50.value = next; return previous; })(cRef(() => dp, __cxx_lvalue_51 => { dp = __cxx_lvalue_51; }));
        }
        continue;
      }
      case i32(4): {
        (currentvalue = (dp = sp));
      }
      (state = i32(5));
      ;
      case i32(5): {
        (lastch = (u32(ch) & 255));
        (ch = (u32((cDeref(((__cxx_lvalue_52) => { const previous = __cxx_lvalue_52.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_52.value = next; return previous; })(cRef(() => sp, __cxx_lvalue_53 => { sp = __cxx_lvalue_53; })), Uint8Array).value)) & 255));
        ((__cxx_lvalue_54) => { const previous = __cxx_lvalue_54.value; const next = i32((previous - 1)); __cxx_lvalue_54.value = next; return previous; })(cRef(() => length, __cxx_lvalue_55 => { length = __cxx_lvalue_55; }));
      }
      ;
      switch (i32(ch)) {
        case i32(10):
        case i32(13): {
          while (((i32((cDeref(dp, Uint8Array).value)) == i32(32)) || (i32((cDeref(dp, Uint8Array).value)) == i32(9)))) {
            ((__cxx_lvalue_56) => { const previous = __cxx_lvalue_56.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_56.value = next; return previous; })(cRef(() => dp, __cxx_lvalue_57 => { dp = __cxx_lvalue_57; }));
          }
        }
        ((cDeref(dp, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        while (((i32((cDeref(currentvalue, Uint8Array).value)) == i32(32)) || (i32((cDeref(currentvalue, Uint8Array).value)) == i32(9)))) {
          ((__cxx_lvalue_58) => { const previous = __cxx_lvalue_58.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_58.value = next; return previous; })(cRef(() => currentvalue, __cxx_lvalue_59 => { currentvalue = __cxx_lvalue_59; }));
        }
        (state = i32(0));
        ((__cxx_lvalue_60) => { const previous = __cxx_lvalue_60.value; const next = i32((previous + 1)); __cxx_lvalue_60.value = next; return previous; })(__cxx_lvalue_1);
        SCRIPT_AddSection(scripthandle, currentsection);
        SCRIPT_AddEntry(scripthandle, currentsection, currententry, currentvalue);
        continue;
        default: {
          ((__cxx_lvalue_61) => { const previous = __cxx_lvalue_61.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_61.value = next; return previous; })(cRef(() => dp, __cxx_lvalue_62 => { dp = __cxx_lvalue_62; }));
        }
        continue;
      }
      default: {
        (length = i32(0));
      }
      continue;
    }
  }
  if (cPointerCompare(sp, fence, ">")) {
    do {
      SILENCE_UNUSED__header_596a20fad036("Stepped outside the fence!");
    } while (Boolean(0));
  }
  return i32(errlevel);
}

// C/C++ source: source/mact/src/scriplib.cpp:433
export function SCRIPT_Init(name) {
  let h = i32(SCRIPT_New());
  if ((h >= 0)) {
    strncpy(cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, h).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).scriptfilename, name, u64(127));
  }
  return i32(h);
}

// C/C++ source: source/mact/src/scriplib.cpp:442
export function SCRIPT_Free(scripthandle) {
  SCRIPT_Delete(scripthandle);
}

// C/C++ source: source/mact/src/scriplib.cpp:447
export function SCRIPT_Load(filename) {
  let s;
  let l;
  let b;
  let h;
  (h = i32(open(filename, i32((0 | 0)))));
  (l = i32((i32(buildvfs_length__header_9ee66f61c537(h)) + 1)));
  (b = cTypedPointer(xmalloc__header_355dc28d92b2(u64(l)), Uint8Array));
  read(h, b, u64(i32((l - 1))));
  ((cDeref(cPointerOffset(b, i32((l - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(10) & 255));
  close(h);
  (s = i32(SCRIPT_Init(filename)));
  if ((s < 0)) {
    xfree__header_583636515fc6(b);
    return i32((-1));
  }
  SCRIPT_ParseBuffer(s, b, l);
  xfree__header_583636515fc6(b);
  return i32(s);
}

// C/C++ source: source/mact/src/scriplib.cpp:474
const __cxx_literal_773bed283abea27c7598 = Uint8Array.from([119, 0]);
export function SCRIPT_Save(scripthandle, filename) {
  let section;
  let entry;
  let value;
  let sec;
  let ent;
  let numsect;
  let nument;
  let fp;
  if ((!filename)) {
    return;
  }
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return;
  }
  (fp = fopen(filename, __cxx_literal_773bed283abea27c7598));
  if ((!fp)) {
    return;
  }
  (numsect = i32(SCRIPT_NumberSections(scripthandle)));
  for ((sec = i32(0)); (sec < numsect); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => sec, __cxx_lvalue_1 => { sec = __cxx_lvalue_1; }))) {
    (section = SCRIPT_Section(scripthandle, sec));
    if ((sec > 0)) {
      fputc(i32(10), fp);
    }
    if ((i32((cDeref(cPointerOffset(section, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0)) {
      fputc(i32(91), fp);
      buildvfs_fputstrptr__header_cadbd4f434d0(fp, section);
      buildvfs_fputstr__header_fa5263503b02(fp, "]\n");
    }
    (nument = i32(SCRIPT_NumberEntries(scripthandle, section)));
    for ((ent = i32(0)); (ent < nument); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => ent, __cxx_lvalue_3 => { ent = __cxx_lvalue_3; }))) {
      (entry = SCRIPT_Entry(scripthandle, section, ent));
      (value = SCRIPT_GetRaw(scripthandle, section, entry));
      buildvfs_fputstrptr__header_cadbd4f434d0(fp, entry);
      buildvfs_fputstr__header_1a138bfd5cc3(fp, " = ");
      buildvfs_fputstrptr__header_cadbd4f434d0(fp, value);
      fputc(i32(10), fp);
    }
  }
  fclose(fp);
}

// C/C++ source: source/mact/src/scriplib.cpp:516
export function SCRIPT_NumberSections(scripthandle) {
  let c = i32(0);
  let s;
  let ls = null;
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return i32(0);
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return i32(0);
  }
  for ((s = cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript); cPointerCompare(ls, s, "!="); ((ls = s), (s = cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; }));
  }
  return i32(c);
}

// C/C++ source: source/mact/src/scriplib.cpp:529
const __cxx_literal_e0e7db5097f04bb8ebbd = Uint8Array.from([0]);
const __cxx_literal_db9dd9511e76209078f5 = Uint8Array.from([0]);
export function SCRIPT_Section(scripthandle, which) {
  let s;
  let ls = null;
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return __cxx_literal_e0e7db5097f04bb8ebbd;
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return __cxx_literal_db9dd9511e76209078f5;
  }
  for ((s = cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript); ((which > 0) && cPointerCompare(ls, s, "!=")); (((ls = s), (s = cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).nextsection)), ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => which, __cxx_lvalue_1 => { which = __cxx_lvalue_1; })))) {
    ;
  }
  return cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).name;
}

// C/C++ source: source/mact/src/scriplib.cpp:541
export function SCRIPT_NumberEntries(scripthandle, sectionname) {
  let s;
  let e;
  let le = null;
  let c = i32(0);
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return i32(0);
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return i32(0);
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  if ((!s)) {
    return i32(0);
  }
  for ((e = cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries); cPointerCompare(le, e, "!="); ((le = e), (e = cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => c, __cxx_lvalue_1 => { c = __cxx_lvalue_1; }));
  }
  return i32(c);
}

// C/C++ source: source/mact/src/scriplib.cpp:557
const __cxx_literal_40f3466c4eb0c58f66a0 = Uint8Array.from([0]);
export function SCRIPT_Entry(scripthandle, sectionname, which) {
  let s;
  let e;
  let le = null;
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return null;
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return null;
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  if ((!s)) {
    return __cxx_literal_40f3466c4eb0c58f66a0;
  }
  for ((e = cRecordObject(cRecordPointer(s, {"align": 8, "arrayAlign": 1, "fields": {"entries": {"offset": 8, "pointer": true, "size": 8}, "lastline": {"offset": 16, "pointer": true, "size": 8}, "name": {"offset": 0, "pointer": true, "size": 8}, "nextsection": {"offset": 24, "pointer": true, "size": 8}, "prevsection": {"offset": 32, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).entries); ((which > 0) && cPointerCompare(le, e, "!=")); (((le = e), (e = cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).nextentry)), ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => which, __cxx_lvalue_1 => { which = __cxx_lvalue_1; })))) {
    ;
  }
  return cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name;
}

// C/C++ source: source/mact/src/scriplib.cpp:572
const __cxx_literal_4056202f0e91d4381aa7 = Uint8Array.from([0]);
export function SCRIPT_GetRaw(scripthandle, sectionname, entryname) {
  let s;
  let e;
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return null;
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return null;
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  (e = SCRIPT_EntryExists(s, entryname));
  if ((!e)) {
    return __cxx_literal_4056202f0e91d4381aa7;
  }
  return cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value;
}

// C/C++ source: source/mact/src/scriplib.cpp:587
export function SCRIPT_ParseString(dest, p) {
  let c = i32(0);
  let ch;
  if ((!(cPointerElementRef(dest, 0).value))) {
    let q = p;
    if ((i32((cDeref(q, Uint8Array).value)) == i32(34))) {
      ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => q, __cxx_lvalue_1 => { q = __cxx_lvalue_1; }));
      while ((Boolean((ch = (u32((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => q, __cxx_lvalue_3 => { q = __cxx_lvalue_3; })), Uint8Array).value)) & 255))) && (i32(ch) != i32(34)))) {
        if ((i32(ch) == i32(92))) {
          (ch = (u32((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => q, __cxx_lvalue_5 => { q = __cxx_lvalue_5; })), Uint8Array).value)) & 255));
          if ((!Boolean(ch))) {
            break;
          }
        }
        ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => c, __cxx_lvalue_7 => { c = __cxx_lvalue_7; }));
      }
    } else {
      while (((Boolean((ch = (u32((cDeref(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => q, __cxx_lvalue_9 => { q = __cxx_lvalue_9; })), Uint8Array).value)) & 255))) && (i32(ch) != i32(32))) && (i32(ch) != i32(9)))) {
        ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => c, __cxx_lvalue_11 => { c = __cxx_lvalue_11; }));
      }
    }
    ((cPointerElementRef(dest, 0).value) = cTypedPointer(xcalloc__header_aff4e6c0324f(u64(i32((c + 1))), 1), Uint8Array));
    (c = i32(0));
  }
  if ((i32((cDeref(p, Uint8Array).value)) == i32(34))) {
    ((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_12.value = next; return previous; })(cRef(() => p, __cxx_lvalue_13 => { p = __cxx_lvalue_13; }));
    while (Boolean((ch = (u32((cDeref(((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cRef(() => p, __cxx_lvalue_15 => { p = __cxx_lvalue_15; })), Uint8Array).value)) & 255)))) {
      switch (i32(ch)) {
        case i32(92): {
          (ch = (u32((cDeref(((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_16.value = next; return previous; })(cRef(() => p, __cxx_lvalue_17 => { p = __cxx_lvalue_17; })), Uint8Array).value)) & 255));
        }
        switch (i32(ch)) {
          case 0: {
            return p;
          }
          case i32(110): {
            ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), ((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i32((previous + 1)); __cxx_lvalue_18.value = next; return previous; })(cRef(() => c, __cxx_lvalue_19 => { c = __cxx_lvalue_19; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(10) & 255));
          }
          break;
          case i32(114): {
            ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), ((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = i32((previous + 1)); __cxx_lvalue_20.value = next; return previous; })(cRef(() => c, __cxx_lvalue_21 => { c = __cxx_lvalue_21; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(13) & 255));
          }
          break;
          case i32(116): {
            ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), ((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = i32((previous + 1)); __cxx_lvalue_22.value = next; return previous; })(cRef(() => c, __cxx_lvalue_23 => { c = __cxx_lvalue_23; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(9) & 255));
          }
          break;
          default: {
            ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), ((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = i32((previous + 1)); __cxx_lvalue_24.value = next; return previous; })(cRef(() => c, __cxx_lvalue_25 => { c = __cxx_lvalue_25; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(ch) & 255));
          }
          break;
        }
        break;
        case i32(34): {
          ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), c, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        }
        return p;
        default: {
          ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), ((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = i32((previous + 1)); __cxx_lvalue_26.value = next; return previous; })(cRef(() => c, __cxx_lvalue_27 => { c = __cxx_lvalue_27; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(ch) & 255));
        }
        break;
      }
    }
    return p;
  } else {
    while (Boolean((ch = (u32((cDeref(((__cxx_lvalue_28) => { const previous = __cxx_lvalue_28.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_28.value = next; return previous; })(cRef(() => p, __cxx_lvalue_29 => { p = __cxx_lvalue_29; })), Uint8Array).value)) & 255)))) {
      if (((i32(ch) == i32(32)) || (i32(ch) == i32(9)))) {
        ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), c, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
        break;
      } else {
        ((cDeref(cPointerOffset((cPointerElementRef(dest, 0).value), ((__cxx_lvalue_30) => { const previous = __cxx_lvalue_30.value; const next = i32((previous + 1)); __cxx_lvalue_30.value = next; return previous; })(cRef(() => c, __cxx_lvalue_31 => { c = __cxx_lvalue_31; })), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(ch) & 255));
      }
    }
  }
  return p;
}

// C/C++ source: source/mact/src/scriplib.cpp:666
export function SCRIPT_GetStringPtr(scripthandle, sectionname, entryname, dest) {
  let s;
  let e;
  let p;
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return i32(1);
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return i32(1);
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  (e = SCRIPT_EntryExists(s, entryname));
  if ((!e)) {
    return i32(1);
  }
  (p = cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value);
  SCRIPT_ParseString(dest, p);
  return i32(0);
}

// C/C++ source: source/mact/src/scriplib.cpp:688
export function SCRIPT_GetString(scripthandle, sectionname, entryname, dest) {
  const __cxx_lvalue_0 = cRef(() => dest, __cxx_lvalue_1 => { dest = __cxx_lvalue_1; });
  return i32(SCRIPT_GetStringPtr(scripthandle, sectionname, entryname, __cxx_lvalue_0));
}

// C/C++ source: source/mact/src/scriplib.cpp:693
export function SCRIPT_GetDoubleString(scripthandle, sectionname, entryname, dest1, dest2) {
  const __cxx_lvalue_0 = cRef(() => dest1, __cxx_lvalue_4 => { dest1 = __cxx_lvalue_4; });
  const __cxx_lvalue_1 = cRef(() => dest2, __cxx_lvalue_5 => { dest2 = __cxx_lvalue_5; });
  let s;
  let e;
  let p;
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return i32(1);
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return i32(1);
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  (e = SCRIPT_EntryExists(s, entryname));
  if ((!e)) {
    return i32(1);
  }
  (p = cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value);
  (p = SCRIPT_ParseString(__cxx_lvalue_0, p));
  if ((i32((cDeref(cPointerOffset(p, -(1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(34))) {
    return i32(0);
  }
  while (((i32((cDeref(p, Uint8Array).value)) == i32(32)) || (i32((cDeref(p, Uint8Array).value)) == i32(9)))) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; }));
  }
  if ((i32((cDeref(p, Uint8Array).value)) == 0)) {
    return i32(0);
  }
  SCRIPT_ParseString(__cxx_lvalue_1, p);
  return i32(0);
}

// C/C++ source: source/mact/src/scriplib.cpp:724
export function SCRIPT_GetNumber(scripthandle, sectionname, entryname, number) {
  let s;
  let e;
  let p;
  const __cxx_lvalue_0 = cRef(() => p, __cxx_lvalue_1 => { p = __cxx_lvalue_1; });
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return i32(1);
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return i32(1);
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  (e = SCRIPT_EntryExists(s, entryname));
  if ((!e)) {
    return i32(1);
  } else {
    if (((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(48)) && (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(120)))) {
      ((cDeref(number, Int32Array).value) = i32(strtol(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 2, Uint8Array.BYTES_PER_ELEMENT), __cxx_lvalue_0, 16)));
      if ((cPointerCompare(p, cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 2, Uint8Array.BYTES_PER_ELEMENT, true), "==") || (((i32((cDeref(p, Uint8Array).value)) != 0) && (i32((cDeref(p, Uint8Array).value)) != i32(32))) && (i32((cDeref(p, Uint8Array).value)) != i32(9))))) {
        return i32(1);
      }
    } else {
      ((cDeref(number, Int32Array).value) = i32(strtol(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, __cxx_lvalue_0, 10)));
      if ((cPointerCompare(p, cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, "==") || (((i32((cDeref(p, Uint8Array).value)) != 0) && (i32((cDeref(p, Uint8Array).value)) != i32(32))) && (i32((cDeref(p, Uint8Array).value)) != i32(9))))) {
        return i32(1);
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/mact/src/scriplib.cpp:756
const __cxx_literal_f46cc5e874208bcfb21c = Uint8Array.from([116, 114, 117, 101, 0]);
const __cxx_literal_60586b2302c445ed810b = Uint8Array.from([102, 97, 108, 115, 101, 0]);
export function SCRIPT_GetBoolean(scripthandle, sectionname, entryname, boole) {
  let s;
  let e;
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return i32(1);
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return i32(1);
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  (e = SCRIPT_EntryExists(s, entryname));
  if ((!e)) {
    return i32(1);
  } else {
    if ((!Boolean(strncasecmp(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, __cxx_literal_f46cc5e874208bcfb21c, u64(4))))) {
      ((cDeref(boole, Int32Array).value) = i32(1));
    } else {
      if ((!Boolean(strncasecmp(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, __cxx_literal_60586b2302c445ed810b, u64(5))))) {
        ((cDeref(boole, Int32Array).value) = i32(0));
      } else {
        if (((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(49)) && (((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(32)) || (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(9))) || (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)))) {
          ((cDeref(boole, Int32Array).value) = i32(1));
        } else {
          if (((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(48)) && (((i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(32)) || (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(9))) || (i32((cDeref(cPointerOffset(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)))) {
            ((cDeref(boole, Int32Array).value) = i32(0));
          }
        }
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/mact/src/scriplib.cpp:779
export function SCRIPT_GetDouble(scripthandle, sectionname, entryname, number) {
  let s;
  let e;
  let p;
  const __cxx_lvalue_0 = cRef(() => p, __cxx_lvalue_1 => { p = __cxx_lvalue_1; });
  if ((!(cPointerElementRef(scriptfiles, scripthandle).value))) {
    return i32(1);
  }
  if ((!cRecordObject(cRecordPointer((cPointerElementRef(scriptfiles, scripthandle).value), {"align": 8, "arrayAlign": 1, "fields": {"apScript": {"offset": 0, "pointer": true, "size": 8}, "lastsection": {"offset": 8, "pointer": true, "size": 8}, "scriptfilename": {"length": 256, "native": "Uint8Array", "offset": 24, "size": 256}, "scriptlines": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": false, "size": 280, "union": false}, {})).apScript)) {
    return i32(1);
  }
  (s = SCRIPT_SectionExists(scripthandle, sectionname));
  (e = SCRIPT_EntryExists(s, entryname));
  if ((!e)) {
    return i32(1);
  } else {
    ((cDeref(number, Float64Array).value) = strtod(cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, __cxx_lvalue_0));
    if ((cPointerCompare(p, cRecordObject(cRecordPointer(e, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "nextentry": {"offset": 16, "pointer": true, "size": 8}, "preventry": {"offset": 24, "pointer": true, "size": 8}, "value": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).value, "==") || (((i32((cDeref(p, Uint8Array).value)) != 0) && (i32((cDeref(p, Uint8Array).value)) != i32(32))) && (i32((cDeref(p, Uint8Array).value)) != i32(9))))) {
      return i32(1);
    }
  }
  return i32(0);
}

// C/C++ source: source/mact/src/scriplib.cpp:802
export function SCRIPT_PutSection(scripthandle, sectionname) {
  SCRIPT_AddSection(scripthandle, sectionname);
}

// C/C++ source: source/mact/src/scriplib.cpp:806
export function SCRIPT_PutRaw(scripthandle, sectionname, entryname, raw) {
  SCRIPT_AddEntry(scripthandle, sectionname, entryname, raw);
}

// C/C++ source: source/mact/src/scriplib.cpp:811
const __cxx_literal_0ec053846828be91093a = Uint8Array.from([0]);
export function SCRIPT_PutString(scripthandle, sectionname, entryname, string) {
  let q;
  let raw;
  let p;
  let len = i32(3);
  if ((!string)) {
    (string = __cxx_literal_0ec053846828be91093a);
  }
  for ((q = string); Boolean((cDeref(q, Uint8Array).value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => q, __cxx_lvalue_1 => { q = __cxx_lvalue_1; }))) {
    if ((((((i32((cDeref(q, Uint8Array).value)) == i32(13)) || (i32((cDeref(q, Uint8Array).value)) == i32(10))) || (i32((cDeref(q, Uint8Array).value)) == i32(9))) || (i32((cDeref(q, Uint8Array).value)) == i32(92))) || (i32((cDeref(q, Uint8Array).value)) == i32(34)))) {
      (len = i32((Number(len) + Number(2))));
    } else {
      if ((i32((cDeref(q, Uint8Array).value)) >= i32(32))) {
        ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => len, __cxx_lvalue_3 => { len = __cxx_lvalue_3; }));
      }
    }
  }
  (p = (raw = cTypedPointer(xmalloc__header_355dc28d92b2(u64(len)), Uint8Array)));
  ((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => p, __cxx_lvalue_5 => { p = __cxx_lvalue_5; })), Uint8Array).value) = (u32(34) & 255));
  for ((q = string); Boolean((cDeref(q, Uint8Array).value)); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(cRef(() => q, __cxx_lvalue_7 => { q = __cxx_lvalue_7; }))) {
    if ((i32((cDeref(q, Uint8Array).value)) == i32(13))) {
      ((cDeref(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => p, __cxx_lvalue_9 => { p = __cxx_lvalue_9; })), Uint8Array).value) = (u32(92) & 255));
      ((cDeref(((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_10.value = next; return previous; })(cRef(() => p, __cxx_lvalue_11 => { p = __cxx_lvalue_11; })), Uint8Array).value) = (u32(114) & 255));
    } else {
      if ((i32((cDeref(q, Uint8Array).value)) == i32(10))) {
        ((cDeref(((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_12.value = next; return previous; })(cRef(() => p, __cxx_lvalue_13 => { p = __cxx_lvalue_13; })), Uint8Array).value) = (u32(92) & 255));
        ((cDeref(((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cRef(() => p, __cxx_lvalue_15 => { p = __cxx_lvalue_15; })), Uint8Array).value) = (u32(110) & 255));
      } else {
        if ((i32((cDeref(q, Uint8Array).value)) == i32(9))) {
          ((cDeref(((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_16.value = next; return previous; })(cRef(() => p, __cxx_lvalue_17 => { p = __cxx_lvalue_17; })), Uint8Array).value) = (u32(92) & 255));
          ((cDeref(((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_18.value = next; return previous; })(cRef(() => p, __cxx_lvalue_19 => { p = __cxx_lvalue_19; })), Uint8Array).value) = (u32(116) & 255));
        } else {
          if (((i32((cDeref(q, Uint8Array).value)) == i32(92)) || (i32((cDeref(q, Uint8Array).value)) == i32(34)))) {
            ((cDeref(((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_20.value = next; return previous; })(cRef(() => p, __cxx_lvalue_21 => { p = __cxx_lvalue_21; })), Uint8Array).value) = (u32(92) & 255));
            ((cDeref(((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_22.value = next; return previous; })(cRef(() => p, __cxx_lvalue_23 => { p = __cxx_lvalue_23; })), Uint8Array).value) = (u32((cDeref(q, Uint8Array).value)) & 255));
          } else {
            if ((i32((cDeref(q, Uint8Array).value)) >= i32(32))) {
              ((cDeref(((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_24.value = next; return previous; })(cRef(() => p, __cxx_lvalue_25 => { p = __cxx_lvalue_25; })), Uint8Array).value) = (u32((cDeref(q, Uint8Array).value)) & 255));
            }
          }
        }
      }
    }
  }
  ((cDeref(((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_26.value = next; return previous; })(cRef(() => p, __cxx_lvalue_27 => { p = __cxx_lvalue_27; })), Uint8Array).value) = (u32(34) & 255));
  ((cDeref(p, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  SCRIPT_AddEntry(scripthandle, sectionname, entryname, raw);
  xfree__header_583636515fc6(raw);
}

// C/C++ source: source/mact/src/scriplib.cpp:840
const __cxx_literal_e46f2c3480149b510e67 = Uint8Array.from([0]);
const __cxx_literal_c4b3208d24fcfb5d8422 = Uint8Array.from([0]);
export function SCRIPT_PutDoubleString(scripthandle, sectionname, entryname, string1, string2) {
  let q;
  let raw;
  let p;
  let len = i32(6);
  if ((!string1)) {
    (string1 = __cxx_literal_e46f2c3480149b510e67);
  }
  if ((!string2)) {
    (string2 = __cxx_literal_c4b3208d24fcfb5d8422);
  }
  for ((q = string1); Boolean((cDeref(q, Uint8Array).value)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => q, __cxx_lvalue_1 => { q = __cxx_lvalue_1; }))) {
    if ((((((i32((cDeref(q, Uint8Array).value)) == i32(13)) || (i32((cDeref(q, Uint8Array).value)) == i32(10))) || (i32((cDeref(q, Uint8Array).value)) == i32(9))) || (i32((cDeref(q, Uint8Array).value)) == i32(92))) || (i32((cDeref(q, Uint8Array).value)) == i32(34)))) {
      (len = i32((Number(len) + Number(2))));
    } else {
      if ((i32((cDeref(q, Uint8Array).value)) >= i32(32))) {
        ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => len, __cxx_lvalue_3 => { len = __cxx_lvalue_3; }));
      }
    }
  }
  for ((q = string2); Boolean((cDeref(q, Uint8Array).value)); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => q, __cxx_lvalue_5 => { q = __cxx_lvalue_5; }))) {
    if ((((((i32((cDeref(q, Uint8Array).value)) == i32(13)) || (i32((cDeref(q, Uint8Array).value)) == i32(10))) || (i32((cDeref(q, Uint8Array).value)) == i32(9))) || (i32((cDeref(q, Uint8Array).value)) == i32(92))) || (i32((cDeref(q, Uint8Array).value)) == i32(34)))) {
      (len = i32((Number(len) + Number(2))));
    } else {
      if ((i32((cDeref(q, Uint8Array).value)) >= i32(32))) {
        ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => len, __cxx_lvalue_7 => { len = __cxx_lvalue_7; }));
      }
    }
  }
  (p = (raw = cTypedPointer(xmalloc__header_355dc28d92b2(u64(len)), Uint8Array)));
  ((cDeref(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_8.value = next; return previous; })(cRef(() => p, __cxx_lvalue_9 => { p = __cxx_lvalue_9; })), Uint8Array).value) = (u32(34) & 255));
  for ((q = string1); Boolean((cDeref(q, Uint8Array).value)); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_10.value = next; return previous; })(cRef(() => q, __cxx_lvalue_11 => { q = __cxx_lvalue_11; }))) {
    if ((i32((cDeref(q, Uint8Array).value)) == i32(13))) {
      ((cDeref(((__cxx_lvalue_12) => { const previous = __cxx_lvalue_12.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_12.value = next; return previous; })(cRef(() => p, __cxx_lvalue_13 => { p = __cxx_lvalue_13; })), Uint8Array).value) = (u32(92) & 255));
      ((cDeref(((__cxx_lvalue_14) => { const previous = __cxx_lvalue_14.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_14.value = next; return previous; })(cRef(() => p, __cxx_lvalue_15 => { p = __cxx_lvalue_15; })), Uint8Array).value) = (u32(114) & 255));
    } else {
      if ((i32((cDeref(q, Uint8Array).value)) == i32(10))) {
        ((cDeref(((__cxx_lvalue_16) => { const previous = __cxx_lvalue_16.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_16.value = next; return previous; })(cRef(() => p, __cxx_lvalue_17 => { p = __cxx_lvalue_17; })), Uint8Array).value) = (u32(92) & 255));
        ((cDeref(((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_18.value = next; return previous; })(cRef(() => p, __cxx_lvalue_19 => { p = __cxx_lvalue_19; })), Uint8Array).value) = (u32(110) & 255));
      } else {
        if ((i32((cDeref(q, Uint8Array).value)) == i32(9))) {
          ((cDeref(((__cxx_lvalue_20) => { const previous = __cxx_lvalue_20.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_20.value = next; return previous; })(cRef(() => p, __cxx_lvalue_21 => { p = __cxx_lvalue_21; })), Uint8Array).value) = (u32(92) & 255));
          ((cDeref(((__cxx_lvalue_22) => { const previous = __cxx_lvalue_22.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_22.value = next; return previous; })(cRef(() => p, __cxx_lvalue_23 => { p = __cxx_lvalue_23; })), Uint8Array).value) = (u32(116) & 255));
        } else {
          if (((i32((cDeref(q, Uint8Array).value)) == i32(92)) || (i32((cDeref(q, Uint8Array).value)) == i32(34)))) {
            ((cDeref(((__cxx_lvalue_24) => { const previous = __cxx_lvalue_24.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_24.value = next; return previous; })(cRef(() => p, __cxx_lvalue_25 => { p = __cxx_lvalue_25; })), Uint8Array).value) = (u32(92) & 255));
            ((cDeref(((__cxx_lvalue_26) => { const previous = __cxx_lvalue_26.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_26.value = next; return previous; })(cRef(() => p, __cxx_lvalue_27 => { p = __cxx_lvalue_27; })), Uint8Array).value) = (u32((cDeref(q, Uint8Array).value)) & 255));
          } else {
            if ((i32((cDeref(q, Uint8Array).value)) >= i32(32))) {
              ((cDeref(((__cxx_lvalue_28) => { const previous = __cxx_lvalue_28.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_28.value = next; return previous; })(cRef(() => p, __cxx_lvalue_29 => { p = __cxx_lvalue_29; })), Uint8Array).value) = (u32((cDeref(q, Uint8Array).value)) & 255));
            }
          }
        }
      }
    }
  }
  ((cDeref(((__cxx_lvalue_30) => { const previous = __cxx_lvalue_30.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_30.value = next; return previous; })(cRef(() => p, __cxx_lvalue_31 => { p = __cxx_lvalue_31; })), Uint8Array).value) = (u32(34) & 255));
  ((cDeref(((__cxx_lvalue_32) => { const previous = __cxx_lvalue_32.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_32.value = next; return previous; })(cRef(() => p, __cxx_lvalue_33 => { p = __cxx_lvalue_33; })), Uint8Array).value) = (u32(32) & 255));
  ((cDeref(((__cxx_lvalue_34) => { const previous = __cxx_lvalue_34.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_34.value = next; return previous; })(cRef(() => p, __cxx_lvalue_35 => { p = __cxx_lvalue_35; })), Uint8Array).value) = (u32(34) & 255));
  for ((q = string2); Boolean((cDeref(q, Uint8Array).value)); ((__cxx_lvalue_36) => { const previous = __cxx_lvalue_36.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_36.value = next; return previous; })(cRef(() => q, __cxx_lvalue_37 => { q = __cxx_lvalue_37; }))) {
    if ((i32((cDeref(q, Uint8Array).value)) == i32(13))) {
      ((cDeref(((__cxx_lvalue_38) => { const previous = __cxx_lvalue_38.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_38.value = next; return previous; })(cRef(() => p, __cxx_lvalue_39 => { p = __cxx_lvalue_39; })), Uint8Array).value) = (u32(92) & 255));
      ((cDeref(((__cxx_lvalue_40) => { const previous = __cxx_lvalue_40.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_40.value = next; return previous; })(cRef(() => p, __cxx_lvalue_41 => { p = __cxx_lvalue_41; })), Uint8Array).value) = (u32(114) & 255));
    } else {
      if ((i32((cDeref(q, Uint8Array).value)) == i32(10))) {
        ((cDeref(((__cxx_lvalue_42) => { const previous = __cxx_lvalue_42.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_42.value = next; return previous; })(cRef(() => p, __cxx_lvalue_43 => { p = __cxx_lvalue_43; })), Uint8Array).value) = (u32(92) & 255));
        ((cDeref(((__cxx_lvalue_44) => { const previous = __cxx_lvalue_44.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_44.value = next; return previous; })(cRef(() => p, __cxx_lvalue_45 => { p = __cxx_lvalue_45; })), Uint8Array).value) = (u32(110) & 255));
      } else {
        if ((i32((cDeref(q, Uint8Array).value)) == i32(9))) {
          ((cDeref(((__cxx_lvalue_46) => { const previous = __cxx_lvalue_46.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_46.value = next; return previous; })(cRef(() => p, __cxx_lvalue_47 => { p = __cxx_lvalue_47; })), Uint8Array).value) = (u32(92) & 255));
          ((cDeref(((__cxx_lvalue_48) => { const previous = __cxx_lvalue_48.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_48.value = next; return previous; })(cRef(() => p, __cxx_lvalue_49 => { p = __cxx_lvalue_49; })), Uint8Array).value) = (u32(116) & 255));
        } else {
          if (((i32((cDeref(q, Uint8Array).value)) == i32(92)) || (i32((cDeref(q, Uint8Array).value)) == i32(34)))) {
            ((cDeref(((__cxx_lvalue_50) => { const previous = __cxx_lvalue_50.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_50.value = next; return previous; })(cRef(() => p, __cxx_lvalue_51 => { p = __cxx_lvalue_51; })), Uint8Array).value) = (u32(92) & 255));
            ((cDeref(((__cxx_lvalue_52) => { const previous = __cxx_lvalue_52.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_52.value = next; return previous; })(cRef(() => p, __cxx_lvalue_53 => { p = __cxx_lvalue_53; })), Uint8Array).value) = (u32((cDeref(q, Uint8Array).value)) & 255));
          } else {
            if ((i32((cDeref(q, Uint8Array).value)) >= i32(32))) {
              ((cDeref(((__cxx_lvalue_54) => { const previous = __cxx_lvalue_54.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_54.value = next; return previous; })(cRef(() => p, __cxx_lvalue_55 => { p = __cxx_lvalue_55; })), Uint8Array).value) = (u32((cDeref(q, Uint8Array).value)) & 255));
            }
          }
        }
      }
    }
  }
  ((cDeref(((__cxx_lvalue_56) => { const previous = __cxx_lvalue_56.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_56.value = next; return previous; })(cRef(() => p, __cxx_lvalue_57 => { p = __cxx_lvalue_57; })), Uint8Array).value) = (u32(34) & 255));
  ((cDeref(p, Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  SCRIPT_AddEntry(scripthandle, sectionname, entryname, raw);
  xfree__header_583636515fc6(raw);
}

// C/C++ source: source/mact/src/scriplib.cpp:893
const __cxx_literal_9e569de647e9d74b47f9 = Uint8Array.from([48, 120, 37, 88, 0]);
const __cxx_literal_da4175ede277d0f4a7db = Uint8Array.from([37, 100, 0]);
export function SCRIPT_PutNumber(scripthandle, sectionname, entryname, number, hexadecimal, defaultvalue) {
  let raw = cZeroAggregate({"array": "Uint8Array", "dims": [64]});
  (defaultvalue = i32(defaultvalue));
  if (Boolean(hexadecimal)) {
    sprintf(raw, __cxx_literal_9e569de647e9d74b47f9, number);
  } else {
    sprintf(raw, __cxx_literal_da4175ede277d0f4a7db, number);
  }
  SCRIPT_AddEntry(scripthandle, sectionname, entryname, raw);
}

// C/C++ source: source/mact/src/scriplib.cpp:912
export function SCRIPT_PutBoolean(scripthandle, sectionname, entryname, boole) {
  let raw = "0";
  if (Boolean(boole)) {
    ((cDeref(cPointerOffset(raw, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(49) & 255));
  }
  SCRIPT_AddEntry(scripthandle, sectionname, entryname, raw);
}

// C/C++ source: source/mact/src/scriplib.cpp:927
const __cxx_literal_4f5386edffa62309585a = Uint8Array.from([37, 103, 0]);
export function SCRIPT_PutDouble(scripthandle, sectionname, entryname, number, defaultvalue) {
  let raw = cZeroAggregate({"array": "Uint8Array", "dims": [64]});
  (defaultvalue = i32(defaultvalue));
  sprintf(raw, __cxx_literal_4f5386edffa62309585a, number);
  SCRIPT_AddEntry(scripthandle, sectionname, entryname, raw);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_d01a2af427b97ec6 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_f7bba8fe27d5a60556d25987() {
  return __cxx_static_address_f7bba8fe27d5a60556d25987.reference || (__cxx_static_address_f7bba8fe27d5a60556d25987.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_d01a2af427b97ec6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f7bba8fe27d5a60556d25987() { return __cxx_static_address_f7bba8fe27d5a60556d25987(); }

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_355dc28d92b2(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_583636515fc6(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup__header_7467580091fb(s) {
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

export function SILENCE_UNUSED__header_734de4679518(arg0, arg1) {

}

export function SILENCE_UNUSED__header_ec2349501768(arg0, arg1) {

}

export function SILENCE_UNUSED__header_bcc14d043222(arg0, arg1, arg2) {

}

export function SILENCE_UNUSED__header_e8eecde66517(arg0, arg1) {

}

export function SILENCE_UNUSED__header_596a20fad036(arg0) {

}

// C/C++ source: source/build/include/vfs.h:105
export function buildvfs_length__header_9ee66f61c537(fd) {
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});
  return i64(((fstat(fd, st) < 0) ? i64((-1)) : st.st_size));
}

// C/C++ source: source/build/include/vfs.h:163
export function buildvfs_fputstrptr__header_cadbd4f434d0(fp, str) {
  if (fp) {
    fwrite(str, u64(1), strlen(str), fp);
  }
}

export function buildvfs_fputstr__header_fa5263503b02(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(3n)) - BigInt(u64(1)))), fp);
  }
}

export function buildvfs_fputstr__header_1a138bfd5cc3(fp, str) {
  if (fp) {
    fwrite(str, u64(1), u64((BigInt(u64(4n)) - BigInt(u64(1)))), fp);
  }
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc__header_aff4e6c0324f(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}
