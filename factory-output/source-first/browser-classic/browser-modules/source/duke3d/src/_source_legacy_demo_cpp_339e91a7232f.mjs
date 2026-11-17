// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/demo.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { ClockTicks } from "./demo.cpp.mjs";
import { __cxx_global_cell_103ca1df5a9531b359a2ae15 } from "../../audiolib/src/fx_man.cpp.mjs";
import { boardfilename } from "./game.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { __cxx_private_cell_f32ba34a1fb723579e808905 } from "./demo.cpp.mjs";
import { __cxx_private_cell_011d86fa47307d3c9303af61 } from "./demo.cpp.mjs";
import { __cxx_private_cell_79f6adc5fc1d12f365fba22e } from "./demo.cpp.mjs";
import { __cxx_private_cell_1c1fffd731c9c748ddfd41b7 } from "./demo.cpp.mjs";
import { __cxx_private_cell_456fb428622e93a857f2783e } from "./demo.cpp.mjs";
import { g_firstDemoFile } from "./demo.cpp.mjs";
import { __cxx_private_cell_4df42b33f7a1fea706f555ac } from "./demo.cpp.mjs";
import { __cxx_private_cell_66ad2b12500007a9c9a94c69 } from "./demo.cpp.mjs";
import { __cxx_global_cell_0f5d76246695f95afb26af0f } from "./global.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { maybe_append_ext } from "../../build/src/common.cpp.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_25ebc483826d436da41b0007 } from "./global.cpp.mjs";
import { __cxx_global_cell_84c518e352f66f31d8eaf74c } from "../../build/src/sdlayer.cpp.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strtol } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_88248ca6ca50548115e47549 } from "../../build/src/pragmas.cpp.mjs";
import { timerGetClockRate } from "../../build/src/timer.cpp.mjs";
import { timerGetFractionalTicks } from "../../build/src/timer.cpp.mjs";
import { __cxx_global_cell_37d96f0d18da4d1ab96cf9c5 } from "../../build/src/engine.cpp.mjs";
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



function cCopyTrivialClass(value, C, fields) {
  if (!(value instanceof C)) throw new TypeError('C++ trivial class copy type mismatch');
  const copy=Object.create(C.prototype);
  for (const field of fields) copy[field]=value[field];
  return copy;
}

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
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }
const floorf = a => Math.fround(Math.floor(Math.fround(a)));

// C/C++ source: source/duke3d/src/demo.cpp:74
export function Demo_SetAllClocks(clocktime) {
  __cxx_global_cell_37d96f0d18da4d1ab96cf9c5().value.__cxx_operator_d644da4c0f0f209b(__cxx_global_cell_25ebc483826d436da41b0007().value.__cxx_operator_d644da4c0f0f209b(__cxx_global_cell_0f5d76246695f95afb26af0f().value.__cxx_operator_d644da4c0f0f209b((ClockTicks()).__cxx_construct_8716ed38f1dfa06d(clocktime))));
}

// C/C++ source: source/duke3d/src/demo.cpp:229
export function Demo_PlayFirst(prof, exitafter) {
  (__cxx_private_cell_011d86fa47307d3c9303af61().value = i32(1));
  (__cxx_private_cell_f32ba34a1fb723579e808905().value = i32(exitafter));
  (prof >= 0);
  (__cxx_private_cell_79f6adc5fc1d12f365fba22e().value = i32((-prof)));
}

