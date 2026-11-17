// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/multivoc.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { divtable32 } from "../../build/src/pragmas.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_a6e3cfd4eba13fb9886cb240 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s32_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
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
  // The selected GNU ABI lets a strided field loop form its final raw byte
  // address after the last field. Dereference still checks the original
  // array's upper bound and rejects that address.
  const stridedEnd=outside && !p.__cAddressOnly && next===p.upper+p.stridedFieldOffset &&
      change===p.stridedFieldStride;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || outside&&!addressOnly&&!stridedEnd)
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
const cInitByteRecord = (schema, values={}, storage=null, prototypes={}, allocation=null) => {
  if(schema.pointerEncoding && (schema.pointerEncoding!=='source-lp64-addresses/2' ||
      globalThis[Symbol.for('source-first.native-pointer-abi')]!==schema.pointerEncoding))
    throw new TypeError('Overlapping pointer union requires the verified source address ABI');
  if(schema.projection && (!(storage instanceof Uint8Array) || typeof values==='function' ||
      !values || Object.keys(values).length || schema.prototype))
    throw new TypeError('Nontrivial C++ field view requires existing storage without initialization');
  const sizeLimit=schema.projection && schema.fieldView ? 268435456 : 1048576;
  if (!Number.isSafeInteger(schema.size) || schema.size<1 || schema.size>sizeLimit ||
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
    } else if (field.reference) {
      if(field.reference!==true || field.size!==8 || field.offset+8>bytes.length)
        throw new TypeError('Reference field differs from verified LP64 ABI');
      Object.defineProperty(result,name,{enumerable:true,get:()=>{
        const reference=cByteRecordPointers.decode(view.getBigUint64(field.offset,true));
        if(reference?.__cReference!==true)throw new TypeError('Uninitialized original C++ reference member');
        return reference;
      },set:reference=>{
        if(reference?.__cReference!==true)throw new TypeError('C++ reference member requires original lvalue storage');
        view.setBigUint64(field.offset,cByteRecordPointers.encode(reference),true);
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
const cRecordArrayByteAddress = (array, count, stride, fieldOffset, fieldSize) => {
  const bytes = array?.[cByteRecordArrayStorage];
  if (!(bytes instanceof Uint8Array) || array.length !== count || bytes.length !== count * stride ||
      !Number.isSafeInteger(fieldOffset) || fieldOffset < 0 || fieldSize < 1 ||
      fieldOffset + fieldSize > stride)
    throw new TypeError('Strided field address requires the complete original byte array');
  const pointer = cPointerOffset(bytes, fieldOffset, 1);
  return {...pointer, stridedFieldOffset:fieldOffset, stridedFieldStride:stride};
};
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

// Implicit trivial C++ assignment changes destination storage in place. Existing
// references to its fields, arrays and overlapping union views retain identity.
// cCopyAggregate validates exact Clang storage schemas and snapshots the source
// before any mutation, including self-assignment or overlapping storage.
const cAssignAggregate = (destination, source, schema, assignmentProof=null) => {
  if(assignmentProof!==null){
    // Only a same-record assignment selected by the original Clang AST may
    // take this path. A JS method prototype occupies no native object bytes.
    // Constructors, authored assignment and generic object copies stay strict.
    const p=assignmentProof,expected=schema.byteRecord;
    if(p.abi!=='source-clang-trivial-record-assignment/1'||!p.clang_method_id||
       !p.record_name||p.record_name!==p.source_record||
       !['copyAssign','moveAssign','clang-trivial-implicit-byte-copy'].includes(p.assignment_mode)||
       p.native_layout?.abi!=='source-record-field-storage/1'||!expected||expected.projection)
      throw TypeError('Trivial record assignment lacks its original Clang proof');
    const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?
      Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
    const native=value=>JSON.stringify(stable(Object.fromEntries(Object.entries(value).filter(([k])=>k!=='prototype'))));
    const target=cByteRecordStorage.get(destination),input=cByteRecordStorage.get(source);
    if(!target||!input||target.bytes.length!==expected.size||input.bytes.length!==expected.size||
       native(JSON.parse(target.schema))!==native(expected)||native(JSON.parse(input.schema))!==native(expected))
      throw TypeError('Trivial record assignment differs from its original native layout');
    target.bytes.set(new Uint8Array(input.bytes));
    return destination;
  }
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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


// Scalar semantics of a proven original load-float/convert-to-int intrinsic
// pair. This is readable arithmetic, with no CPU/ISA execution machinery.
const cSSEFloat32ToInt32 = value => {
  const number = Math.fround(value);
  if (!Number.isFinite(number)) return -2147483648;
  const lower = Math.floor(number), fraction = number - lower;
  const rounded = fraction < .5 ? lower : fraction > .5 ? lower + 1
    : lower % 2 === 0 ? lower : lower + 1;
  return rounded < -2147483648 || rounded > 2147483647 ? -2147483648 : rounded | 0;
};

const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_5f14566919e51ca3 = i32(3754936);
function __cxx_static_address_de7af7089e6c0efcde3ca5aa() {
  return __cxx_static_address_de7af7089e6c0efcde3ca5aa.reference || (__cxx_static_address_de7af7089e6c0efcde3ca5aa.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_5f14566919e51ca3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_ca96090559e514d4 = i32(1144);
function __cxx_static_address_8d3e2fb7ea94f01b41f81bb0() {
  return __cxx_static_address_8d3e2fb7ea94f01b41f81bb0.reference || (__cxx_static_address_8d3e2fb7ea94f01b41f81bb0.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_ca96090559e514d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/include/multivoc.h:149
export function MV_MusicRoutineBuffer() {
  return MV_MusicRoutineBuffer.type || (MV_MusicRoutineBuffer.type = class MV_MusicRoutineBuffer__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"buffer": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/audiolib/src/multivoc.cpp:395
export class __cxx_record_ref_count_ptr_a19f50960d765cf5 {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_19d3a11f50b9f80b(t) {
    this.p = t;
    
  }
  static __cxx_construct_19d3a11f50b9f80b(t) {
    const value=Object.create(__cxx_record_ref_count_ptr_a19f50960d765cf5.prototype);
    value.__cxx_construct_19d3a11f50b9f80b(t);
    return value;
  }
  __cxx_construct_3fdb0b4b21c3726c() {
    this.p = null;
    
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(__cxx_record_ref_count_ptr_a19f50960d765cf5.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_86dd43e02985fcde(other) {
    this.p = other.p;
        (other.p = null);
  }
  static __cxx_construct_86dd43e02985fcde(other) {
    const value=Object.create(__cxx_record_ref_count_ptr_a19f50960d765cf5.prototype);
    value.__cxx_construct_86dd43e02985fcde(other);
    return value;
  }
  __cxx_operator_74f15c789850719c(arg0) {
    if (this.p) {
      cRecordObject(this.p).remove_ref(u64(1));
    }
    (this.p = null);
    return this;
  }
  __cxx_operator_48ae80392d648bd2(other) {
    if (this.p) {
      cRecordObject(this.p).remove_ref(u64(1));
      (this.p = null);
    }
    (this.p = other.p);
    (other.p = null);
    return this;
  }
  __cxx_operator_70cfbc9f7dfd2e2a() {
    return this.p;
  }
  get() {
    return this.p;
  }
  release() {
    let out = this.p;
    (this.p = null);
    return out;
  }
  __cxx_conversion_ff87936e65be0ab2() {
    return Boolean(cPointerCompare(this.p, null, "!="));
  }
  __cxx_destruct_36362e01566902a6() {
    if (this.p) {
      cRecordObject(this.p).remove_ref(u64(1));
    }
  }
}

// C/C++ source: source/audiolib/src/multivoc.cpp:60
export let MV_ReverbLevel = 0;
function __cxx_static_address_8ab29b01937a37b6b93b5306() {
  return __cxx_static_address_8ab29b01937a37b6b93b5306.reference || (__cxx_static_address_8ab29b01937a37b6b93b5306.reference = {
    __cReference: true,
    get value() { return MV_ReverbLevel; },
    set value(__cxx_lvalue_0) { MV_ReverbLevel = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_8ab29b01937a37b6b93b5306() { return __cxx_static_address_8ab29b01937a37b6b93b5306(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:61
export let MV_ReverbDelay = 0;
function __cxx_static_address_04bb4c1afe72ffab04a12fb4() {
  return __cxx_static_address_04bb4c1afe72ffab04a12fb4.reference || (__cxx_static_address_04bb4c1afe72ffab04a12fb4.reference = {
    __cReference: true,
    get value() { return MV_ReverbDelay; },
    set value(__cxx_lvalue_0) { MV_ReverbDelay = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_04bb4c1afe72ffab04a12fb4() { return __cxx_static_address_04bb4c1afe72ffab04a12fb4(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:62
export let MV_ReverbVolume = 0;
function __cxx_static_address_116153779212623c7a04003f() {
  return __cxx_static_address_116153779212623c7a04003f.reference || (__cxx_static_address_116153779212623c7a04003f.reference = {
    __cReference: true,
    get value() { return MV_ReverbVolume; },
    set value(__cxx_lvalue_0) { MV_ReverbVolume = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_116153779212623c7a04003f() { return __cxx_static_address_116153779212623c7a04003f(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:64
export let MV_PanTable = cByteRecordNDArray({"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, [128, 128], {}, cStaticInitializerValues([]));
function __cxx_static_address_a187ce19e9b40c298627eff3() {
  return __cxx_static_address_a187ce19e9b40c298627eff3.reference || (__cxx_static_address_a187ce19e9b40c298627eff3.reference = {
    __cReference: true,
    get value() { return MV_PanTable; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:66
export let MV_Installed = 0;
export function __cxx_global_cell_6ba894e05caa47d1bfdd0a0c() {
  return __cxx_global_cell_6ba894e05caa47d1bfdd0a0c.reference || (__cxx_global_cell_6ba894e05caa47d1bfdd0a0c.reference = {
    __cReference: true,
    get value() { return MV_Installed; },
    set value(__cxx_lvalue_0) { MV_Installed = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:68
export let MV_BufferSize = i32(256);
export function __cxx_global_cell_52b7fc592cc0ae06f2ba575b() {
  return __cxx_global_cell_52b7fc592cc0ae06f2ba575b.reference || (__cxx_global_cell_52b7fc592cc0ae06f2ba575b.reference = {
    __cReference: true,
    get value() { return MV_BufferSize; },
    set value(__cxx_lvalue_0) { MV_BufferSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:69
export let MV_BufferLength = 0;
function __cxx_static_address_de9a3150e6a23bec9b056b81() {
  return __cxx_static_address_de9a3150e6a23bec9b056b81.reference || (__cxx_static_address_de9a3150e6a23bec9b056b81.reference = {
    __cReference: true,
    get value() { return MV_BufferLength; },
    set value(__cxx_lvalue_0) { MV_BufferLength = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_de9a3150e6a23bec9b056b81() { return __cxx_static_address_de9a3150e6a23bec9b056b81(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:71
export let MV_NumberOfBuffers = i32(32);
function __cxx_static_address_55acafd99436af2011d7d486() {
  return __cxx_static_address_55acafd99436af2011d7d486.reference || (__cxx_static_address_55acafd99436af2011d7d486.reference = {
    __cReference: true,
    get value() { return MV_NumberOfBuffers; },
    set value(__cxx_lvalue_0) { MV_NumberOfBuffers = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_55acafd99436af2011d7d486() { return __cxx_static_address_55acafd99436af2011d7d486(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:73
export let MV_MaxVoices = i32(1);
export function __cxx_global_cell_671d938a8da950fac64efbdb() {
  return __cxx_global_cell_671d938a8da950fac64efbdb.reference || (__cxx_global_cell_671d938a8da950fac64efbdb.reference = {
    __cReference: true,
    get value() { return MV_MaxVoices; },
    set value(__cxx_lvalue_0) { MV_MaxVoices = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:74
export let MV_Channels = i32(1);
export function __cxx_global_cell_9eef96950efe01b75b43b902() {
  return __cxx_global_cell_9eef96950efe01b75b43b902.reference || (__cxx_global_cell_9eef96950efe01b75b43b902.reference = {
    __cReference: true,
    get value() { return MV_Channels; },
    set value(__cxx_lvalue_0) { MV_Channels = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:75
export let MV_MixRate = 0;
export function __cxx_global_cell_60c5e8a990104b93db1b82e7() {
  return __cxx_global_cell_60c5e8a990104b93db1b82e7.reference || (__cxx_global_cell_60c5e8a990104b93db1b82e7.reference = {
    __cReference: true,
    get value() { return MV_MixRate; },
    set value(__cxx_lvalue_0) { MV_MixRate = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:76
export let MV_InitDataPtr = null;
export function __cxx_global_cell_df3169c392bf05de38bfe108() {
  return __cxx_global_cell_df3169c392bf05de38bfe108.reference || (__cxx_global_cell_df3169c392bf05de38bfe108.reference = {
    __cReference: true,
    get value() { return MV_InitDataPtr; },
    set value(__cxx_lvalue_0) { MV_InitDataPtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:78
export let MV_LazyAlloc = i32(true);
export function __cxx_global_cell_a041cfaa612703140e111290() {
  return __cxx_global_cell_a041cfaa612703140e111290.reference || (__cxx_global_cell_a041cfaa612703140e111290.reference = {
    __cReference: true,
    get value() { return MV_LazyAlloc; },
    set value(__cxx_lvalue_0) { MV_LazyAlloc = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:84
export let MV_BufferEmpty = new Int32Array(32);
function __cxx_static_address_58611e27a1da29a5e2cf73ae() {
  return __cxx_static_address_58611e27a1da29a5e2cf73ae.reference || (__cxx_static_address_58611e27a1da29a5e2cf73ae.reference = {
    __cReference: true,
    get value() { return MV_BufferEmpty; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_58611e27a1da29a5e2cf73ae() { return __cxx_static_address_58611e27a1da29a5e2cf73ae(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:85
export let MV_MixBuffer = cPointerArray(65);
function __cxx_static_address_e4e10d857355e6d688b20fac() {
  return __cxx_static_address_e4e10d857355e6d688b20fac.reference || (__cxx_static_address_e4e10d857355e6d688b20fac.reference = {
    __cReference: true,
    get value() { return MV_MixBuffer; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:87
export let MV_Voices = null;
export function __cxx_global_cell_c913bc40c747f8379816a88e() {
  return __cxx_global_cell_c913bc40c747f8379816a88e.reference || (__cxx_global_cell_c913bc40c747f8379816a88e.reference = {
    __cReference: true,
    get value() { return MV_Voices; },
    set value(__cxx_lvalue_0) { MV_Voices = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_d6a7f09a7fbf5ab2 = i32(2147483647);
function __cxx_static_address_0ef0a0e32da49ada59ee1734() {
  return __cxx_static_address_0ef0a0e32da49ada59ee1734.reference || (__cxx_static_address_0ef0a0e32da49ada59ee1734.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_d6a7f09a7fbf5ab2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2dab9d3c1b46b3d6 = i32(2147483648);
function __cxx_static_address_aaa80cb1d9bc2c219db46955() {
  return __cxx_static_address_aaa80cb1d9bc2c219db46955.reference || (__cxx_static_address_aaa80cb1d9bc2c219db46955.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2dab9d3c1b46b3d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c8e9504c5fdd6057 = i32(2147483648);
function __cxx_static_address_6531ee937f0004ee9305e85a() {
  return __cxx_static_address_6531ee937f0004ee9305e85a.reference || (__cxx_static_address_6531ee937f0004ee9305e85a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c8e9504c5fdd6057; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_4893317b55fdd91c = i32(65536);
function __cxx_static_address_e28eaf10de1e1605ef80a958() {
  return __cxx_static_address_e28eaf10de1e1605ef80a958.reference || (__cxx_static_address_e28eaf10de1e1605ef80a958.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_4893317b55fdd91c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_56990b17be0360a2 = i32(32768);
function __cxx_static_address_41ab4f9cd50d845806bbad11() {
  return __cxx_static_address_41ab4f9cd50d845806bbad11.reference || (__cxx_static_address_41ab4f9cd50d845806bbad11.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_56990b17be0360a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_3a1df6c21418345f = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_4122146f83801b3bd31a648d() {
  return __cxx_static_address_4122146f83801b3bd31a648d.reference || (__cxx_static_address_4122146f83801b3bd31a648d.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_3a1df6c21418345f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:91
export let MV_MixPage = 0;
function __cxx_static_address_8733c2c3c2373c35c3f26ae4() {
  return __cxx_static_address_8733c2c3c2373c35c3f26ae4.reference || (__cxx_static_address_8733c2c3c2373c35c3f26ae4.reference = {
    __cReference: true,
    get value() { return MV_MixPage; },
    set value(__cxx_lvalue_0) { MV_MixPage = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_8733c2c3c2373c35c3f26ae4() { return __cxx_static_address_8733c2c3c2373c35c3f26ae4(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:93
export let MV_CallBackFunc = null;
function __cxx_static_address_2e18f8fee903270951f3aeaf() {
  return __cxx_static_address_2e18f8fee903270951f3aeaf.reference || (__cxx_static_address_2e18f8fee903270951f3aeaf.reference = {
    __cReference: true,
    get value() { return MV_CallBackFunc; },
    set value(__cxx_lvalue_0) { MV_CallBackFunc = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_2e18f8fee903270951f3aeaf() { return __cxx_static_address_2e18f8fee903270951f3aeaf(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:95
export let MV_MixDestination = null;
export function __cxx_global_cell_1e2fc3d4b9ce0dbbe47b0ceb() {
  return __cxx_global_cell_1e2fc3d4b9ce0dbbe47b0ceb.reference || (__cxx_global_cell_1e2fc3d4b9ce0dbbe47b0ceb.reference = {
    __cReference: true,
    get value() { return MV_MixDestination; },
    set value(__cxx_lvalue_0) { MV_MixDestination = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:96
export let MV_SampleSize = i32(1);
export function __cxx_global_cell_f26f74aea0df8d9a78820661() {
  return __cxx_global_cell_f26f74aea0df8d9a78820661.reference || (__cxx_global_cell_f26f74aea0df8d9a78820661.reference = {
    __cReference: true,
    get value() { return MV_SampleSize; },
    set value(__cxx_lvalue_0) { MV_SampleSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:97
export let MV_RightChannelOffset = 0;
export function __cxx_global_cell_ca9f4f046a4443694bc8a5a4() {
  return __cxx_global_cell_ca9f4f046a4443694bc8a5a4.reference || (__cxx_global_cell_ca9f4f046a4443694bc8a5a4.reference = {
    __cReference: true,
    get value() { return MV_RightChannelOffset; },
    set value(__cxx_lvalue_0) { MV_RightChannelOffset = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:99
export let MV_ErrorCode = i32(1);
export function __cxx_global_cell_8a37c6e6dc891d5eba65e067() {
  return __cxx_global_cell_8a37c6e6dc891d5eba65e067.reference || (__cxx_global_cell_8a37c6e6dc891d5eba65e067.reference = {
    __cReference: true,
    get value() { return MV_ErrorCode; },
    set value(__cxx_lvalue_0) { MV_ErrorCode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:101
export let MV_GlobalVolume = i32(fix16_one__header_global_4893317b55fdd91c);
export function __cxx_global_cell_f6503dd2f9475abde00d5b1a() {
  return __cxx_global_cell_f6503dd2f9475abde00d5b1a.reference || (__cxx_global_cell_f6503dd2f9475abde00d5b1a.reference = {
    __cReference: true,
    get value() { return MV_GlobalVolume; },
    set value(__cxx_lvalue_0) { MV_GlobalVolume = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:102
export let MV_VolumeSmoothFactor = i32(fix16_one__header_global_4893317b55fdd91c);
export function __cxx_global_cell_d948bcfdda67a38fb8a65e07() {
  return __cxx_global_cell_d948bcfdda67a38fb8a65e07.reference || (__cxx_global_cell_d948bcfdda67a38fb8a65e07.reference = {
    __cReference: true,
    get value() { return MV_VolumeSmoothFactor; },
    set value(__cxx_lvalue_0) { MV_VolumeSmoothFactor = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:104
export let MV_Locked = 0;
export function __cxx_global_cell_863e87c70fe831130f94a0ec() {
  return __cxx_global_cell_863e87c70fe831130f94a0ec.reference || (__cxx_global_cell_863e87c70fe831130f94a0ec.reference = {
    __cReference: true,
    get value() { return MV_Locked; },
    set value(__cxx_lvalue_0) { MV_Locked = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:105
export let MV_MusicBuffer = null;
export function __cxx_global_cell_4031867f2af48f5f8b7065db() {
  return __cxx_global_cell_4031867f2af48f5f8b7065db.reference || (__cxx_global_cell_4031867f2af48f5f8b7065db.reference = {
    __cReference: true,
    get value() { return MV_MusicBuffer; },
    set value(__cxx_lvalue_0) { MV_MusicBuffer = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:106
export let MV_MusicCallback = null;
function __cxx_static_address_366786f45d5ff50d78e1793b() {
  return __cxx_static_address_366786f45d5ff50d78e1793b.reference || (__cxx_static_address_366786f45d5ff50d78e1793b.reference = {
    __cReference: true,
    get value() { return MV_MusicCallback; },
    set value(__cxx_lvalue_0) { MV_MusicCallback = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_366786f45d5ff50d78e1793b() { return __cxx_static_address_366786f45d5ff50d78e1793b(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:108
export let MV_Handles = null;
function __cxx_static_address_911f7673d7a76103f5901064() {
  return __cxx_static_address_911f7673d7a76103f5901064.reference || (__cxx_static_address_911f7673d7a76103f5901064.reference = {
    __cReference: true,
    get value() { return MV_Handles; },
    set value(__cxx_lvalue_0) { MV_Handles = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_911f7673d7a76103f5901064() { return __cxx_static_address_911f7673d7a76103f5901064(); }

// C/C++ source: source/audiolib/src/multivoc.cpp:338
const __cxx_literal_3614805f10d3863994c6 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 97, 117, 100, 105, 111, 108, 105, 98, 47, 115, 114, 99, 47, 109, 117, 108, 116, 105, 118, 111, 99, 46, 99, 112, 112, 0]);
const __cxx_literal_c363862792e30dbb771a = Uint8Array.from([78, 111, 32, 118, 111, 105, 99, 101, 32, 102, 111, 117, 110, 100, 32, 102, 111, 114, 32, 104, 97, 110, 100, 108, 101, 32, 48, 120, 37, 48, 56, 120, 0]);
export function MV_GetVoice(handle) {
  if (((handle < 1) || (handle > MV_MaxVoices))) {
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_3614805f10d3863994c6, u32(342), __cxx_literal_c363862792e30dbb771a, handle));
    return null;
  }
  if (cPointerCompare((cPointerElementRef(MV_Handles, i32((handle - 1))).value), null, "!=")) {
    return (cPointerElementRef(MV_Handles, i32((handle - 1))).value);
  }
  MV_SetErrorCode__header_fa0e5b8ad773(i32(4));
  return null;
}

// C/C++ source: source/audiolib/src/multivoc.cpp:376
export function MV_VoicePlaying(handle) {
  (handle <= MV_MaxVoices);
  let voice = (cPointerElementRef(MV_Handles, i32((handle - 1))).value);
  return i32(((Boolean(MV_Installed) && cPointerCompare(voice, null, "!=")) && (!Boolean(__source_byte_method_load_3d3a49581334a76615f4(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).Paused, {"align": 4, "arrayAlign": 1, "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false})), 0)))));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:749
export function MV_GetMaxReverbDelay() {
  return i32(Math.imul(256, MV_NumberOfBuffers));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:750
export function MV_GetReverbDelay() {
  return i32(tabledivide32__header_d0d47dde933e(MV_ReverbDelay, MV_SampleSize));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:752
export function MV_SetReverbDelay(delay) {
  const __cxx_lvalue_0 = cRef(() => delay, __cxx_lvalue_3 => { delay = i32(__cxx_lvalue_3); });
  (MV_ReverbDelay = i32(Math.imul((max__template_b1cfaf2244c73238(((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(256), min__template_774131ccff66371d(__cxx_lvalue_0, ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(MV_GetMaxReverbDelay())))).value, MV_SampleSize)));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:757
export function MV_SetMixMode(numchannels) {
  if ((!Boolean(MV_Installed))) {
    return i32(-1);
  }
  (MV_Channels = i32((1 + i32((numchannels == 2)))));
  (MV_SampleSize = i32(u64((BigInt(2) * BigInt(u64(MV_Channels))))));
  (MV_BufferSize = i32(Math.imul(256, MV_SampleSize)));
  (MV_NumberOfBuffers = i32(tabledivide32__header_d0d47dde933e(i32(Math.imul(256, 32)), MV_BufferSize)));
  ((i32((MV_NumberOfBuffers & i32((MV_NumberOfBuffers - 1)))) == 0) && Boolean(MV_NumberOfBuffers));
  (MV_BufferLength = i32(Math.imul(256, 32)));
  (MV_RightChannelOffset = i32((MV_SampleSize >> 1)));
  return i32(0);
}

// C/C++ source: source/audiolib/src/multivoc.cpp:807
export function MV_CalcPanTable() {
  let HalfAngle = i32(Math.trunc(i32((127 + 1)) / 2));
  let QuarterAngle = i32(Math.trunc(HalfAngle / 2));
  for (let distance = i32(0); (distance <= 127); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => distance, __cxx_lvalue_1 => { distance = __cxx_lvalue_1; }))) {
    let level = i32(Math.trunc(i32(Math.imul(255, i32((127 - distance)))) / 127));
    for (let angle = i32(0); (angle <= QuarterAngle); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => angle, __cxx_lvalue_3 => { angle = __cxx_lvalue_3; }))) {
      let ramp = i32((level - Math.trunc(i32(Math.imul(level, angle)) / QuarterAngle)));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, angle).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).left = (u32((u32(ramp) & 255)) & 255));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, angle).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).right = (u32((u32(level) & 255)) & 255));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, i32((HalfAngle - angle))).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).left = (u32((u32(ramp) & 255)) & 255));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, i32((HalfAngle - angle))).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).right = (u32((u32(level) & 255)) & 255));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, i32((HalfAngle + angle))).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).left = (u32((u32(level) & 255)) & 255));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, i32((HalfAngle + angle))).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).right = (u32((u32(ramp) & 255)) & 255));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, i32((127 - angle))).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).left = (u32((u32(level) & 255)) & 255));
      ((cPointerElementRef(cRecordPointer((cPointerElementRef(MV_PanTable, i32((127 - angle))).value), {"align": 1, "arrayAlign": 1, "fields": {"left": {"native": "Uint8Array", "offset": 0, "size": 1}, "right": {"native": "Uint8Array", "offset": 1, "size": 1}}, "overlaps": false, "size": 2, "union": false}, {}), distance).value).right = (u32((u32(ramp) & 255)) & 255));
    }
  }
}

// C/C++ source: source/audiolib/src/multivoc.cpp:837
export function MV_GetVolume() {
  return i32(Blrintf__header_554477256d10(Math.fround((fix16_to_float__header_f653a1768490(MV_GlobalVolume) * Math.fround(255)))));
}

// C/C++ source: source/audiolib/src/multivoc.cpp:839
export function MV_SetCallBack(__cxx_function) {
  (MV_CallBackFunc = __cxx_function);
}

// C/C++ source: source/audiolib/src/multivoc.cpp:979
export function MV_GetMusicRoutineBuffer() {
  return cCopyAggregate(cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"buffer": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"buffer": MV_MusicBuffer, "size": MV_BufferSize}, null, {}), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"buffer": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}});
}

// C/C++ source: source/audiolib/src/multivoc.cpp:984
export const loopStartTags = cPointerArray(3, () => [Uint8Array.from([76, 79, 79, 80, 95, 83, 84, 65, 82, 84, 0]), Uint8Array.from([76, 79, 79, 80, 83, 84, 65, 82, 84, 0]), Uint8Array.from([76, 79, 79, 80, 0])]);
function __cxx_static_address_466807229ebfb926479b6f8c() {
  return __cxx_static_address_466807229ebfb926479b6f8c.reference || (__cxx_static_address_466807229ebfb926479b6f8c.reference = {
    __cReference: true,
    get value() { return loopStartTags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:985
export const loopEndTags = cPointerArray(2, () => [Uint8Array.from([76, 79, 79, 80, 95, 69, 78, 68, 0]), Uint8Array.from([76, 79, 79, 80, 69, 78, 68, 0])]);
function __cxx_static_address_e3c88f2290e83973dece66b3() {
  return __cxx_static_address_e3c88f2290e83973dece66b3.reference || (__cxx_static_address_e3c88f2290e83973dece66b3.reference = {
    __cReference: true,
    get value() { return loopEndTags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:986
export const loopLengthTags = cPointerArray(2, () => [Uint8Array.from([76, 79, 79, 80, 95, 76, 69, 78, 71, 84, 72, 0]), Uint8Array.from([76, 79, 79, 80, 76, 69, 78, 71, 84, 72, 0])]);
function __cxx_static_address_d2cdf47c4d313c2930524e0f() {
  return __cxx_static_address_d2cdf47c4d313c2930524e0f.reference || (__cxx_static_address_d2cdf47c4d313c2930524e0f.reference = {
    __cReference: true,
    get value() { return loopLengthTags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/multivoc.cpp:1011
export function MV_GetNextDemandFeedBlock(voice) {
  if ((cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).BlockLength > u32(0))) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) - Number(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).length)))))(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "position"));
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = cPointerOffset(__cxx_lvalue_1.value, (cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).length >>> 16), Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "sound"));
    (cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).length = u32((min__template_c5ffcfb092321e6b(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "BlockLength"), ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(32768))).value));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((Number(__cxx_lvalue_3.value) - Number(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).length)))))(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "BlockLength"));
    ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = u32((__cxx_lvalue_4.value << 16))))(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "length"));
    return 1;
  }
  if (cPointerCompare(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).__cxx_anonymous_6.DemandFeed, null, "==")) {
    return 0;
  }
  (cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).position = u32(0));
  cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).__cxx_anonymous_6.DemandFeed(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "sound"), cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "BlockLength"), cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).rawdataptr);
  (cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).length = u32((min__template_c5ffcfb092321e6b(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "BlockLength"), ((__cxx_lvalue_5) => cRef(() => __cxx_lvalue_5, () => { throw new TypeError("const C++ reference write"); }))(32768))).value));
  ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = u32((Number(__cxx_lvalue_6.value) - Number(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).length)))))(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "BlockLength"));
  ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = u32((__cxx_lvalue_7.value << 16))))(cObjectFieldRef(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})), "length"));
  if (((cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).length > u32(0)) && cPointerCompare(cRecordObject(cRecordPointer(voice, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).sound, null, "!="))) {
    return 1;
  }
  return 0;
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_8b3bff012745dc91 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_d10b72d37635b704af22c0dd() {
  return __cxx_static_address_d10b72d37635b704af22c0dd.reference || (__cxx_static_address_d10b72d37635b704af22c0dd.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_8b3bff012745dc91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_d10b72d37635b704af22c0dd() { return __cxx_static_address_d10b72d37635b704af22c0dd(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_b94e26943c736430 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_e5a83337cb19309d8841b7ca() {
  return __cxx_static_address_e5a83337cb19309d8841b7ca.reference || (__cxx_static_address_e5a83337cb19309d8841b7ca.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_b94e26943c736430; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_afb0599256b5558e = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_350ef9eb8ff01b19a4397e5e() {
  return __cxx_static_address_350ef9eb8ff01b19a4397e5e.reference || (__cxx_static_address_350ef9eb8ff01b19a4397e5e.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_afb0599256b5558e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_350ef9eb8ff01b19a4397e5e() { return __cxx_static_address_350ef9eb8ff01b19a4397e5e(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_2d1dc85e34ff422c = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_081cebaa696727f43eb6317c() {
  return __cxx_static_address_081cebaa696727f43eb6317c.reference || (__cxx_static_address_081cebaa696727f43eb6317c.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_2d1dc85e34ff422c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_081cebaa696727f43eb6317c() { return __cxx_static_address_081cebaa696727f43eb6317c(); }

// C/C++ source: C:/Users/andre/Documents/Codex/2026-10-13/master-execution-prompt-complete-eduke32-readable/work/toolchains/linux-sysroot/usr/include/c++/12/bits/atomic_base.h:456
export function __source_byte_method_store_addf92f531e481c55e70(__source_this_addf92f531e481c55e70, __i, __m) {
  let __b = __cxx_operator_e73606c6bb71dfa0(__m, 65535);
  do {
    if ((__is_constant_evaluated() && (!Boolean((i32(__b) != i32(2)))))) {
      __builtin_unreachable();
    }
  } while (false);
  do {
    if ((__is_constant_evaluated() && (!Boolean((i32(__b) != i32(4)))))) {
      __builtin_unreachable();
    }
  } while (false);
  do {
    if ((__is_constant_evaluated() && (!Boolean((i32(__b) != i32(1)))))) {
      __builtin_unreachable();
    }
  } while (false);
  cAtomic(cObjectFieldRef(__source_this_addf92f531e481c55e70, "_M_i"), Int32Array, "store", i32(__m), __i);
}

// C/C++ source: C:/Users/andre/Documents/Codex/2026-10-13/master-execution-prompt-complete-eduke32-readable/work/toolchains/linux-sysroot/usr/include/c++/12/bits/atomic_base.h:481
export function __source_byte_method_load_3d3a49581334a76615f4(__source_this_3d3a49581334a76615f4, __m) {
  let __b = __cxx_operator_e73606c6bb71dfa0(__m, 65535);
  do {
    if ((__is_constant_evaluated() && (!Boolean((i32(__b) != i32(3)))))) {
      __builtin_unreachable();
    }
  } while (false);
  do {
    if ((__is_constant_evaluated() && (!Boolean((i32(__b) != i32(4)))))) {
      __builtin_unreachable();
    }
  } while (false);
  return i32(cAtomic(cObjectFieldRef(__source_this_3d3a49581334a76615f4, "_M_i"), Int32Array, "load", i32(__m)));
}

export function Move__template_45f4f2db05c479ff(node, root) {
  Unlink__template_843de158a7ee4205(node);
  Insert__template_a833a461de94f09a(root, node);
}

export function clamp__header_acff00012631(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/audiolib/src/_multivc.h:231
export function MV_SetErrorCode__header_fa0e5b8ad773(status) {
  (MV_ErrorCode = i32(status));
  return i32(-1);
}

// C/C++ source: source/build/include/compat.h:1450
export function xaligned_free__header_d0f3becbf458(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1428
export function xaligned_alloc__header_9a0eef3e01d2(alignment, size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function Empty__template_d798a222b9bae8c7(root) {
  return Boolean((cPointerCompare(cRecordObject(cRecordPointer(root, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).next, root, "==") && cPointerCompare(cRecordObject(cRecordPointer(root, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev, root, "==")));
}

// C/C++ source: source/audiolib/include/fx_man.h:136
export function FX_SoundValidAndActive__header_e795b03dc27c(handle) {
  return i32(((handle > 0) && Boolean(MV_VoicePlaying(handle))));
}

export function Remove__template_5d7072c0f1174e54(node) {
  Unlink__template_843de158a7ee4205(node);
  Reset__template_1e74985547608292(node);
}

// C/C++ source: source/build/include/fix16.h:46
export function fix16_from_int__header_f52908b5a6ca(a) {
  return i32(Math.imul(a, fix16_one__header_global_4893317b55fdd91c));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_f609c7b01b7889e2(__a, __b) {
  if ((__a.value < __b.value)) {
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

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/pragmas.h:121
export function tabledivide32__header_d0d47dde933e(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_a6e3cfd4eba13fb9886cb240().value)) & i32((!(u32(d) < u32(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable32, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), 0).value), libdivide_s32_gen((__cxx_global_cell_a6e3cfd4eba13fb9886cb240().value = i32(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "libdivide_s32_t &(libdivide_s32_t &&) noexcept", "clang_method_id": "0x1219fb2fff0", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "9ce070c4dbcc716e36f4dc7d230c2fe3683993c7fa9c37d6a637a708f7c906c0"}, "record_name": "libdivide::libdivide_s32_t", "source_record": "libdivide::libdivide_s32_t"});
  }
  return i32(libdivide_s32_do(n, cPointerOffset(divtable32, i32(Math.imul(i32((u32(d) < u32(16384))), d)), 5)));
}

// C/C++ source: source/build/include/compat.h:706
export function Blrintf__header_554477256d10(x) {
  return cSSEFloat32ToInt32(x);
}

// C/C++ source: source/build/include/fix16.h:43
export function fix16_to_float__header_f653a1768490(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r__header_global_3a1df6c21418345f)));
}

// C/C++ source: source/build/include/compat.h:1436
export function xaligned_calloc__header_eb9cdb4cb122(alignment, count, size) {
  let blocksize = u64((BigInt(count) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, blocksize, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, blocksize);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function Reset__template_1e74985547608292(node) {
  (cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).next = (cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev = node));
}

export function Insert__template_a833a461de94f09a(root, node) {
  (cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).next = root);
  (cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev = cRecordObject(cRecordPointer(root, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev);
  (cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(root, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).next = node);
  (cRecordObject(cRecordPointer(root, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev = node);
}

// C/C++ source: source/build/include/fix16.h:47
export function fix16_from_float__header_cc2ec3367744(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one__header_global_4893317b55fdd91c))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c5ffcfb092321e6b(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/atomic_base.h:104
export function __cxx_operator_e73606c6bb71dfa0(__m, __mod) {
  return i32((i32(__m) & i32(__mod)));
}

// C/C++ source: @sysroot/usr/include/x86_64-linux-gnu/c++/12/bits/c++config.h:516
export function __is_constant_evaluated() {
  return Boolean(false);
}

// C/C++ source: source/build/include/libasync.h:1275
export function get_internal_task__template_4cab75a8a2e891a2(t) {
  return t.internal_task.get();
}

export function Unlink__template_843de158a7ee4205(node) {
  (cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).next = cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).next);
  (cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).next, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev = cRecordObject(cRecordPointer(node, {"align": 8, "arrayAlign": 1, "fields": {"BlockLength": {"native": "Uint32Array", "offset": 120, "size": 4}, "FixedPointBufferSize": {"native": "Uint32Array", "offset": 132, "size": 4}, "GetSound": {"offset": 16, "pointer": true, "size": 8}, "GoalVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 96}, "Loop": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"Count": {"native": "Int32Array", "offset": 16, "size": 4}, "End": {"offset": 8, "pointer": true, "size": 8}, "Size": {"native": "Uint32Array", "offset": 20, "size": 4}, "Start": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 56}, "PannedVolume": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"Left": {"native": "Int32Array", "offset": 0, "size": 4}, "Right": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 88}, "Paused": {"byteRecord": {"align": 4, "arrayAlign": 1, "bases": [{"offset": 0, "size": 4, "type": "__cxx_record___atomic_base_6b7b06d18593cb0a"}], "fields": {"_M_i": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "projection": true, "size": 4, "union": false}, "offset": 152}, "PitchScale": {"native": "Uint32Array", "offset": 128, "size": 4}, "RateScale": {"native": "Uint32Array", "offset": 144, "size": 4}, "SamplingRate": {"native": "Uint32Array", "offset": 140, "size": 4}, "__cxx_anonymous_6": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"DemandFeed": {"offset": 0, "pointer": true, "size": 8}, "NextBlock": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "projection": true, "size": 8, "union": true}, "offset": 48}, "bits": {"native": "Int32Array", "offset": 108, "size": 4}, "callbackval": {"native": "BigInt64Array", "offset": 80, "size": 8}, "channels": {"native": "Int32Array", "offset": 112, "size": 4}, "handle": {"native": "Int32Array", "offset": 156, "size": 4}, "length": {"native": "Uint32Array", "offset": 136, "size": 4}, "mix": {"offset": 24, "pointer": true, "size": 8}, "next": {"offset": 0, "pointer": true, "size": 8}, "position": {"native": "Uint32Array", "offset": 148, "size": 4}, "prev": {"offset": 8, "pointer": true, "size": 8}, "priority": {"native": "Int32Array", "offset": 160, "size": 4}, "rawdataptr": {"offset": 40, "pointer": true, "size": 8}, "rawdatasiz": {"native": "Uint32Array", "offset": 124, "size": 4}, "sound": {"offset": 32, "pointer": true, "size": 8}, "task": {"byteRecord": {"align": 8, "arrayAlign": 1, "bases": [{"offset": 0, "size": 8, "type": "__cxx_record_basic_task_89320f368fe96d0e"}], "fields": {"internal_task": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 168}, "volume": {"native": "Int32Array", "offset": 116, "size": 4}}, "overlaps": true, "projection": true, "size": 176, "union": false})).prev);
}

// C/C++ source: source/audiolib/src/multivoc.cpp:488
export function __cxx_operator_2b395f479b779960(a, arg1) {
  return Boolean(cPointerCompare(a.p, null, "!="));
}
