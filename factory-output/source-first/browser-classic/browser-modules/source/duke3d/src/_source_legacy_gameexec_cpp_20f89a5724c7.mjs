// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gameexec.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { aGameVars } from "./gamevars.cpp.mjs";
import { divtable32 } from "../../build/src/pragmas.cpp.mjs";
import { fix16_add } from "../../build/src/fix16.cpp.mjs";
import { fix16_div } from "../../build/src/fix16.cpp.mjs";
import { fix16_mul } from "../../build/src/fix16.cpp.mjs";
import { fix16_one } from "./gameexec.cpp.mjs";
import { fix16_sadd } from "../../build/src/fix16.cpp.mjs";
import { fix16_sdiv } from "../../build/src/fix16.cpp.mjs";
import { fix16_smul } from "../../build/src/fix16.cpp.mjs";
import { __cxx_global_cell_a6e3cfd4eba13fb9886cb240 } from "../../build/src/pragmas.cpp.mjs";
import { libdivide_s32_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { __cxx_global_cell_5bce98f73f3ed0c837f2729e } from "./gameexec.cpp.mjs";

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
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half = i32(32768);
function __cxx_static_address_920cc9e7087c8d9c37d371e8() {
  return __cxx_static_address_920cc9e7087c8d9c37d371e8.reference || (__cxx_static_address_920cc9e7087c8d9c37d371e8.reference = {
    __cReference: true,
    get value() { return fix16_half; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_294883c53e7bdb2fc215ba73() {
  return __cxx_static_address_294883c53e7bdb2fc215ba73.reference || (__cxx_static_address_294883c53e7bdb2fc215ba73.reference = {
    __cReference: true,
    get value() { return flt_f161r; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.hpp:6
export function Fix16() {
  return Fix16.type || (Fix16.type = class Fix16__implementation {
  constructor() { throw new TypeError("Clang-selected constructor factory required"); }
  __cxx_construct_3fdb0b4b21c3726c() {
        (this.m_value = i32(0));
  }
  static __cxx_construct_3fdb0b4b21c3726c() {
    const value=Object.create(Fix16__implementation.prototype);
    value.__cxx_construct_3fdb0b4b21c3726c();
    return value;
  }
  __cxx_construct_51432f96b1f0cb42(inValue) {
        (this.m_value = i32(inValue.m_value));
  }
  static __cxx_construct_51432f96b1f0cb42(inValue) {
    const value=Object.create(Fix16__implementation.prototype);
    value.__cxx_construct_51432f96b1f0cb42(inValue);
    return value;
  }
  __cxx_construct_b6ce2f0dc59b92d0(inValue) {
        (this.m_value = i32(inValue));
  }
  static __cxx_construct_b6ce2f0dc59b92d0(inValue) {
    const value=Object.create(Fix16__implementation.prototype);
    value.__cxx_construct_b6ce2f0dc59b92d0(inValue);
    return value;
  }
  __cxx_construct_8664f1973bd54e21(inValue) {
        (this.m_value = i32(fix16_from_float__header_cb7bb7dfd505(inValue)));
  }
  static __cxx_construct_8664f1973bd54e21(inValue) {
    const value=Object.create(Fix16__implementation.prototype);
    value.__cxx_construct_8664f1973bd54e21(inValue);
    return value;
  }
  __cxx_construct_416c5d42732d66cf(inValue) {
        (this.m_value = i32(fix16_from_dbl__header_8e5e515ebb29(inValue)));
  }
  static __cxx_construct_416c5d42732d66cf(inValue) {
    const value=Object.create(Fix16__implementation.prototype);
    value.__cxx_construct_416c5d42732d66cf(inValue);
    return value;
  }
  __cxx_construct_c33a78576ecd456c(inValue) {
        (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32(inValue))));
  }
  static __cxx_construct_c33a78576ecd456c(inValue) {
    const value=Object.create(Fix16__implementation.prototype);
    value.__cxx_construct_c33a78576ecd456c(inValue);
    return value;
  }
  __cxx_conversion_c6f53d32f72a2a42() {
    return i32(this.m_value);
  }
  __cxx_conversion_c7cab5f5bea762f4() {
    return fix16_to_dbl__header_978a8ec758b1(this.m_value);
  }
  __cxx_conversion_e34eebab36cb5164() {
    return Math.fround(fix16_to_float__header_1ddac830bf2c(this.m_value));
  }
  __cxx_conversion_b3924c61e340345a() {
    return ((u32(((u32(fix16_to_int__header_826ef69a44f3(this.m_value)) << 16) >> 16)) << 16) >> 16);
  }
  __cxx_operator_d8edc83138e69dd7(rhs) {
    (this.m_value = i32(rhs.m_value));
    return this;
  }
  __cxx_operator_b12341c6d9e8bcf9(rhs) {
    (this.m_value = i32(rhs));
    return this;
  }
  __cxx_operator_d0ec20269c5e0920(rhs) {
    (this.m_value = i32(fix16_from_dbl__header_8e5e515ebb29(rhs)));
    return this;
  }
  __cxx_operator_61b685c1b60096cd(rhs) {
    (this.m_value = i32(fix16_from_float__header_cb7bb7dfd505(rhs)));
    return this;
  }
  __cxx_operator_85b70e182cf11478(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32(rhs))));
    return this;
  }
  __cxx_operator_6f369b230ea0f753(rhs) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(rhs.m_value)))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_323f1602e7f56818(rhs) {
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(rhs)))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_93060623bde5bb4a(rhs) {
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((Number(__cxx_lvalue_2.value) + Number(fix16_from_dbl__header_8e5e515ebb29(rhs))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_69340bf9b50b9974(rhs) {
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) + Number(fix16_from_float__header_cb7bb7dfd505(rhs))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_82ff6b8d8ce576de(rhs) {
    ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = i32((Number(__cxx_lvalue_4.value) + Number(fix16_from_int__header_6768ed80e668(i32(rhs)))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_b415638d6de40e0b(rhs) {
    ((__cxx_lvalue_5) => (__cxx_lvalue_5.value = i32((Number(__cxx_lvalue_5.value) - Number(rhs.m_value)))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_21f092bee337ab0b(rhs) {
    ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = i32((Number(__cxx_lvalue_6.value) - Number(rhs)))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_c788cdc3fb75d8a9(rhs) {
    ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = i32((Number(__cxx_lvalue_7.value) - Number(fix16_from_dbl__header_8e5e515ebb29(rhs))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_4cfec0d582ed130f(rhs) {
    ((__cxx_lvalue_8) => (__cxx_lvalue_8.value = i32((Number(__cxx_lvalue_8.value) - Number(fix16_from_float__header_cb7bb7dfd505(rhs))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_aedcaf9094d74262(rhs) {
    ((__cxx_lvalue_9) => (__cxx_lvalue_9.value = i32((Number(__cxx_lvalue_9.value) - Number(fix16_from_int__header_6768ed80e668(i32(rhs)))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_09f1db565e7e75a9(rhs) {
    (this.m_value = i32(fix16_mul(this.m_value, rhs.m_value)));
    return this;
  }
  __cxx_operator_2c762173093038ab(rhs) {
    (this.m_value = i32(fix16_mul(this.m_value, rhs)));
    return this;
  }
  __cxx_operator_dad21bc0137d657f(rhs) {
    (this.m_value = i32(fix16_mul(this.m_value, fix16_from_dbl__header_8e5e515ebb29(rhs))));
    return this;
  }
  __cxx_operator_2a5eee150b3f5351(rhs) {
    (this.m_value = i32(fix16_mul(this.m_value, fix16_from_float__header_cb7bb7dfd505(rhs))));
    return this;
  }
  __cxx_operator_a581f0a3c33568a8(rhs) {
    ((__cxx_lvalue_10) => (__cxx_lvalue_10.value = i32(Math.imul(__cxx_lvalue_10.value, i32(rhs)))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_8d592a17d8cc06b2(rhs) {
    (this.m_value = i32(fix16_div(this.m_value, rhs.m_value)));
    return this;
  }
  __cxx_operator_001a9348f847ac77(rhs) {
    (this.m_value = i32(fix16_div(this.m_value, rhs)));
    return this;
  }
  __cxx_operator_8afedbd5a9ab7302(rhs) {
    (this.m_value = i32(fix16_div(this.m_value, fix16_from_dbl__header_8e5e515ebb29(rhs))));
    return this;
  }
  __cxx_operator_7b98dcb6411f426f(rhs) {
    (this.m_value = i32(fix16_div(this.m_value, fix16_from_float__header_cb7bb7dfd505(rhs))));
    return this;
  }
  __cxx_operator_d41de174a1dd0070(rhs) {
    (this.m_value = i32(tabledivide32__header_453730bd97a3(this.m_value, i32(rhs))));
    return this;
  }
  __cxx_operator_982e958696ed5572(rhs) {
    (this.m_value = i32(fix16_mod__header_57cd079f1117(this.m_value, rhs.m_value)));
    return this;
  }
  __cxx_operator_f5a368ff350e7487(rhs) {
    (this.m_value = i32(fix16_mod__header_57cd079f1117(this.m_value, rhs)));
    return this;
  }
  __cxx_operator_a2600341c1110788(rhs) {
    (this.m_value = i32(fix16_mod__header_57cd079f1117(this.m_value, fix16_from_dbl__header_8e5e515ebb29(rhs))));
    return this;
  }
  __cxx_operator_de8871a7cf2c9236(rhs) {
    (this.m_value = i32(fix16_mod__header_57cd079f1117(this.m_value, fix16_from_float__header_cb7bb7dfd505(rhs))));
    return this;
  }
  __cxx_operator_4b3c7e85d6e3960c(rhs) {
    ((__cxx_lvalue_11) => (__cxx_lvalue_11.value = i32((Number(__cxx_lvalue_11.value) % Number(i32(rhs))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_f00dd8b55fcec654(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) & fix16_to_int__header_826ef69a44f3(rhs.m_value))))));
    return this;
  }
  __cxx_operator_34dec686d788c4d5(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) & fix16_to_int__header_826ef69a44f3(rhs))))));
    return this;
  }
  __cxx_operator_7ba06416e4facf0f(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) & i32(rhs))))));
    return this;
  }
  __cxx_operator_e88f924658e12432(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) ^ fix16_to_int__header_826ef69a44f3(rhs.m_value))))));
    return this;
  }
  __cxx_operator_2645098b9172fcbe(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) ^ fix16_to_int__header_826ef69a44f3(rhs))))));
    return this;
  }
  __cxx_operator_afe80bf48284a6c3(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) ^ i32(rhs))))));
    return this;
  }
  __cxx_operator_b054ffa71dcb0636(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) | fix16_to_int__header_826ef69a44f3(rhs.m_value))))));
    return this;
  }
  __cxx_operator_aa6c575211bafc0a(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) | fix16_to_int__header_826ef69a44f3(rhs))))));
    return this;
  }
  __cxx_operator_9ddc628091c5e1d3(rhs) {
    (this.m_value = i32(fix16_from_int__header_6768ed80e668(i32((fix16_to_int__header_826ef69a44f3(this.m_value) | i32(rhs))))));
    return this;
  }
  __cxx_operator_0c57556f3cf7021d(rhs) {
    ((__cxx_lvalue_12) => (__cxx_lvalue_12.value = i32((__cxx_lvalue_12.value << rhs.m_value))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_c9c6a6c5c0f1bd39(rhs) {
    ((__cxx_lvalue_13) => (__cxx_lvalue_13.value = i32((__cxx_lvalue_13.value << rhs))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_7773368a63e2ee12(rhs) {
    ((__cxx_lvalue_14) => (__cxx_lvalue_14.value = i32((__cxx_lvalue_14.value << fix16_from_int__header_6768ed80e668(i32(rhs))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_0cb8fc483d570f8c(rhs) {
    ((__cxx_lvalue_15) => (__cxx_lvalue_15.value = i32((__cxx_lvalue_15.value >> rhs.m_value))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_1d2510e4387eb32b(rhs) {
    ((__cxx_lvalue_16) => (__cxx_lvalue_16.value = i32((__cxx_lvalue_16.value >> rhs))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_c06480ea9c11d53e(rhs) {
    ((__cxx_lvalue_17) => (__cxx_lvalue_17.value = i32((__cxx_lvalue_17.value >> fix16_from_int__header_6768ed80e668(i32(rhs))))))(cObjectFieldRef(this, "m_value"));
    return this;
  }
  __cxx_operator_d55f356f535fbee7(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, other.m_value)));
  }
  __cxx_operator_5ba6fe14744c1375(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, other)));
  }
  __cxx_operator_5b6075f9dee75194(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, fix16_from_dbl__header_8e5e515ebb29(other))));
  }
  __cxx_operator_968503300f2a7ca8(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, fix16_from_float__header_cb7bb7dfd505(other))));
  }
  __cxx_operator_f3b23a53c8cb0a2b(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, fix16_from_int__header_6768ed80e668(i32(other)))));
  }
  sadd__cxx_method_7925f696506bc188(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, other.m_value)));
  }
  sadd__cxx_method_f9f92e27650ef647(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, other)));
  }
  sadd__cxx_method_75a45809b9ea0432(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, fix16_from_dbl__header_8e5e515ebb29(other))));
  }
  sadd__cxx_method_8adedc64590f427f(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, fix16_from_float__header_cb7bb7dfd505(other))));
  }
  sadd__cxx_method_6d9ad574acb688b8(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, fix16_from_int__header_6768ed80e668(i32(other)))));
  }
  __cxx_operator_b561ac10da4ad709(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, (-other.m_value))));
  }
  __cxx_operator_42816d7010b6b059(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, (-other))));
  }
  __cxx_operator_c9c021dd1c0969af(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, (-fix16_from_dbl__header_8e5e515ebb29(other)))));
  }
  __cxx_operator_50f4cc4b18892239(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, (-fix16_from_float__header_cb7bb7dfd505(other)))));
  }
  __cxx_operator_1552b9124f49a3d9(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_add(this.m_value, (-fix16_from_int__header_6768ed80e668(i32(other))))));
  }
  ssub__cxx_method_7925f696506bc188(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, (-other.m_value))));
  }
  ssub__cxx_method_f9f92e27650ef647(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, (-other))));
  }
  ssub__cxx_method_75a45809b9ea0432(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, (-fix16_from_dbl__header_8e5e515ebb29(other)))));
  }
  ssub__cxx_method_8adedc64590f427f(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, (-fix16_from_float__header_cb7bb7dfd505(other)))));
  }
  ssub__cxx_method_6d9ad574acb688b8(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sadd(this.m_value, (-fix16_from_int__header_6768ed80e668(i32(other))))));
  }
  __cxx_operator_3b6b4b84bdd0fe34(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_mul(this.m_value, other.m_value)));
  }
  __cxx_operator_eb1d86ab9a90a7ba(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_mul(this.m_value, other)));
  }
  __cxx_operator_7323c04663c345b8(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_mul(this.m_value, fix16_from_dbl__header_8e5e515ebb29(other))));
  }
  __cxx_operator_bfe3e2a2302d3ba1(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_mul(this.m_value, fix16_from_float__header_cb7bb7dfd505(other))));
  }
  __cxx_operator_e9c8e8373975513b(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_mul(this.m_value, fix16_from_int__header_6768ed80e668(i32(other)))));
  }
  smul__cxx_method_7925f696506bc188(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_smul(this.m_value, other.m_value)));
  }
  smul__cxx_method_f9f92e27650ef647(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_smul(this.m_value, other)));
  }
  smul__cxx_method_75a45809b9ea0432(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_smul(this.m_value, fix16_from_dbl__header_8e5e515ebb29(other))));
  }
  smul__cxx_method_8adedc64590f427f(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_smul(this.m_value, fix16_from_float__header_cb7bb7dfd505(other))));
  }
  smul__cxx_method_6d9ad574acb688b8(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_smul(this.m_value, fix16_from_int__header_6768ed80e668(i32(other)))));
  }
  __cxx_operator_65f60286144cd866(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_div(this.m_value, other.m_value)));
  }
  __cxx_operator_552bce507c1456b1(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_div(this.m_value, other)));
  }
  __cxx_operator_cca33da0f1529d42(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_div(this.m_value, fix16_from_dbl__header_8e5e515ebb29(other))));
  }
  __cxx_operator_2ff2fbf101c010a3(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_div(this.m_value, fix16_from_float__header_cb7bb7dfd505(other))));
  }
  __cxx_operator_3b4a21daa79bcb21(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_div(this.m_value, fix16_from_int__header_6768ed80e668(i32(other)))));
  }
  sdiv__cxx_method_7925f696506bc188(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sdiv(this.m_value, other.m_value)));
  }
  sdiv__cxx_method_f9f92e27650ef647(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sdiv(this.m_value, other)));
  }
  sdiv__cxx_method_75a45809b9ea0432(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sdiv(this.m_value, fix16_from_dbl__header_8e5e515ebb29(other))));
  }
  sdiv__cxx_method_8adedc64590f427f(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sdiv(this.m_value, fix16_from_float__header_cb7bb7dfd505(other))));
  }
  sdiv__cxx_method_6d9ad574acb688b8(other) {
    return (Fix16()).__cxx_construct_51432f96b1f0cb42((Fix16()).__cxx_construct_b6ce2f0dc59b92d0(fix16_sdiv(this.m_value, fix16_from_int__header_6768ed80e668(i32(other)))));
  }
  __cxx_operator_53d46caf328a7814(other) {
    return Boolean((this.m_value == other.m_value));
  }
  __cxx_operator_495ada299d127f17(other) {
    return Boolean((this.m_value == other));
  }
  __cxx_operator_4abfe7bd8e1c63d1(other) {
    return Boolean((this.m_value == fix16_from_dbl__header_8e5e515ebb29(other)));
  }
  __cxx_operator_707789f6e4f0c031(other) {
    return Boolean((this.m_value == fix16_from_float__header_cb7bb7dfd505(other)));
  }
  __cxx_operator_ef936624cb0d9cce(other) {
    return Boolean((this.m_value == fix16_from_int__header_6768ed80e668(i32(other))));
  }
  __cxx_operator_602445b4ceed1b62(other) {
    return Boolean((this.m_value != other.m_value));
  }
  __cxx_operator_58582c1c23071c93(other) {
    return Boolean((this.m_value != other));
  }
  __cxx_operator_c292be6ad78570ec(other) {
    return Boolean((this.m_value != fix16_from_dbl__header_8e5e515ebb29(other)));
  }
  __cxx_operator_4b4787563e8816eb(other) {
    return Boolean((this.m_value != fix16_from_float__header_cb7bb7dfd505(other)));
  }
  __cxx_operator_d52e0deb3626061f(other) {
    return Boolean((this.m_value != fix16_from_int__header_6768ed80e668(i32(other))));
  }
  __cxx_operator_dd1f3504f7af712f(other) {
    return Boolean((this.m_value <= other.m_value));
  }
  __cxx_operator_324d917cd63072b9(other) {
    return Boolean((this.m_value <= other));
  }
  __cxx_operator_99dca449feec7fce(other) {
    return Boolean((this.m_value <= fix16_from_dbl__header_8e5e515ebb29(other)));
  }
  __cxx_operator_ba4b53f50fb021bb(other) {
    return Boolean((this.m_value <= fix16_from_float__header_cb7bb7dfd505(other)));
  }
  __cxx_operator_7d6cddf6159cb11c(other) {
    return Boolean((this.m_value <= fix16_from_int__header_6768ed80e668(i32(other))));
  }
  __cxx_operator_25b3ef824f9502eb(other) {
    return Boolean((this.m_value >= other.m_value));
  }
  __cxx_operator_69873b11bf722d24(other) {
    return Boolean((this.m_value >= other));
  }
  __cxx_operator_ff6e4bd8345c668a(other) {
    return Boolean((this.m_value >= fix16_from_dbl__header_8e5e515ebb29(other)));
  }
  __cxx_operator_68e5a657a9b08c20(other) {
    return Boolean((this.m_value >= fix16_from_float__header_cb7bb7dfd505(other)));
  }
  __cxx_operator_78d374ec3faa5dd1(other) {
    return Boolean((this.m_value >= fix16_from_int__header_6768ed80e668(i32(other))));
  }
  __cxx_operator_06ddcdd6a5985283(other) {
    return Boolean((this.m_value < other.m_value));
  }
  __cxx_operator_0a09724bdbdcee28(other) {
    return Boolean((this.m_value < other));
  }
  __cxx_operator_70c5b02128b8ba5e(other) {
    return Boolean((this.m_value < fix16_from_dbl__header_8e5e515ebb29(other)));
  }
  __cxx_operator_3d3fbc78f0532c07(other) {
    return Boolean((this.m_value < fix16_from_float__header_cb7bb7dfd505(other)));
  }
  __cxx_operator_e808bc735d4940bf(other) {
    return Boolean((this.m_value < fix16_from_int__header_6768ed80e668(i32(other))));
  }
  __cxx_operator_9cd4770130f312ed(other) {
    return Boolean((this.m_value > other.m_value));
  }
  __cxx_operator_10b5dc7258f555a2(other) {
    return Boolean((this.m_value > other));
  }
  __cxx_operator_54bc142482cda5c1(other) {
    return Boolean((this.m_value > fix16_from_dbl__header_8e5e515ebb29(other)));
  }
  __cxx_operator_009cabe3d444cf8c(other) {
    return Boolean((this.m_value > fix16_from_float__header_cb7bb7dfd505(other)));
  }
  __cxx_operator_698f34b719cb2b16(other) {
    return Boolean((this.m_value > fix16_from_int__header_6768ed80e668(i32(other))));
  }
});
}