// C/C++ source: source/duke3d/src/demo.cpp:237
const __cxx_literal_58b5ff980287a5b7a8bd = Uint8Array.from([101, 100, 101, 109, 111, 37, 48, 51, 100, 46, 101, 100, 109, 0]);
const __cxx_literal_d63deb7fd19c1e403b46 = Uint8Array.from([46, 101, 100, 109, 0]);
export function Demo_SetFirst(demostr) {
  let tailptr;
  const __cxx_lvalue_0 = cRef(() => tailptr, __cxx_lvalue_1 => { tailptr = __cxx_lvalue_1; });
  let i = i32(strtol(demostr, __cxx_lvalue_0, 10));
  if ((cPointerCompare(tailptr, cPointerOffset(demostr, strlen(demostr), Uint8Array.BYTES_PER_ELEMENT, true), "==") && (u32(i) < u32(1000)))) {
    sprintf(g_firstDemoFile, __cxx_literal_58b5ff980287a5b7a8bd, i);
  } else {
    maybe_append_ext(g_firstDemoFile, i32(256), demostr, __cxx_literal_d63deb7fd19c1e403b46);
  }
}

// C/C++ source: source/duke3d/src/demo.cpp:378
export function Demo_IsProfiling() {
  return i32((__cxx_private_cell_79f6adc5fc1d12f365fba22e().value > 0));
}

// C/C++ source: source/duke3d/src/demo.cpp:383
export function Demo_StopProfiling() {
  (__cxx_private_cell_456fb428622e93a857f2783e().value = i32(1));
}

// C/C++ source: source/duke3d/src/demo.cpp:388
export function Demo_GToc(t) {
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(__cxx_private_cell_4df42b33f7a1fea706f555ac().value, "numtics"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = (__cxx_lvalue_1.value + (timerGetFractionalTicks() - t))))(cObjectFieldRef(__cxx_private_cell_4df42b33f7a1fea706f555ac().value, "totalgamems"));
}

// C/C++ source: source/duke3d/src/demo.cpp:394
export function Demo_RToc(t1, t2) {
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cObjectFieldRef(__cxx_private_cell_4df42b33f7a1fea706f555ac().value, "numframes"));
  ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = (__cxx_lvalue_1.value + (t2 - t1))))(cObjectFieldRef(__cxx_private_cell_4df42b33f7a1fea706f555ac().value, "totalroomsdrawms"));
  ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = (__cxx_lvalue_2.value + (timerGetFractionalTicks() - t2))))(cObjectFieldRef(__cxx_private_cell_4df42b33f7a1fea706f555ac().value, "totalrestdrawms"));
}

// C/C++ source: source/duke3d/src/demo.cpp:419
export function Demo_SetupProfile() {
  (__cxx_private_cell_79f6adc5fc1d12f365fba22e().value = i32(Math.imul(__cxx_private_cell_79f6adc5fc1d12f365fba22e().value, (-1))));
  (__cxx_private_cell_1c1fffd731c9c748ddfd41b7().value = i32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.SoundToggle));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.SoundToggle = i32(0));
  memset(__cxx_private_cell_4df42b33f7a1fea706f555ac().value, 0, 40);
  (__cxx_private_cell_4df42b33f7a1fea706f555ac().value.starthiticks = timerGetFractionalTicks());
}

