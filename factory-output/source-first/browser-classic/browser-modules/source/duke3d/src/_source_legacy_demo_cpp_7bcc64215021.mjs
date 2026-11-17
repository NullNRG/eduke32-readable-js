// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/demo.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { ClockTicks } from "./demo.cpp.mjs";
import { __cxx_global_cell_103ca1df5a9531b359a2ae15 } from "../../audiolib/src/fx_man.cpp.mjs";
import { P_DoQuote } from "./text.cpp.mjs";
import { apStrings } from "./global.cpp.mjs";
import { boardfilename } from "./game.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { __cxx_private_cell_f99f12c48d172f28deb53a54 } from "./demo.cpp.mjs";
import { __cxx_private_cell_fc38bb6496c8a7b0b9bbe017 } from "./demo.cpp.mjs";
import { __cxx_private_cell_eeeeee90004f361ef45e4b6c } from "./demo.cpp.mjs";
import { dfwrite_LZ4 } from "../../build/src/vfs.cpp.mjs";
import { fclose } from "../../../browser-abi/libc_provider.mjs";
import { fseek } from "../../../browser-abi/libc_provider.mjs";
import { fwrite } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_e17a5783e4d4a0690d42cb8d } from "./demo.cpp.mjs";
import { __cxx_private_cell_f32ba34a1fb723579e808905 } from "./demo.cpp.mjs";
import { __cxx_global_cell_b8b854e6be4b2dfee7e6f10c } from "./demo.cpp.mjs";
import { __cxx_private_cell_011d86fa47307d3c9303af61 } from "./demo.cpp.mjs";
import { __cxx_private_cell_79f6adc5fc1d12f365fba22e } from "./demo.cpp.mjs";
import { __cxx_global_cell_a4246fbb63a7ebf8507a32fa } from "./demo.cpp.mjs";
import { __cxx_private_cell_1a1afaae10afa35b57057a03 } from "./demo.cpp.mjs";
import { __cxx_private_cell_1c1fffd731c9c748ddfd41b7 } from "./demo.cpp.mjs";
import { __cxx_private_cell_456fb428622e93a857f2783e } from "./demo.cpp.mjs";
import { g_firstDemoFile } from "./demo.cpp.mjs";
import { g_player } from "./global.cpp.mjs";
import { __cxx_private_cell_4df42b33f7a1fea706f555ac } from "./demo.cpp.mjs";
import { __cxx_private_cell_66ad2b12500007a9c9a94c69 } from "./demo.cpp.mjs";
import { kdfread_LZ4 } from "../../build/src/vfs.cpp.mjs";
import { kread } from "../../build/src/vfs.cpp.mjs";
import { __cxx_global_cell_0f5d76246695f95afb26af0f } from "./global.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { maybe_append_ext } from "../../build/src/common.cpp.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_04adffdeab684b9c52206917 } from "../../build/src/mmulti.cpp.mjs";
import { __cxx_global_cell_25ebc483826d436da41b0007 } from "./global.cpp.mjs";
import { perror } from "../../../browser-abi/libc_provider.mjs";
import { recsync } from "./global.cpp.mjs";
import { __cxx_global_cell_84c518e352f66f31d8eaf74c } from "../../build/src/sdlayer.cpp.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { strtol } from "../../../browser-abi/libc_provider.mjs";
import { sv_freemem } from "./savegame.cpp.mjs";
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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
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

