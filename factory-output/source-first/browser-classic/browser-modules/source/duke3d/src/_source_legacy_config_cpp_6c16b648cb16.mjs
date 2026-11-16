// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/config.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_7ad9490ab779b926bf483166 } from "./game.cpp.mjs";
import { Bstrtoken } from "../../build/src/compat.cpp.mjs";
import { CONTROL_BindKey } from "../../mact/src/control.cpp.mjs";
import { CONTROL_ClearAllBinds } from "../../mact/src/control.cpp.mjs";
import { CONTROL_FreeKeyBind } from "../../mact/src/control.cpp.mjs";
import { CONTROL_KeyBinds } from "../../mact/src/control.cpp.mjs";
import { CONTROL_MapAnalogAxis } from "../../mact/src/control.cpp.mjs";
import { CONTROL_MapButton } from "../../mact/src/control.cpp.mjs";
import { CONTROL_MapDigitalAxis } from "../../mact/src/control.cpp.mjs";
import { CONTROL_SetAnalogAxisInvert } from "../../mact/src/control.cpp.mjs";
import { CONTROL_SetAnalogAxisSensitivity } from "../../mact/src/control.cpp.mjs";
import { __cxx_global_cell_d16777dd8cd77fdf0c735c4c } from "./screens.cpp.mjs";
import { __cxx_global_cell_c7221fd6ffce6a41cc43a6f8 } from "./screens.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { JOYSTICK_SetDeadZone } from "../../mact/src/control.cpp.mjs";
import { KB_ScanCodeToString } from "../../mact/src/keyboard.cpp.mjs";
import { KB_StringToScanCode } from "../../mact/src/keyboard.cpp.mjs";
import { OSD_CaptureKey } from "../../build/src/osd.cpp.mjs";
import { OSD_Exec } from "../../build/src/osd.cpp.mjs";
import { OSD_WriteAliases } from "../../build/src/osd.cpp.mjs";
import { OSD_WriteCvars } from "../../build/src/osd.cpp.mjs";
import { SCRIPT_GetDouble } from "../../mact/src/scriplib.cpp.mjs";
import { SCRIPT_GetNumber } from "../../mact/src/scriplib.cpp.mjs";
import { SCRIPT_GetString } from "../../mact/src/scriplib.cpp.mjs";
import { SCRIPT_Init } from "../../mact/src/scriplib.cpp.mjs";
import { SCRIPT_PutNumber } from "../../mact/src/scriplib.cpp.mjs";
import { __errno_location } from "../../../browser-abi/libc_provider.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { fclose } from "../../../browser-abi/libc_provider.mjs";
import { fopen } from "../../../browser-abi/libc_provider.mjs";
import { fwrite } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_b9224c19fd76cc2e0a63ab16 } from "./screens.cpp.mjs";
import { __cxx_global_cell_c0e288040dbf9a805036c27d } from "./common.cpp.mjs";
import { g_setupFileName } from "./global.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { gamefunctions } from "./config.cpp.mjs";
import { __cxx_global_cell_3f867168dc2e6af035c1cc31 } from "./config.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_findcase } from "../../build/src/hash.cpp.mjs";
import { joyGetName } from "../../build/src/sdlayer.cpp.mjs";
import { __cxx_global_cell_39a39d1bfab5e142a4f76536 } from "../../build/src/baselayer.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { mbtn_to_name } from "./config.cpp.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memmove } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { sctokeylut__header_global_c278a7b696219d09 } from "./config.cpp.mjs";
import { snprintf } from "../../../browser-abi/libc_provider.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { stat } from "../../../browser-abi/libc_provider.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { strcmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strerror } from "../../../browser-abi/libc_provider.mjs";
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
// C/C++ source: source/duke3d/src/config.cpp:560
export class GameControllerButtonSetting {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}}, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), new.target.prototype);
  }
  apply() {
    CONFIG_SetJoystickButtonFunction(i32(this.button), 0, this.function);
  }
}

// C/C++ source: source/duke3d/src/config.cpp:570
export class GameControllerAnalogAxisSetting {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerAnalogAxisSetting", "size": 8, "union": false}}, {"GameControllerAnalogAxisSetting": () => GameControllerAnalogAxisSetting.prototype}), new.target.prototype);
  }
  apply() {
    CONFIG_SetJoystickAnalogAxisFunction(i32(this.axis), this.function);
  }
}

// C/C++ source: source/duke3d/src/config.cpp:580
export class GameControllerDigitalAxisSetting {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 8, "size": 4}, "polarity": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerDigitalAxisSetting", "size": 12, "union": false}}, {"GameControllerDigitalAxisSetting": () => GameControllerDigitalAxisSetting.prototype}), new.target.prototype);
  }
  apply() {
    CONFIG_SetJoystickDigitalAxisFunction(i32(this.axis), this.polarity, this.function);
  }
}