// C/C++ source: source/duke3d/src/demo.cpp:431
const __cxx_literal_1efd6a30f5ff0a136186 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 100, 101, 109, 111, 46, 99, 112, 112, 0]);
const __cxx_literal_a20d1fd4670203a654a8 = Uint8Array.from([61, 61, 32, 100, 101, 109, 111, 32, 37, 100, 58, 32, 37, 100, 32, 103, 97, 109, 101, 116, 105, 99, 115, 0]);
const __cxx_literal_5653788a9fd0159904e0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 100, 101, 109, 111, 46, 99, 112, 112, 0]);
const __cxx_literal_3d7e8b667c2cb2438026 = Uint8Array.from([61, 61, 32, 100, 101, 109, 111, 32, 37, 100, 32, 103, 97, 109, 101, 32, 116, 105, 109, 101, 115, 58, 32, 37, 46, 48, 51, 102, 32, 109, 115, 32, 40, 37, 46, 48, 51, 102, 32, 117, 115, 47, 103, 97, 109, 101, 116, 105, 99, 41, 0]);
const __cxx_literal_963cba3b1f7f9307a5e6 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 100, 101, 109, 111, 46, 99, 112, 112, 0]);
const __cxx_literal_99161ccca30b16f27c9a = Uint8Array.from([61, 61, 32, 100, 101, 109, 111, 32, 37, 100, 58, 32, 37, 100, 32, 102, 114, 97, 109, 101, 115, 32, 40, 37, 100, 32, 102, 114, 97, 109, 101, 115, 47, 103, 97, 109, 101, 116, 105, 99, 41, 0]);
const __cxx_literal_4c7ef4d6d847b6a36746 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 100, 101, 109, 111, 46, 99, 112, 112, 0]);
const __cxx_literal_57086671d86a2c0c87d6 = Uint8Array.from([61, 61, 32, 100, 101, 109, 111, 32, 37, 100, 32, 100, 114, 97, 119, 114, 111, 111, 109, 115, 32, 116, 105, 109, 101, 115, 58, 32, 37, 46, 48, 51, 102, 32, 115, 32, 40, 37, 46, 48, 51, 102, 32, 109, 115, 47, 102, 114, 97, 109, 101, 41, 0]);
const __cxx_literal_b8bc259eb260323d3488 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 100, 101, 109, 111, 46, 99, 112, 112, 0]);
const __cxx_literal_5d693836d3eb29478a6f = Uint8Array.from([61, 61, 32, 100, 101, 109, 111, 32, 37, 100, 32, 100, 114, 97, 119, 114, 101, 115, 116, 32, 116, 105, 109, 101, 115, 58, 32, 37, 46, 48, 51, 102, 32, 115, 32, 40, 37, 46, 48, 51, 102, 32, 109, 115, 47, 102, 114, 97, 109, 101, 41, 0]);
const __cxx_literal_28b9471109fe30588db1 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 100, 101, 109, 111, 46, 99, 112, 112, 0]);
const __cxx_literal_0a3aca7cb9be88117056 = Uint8Array.from([61, 61, 32, 100, 101, 109, 111, 32, 37, 100, 58, 32, 110, 111, 110, 45, 112, 114, 111, 102, 105, 108, 101, 100, 32, 116, 105, 109, 101, 32, 111, 118, 101, 114, 104, 101, 97, 100, 58, 32, 37, 46, 48, 50, 102, 32, 37, 37, 0]);
export function Demo_FinishProfile() {
  if (Boolean(Demo_IsProfiling())) {
    let dn = i32((__cxx_private_cell_66ad2b12500007a9c9a94c69().value - 1));
    let nt = i32(__cxx_private_cell_4df42b33f7a1fea706f555ac().value.numtics);
    let nf = i32(__cxx_private_cell_4df42b33f7a1fea706f555ac().value.numframes);
    let gms = __cxx_private_cell_4df42b33f7a1fea706f555ac().value.totalgamems;
    let dms1 = __cxx_private_cell_4df42b33f7a1fea706f555ac().value.totalroomsdrawms;
    let dms2 = __cxx_private_cell_4df42b33f7a1fea706f555ac().value.totalrestdrawms;
    (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.SoundToggle = i32(__cxx_private_cell_1c1fffd731c9c748ddfd41b7().value));
    if ((nt > 0)) {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_1efd6a30f5ff0a136186, u32(444), __cxx_literal_a20d1fd4670203a654a8, dn, nt));
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_5653788a9fd0159904e0, u32(446), __cxx_literal_3d7e8b667c2cb2438026, dn, gms, ((gms * 1000) / nt)));
    }
    if ((nf > 0)) {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_963cba3b1f7f9307a5e6, u32(451), __cxx_literal_99161ccca30b16f27c9a, dn, nf, i32((__cxx_private_cell_79f6adc5fc1d12f365fba22e().value - 1))));
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_4c7ef4d6d847b6a36746, u32(453), __cxx_literal_57086671d86a2c0c87d6, dn, (dms1 / 1000), (dms1 / nf)));
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_b8bc259eb260323d3488, u32(455), __cxx_literal_5d693836d3eb29478a6f, dn, (dms2 / 1000), (dms2 / nf)));
    }
    {
      let totalprofms = ((gms + dms1) + dms2);
      let totalms = (timerGetFractionalTicks() - __cxx_private_cell_4df42b33f7a1fea706f555ac().value.starthiticks);
      if ((totalprofms != 0)) {
        ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_28b9471109fe30588db1, u32(463), __cxx_literal_0a3aca7cb9be88117056, dn, (((100 * totalms) / totalprofms) - 100)));
      }
    }
  }
  (__cxx_private_cell_79f6adc5fc1d12f365fba22e().value = i32(0));
  (__cxx_private_cell_456fb428622e93a857f2783e().value = i32(0));
}