// C/C++ source: source/duke3d/src/demo.cpp:251
const __cxx_literal_bd88914dee2a604502b1 = Uint8Array.from([115, 89, 110, 67, 0]);
export function Demo_WriteSync() {
  let tmpreccnt;
  const __cxx_lvalue_0 = cScalarStorage(Int16Array);
  fwrite(__cxx_literal_bd88914dee2a604502b1, u64(4), u64(1), __cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
  (__cxx_lvalue_0.value = ((u32(((u32(((u32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt) << 16) >> 16)) << 16) >> 16)) << 16) >> 16));
  fwrite(__cxx_lvalue_0, 2, u64(1), __cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
  if (Boolean(__cxx_private_cell_eeeeee90004f361ef45e4b6c().value)) {
    fwrite(__cxx_private_cell_1a1afaae10afa35b57057a03().value, u64(1), u64(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt), __cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
  }
  if (Boolean(__cxx_private_cell_fc38bb6496c8a7b0b9bbe017().value)) {
    dfwrite_LZ4(recsync, i32(20), __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt, __cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
  } else {
    fwrite(recsync, 20, u64(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt), __cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
  }
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt = i32(0));
}

// C/C++ source: source/duke3d/src/demo.cpp:294
const __cxx_literal_7853649749f7a4749027 = Uint8Array.from([69, 110, 68, 33, 0]);
const __cxx_literal_74cf3b4c2f6b3437b091 = Uint8Array.from([71, 95, 67, 108, 111, 115, 101, 68, 101, 109, 111, 87, 114, 105, 116, 101, 58, 32, 102, 105, 110, 97, 108, 32, 102, 115, 101, 101, 107, 0]);
const __cxx_literal_474bcb9f575a1247d152 = Uint8Array.from([68, 69, 77, 79, 32, 82, 69, 67, 79, 82, 68, 73, 78, 71, 32, 83, 84, 79, 80, 80, 69, 68, 0]);
export function G_CloseDemoWrite() {
  if ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.recstat == 1)) {
    if ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt > 0)) {
      Demo_WriteSync();
    }
    fwrite(__cxx_literal_7853649749f7a4749027, u64(4), u64(1), __cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
    if (Boolean(fseek(__cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value, i64(28n), 0))) {
      perror(__cxx_literal_74cf3b4c2f6b3437b091);
    } else {
      fwrite(cScalarLValueIO(__cxx_global_cell_e17a5783e4d4a0690d42cb8d(), Int32Array), 4, u64(1), __cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
    }
    (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.recstat = i32((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_recstat = i32(0))));
    do {
      if (__cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value) {
        fclose(__cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value);
        (__cxx_global_cell_b8b854e6be4b2dfee7e6f10c().value = cRecordPointer(null, {"align": 8, "arrayAlign": 1, "fields": {"_IO_backup_base": {"offset": 80, "pointer": true, "size": 8}, "_IO_buf_base": {"offset": 56, "pointer": true, "size": 8}, "_IO_buf_end": {"offset": 64, "pointer": true, "size": 8}, "_IO_read_base": {"offset": 24, "pointer": true, "size": 8}, "_IO_read_end": {"offset": 16, "pointer": true, "size": 8}, "_IO_read_ptr": {"offset": 8, "pointer": true, "size": 8}, "_IO_save_base": {"offset": 72, "pointer": true, "size": 8}, "_IO_save_end": {"offset": 88, "pointer": true, "size": 8}, "_IO_write_base": {"offset": 32, "pointer": true, "size": 8}, "_IO_write_end": {"offset": 48, "pointer": true, "size": 8}, "_IO_write_ptr": {"offset": 40, "pointer": true, "size": 8}, "__pad5": {"native": "BigUint64Array", "offset": 184, "size": 8}, "_chain": {"offset": 104, "pointer": true, "size": 8}, "_codecvt": {"offset": 152, "pointer": true, "size": 8}, "_cur_column": {"native": "Uint16Array", "offset": 128, "size": 2}, "_fileno": {"native": "Int32Array", "offset": 112, "size": 4}, "_flags": {"native": "Int32Array", "offset": 0, "size": 4}, "_flags2": {"native": "Int32Array", "offset": 116, "size": 4}, "_freeres_buf": {"offset": 176, "pointer": true, "size": 8}, "_freeres_list": {"offset": 168, "pointer": true, "size": 8}, "_lock": {"offset": 136, "pointer": true, "size": 8}, "_markers": {"offset": 96, "pointer": true, "size": 8}, "_mode": {"native": "Int32Array", "offset": 192, "size": 4}, "_offset": {"native": "BigInt64Array", "offset": 144, "size": 8}, "_old_offset": {"native": "BigInt64Array", "offset": 120, "size": 8}, "_shortbuf": {"length": 1, "native": "Uint8Array", "offset": 131, "size": 1}, "_unused2": {"length": 20, "native": "Uint8Array", "offset": 196, "size": 20}, "_vtable_offset": {"native": "Int8Array", "offset": 130, "size": 1}, "_wide_data": {"offset": 160, "pointer": true, "size": 8}}, "overlaps": false, "size": 216, "union": false}, {}));
      }
    } while (Boolean(0));
    sv_freemem();
    strcpy((cPointerElementRef(apStrings, 122).value), __cxx_literal_474bcb9f575a1247d152);
    P_DoQuote(122, (cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_04adffdeab684b9c52206917().value).value).ps);
  }
}

// C/C++ source: source/duke3d/src/demo.cpp:338
export function Demo_ReadSync(errcode) {
  let si;
  const __cxx_lvalue_0 = cScalarStorage(Uint16Array);
  let i;
  if ((u64(kread(__cxx_global_cell_a4246fbb63a7ebf8507a32fa().value, __cxx_lvalue_0, i32(2))) != 2)) {
    return i32(errcode);
  }
  (i = i32(__cxx_lvalue_0.value));
  if (Boolean(__cxx_private_cell_f99f12c48d172f28deb53a54().value)) {
    if ((kread(__cxx_global_cell_a4246fbb63a7ebf8507a32fa().value, __cxx_private_cell_1a1afaae10afa35b57057a03().value, i) != i)) {
      return i32(errcode);
    }
  }
  if (Boolean(__cxx_private_cell_fc38bb6496c8a7b0b9bbe017().value)) {
    if ((kdfread_LZ4(recsync, i32(20), i, __cxx_global_cell_a4246fbb63a7ebf8507a32fa().value) != i)) {
      return i32((errcode + 1));
    }
  } else {
    let bytes = i32(u64((BigInt(20) * BigInt(u64(i)))));
    if ((kread(__cxx_global_cell_a4246fbb63a7ebf8507a32fa().value, recsync, bytes) != bytes)) {
      return i32((errcode + 2));
    }
  }
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.reccnt = i32(i));
  return i32(0);
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