// C/C++ source: source/duke3d/src/config.cpp:47
export function CONFIG_FunctionNameToNum(func) {
  if (((!func) || (i32((cDeref(cPointerOffset(func, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(0)))) {
    return i32((-1));
  }
  return i32(hash_findcase(__cxx_global_cell_3f867168dc2e6af035c1cc31().value, func));
}

// C/C++ source: source/duke3d/src/config.cpp:56
const __cxx_literal_836debffa9e8d7bfc475 = Uint8Array.from([0]);
export function CONFIG_FunctionNumToName(func) {
  if ((u32(func) >= u32(63))) {
    return __cxx_literal_836debffa9e8d7bfc475;
  }
  return (cPointerElementRef(gamefunctions, func).value);
}

// C/C++ source: source/duke3d/src/config.cpp:64
const __cxx_literal_b281012e863db6bbff1e = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 116, 117, 114, 110, 105, 110, 103, 0]);
const __cxx_literal_5b250fc8f927e063a1e9 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 115, 116, 114, 97, 102, 105, 110, 103, 0]);
const __cxx_literal_bfd333e8141aefb0124a = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 109, 111, 118, 105, 110, 103, 0]);
const __cxx_literal_9ac25f403bf9f2363d8e = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 108, 111, 111, 107, 105, 110, 103, 117, 112, 97, 110, 100, 100, 111, 119, 110, 0]);
export function CONFIG_AnalogNameToNum(func) {
  if ((!func)) {
    return i32((-1));
  } else {
    if ((!Boolean(strcasecmp(func, __cxx_literal_b281012e863db6bbff1e)))) {
      return i32(0);
    } else {
      if ((!Boolean(strcasecmp(func, __cxx_literal_5b250fc8f927e063a1e9)))) {
        return i32(1);
      } else {
        if ((!Boolean(strcasecmp(func, __cxx_literal_bfd333e8141aefb0124a)))) {
          return i32(5);
        } else {
          if ((!Boolean(strcasecmp(func, __cxx_literal_9ac25f403bf9f2363d8e)))) {
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
const __cxx_literal_20b2a58f4333f7962e4d = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 116, 117, 114, 110, 105, 110, 103, 0]);
const __cxx_literal_5d0683b0a5a4762cb3a7 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 115, 116, 114, 97, 102, 105, 110, 103, 0]);
const __cxx_literal_d03ab46bf504b256227e = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 109, 111, 118, 105, 110, 103, 0]);
const __cxx_literal_8c80751c9a7a634802c4 = Uint8Array.from([97, 110, 97, 108, 111, 103, 95, 108, 111, 111, 107, 105, 110, 103, 117, 112, 97, 110, 100, 100, 111, 119, 110, 0]);
const __cxx_literal_ebaf45f159fe439524ba = Uint8Array.from([0]);
export function CONFIG_AnalogNumToName(func) {
  switch (func) {
    case i32(0): {
      return __cxx_literal_20b2a58f4333f7962e4d;
    }
    case i32(1): {
      return __cxx_literal_5d0683b0a5a4762cb3a7;
    }
    case i32(5): {
      return __cxx_literal_d03ab46bf504b256227e;
    }
    case i32(2): {
      return __cxx_literal_8c80751c9a7a634802c4;
    }
  }
  return __cxx_literal_ebaf45f159fe439524ba;
}

// C/C++ source: source/duke3d/src/config.cpp:99
export function CONFIG_SetJoystickButtonFunction(i, j, __cxx_function) {
  ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickFunctions, i).value), j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(__cxx_function));
  CONTROL_MapButton(__cxx_function, i, j, 2);
}

// C/C++ source: source/duke3d/src/config.cpp:104
export function CONFIG_SetJoystickAnalogAxisSensitivity(i, sens) {
  ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSensitivity, i, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) = Math.fround(sens));
  CONTROL_SetAnalogAxisSensitivity(i, sens, 2);
}

// C/C++ source: source/duke3d/src/config.cpp:109
export function CONFIG_SetJoystickAnalogAxisInvert(i, invert) {
  ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueInvert, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(invert));
  CONTROL_SetAnalogAxisInvert(i, invert);
}

// C/C++ source: source/duke3d/src/config.cpp:114
export function CONFIG_SetJoystickAnalogAxisDeadSaturate(i, dead, saturate) {
  ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueDead, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(dead));
  ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSaturate, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(saturate));
  JOYSTICK_SetDeadZone(i, (u32(dead) & 65535), (u32(saturate) & 65535));
}

// C/C++ source: source/duke3d/src/config.cpp:120
export function CONFIG_SetJoystickDigitalAxisFunction(i, j, __cxx_function) {
  ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickDigitalFunctions, i).value), j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(__cxx_function));
  CONTROL_MapDigitalAxis(i, __cxx_function, j);
}

// C/C++ source: source/duke3d/src/config.cpp:125
export function CONFIG_SetJoystickAnalogAxisFunction(i, __cxx_function) {
  ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueAxes, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(__cxx_function));
  CONTROL_MapAnalogAxis(i, __cxx_function);
}