export function Gv_AddVar(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) + BigInt(i64(operand))))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) + BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) + BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) + Number(i32(operand))))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value + i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_323f1602e7f56818(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_SubVar(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) - BigInt(i64(operand))))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) - BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) - BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) - Number(i32(operand))))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value - i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_21f092bee337ab0b(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_MulVar(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) * BigInt(i64(operand))))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) * BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) * BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32(Math.imul(__cxx_lvalue_3.value, i32(operand)))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value * i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_2c762173093038ab(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_ModVar(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) % BigInt(i64(operand))))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) % BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) % BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((Number(__cxx_lvalue_3.value) % Number(i32(operand))))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value % i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_f5a368ff350e7487(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_AndVar(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) & BigInt(i64(operand))))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) & BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) & BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value & i32(operand)))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value & i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_34dec686d788c4d5(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_XorVar(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) ^ BigInt(i64(operand))))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) ^ BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) ^ BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value ^ i32(operand)))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value ^ i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_2645098b9172fcbe(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_OrVar(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) | BigInt(i64(operand))))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) | BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) | BigInt(i64(operand))))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value | i32(operand)))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value | i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_aa6c575211bafc0a(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_ShiftVarL(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) << BigInt(operand)))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) << BigInt(operand)))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) << BigInt(operand)))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value << i32(operand)))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value << i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_c9c6a6c5c0f1bd39(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

export function Gv_ShiftVarR(id, operand) {
  let __cxx_var = (cPointerElementRef(cRecordPointer(aGameVars, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"global": {"native": "BigInt64Array", "offset": 0, "size": 8}, "pValues": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "pointerEncoding": "source-lp64-addresses/2", "size": 8, "union": true}, "offset": 0}, "defaultValue": {"native": "BigInt64Array", "offset": 8, "size": 8}, "flags": {"native": "BigUint64Array", "offset": 16, "size": 8}, "szLabel": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": true, "size": 32, "union": false}, {}), id).value);
  switch (u64((BigInt(__cxx_var.flags) & BigInt(u64(i32((i32(3) | i32(1351680)))))))) {
    default: {
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i64((BigInt(__cxx_lvalue_0.value) >> BigInt(operand)))))(cObjectFieldRef(__cxx_var.__cxx_anonymous_0, "global"));
    }
    break;
    case u64(1): {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i64((BigInt(__cxx_lvalue_1.value) >> BigInt(operand)))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.playerNum & i32((16 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(2): {
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i64((BigInt(__cxx_lvalue_2.value) >> BigInt(operand)))))(cDeref(cPointerOffset(__cxx_var.__cxx_anonymous_0.pValues, i32((__cxx_global_cell_5bce98f73f3ed0c837f2729e().value.spriteNum & i32((16384 - 1)))), BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array));
    }
    break;
    case u64(1310720):
    case u64(8192): {
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value >> i32(operand)))))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int32Array), Int32Array));
    }
    break;
    case u64(32768): {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = ((u32((__cxx_lvalue_4.value >> i32(((u32(((u32(operand) << 16) >> 16)) << 16) >> 16)))) << 16) >> 16)))(cDeref(cTypedPointer(__cxx_var.__cxx_anonymous_0.pValues, Int16Array), Int16Array));
    }
    break;
    case u64(1048576): {
      let pfix = cSourceAddresses.decode(__cxx_var.__cxx_anonymous_0.global);
      cRecordObject(pfix).__cxx_operator_1d2510e4387eb32b(fix16_from_int__header_6768ed80e668(operand));
      break;
    }
  }
}