export function ARRAY_SIZE__header_ca0a16ad68c4(arg0) {
  return u64(512n);
}

// C/C++ source: source/duke3d/src/game.h:293
export function G_HaveUserMap__header_6552372bf489() {
  return i32((((i32((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.level_number == 7)) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number == 0)));
}

// C/C++ source: source/build/include/baselayer.h:364
const __cxx_literal_babdfc56f8f23746c2a6 = Uint8Array.from([99, 97, 108, 99, 95, 115, 109, 111, 111, 116, 104, 114, 97, 116, 105, 111, 58, 32, 114, 97, 116, 105, 111, 58, 32, 37, 100, 0]);
export function calc_smoothratio__header_bdcedff01926(totalclk, ototalclk, gameTicRate) {
  let tfreq = i32(floorf(((__cxx_global_cell_84c518e352f66f31d8eaf74c().value * 120) / timerGetClockRate())));
  let clk = i32(__cxx_operator_761c63d1e16e183f(cCopyTrivialClass(totalclk, ClockTicks(), ["wholeTicks", "ticksS32"]), ototalclk).toScale16());
  let tics = Math.fround(Math.fround((Math.fround((Math.fround((Math.fround((Math.fround(1) / Math.fround(65536))) * Math.fround((Math.fround(1) / Math.fround(120))))) * Math.fround(tfreq))) * Math.fround(clk))));
  let ratio = i32(__cxx_global_cell_88248ca6ca50548115e47549().value(i32(Math.fround((Math.fround((Math.fround(65536) * tics)) * Math.fround(gameTicRate)))), tfreq));
  const __cxx_lvalue_0 = cRef(() => ratio, __cxx_lvalue_1 => { ratio = i32(__cxx_lvalue_1); });
  if ((u32(ratio) > u32(66048))) {
    do {
      SILENCE_UNUSED__header_83291bbed5a3(__cxx_literal_babdfc56f8f23746c2a6, __cxx_lvalue_0);
    } while (Boolean(0));
  }
  return i32(clamp__header_6a8ab3aa40d8(ratio, 0, 65536));
}

// C/C++ source: source/audiolib/include/fx_man.h:97
export function FX_CheckMVErr__header_83b4ec715094(status) {
  if ((status != i32(0))) {
    FX_SetErrorCode__header_4af0a1210311(i32(2));
    (status = i32(-2));
  }
  return i32(status);
}

export function SILENCE_UNUSED__header_83291bbed5a3(arg0, arg1) {

}

export function clamp__header_6a8ab3aa40d8(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/audiolib/include/fx_man.h:91
export function FX_SetErrorCode__header_4af0a1210311(status) {
  (__cxx_global_cell_103ca1df5a9531b359a2ae15().value = i32(status));
  return i32(-1);
}

export function __cxx_operator_e3598b0077b4da36(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_c4f1fab776aa8f78(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_35d41574d9c68141(lhs, rhs) {
  return Boolean((lhs.wholeTicks == rhs.wholeTicks));
}