// C/C++ source: source/duke3d/src/config.cpp:132
let __static_CONFIG_SetDefaultKeys_s_gamefunc_ = (() => { const bytes = new Uint8Array(10); bytes.set([103, 97, 109, 101, 102, 117, 110, 99, 95]); return bytes; })();
export function CONFIG_SetDefaultKeys(keyptr, lazy) {

  let strlen_gamefunc_ = i32(u64((BigInt(ARRAY_SIZE__header_4bd4efb10165(__static_CONFIG_SetDefaultKeys_s_gamefunc_)) - BigInt(u64(1)))));
  if ((!lazy)) {
    memset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, 255, 126);
    CONTROL_ClearAllBinds();
  }
  for (let i = i32(0); (i64(i) < i64(ARRAY_SIZE__header_624fefad79ed(gamefunctions))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((i32((cDeref(cPointerOffset((cPointerElementRef(gamefunctions, i).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(0))) {
      continue;
    }
    let key = (cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, i).value);
    let default0 = i32(KB_StringToScanCode((cPointerElementRef(keyptr, i32((i << 1))).value)));
    let default1 = i32(KB_StringToScanCode((cPointerElementRef(keyptr, i32((i32((i << 1)) + 1))).value)));
    if ((lazy && ((i32((cDeref(cPointerOffset(key, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 255) || ((Boolean(CONTROL_KeyIsBound__header_e56aea27d40b(default0)) && (strlen((cPointerElementRef(cRecordPointer(CONTROL_KeyBinds, {"align": 8, "arrayAlign": 1, "fields": {"cmdstr": {"offset": 8, "pointer": true, "size": 8}, "key": {"offset": 0, "pointer": true, "size": 8}, "laststate": {"native": "Uint8Array", "offset": 17, "size": 1}, "repeat": {"native": "Uint8Array", "offset": 16, "size": 1}}, "overlaps": false, "size": 24, "union": false}, {}), default0).value).cmdstr) > u64(strlen_gamefunc_))) && (CONFIG_FunctionNameToNum(cPointerOffset((cPointerElementRef(cRecordPointer(CONTROL_KeyBinds, {"align": 8, "arrayAlign": 1, "fields": {"cmdstr": {"offset": 8, "pointer": true, "size": 8}, "key": {"offset": 0, "pointer": true, "size": 8}, "laststate": {"native": "Uint8Array", "offset": 17, "size": 1}, "repeat": {"native": "Uint8Array", "offset": 16, "size": 1}}, "overlaps": false, "size": 24, "union": false}, {}), default0).value).cmdstr, strlen_gamefunc_, Uint8Array.BYTES_PER_ELEMENT)) >= 0))))) {
      continue;
    }
    ((cDeref(cPointerOffset(key, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(default0) & 255)) & 255));
    ((cDeref(cPointerOffset(key, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(default1) & 255)) & 255));
    if (Boolean((cDeref(cPointerOffset(key, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
      CONTROL_FreeKeyBind(i32((cDeref(cPointerOffset(key, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
    }
    if (Boolean((cDeref(cPointerOffset(key, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))) {
      CONTROL_FreeKeyBind(i32((cDeref(cPointerOffset(key, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
    }
    if ((i == i32(52))) {
      OSD_CaptureKey((cDeref(cPointerOffset(key, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
    } else {
      CONFIG_MapKey(i, (cDeref(cPointerOffset(key, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), (u32(0) & 255), (cDeref(cPointerOffset(key, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), (u32(0) & 255));
    }
  }
}

// C/C++ source: source/duke3d/src/config.cpp:405
const __cxx_literal_2c68e647408d26d8e11f = Uint8Array.from([103, 97, 109, 101, 102, 117, 110, 99, 95, 37, 115, 59, 32, 0]);
const __cxx_literal_c4e10acdaf22795f13c8 = Uint8Array.from([60, 63, 62, 0]);
export function CONFIG_MapKey(which, key1, oldkey1, key2, oldkey2) {
  let keys = new Int32Array([i32(key1), i32(key2), i32(oldkey1), i32(oldkey2)]);
  let buf = cZeroAggregate({"array": "Uint8Array", "dims": [64]});
  if ((which == i32(52))) {
    OSD_CaptureKey(key1);
  }
  for (let k = i32(0); (u64(u32(k)) < ARRAY_SIZE__header_18686f250d67(keys)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => k, __cxx_lvalue_1 => { k = __cxx_lvalue_1; }))) {
    if ((((cDeref(cPointerOffset(keys, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == 255) || (!Boolean((cDeref(cPointerOffset(keys, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) {
      continue;
    }
    let match = i32(0);
    for (; (i64(match) < i64(ARRAY_SIZE__header_81b12eec007e(sctokeylut__header_global_c278a7b696219d09))); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => match, __cxx_lvalue_3 => { match = __cxx_lvalue_3; }))) {
      if (((cDeref(cPointerOffset(keys, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == i32((cPointerElementRef(sctokeylut__header_global_c278a7b696219d09, match).value).sc))) {
        break;
      }
    }
    ((cDeref(cPointerOffset(tempbuf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    for (let i = i32((i32(63) - 1)); (i >= 0); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
      if (((i32((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, i).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == (cDeref(cPointerOffset(keys, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) || (i32((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, i).value), 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == (cDeref(cPointerOffset(keys, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) {
        sprintf(buf, __cxx_literal_2c68e647408d26d8e11f, CONFIG_FunctionNumToName(i));
        strcat(tempbuf, buf);
      }
    }
    let len = i32(strlen(tempbuf));
    if ((len >= 2)) {
      ((cDeref(cPointerOffset(tempbuf, i32((len - 2)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
      CONTROL_BindKey((cDeref(cPointerOffset(keys, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), tempbuf, 1, ((cPointerElementRef(sctokeylut__header_global_c278a7b696219d09, match).value).key ? (cPointerElementRef(sctokeylut__header_global_c278a7b696219d09, match).value).key : __cxx_literal_c4e10acdaf22795f13c8));
    } else {
      CONTROL_FreeKeyBind((cDeref(cPointerOffset(keys, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
    }
  }
}

// C/C++ source: source/duke3d/src/config.cpp:452
const __cxx_literal_9b9a957752c7e0b7931c = Uint8Array.from([77, 111, 117, 115, 101, 66, 117, 116, 116, 111, 110, 37, 100, 0]);
const __cxx_literal_dafde287e8b212f46e15 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_5ca610652c3238734e2d = Uint8Array.from([77, 111, 117, 115, 101, 66, 117, 116, 116, 111, 110, 67, 108, 105, 99, 107, 101, 100, 37, 100, 0]);
const __cxx_literal_93f93520bc2d213b7d0b = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
export function CONFIG_SetupMouse() {
  if ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle < 0)) {
    return;
  }
  let str = cZeroAggregate({"array": "Uint8Array", "dims": [80]});
  let temp = cZeroAggregate({"array": "Uint8Array", "dims": [80]});
  for (let i = i32(0); (i < 10); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    sprintf(str, __cxx_literal_9b9a957752c7e0b7931c, i);
    ((cDeref(cPointerOffset(temp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((!Boolean(SCRIPT_GetString(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_dafde287e8b212f46e15, str, temp)))) {
      ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.MouseFunctions, i).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(CONFIG_FunctionNameToNum(temp)));
    }
    sprintf(str, __cxx_literal_5ca610652c3238734e2d, i);
    ((cDeref(cPointerOffset(temp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((!Boolean(SCRIPT_GetString(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_93f93520bc2d213b7d0b, str, temp)))) {
      ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.MouseFunctions, i).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(CONFIG_FunctionNameToNum(temp)));
    }
  }
  for (let i = i32(0); (i < 10); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    CONTROL_MapButton((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.MouseFunctions, i).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), i, 0, 1);
    CONTROL_MapButton((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.MouseFunctions, i).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), i, 1, 1);
  }
}

// C/C++ source: source/duke3d/src/config.cpp:481
const __cxx_literal_fc226c172333fb3d5ef8 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 66, 117, 116, 116, 111, 110, 37, 100, 0]);
const __cxx_literal_69b4007f59d2c7d021c9 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_2a122863ab0c43cae1b5 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 66, 117, 116, 116, 111, 110, 67, 108, 105, 99, 107, 101, 100, 37, 100, 0]);
const __cxx_literal_c9a5f4b551ef55252c35 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_a9ec16722b7bc75a051f = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 65, 110, 97, 108, 111, 103, 65, 120, 101, 115, 37, 100, 0]);
const __cxx_literal_ede0bca23ae066e66846 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_42e3e9d4c1cd4cb81bb9 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 68, 105, 103, 105, 116, 97, 108, 65, 120, 101, 115, 37, 100, 95, 48, 0]);
const __cxx_literal_bce732769e2511c52359 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_c1d5b1bf71fec6c941c0 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 68, 105, 103, 105, 116, 97, 108, 65, 120, 101, 115, 37, 100, 95, 49, 0]);
const __cxx_literal_49e364d7a421410680d6 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_d14897554cbcb100fd7b = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 65, 110, 97, 108, 111, 103, 83, 101, 110, 115, 105, 116, 105, 118, 105, 116, 121, 37, 100, 0]);
const __cxx_literal_daa3978ff4a15fc8112f = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_5d94c0fa268961825fe6 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 65, 110, 97, 108, 111, 103, 73, 110, 118, 101, 114, 116, 37, 100, 0]);
const __cxx_literal_5e51893fecf5a2b9df38 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_03311ee58046f2ec02c6 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 65, 110, 97, 108, 111, 103, 68, 101, 97, 100, 37, 100, 0]);
const __cxx_literal_e460e5c355b8ea2e4e06 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
const __cxx_literal_7d11d42a02d7230e8ddc = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 65, 110, 97, 108, 111, 103, 83, 97, 116, 117, 114, 97, 116, 101, 37, 100, 0]);
const __cxx_literal_581f1f00a373444153f6 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 115, 0]);
export function CONFIG_SetupJoystick() {
  let i;
  let str = cZeroAggregate({"array": "Uint8Array", "dims": [80]});
  let temp = cZeroAggregate({"array": "Uint8Array", "dims": [80]});
  let scale;
  const __cxx_lvalue_0 = cRef(() => scale, __cxx_lvalue_2 => { scale = i32(__cxx_lvalue_2); });
  let sens;
  const __cxx_lvalue_1 = cRef(() => sens, __cxx_lvalue_3 => { sens = __cxx_lvalue_3; });
  if ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle < 0)) {
    return;
  }
  for ((i = i32(0)); (i < i32((32 + 4))); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    sprintf(str, __cxx_literal_fc226c172333fb3d5ef8, i);
    ((cDeref(cPointerOffset(temp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((!Boolean(SCRIPT_GetString(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_69b4007f59d2c7d021c9, str, temp)))) {
      ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickFunctions, i).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(CONFIG_FunctionNameToNum(temp)));
    }
    sprintf(str, __cxx_literal_2a122863ab0c43cae1b5, i);
    ((cDeref(cPointerOffset(temp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((!Boolean(SCRIPT_GetString(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_c9a5f4b551ef55252c35, str, temp)))) {
      ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickFunctions, i).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(CONFIG_FunctionNameToNum(temp)));
    }
  }
  for ((i = i32(0)); (i < 9); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    sprintf(str, __cxx_literal_a9ec16722b7bc75a051f, i);
    ((cDeref(cPointerOffset(temp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((!Boolean(SCRIPT_GetString(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_ede0bca23ae066e66846, str, temp)))) {
      ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueAxes, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(CONFIG_AnalogNameToNum(temp)));
    }
    sprintf(str, __cxx_literal_42e3e9d4c1cd4cb81bb9, i);
    ((cDeref(cPointerOffset(temp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((!Boolean(SCRIPT_GetString(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_bce732769e2511c52359, str, temp)))) {
      ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickDigitalFunctions, i).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(CONFIG_FunctionNameToNum(temp)));
    }
    sprintf(str, __cxx_literal_c1d5b1bf71fec6c941c0, i);
    ((cDeref(cPointerOffset(temp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
    if ((!Boolean(SCRIPT_GetString(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_49e364d7a421410680d6, str, temp)))) {
      ((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickDigitalFunctions, i).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(CONFIG_FunctionNameToNum(temp)));
    }
    sprintf(str, __cxx_literal_d14897554cbcb100fd7b, i);
    (sens = (cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSensitivity, i, Float32Array.BYTES_PER_ELEMENT), Float32Array).value));
    SCRIPT_GetDouble(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_daa3978ff4a15fc8112f, str, __cxx_lvalue_1);
    ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSensitivity, i, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) = Math.fround(sens));
    sprintf(str, __cxx_literal_5d94c0fa268961825fe6, i);
    (scale = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueInvert, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    SCRIPT_GetNumber(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_5e51893fecf5a2b9df38, str, __cxx_lvalue_0);
    ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueInvert, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(scale));
    sprintf(str, __cxx_literal_03311ee58046f2ec02c6, i);
    (scale = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueDead, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    SCRIPT_GetNumber(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_e460e5c355b8ea2e4e06, str, __cxx_lvalue_0);
    ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueDead, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(scale));
    sprintf(str, __cxx_literal_7d11d42a02d7230e8ddc, i);
    (scale = i32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSaturate, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    SCRIPT_GetNumber(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_581f1f00a373444153f6, str, __cxx_lvalue_0);
    ((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSaturate, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(scale));
  }
  for ((i = i32(0)); (i < i32((32 + 4))); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => i, __cxx_lvalue_9 => { i = __cxx_lvalue_9; }))) {
    CONTROL_MapButton((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickFunctions, i).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), i, 0, 2);
    CONTROL_MapButton((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickFunctions, i).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), i, 1, 2);
  }
  for ((i = i32(0)); (i < 9); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous + 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
    CONTROL_MapAnalogAxis(i, (cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueAxes, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
    CONTROL_MapDigitalAxis(i, (cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickDigitalFunctions, i).value), 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 0);
    CONTROL_MapDigitalAxis(i, (cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickDigitalFunctions, i).value), 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 1);
    CONTROL_SetAnalogAxisSensitivity(i, (cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSensitivity, i, Float32Array.BYTES_PER_ELEMENT), Float32Array).value), 2);
    CONTROL_SetAnalogAxisInvert(i, (cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueInvert, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
    JOYSTICK_SetDeadZone(i, (u32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueDead, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & 65535), (u32((cDeref(cPointerOffset(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAnalogueSaturate, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)) & 65535));
  }
}

// C/C++ source: source/duke3d/src/config.cpp:592
let __static_CONFIG_SetGameControllerAxesModern_analogAxes = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerAnalogAxisSetting", "size": 8, "union": false}, [4], {"GameControllerAnalogAxisSetting": () => GameControllerAnalogAxisSetting.prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerAnalogAxisSetting", "size": 8, "union": false}, {"axis": 0, "function": i32(1)}, null, {"GameControllerAnalogAxisSetting": () => GameControllerAnalogAxisSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerAnalogAxisSetting", "size": 8, "union": false}, {"axis": 1, "function": i32(5)}, null, {"GameControllerAnalogAxisSetting": () => GameControllerAnalogAxisSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerAnalogAxisSetting", "size": 8, "union": false}, {"axis": 2, "function": i32(0)}, null, {"GameControllerAnalogAxisSetting": () => GameControllerAnalogAxisSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerAnalogAxisSetting", "size": 8, "union": false}, {"axis": 3, "function": i32(2)}, null, {"GameControllerAnalogAxisSetting": () => GameControllerAnalogAxisSetting.prototype})]);
export function CONFIG_SetGameControllerAxesModern() {

  CONFIG_SetJoystickAnalogAxisSensitivity(i32(2), Math.fround(5));
  CONFIG_SetJoystickAnalogAxisSensitivity(i32(3), Math.fround(5));
  {
    const __cxx_range_array_0 = __static_CONFIG_SetGameControllerAxesModern_analogAxes;
    if (__cxx_range_array_0.length !== 4) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 4; ++__cxx_range_index_0) {
      __cxx_range_array_0[__cxx_range_index_0].apply();
    }
  }
}

// C/C++ source: source/duke3d/src/config.cpp:609
let __static_CONFIG_SetGameControllerDefaults_buttons = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, [11], {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 0, "function": i32(6)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 1, "function": i32(29)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 3, "function": i32(49)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 4, "function": i32(38)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 7, "function": i32(7)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 8, "function": i32(62)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 11, "function": i32(51)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 12, "function": i32(50)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 9, "function": i32(10)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 10, "function": i32(8)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 15, "function": i32(61)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype})]);
let __static_CONFIG_SetGameControllerDefaults_buttonsDuke = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, [3], {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 2, "function": i32(29)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 13, "function": i32(30)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 14, "function": i32(31)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype})]);
let __static_CONFIG_SetGameControllerDefaults_buttonsFury = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, [3], {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 2, "function": i32(48)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 13, "function": i32(35)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"button": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerButtonSetting", "size": 8, "union": false}, {"button": 14, "function": i32(34)}, null, {"GameControllerButtonSetting": () => GameControllerButtonSetting.prototype})]);
let __static_CONFIG_SetGameControllerDefaults_digitalAxes = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 8, "size": 4}, "polarity": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerDigitalAxisSetting", "size": 12, "union": false}, [2], {"GameControllerDigitalAxisSetting": () => GameControllerDigitalAxisSetting.prototype}, [cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 8, "size": 4}, "polarity": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerDigitalAxisSetting", "size": 12, "union": false}, {"axis": 4, "polarity": 1, "function": i32(9)}, null, {"GameControllerDigitalAxisSetting": () => GameControllerDigitalAxisSetting.prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"axis": {"native": "Int32Array", "offset": 0, "size": 4}, "function": {"native": "Int32Array", "offset": 8, "size": 4}, "polarity": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "GameControllerDigitalAxisSetting", "size": 12, "union": false}, {"axis": 5, "polarity": 1, "function": i32(5)}, null, {"GameControllerDigitalAxisSetting": () => GameControllerDigitalAxisSetting.prototype})]);
export function CONFIG_SetGameControllerDefaults() {
  CONFIG_SetGameControllerDefaultsClear();
  CONFIG_SetGameControllerAxesModern();




  {
    const __cxx_range_array_0 = __static_CONFIG_SetGameControllerDefaults_buttons;
    if (__cxx_range_array_0.length !== 11) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 11; ++__cxx_range_index_0) {
      __cxx_range_array_0[__cxx_range_index_0].apply();
    }
  }
  if (Boolean(i32((__cxx_global_cell_c0e288040dbf9a805036c27d().value & 128)))) {
    {
      const __cxx_range_array_1 = __static_CONFIG_SetGameControllerDefaults_buttonsFury;
      if (__cxx_range_array_1.length !== 3) throw new RangeError("C array extent mismatch");
      for (let __cxx_range_index_1 = 0; __cxx_range_index_1 < 3; ++__cxx_range_index_1) {
        __cxx_range_array_1[__cxx_range_index_1].apply();
      }
    }
  } else {
    {
      const __cxx_range_array_2 = __static_CONFIG_SetGameControllerDefaults_buttonsDuke;
      if (__cxx_range_array_2.length !== 3) throw new RangeError("C array extent mismatch");
      for (let __cxx_range_index_2 = 0; __cxx_range_index_2 < 3; ++__cxx_range_index_2) {
        __cxx_range_array_2[__cxx_range_index_2].apply();
      }
    }
  }
  {
    const __cxx_range_array_3 = __static_CONFIG_SetGameControllerDefaults_digitalAxes;
    if (__cxx_range_array_3.length !== 2) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_3 = 0; __cxx_range_index_3 < 2; ++__cxx_range_index_3) {
      __cxx_range_array_3[__cxx_range_index_3].apply();
    }
  }
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAimAssist = i32(1));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickAimWeight = i32(4));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickViewCentering = i32(4));
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.controllerRumble = i32(1));
}

// C/C++ source: source/duke3d/src/config.cpp:672
export function CONFIG_SetGameControllerDefaultsClear() {
  for (let i = i32(0); (i < i32((32 + 4))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    CONFIG_SetJoystickButtonFunction(i, 0, (-1));
    CONFIG_SetJoystickButtonFunction(i, 1, (-1));
  }
  for (let i = i32(0); (i < 9); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    CONFIG_SetJoystickAnalogAxisSensitivity(i, Math.fround(5));
    CONFIG_SetJoystickAnalogAxisInvert(i, 0);
    CONFIG_SetJoystickAnalogAxisDeadSaturate(i, 1000, 9500);
    CONFIG_SetJoystickDigitalAxisFunction(i, 0, (-1));
    CONFIG_SetJoystickDigitalAxisFunction(i, 1, (-1));
    CONFIG_SetJoystickAnalogAxisFunction(i, (-1));
  }
}

// C/C++ source: source/duke3d/src/config.cpp:823
const __cxx_literal_64155563b67f69f9f895 = Uint8Array.from([46, 0]);
const __cxx_literal_3b7485d0cc592c904292 = Uint8Array.from([101, 100, 117, 107, 101, 51, 50, 46, 99, 102, 103, 0]);
const __cxx_literal_a0b50d73409f61968e50 = Uint8Array.from([115, 101, 116, 116, 105, 110, 103, 115, 46, 99, 102, 103, 0]);
const __cxx_literal_99bab4103240410990f8 = Uint8Array.from([37, 115, 95, 115, 101, 116, 116, 105, 110, 103, 115, 46, 99, 102, 103, 0]);
export function CONFIG_ReadSettings() {
  let dummy = null;
  const __cxx_lvalue_0 = cRef(() => dummy, __cxx_lvalue_1 => { dummy = __cxx_lvalue_1; });
  let setupFileName = xstrdup__header_a474e7e95220(g_setupFileName);
  let p = Bstrtoken(setupFileName, __cxx_literal_64155563b67f69f9f895, __cxx_lvalue_0, 1);
  if (((!p) || (!Boolean(strcmp(g_setupFileName, __cxx_literal_3b7485d0cc592c904292))))) {
    sprintf(tempbuf, __cxx_literal_a0b50d73409f61968e50);
  } else {
    sprintf(tempbuf, __cxx_literal_99bab4103240410990f8, p);
  }
  xfree__header_70b65f06af72(setupFileName);
  OSD_Exec(tempbuf);
  (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.setupread = i32(2));
  return;
}

// C/C++ source: source/duke3d/src/config.cpp:843
const __cxx_literal_5740759b6cb87d617beb = Uint8Array.from([101, 100, 117, 107, 101, 51, 50, 46, 99, 102, 103, 0]);
const __cxx_literal_88fda106d676592fddc4 = Uint8Array.from([115, 101, 116, 116, 105, 110, 103, 115, 46, 99, 102, 103, 0]);
const __cxx_literal_23ef15139465fb2bf674 = Uint8Array.from([37, 115, 95, 115, 101, 116, 116, 105, 110, 103, 115, 46, 99, 102, 103, 0]);
const __cxx_literal_3dc420aa74d0e2a5b946 = Uint8Array.from([46, 0]);
const __cxx_literal_c5c3597c726ea35d0a9c = Uint8Array.from([119, 98, 0]);
const __cxx_literal_a125a850f357cebd2401 = Uint8Array.from([47, 47, 32, 116, 104, 105, 115, 32, 102, 105, 108, 101, 32, 105, 115, 32, 97, 117, 116, 111, 109, 97, 116, 105, 99, 97, 108, 108, 121, 32, 103, 101, 110, 101, 114, 97, 116, 101, 100, 32, 98, 121, 32, 0]);
const __cxx_literal_548fe11c285dd29ed6c9 = Uint8Array.from([10, 117, 110, 98, 105, 110, 100, 97, 108, 108, 10, 0]);
const __cxx_literal_0ff1ce6bf7d620805620 = Uint8Array.from([98, 105, 110, 100, 32, 34, 0]);
const __cxx_literal_c65e575e5a79afd9fee8 = Uint8Array.from([34, 32, 34, 0]);
const __cxx_literal_5220ffcdfefb313bf94b = Uint8Array.from([34, 32, 110, 111, 114, 101, 112, 101, 97, 116, 32, 34, 0]);
const __cxx_literal_ef97b450183ce8a5de52 = Uint8Array.from([34, 10, 0]);
const __cxx_literal_46b461284b04472b2e38 = Uint8Array.from([117, 110, 98, 111, 117, 110, 100, 32, 0]);
const __cxx_literal_782048bcc88051fdbc8d = Uint8Array.from([10, 0]);
const __cxx_literal_b1462a2c065d743a6c52 = Uint8Array.from([99, 114, 111, 115, 115, 104, 97, 105, 114, 99, 111, 108, 111, 114, 32, 0]);
const __cxx_literal_569842ded19c2b0446e7 = Uint8Array.from([37, 100, 32, 37, 100, 32, 37, 100, 10, 0]);
const __cxx_literal_e698a23e349d6a319e87 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 111, 110, 102, 105, 103, 46, 99, 112, 112, 0]);
const __cxx_literal_4902269992dcb8f4ee17 = Uint8Array.from([87, 114, 111, 116, 101, 32, 37, 115, 0]);
const __cxx_literal_1770b2c74faa9f9bed60 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 99, 111, 110, 102, 105, 103, 46, 99, 112, 112, 0]);
const __cxx_literal_1dfc874837e8ca1cdde1 = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 119, 114, 105, 116, 101, 32, 37, 115, 58, 32, 37, 115, 46, 0]);
export function CONFIG_WriteSettings() {
  if ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.setupread != 2)) {
    return;
  }
  let dummy = null;
  const __cxx_lvalue_0 = cRef(() => dummy, __cxx_lvalue_1 => { dummy = __cxx_lvalue_1; });
  let filename = cZeroAggregate({"array": "Uint8Array", "dims": [256]});
  if ((!Boolean(strcmp(g_setupFileName, __cxx_literal_5740759b6cb87d617beb)))) {
    sprintf(filename, __cxx_literal_88fda106d676592fddc4);
  } else {
    sprintf(filename, __cxx_literal_23ef15139465fb2bf674, Bstrtoken(g_setupFileName, __cxx_literal_3dc420aa74d0e2a5b946, __cxx_lvalue_0, 1));
  }
  let fp = fopen(filename, __cxx_literal_c5c3597c726ea35d0a9c);
  if (fp) {
    buildvfs_fputstr__header_894d7acf3b1c(fp, __cxx_literal_a125a850f357cebd2401);
    buildvfs_fputstrptr__header_5c75b54544b7(fp, __cxx_global_cell_7ad9490ab779b926bf483166().value);
    buildvfs_fputstr__header_829d08dc3ee2(fp, __cxx_literal_548fe11c285dd29ed6c9);
    for (let i = i32(0); (i < i32((256 + 10))); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      if (Boolean(CONTROL_KeyIsBound__header_e56aea27d40b(i))) {
        buildvfs_fputstr__header_245ff0c09c38(fp, __cxx_literal_0ff1ce6bf7d620805620);
        buildvfs_fputstrptr__header_5c75b54544b7(fp, (cPointerElementRef(cRecordPointer(CONTROL_KeyBinds, {"align": 8, "arrayAlign": 1, "fields": {"cmdstr": {"offset": 8, "pointer": true, "size": 8}, "key": {"offset": 0, "pointer": true, "size": 8}, "laststate": {"native": "Uint8Array", "offset": 17, "size": 1}, "repeat": {"native": "Uint8Array", "offset": 16, "size": 1}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).key);
        if (Boolean((cPointerElementRef(cRecordPointer(CONTROL_KeyBinds, {"align": 8, "arrayAlign": 1, "fields": {"cmdstr": {"offset": 8, "pointer": true, "size": 8}, "key": {"offset": 0, "pointer": true, "size": 8}, "laststate": {"native": "Uint8Array", "offset": 17, "size": 1}, "repeat": {"native": "Uint8Array", "offset": 16, "size": 1}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).repeat)) {
          buildvfs_fputstr__header_854d92be64d5(fp, __cxx_literal_c65e575e5a79afd9fee8);
        } else {
          buildvfs_fputstr__header_ddca9f6a708d(fp, __cxx_literal_5220ffcdfefb313bf94b);
        }
        buildvfs_fputstrptr__header_5c75b54544b7(fp, (cPointerElementRef(cRecordPointer(CONTROL_KeyBinds, {"align": 8, "arrayAlign": 1, "fields": {"cmdstr": {"offset": 8, "pointer": true, "size": 8}, "key": {"offset": 0, "pointer": true, "size": 8}, "laststate": {"native": "Uint8Array", "offset": 17, "size": 1}, "repeat": {"native": "Uint8Array", "offset": 16, "size": 1}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).cmdstr);
        buildvfs_fputstr__header_ca7e133a7c30(fp, __cxx_literal_ef97b450183ce8a5de52);
      }
    }
    for (let i = i32(0); (i < i32(63)); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
      let name = CONFIG_FunctionNumToName(i);
      if (((name && (i32((cDeref(cPointerOffset(name, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != i32(0))) && ((i32((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, i).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 255) || (!Boolean((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, i).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))) {
        buildvfs_fputstr__header_32b646f8ccdd(fp, __cxx_literal_46b461284b04472b2e38);
        buildvfs_fputstrptr__header_5c75b54544b7(fp, name);
        buildvfs_fputstr__header_1f5473693100(fp, __cxx_literal_782048bcc88051fdbc8d);
      }
    }
    OSD_WriteAliases(fp);
    if (((__cxx_global_cell_b9224c19fd76cc2e0a63ab16().value != (-1)) && (__cxx_global_cell_b9224c19fd76cc2e0a63ab16().value != i32((i32((i32(__cxx_global_cell_c7221fd6ffce6a41cc43a6f8().value.r) + i32((i32(__cxx_global_cell_c7221fd6ffce6a41cc43a6f8().value.g) << 8)))) + i32((i32(__cxx_global_cell_c7221fd6ffce6a41cc43a6f8().value.b) << 16))))))) {
      buildvfs_fputstr__header_a319820a732b(fp, __cxx_literal_b1462a2c065d743a6c52);
      let buf = cZeroAggregate({"array": "Uint8Array", "dims": [64]});
      snprintf(buf, 64, __cxx_literal_569842ded19c2b0446e7, i32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.r), i32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.g), i32(__cxx_global_cell_d16777dd8cd77fdf0c735c4c().value.b));
      buildvfs_fputstrptr__header_5c75b54544b7(fp, buf);
    }
    OSD_WriteCvars(fp);
    fclose(fp);
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_e698a23e349d6a319e87, u32(903), __cxx_literal_4902269992dcb8f4ee17, filename));
    return;
  }
  ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_1770b2c74faa9f9bed60, u32(908), __cxx_literal_1dfc874837e8ca1cdde1, filename, strerror((cDeref(__errno_location(), Int32Array).value))));
}

// C/C++ source: source/duke3d/src/config.cpp:1048
export function CONFIG_GetGameFuncOnKeyboard(gameFunc) {
  let string0 = KB_ScanCodeToString((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, gameFunc).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value));
  return ((i32((cDeref(cPointerOffset(string0, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(0)) ? KB_ScanCodeToString((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.KeyboardKeys, gameFunc).value), 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) : string0);
}

// C/C++ source: source/duke3d/src/config.cpp:1067
const __cxx_literal_fcbfea96d5c4599f68b3 = Uint8Array.from([0]);
export function CONFIG_GetGameFuncOnMouse(gameFunc) {
  for (let j = i32(0); (j < 2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    for (let i = i32(0); (i < 10); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      if (((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.MouseFunctions, i).value), j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == gameFunc)) {
        return (cPointerElementRef((cPointerElementRef(mbtn_to_name, i).value), j).value);
      }
    }
  }
  return __cxx_literal_fcbfea96d5c4599f68b3;
}

// C/C++ source: source/duke3d/src/config.cpp:1077
const __cxx_literal_768ae075235969c6b9c7 = Uint8Array.from([0]);
export function CONFIG_GetGameFuncOnJoystick(gameFunc) {
  for (let j = i32(0); (j < 2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    for (let i = i32(0); (i < __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      if (((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickFunctions, i).value), j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == gameFunc)) {
        return joyGetName(1, i);
      }
    }
  }
  for (let i = i32(0); (i < __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    for (let j = i32(0); (j < 2); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return next; })(cRef(() => j, __cxx_lvalue_7 => { j = __cxx_lvalue_7; }))) {
      if (((cDeref(cPointerOffset((cPointerElementRef(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.JoystickDigitalFunctions, i).value), j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) == gameFunc)) {
        return joyGetName(0, i);
      }
    }
  }
  return __cxx_literal_768ae075235969c6b9c7;
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
const __cxx_literal_35f62b2e987c7e6e122b = Uint8Array.from([77, 68, 52, 95, 37, 48, 56, 120, 37, 48, 56, 120, 37, 48, 56, 120, 37, 48, 56, 120, 0]);
export function CONFIG_GetMD4EntryName(m, md4) {
  sprintf(m, __cxx_literal_35f62b2e987c7e6e122b, B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 0, Uint8Array.BYTES_PER_ELEMENT))), B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 4, Uint8Array.BYTES_PER_ELEMENT))), B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 8, Uint8Array.BYTES_PER_ELEMENT))), B_SWAP32__header_306703534b37(B_UNBUF32__header_345da132edac(cPointerOffset(md4, 12, Uint8Array.BYTES_PER_ELEMENT))));
}

// C/C++ source: source/duke3d/src/config.cpp:1115
const __cxx_literal_25e297526593db850739 = Uint8Array.from([77, 97, 112, 84, 105, 109, 101, 115, 0]);
const __cxx_literal_b80863f5aac07ce9c4fa = Uint8Array.from([77, 97, 112, 84, 105, 109, 101, 115, 0]);
export function CONFIG_GetMapBestTime(mapname, mapmd4) {
  if (((!Boolean(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.setupread)) || (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle < 0))) {
    return i32((-1));
  }
  let m = cZeroAggregate({"array": "Uint8Array", "dims": [37]});
  CONFIG_GetMD4EntryName(m, mapmd4);
  let t = i32((-1));
  const __cxx_lvalue_0 = cRef(() => t, __cxx_lvalue_1 => { t = i32(__cxx_lvalue_1); });
  if (Boolean(SCRIPT_GetNumber(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_25e297526593db850739, m, __cxx_lvalue_0))) {
    let m2 = cZeroAggregate({"array": "Uint8Array", "dims": [256]});
    let p = CONFIG_GetMapEntryName(m2, mapname);
    SCRIPT_GetNumber(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_b80863f5aac07ce9c4fa, p, __cxx_lvalue_0);
  }
  return i32(t);
}

// C/C++ source: source/duke3d/src/config.cpp:1137
const __cxx_literal_d6c6199ea6519eb94611 = Uint8Array.from([77, 97, 112, 84, 105, 109, 101, 115, 0]);
export function CONFIG_SetMapBestTime(mapmd4, tm) {
  if (((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle < 0) && ((__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle = i32(SCRIPT_Init(g_setupFileName))) < 0))) {
    return i32((-1));
  }
  let m = cZeroAggregate({"array": "Uint8Array", "dims": [37]});
  CONFIG_GetMD4EntryName(m, mapmd4);
  SCRIPT_PutNumber(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.scripthandle, __cxx_literal_d6c6199ea6519eb94611, m, tm, 0, 0);
  return i32(0);
}

export function ARRAY_SIZE__header_4bd4efb10165(arg0) {
  return u64(10n);
}

export function ARRAY_SIZE__header_624fefad79ed(arg0) {
  return u64(63n);
}

// C/C++ source: source/mact/include/control.h:231
export function CONTROL_KeyIsBound__header_e56aea27d40b(key) {
  let bind = (cPointerElementRef(cRecordPointer(CONTROL_KeyBinds, {"align": 8, "arrayAlign": 1, "fields": {"cmdstr": {"offset": 8, "pointer": true, "size": 8}, "key": {"offset": 0, "pointer": true, "size": 8}, "laststate": {"native": "Uint8Array", "offset": 17, "size": 1}, "repeat": {"native": "Uint8Array", "offset": 16, "size": 1}}, "overlaps": false, "size": 24, "union": false}, {}), key).value);
  return i32((bind.cmdstr && bind.key));
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