// C/C++ source: source/build/include/fix16.h:46
export function fix16_from_int__header_6768ed80e668(a) {
  return i32(Math.imul(a, fix16_one));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:47
export function fix16_from_float__header_cb7bb7dfd505(a) {
  return i32(Math.fround((Math.fround((a * Math.fround(fix16_one))) + ((a >= Math.fround(0)) ? Math.fround(0.5) : (-Math.fround(0.5))))));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:48
export function fix16_from_dbl__header_8e5e515ebb29(a) {
  return i32(((a * fix16_one) + ((a >= 0) ? 0.5 : (-0.5))));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:44
export function fix16_to_dbl__header_978a8ec758b1(a) {
  return (a * flt_f161r);
}

// C/C++ source: source/duke3d/src/gameexec.cpp:43
export function fix16_to_float__header_1ddac830bf2c(a) {
  return Math.fround(Math.fround((Math.fround(Math.fround(a)) * flt_f161r)));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:42
export function fix16_to_int__header_826ef69a44f3(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half : (-fix16_half)))) / fix16_one));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:121
export function tabledivide32__header_453730bd97a3(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_a6e3cfd4eba13fb9886cb240().value)) & i32((!(u32(d) < u32(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable32, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), 0).value), libdivide_s32_gen((__cxx_global_cell_a6e3cfd4eba13fb9886cb240().value = i32(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "libdivide_s32_t &(libdivide_s32_t &&) noexcept", "clang_method_id": "0x1f14d068a40", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "9ce070c4dbcc716e36f4dc7d230c2fe3683993c7fa9c37d6a637a708f7c906c0"}, "record_name": "libdivide::libdivide_s32_t", "source_record": "libdivide::libdivide_s32_t"});
  }
  return i32(libdivide_s32_do(n, cPointerOffset(divtable32, i32(Math.imul(i32((u32(d) < u32(16384))), d)), 5)));
}

// C/C++ source: source/duke3d/src/gameexec.cpp:94
export function fix16_mod__header_57cd079f1117(x, y) {
  return i32((x = i32((Number(x) % Number(y)))));
}
