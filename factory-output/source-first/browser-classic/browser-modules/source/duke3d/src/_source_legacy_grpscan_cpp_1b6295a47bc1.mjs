// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/grpscan.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Bcrc32 } from "../../build/src/crc32.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { close } from "../../../browser-abi/libc_provider.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { fclose } from "../../../browser-abi/libc_provider.mjs";
import { findfrompath } from "../../build/src/vfs.cpp.mjs";
import { fopen } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_57be1c803b4f67589d421f5a } from "./grpscan.cpp.mjs";
import { fprintf } from "../../../browser-abi/libc_provider.mjs";
import { fstat } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { getatoken } from "../../build/src/common.cpp.mjs";
import { __cxx_private_cell_02fb52639d513d6a4f2de69e } from "./grpscan.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { initgroupfile } from "../../build/src/vfs.cpp.mjs";
import { klistfree } from "../../build/src/vfs.cpp.mjs";
import { klistpath } from "../../build/src/vfs.cpp.mjs";
import { krename } from "../../build/src/vfs.cpp.mjs";
import { __cxx_global_cell_3cc3e74cc237b178311ec8e2 } from "./grpscan.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { openfrompath } from "../../build/src/vfs.cpp.mjs";
import { read } from "../../../browser-abi/libc_provider.mjs";
import { scriptfile_addsymbolvalue } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_clearsymbols } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_close } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_eof } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_fromfile } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getbraces } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getnumber } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getstring } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getsymbol } from "../../build/src/scriptfile.cpp.mjs";
import { stat } from "../../../browser-abi/libc_provider.mjs";
import { strcmp } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_9ebf8c3d8dd35ce201f9e893 } from "./grpscan.cpp.mjs";

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
// C/C++ source: source/duke3d/src/grpscan.cpp:41
export const internalgrpfiles = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, [33], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 0]), "crcval": i32(3150564932), "size": 26524524, "game": 1, "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 32, 40, 83, 111, 117, 116, 104, 32, 75, 111, 114, 101, 97, 110, 32, 67, 101, 110, 115, 111, 114, 101, 100, 41, 0]), "crcval": i32(2857331264), "size": 26385383, "game": 1, "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 58, 32, 65, 116, 111, 109, 105, 99, 32, 69, 100, 105, 116, 105, 111, 110, 0]), "crcval": i32(4248686577), "size": 44356548, "game": 1, "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 58, 32, 65, 116, 111, 109, 105, 99, 32, 69, 100, 105, 116, 105, 111, 110, 32, 40, 87, 84, 41, 0]), "crcval": i32(2552954442), "size": 44356548, "game": 1, "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 58, 32, 80, 108, 117, 116, 111, 110, 105, 117, 109, 32, 80, 97, 107, 0]), "crcval": i32(4111771308), "size": 44348015, "game": 1, "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 32, 83, 104, 97, 114, 101, 119, 97, 114, 101, 32, 48, 46, 57, 57, 0]), "crcval": i32(49383680), "size": 9690241, "game": i32((1 | 96)), "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 32, 83, 104, 97, 114, 101, 119, 97, 114, 101, 32, 49, 46, 48, 0]), "crcval": i32(2726995337), "size": 10429258, "game": i32((1 | 32)), "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 32, 83, 104, 97, 114, 101, 119, 97, 114, 101, 32, 49, 46, 49, 0]), "crcval": i32(2435718797), "size": 10442980, "game": i32((1 | 32)), "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 32, 83, 104, 97, 114, 101, 119, 97, 114, 101, 32, 49, 46, 51, 68, 0]), "crcval": i32(2553993507), "size": 11035779, "game": i32((1 | 32)), "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 32, 77, 97, 99, 32, 68, 101, 109, 111, 0]), "crcval": i32(3321304417), "size": 10444391, "game": i32((1 | 32)), "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 32, 51, 68, 32, 77, 97, 99, 85, 115, 101, 114, 32, 68, 101, 109, 111, 0]), "crcval": i32(1939955431), "size": 10628573, "game": i32((1 | 32)), "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 105, 116, 32, 111, 117, 116, 32, 105, 110, 32, 68, 46, 67, 46, 32, 40, 49, 46, 51, 68, 41, 0]), "crcval": i32(2837717336), "size": 7926624, "game": i32((1 | 16)), "dependency": i32(3150564932), "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 105, 116, 32, 111, 117, 116, 32, 105, 110, 32, 68, 46, 67, 46, 0]), "crcval": i32(3080558975), "size": 8225517, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 105, 116, 32, 111, 117, 116, 32, 105, 110, 32, 68, 46, 67, 46, 0]), "crcval": i32(2832171226), "size": 8410183, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 105, 116, 32, 111, 117, 116, 32, 105, 110, 32, 68, 46, 67, 46, 0]), "crcval": i32(967217855), "size": 8410187, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([68, 85, 75, 69, 68, 67, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 105, 116, 32, 111, 117, 116, 32, 105, 110, 32, 68, 46, 67, 46, 0]), "crcval": i32(3325782667), "size": 8410149, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([68, 85, 75, 69, 68, 67, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 67, 97, 114, 105, 98, 98, 101, 97, 110, 58, 32, 76, 105, 102, 101, 39, 115, 32, 97, 32, 66, 101, 97, 99, 104, 32, 40, 49, 46, 51, 68, 41, 0]), "crcval": i32(1244511074), "size": 23559381, "game": i32((1 | 16)), "dependency": i32(3150564932), "scriptname": null, "postprocessing": process_vaca13}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 67, 97, 114, 105, 98, 98, 101, 97, 110, 58, 32, 76, 105, 102, 101, 39, 115, 32, 97, 32, 66, 101, 97, 99, 104, 32, 40, 80, 80, 97, 107, 41, 0]), "crcval": i32(793758958), "size": 22551333, "game": i32((1 | 16)), "dependency": i32(4111771308), "scriptname": null, "postprocessing": process_vacapp15}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 67, 97, 114, 105, 98, 98, 101, 97, 110, 58, 32, 76, 105, 102, 101, 39, 115, 32, 97, 32, 66, 101, 97, 99, 104, 0]), "crcval": i32(3056288509), "size": 22521880, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": null, "postprocessing": process_vacapp15}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 67, 97, 114, 105, 98, 98, 101, 97, 110, 58, 32, 76, 105, 102, 101, 39, 115, 32, 97, 32, 66, 101, 97, 99, 104, 0]), "crcval": i32(418389083), "size": 22213819, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 67, 97, 114, 105, 98, 98, 101, 97, 110, 58, 32, 76, 105, 102, 101, 39, 115, 32, 97, 32, 66, 101, 97, 99, 104, 0]), "crcval": i32(1706423952), "size": 22397273, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([86, 65, 67, 65, 84, 73, 79, 78, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 67, 97, 114, 105, 98, 98, 101, 97, 110, 58, 32, 76, 105, 102, 101, 39, 115, 32, 97, 32, 66, 101, 97, 99, 104, 0]), "crcval": i32(1691296593), "size": 22213795, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([86, 65, 67, 65, 84, 73, 79, 78, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 58, 32, 78, 117, 99, 108, 101, 97, 114, 32, 87, 105, 110, 116, 101, 114, 0]), "crcval": i32(4056606948), "size": 16169365, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([78, 87, 73, 78, 84, 69, 82, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 58, 32, 78, 117, 99, 108, 101, 97, 114, 32, 87, 105, 110, 116, 101, 114, 32, 68, 101, 109, 111, 0]), "crcval": i32(3354378153), "size": 10965909, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([78, 87, 73, 78, 84, 69, 82, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 33, 90, 79, 78, 69, 32, 73, 73, 32, 40, 49, 46, 51, 68, 41, 0]), "crcval": i32(2193732735), "size": 26135388, "game": i32((1 | 16)), "dependency": i32(3150564932), "scriptname": Uint8Array.from([68, 90, 45, 71, 65, 77, 69, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 33, 90, 79, 78, 69, 32, 73, 73, 0]), "crcval": i32(2142638460), "size": 44100411, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([68, 90, 45, 71, 65, 77, 69, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 33, 90, 79, 78, 69, 32, 73, 73, 0]), "crcval": i32(513087217), "size": 3186656, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([68, 90, 45, 71, 65, 77, 69, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 39, 115, 32, 80, 101, 110, 116, 104, 111, 117, 115, 101, 32, 80, 97, 114, 97, 100, 105, 115, 101, 0]), "crcval": i32(2094541371), "size": 2112419, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([112, 112, 97, 107, 103, 97, 109, 101, 46, 99, 111, 110, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([68, 117, 107, 101, 32, 78, 117, 107, 101, 109, 39, 115, 32, 80, 101, 110, 116, 104, 111, 117, 115, 101, 32, 80, 97, 114, 97, 100, 105, 115, 101, 0]), "crcval": i32(3482487384), "size": 4247491, "game": i32((1 | 16)), "dependency": i32(4248686577), "scriptname": Uint8Array.from([80, 80, 65, 75, 71, 65, 77, 69, 46, 67, 79, 78, 0]), "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([78, 65, 77, 0]), "crcval": i32(1975644283), "size": 43448927, "game": 2, "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([78, 65, 80, 65, 76, 77, 0]), "crcval": i32(1038178458), "size": 44365728, "game": i32((2 | 4)), "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([87, 87, 73, 73, 32, 71, 73, 0]), "crcval": i32(2424013503), "size": 77939508, "game": 8, "dependency": 0, "scriptname": null, "postprocessing": null}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, cStaticInitializerValues({"name": Uint8Array.from([80, 108, 97, 116, 111, 111, 110, 32, 76, 101, 97, 100, 101, 114, 0]), "crcval": i32(3522006028), "size": 37852572, "game": i32((8 | 16)), "dependency": i32(2424013503), "scriptname": Uint8Array.from([80, 76, 65, 84, 79, 79, 78, 76, 46, 68, 69, 70, 0]), "postprocessing": null}), null, {})]));
function __cxx_static_address_12fceff0ef433bec159b2149() {
  return __cxx_static_address_12fceff0ef433bec159b2149.reference || (__cxx_static_address_12fceff0ef433bec159b2149.reference = {
    __cReference: true,
    get value() { return internalgrpfiles; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/grpscan.cpp:82
const __cxx_literal_1cd7dd52afad5db6856c = Uint8Array.from([71, 65, 77, 69, 70, 76, 65, 71, 95, 68, 85, 75, 69, 0]);
const __cxx_literal_7ee0bd43430f163cdc43 = Uint8Array.from([71, 65, 77, 69, 70, 76, 65, 71, 95, 65, 68, 68, 79, 78, 0]);
const __cxx_literal_de34598d936a7a00a5c8 = Uint8Array.from([71, 65, 77, 69, 70, 76, 65, 71, 95, 78, 65, 77, 0]);
const __cxx_literal_607b86d32bb9a0eef470 = Uint8Array.from([71, 65, 77, 69, 70, 76, 65, 71, 95, 78, 65, 80, 65, 76, 77, 0]);
const __cxx_literal_da207b72f20055045846 = Uint8Array.from([71, 65, 77, 69, 70, 76, 65, 71, 95, 87, 87, 50, 71, 73, 0]);
const __cxx_literal_47eb9220e4fbbd683da3 = Uint8Array.from([68, 85, 75, 69, 87, 84, 95, 67, 82, 67, 0]);
const __cxx_literal_c2dd8cd9fee9904be831 = Uint8Array.from([68, 85, 75, 69, 49, 53, 95, 67, 82, 67, 0]);
const __cxx_literal_bcfbda9f52b33f3e4481 = Uint8Array.from([68, 85, 75, 69, 80, 80, 95, 67, 82, 67, 0]);
const __cxx_literal_866a6284cf58e3b138b9 = Uint8Array.from([68, 85, 75, 69, 49, 51, 95, 67, 82, 67, 0]);
const __cxx_literal_34f5d106bb00c9e16096 = Uint8Array.from([68, 85, 75, 69, 68, 67, 49, 51, 95, 67, 82, 67, 0]);
const __cxx_literal_ea5a6252734c97a1b4be = Uint8Array.from([68, 85, 75, 69, 68, 67, 80, 80, 95, 67, 82, 67, 0]);
const __cxx_literal_d4457eed1ae83b0aaebd = Uint8Array.from([68, 85, 75, 69, 68, 67, 95, 67, 82, 67, 0]);
const __cxx_literal_86e49d27dd6ea0a6ea29 = Uint8Array.from([86, 65, 67, 65, 49, 51, 95, 67, 82, 67, 0]);
const __cxx_literal_8d89789646a517622eb9 = Uint8Array.from([86, 65, 67, 65, 80, 80, 95, 67, 82, 67, 0]);
const __cxx_literal_0804efec36acada10b29 = Uint8Array.from([86, 65, 67, 65, 49, 53, 95, 67, 82, 67, 0]);
const __cxx_literal_e7e9b5f16588568c9fc8 = Uint8Array.from([68, 85, 75, 69, 67, 66, 95, 67, 82, 67, 0]);
const __cxx_literal_13d26e367f35131f5bac = Uint8Array.from([68, 85, 75, 69, 78, 87, 95, 67, 82, 67, 0]);
const __cxx_literal_b0f34a3c45f840b68c60 = Uint8Array.from([68, 90, 50, 95, 49, 51, 95, 67, 82, 67, 0]);
const __cxx_literal_c6d781b70f50174f1f0c = Uint8Array.from([68, 90, 50, 95, 80, 80, 95, 67, 82, 67, 0]);
const __cxx_literal_98bd095fa507f92d3647 = Uint8Array.from([78, 65, 77, 95, 67, 82, 67, 0]);
const __cxx_literal_163b4b8bc8889396c6bc = Uint8Array.from([78, 65, 80, 65, 76, 77, 95, 67, 82, 67, 0]);
const __cxx_literal_f87745535cd0061dbd2f = Uint8Array.from([87, 87, 50, 71, 73, 95, 67, 82, 67, 0]);
const __cxx_literal_91505a4f717800dc167a = Uint8Array.from([103, 114, 112, 105, 110, 102, 111, 0]);
let __static_LoadList_profiletokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [1], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_91505a4f717800dc167a, "tokenid": i32(0)}, null, {})]);
const __cxx_literal_207574a6f669b85a0cf3 = Uint8Array.from([110, 97, 109, 101, 0]);
const __cxx_literal_5cf75567f6d8a64bdffd = Uint8Array.from([115, 99, 114, 105, 112, 116, 110, 97, 109, 101, 0]);
const __cxx_literal_21ecb590a4d73b9061bd = Uint8Array.from([100, 101, 102, 110, 97, 109, 101, 0]);
const __cxx_literal_a9a97e603468129bfa8a = Uint8Array.from([114, 116, 115, 110, 97, 109, 101, 0]);
const __cxx_literal_19739cf7b8227e4d534f = Uint8Array.from([99, 114, 99, 0]);
const __cxx_literal_689edbd1ddc57b8ceefa = Uint8Array.from([100, 101, 112, 101, 110, 100, 101, 110, 99, 121, 0]);
const __cxx_literal_cb5aad033ac5d72d5753 = Uint8Array.from([115, 105, 122, 101, 0]);
const __cxx_literal_acd88b0c0d2028a7a36e = Uint8Array.from([102, 108, 97, 103, 115, 0]);
let __static_LoadList_grpinfotokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [8], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_207574a6f669b85a0cf3, "tokenid": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_5cf75567f6d8a64bdffd, "tokenid": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_21ecb590a4d73b9061bd, "tokenid": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_a9a97e603468129bfa8a, "tokenid": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_19739cf7b8227e4d534f, "tokenid": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_689edbd1ddc57b8ceefa, "tokenid": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_cb5aad033ac5d72d5753, "tokenid": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_acd88b0c0d2028a7a36e, "tokenid": i32(7)}, null, {})]);
export function LoadList(filename) {
  let script = scriptfile_fromfile(filename);
  if ((!script)) {
    return;
  }
  scriptfile_addsymbolvalue(__cxx_literal_1cd7dd52afad5db6856c, 1);
  scriptfile_addsymbolvalue(__cxx_literal_7ee0bd43430f163cdc43, i32((1 | 16)));
  scriptfile_addsymbolvalue(__cxx_literal_de34598d936a7a00a5c8, 2);
  scriptfile_addsymbolvalue(__cxx_literal_607b86d32bb9a0eef470, i32((2 | 4)));
  scriptfile_addsymbolvalue(__cxx_literal_da207b72f20055045846, i32((2 | 8)));
  scriptfile_addsymbolvalue(__cxx_literal_47eb9220e4fbbd683da3, i32(2552954442));
  scriptfile_addsymbolvalue(__cxx_literal_c2dd8cd9fee9904be831, i32(4248686577));
  scriptfile_addsymbolvalue(__cxx_literal_bcfbda9f52b33f3e4481, i32(4111771308));
  scriptfile_addsymbolvalue(__cxx_literal_866a6284cf58e3b138b9, i32(3150564932));
  scriptfile_addsymbolvalue(__cxx_literal_34f5d106bb00c9e16096, i32(2837717336));
  scriptfile_addsymbolvalue(__cxx_literal_ea5a6252734c97a1b4be, i32(3080558975));
  scriptfile_addsymbolvalue(__cxx_literal_d4457eed1ae83b0aaebd, i32(2832171226));
  scriptfile_addsymbolvalue(__cxx_literal_86e49d27dd6ea0a6ea29, i32(1244511074));
  scriptfile_addsymbolvalue(__cxx_literal_8d89789646a517622eb9, i32(793758958));
  scriptfile_addsymbolvalue(__cxx_literal_0804efec36acada10b29, i32(3056288509));
  scriptfile_addsymbolvalue(__cxx_literal_e7e9b5f16588568c9fc8, i32(418389083));
  scriptfile_addsymbolvalue(__cxx_literal_13d26e367f35131f5bac, i32(4056606948));
  scriptfile_addsymbolvalue(__cxx_literal_b0f34a3c45f840b68c60, i32(2193732735));
  scriptfile_addsymbolvalue(__cxx_literal_c6d781b70f50174f1f0c, i32(2142638460));
  scriptfile_addsymbolvalue(__cxx_literal_98bd095fa507f92d3647, i32(1975644283));
  scriptfile_addsymbolvalue(__cxx_literal_163b4b8bc8889396c6bc, i32(1038178458));
  scriptfile_addsymbolvalue(__cxx_literal_f87745535cd0061dbd2f, i32(2424013503));
  while ((!Boolean(scriptfile_eof(script)))) {


    let token = i32(getatoken(script, __static_LoadList_profiletokens, i32(ARRAY_SIZE__header_c13a16ef3227(__static_LoadList_profiletokens))));
    switch (token) {
      case i32(0): {
        let gsize = i32(0);
        const __cxx_lvalue_0 = cRef(() => gsize, __cxx_lvalue_9 => { gsize = i32(__cxx_lvalue_9); });
        let gcrcval = i32(0);
        const __cxx_lvalue_1 = cRef(() => gcrcval, __cxx_lvalue_10 => { gcrcval = i32(__cxx_lvalue_10); });
        let gflags = i32(1);
        const __cxx_lvalue_2 = cRef(() => gflags, __cxx_lvalue_11 => { gflags = i32(__cxx_lvalue_11); });
        let gdepcrc = i32(4248686577);
        const __cxx_lvalue_3 = cRef(() => gdepcrc, __cxx_lvalue_12 => { gdepcrc = i32(__cxx_lvalue_12); });
        let gname = null;
        const __cxx_lvalue_4 = cRef(() => gname, __cxx_lvalue_13 => { gname = __cxx_lvalue_13; });
        let gscript = null;
        const __cxx_lvalue_5 = cRef(() => gscript, __cxx_lvalue_14 => { gscript = __cxx_lvalue_14; });
        let gdef = null;
        const __cxx_lvalue_6 = cRef(() => gdef, __cxx_lvalue_15 => { gdef = __cxx_lvalue_15; });
        let grts = null;
        const __cxx_lvalue_7 = cRef(() => grts, __cxx_lvalue_16 => { grts = __cxx_lvalue_16; });
        let grpend = null;
        const __cxx_lvalue_8 = cRef(() => grpend, __cxx_lvalue_17 => { grpend = __cxx_lvalue_17; });

        if (Boolean(scriptfile_getbraces(script, __cxx_lvalue_8))) {
          break;
        }
        while (cPointerCompare(cRecordObject(cRecordPointer(script, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, grpend, "<")) {
          let token = i32(getatoken(script, __static_LoadList_grpinfotokens, i32(ARRAY_SIZE__header_75c07013efc9(__static_LoadList_grpinfotokens))));
          switch (token) {
            case i32(1): {
              scriptfile_getstring(script, __cxx_lvalue_4);
            }
            break;
            case i32(5): {
              scriptfile_getstring(script, __cxx_lvalue_5);
            }
            break;
            case i32(6): {
              scriptfile_getstring(script, __cxx_lvalue_6);
            }
            break;
            case i32(8): {
              scriptfile_getstring(script, __cxx_lvalue_7);
            }
            break;
            case i32(7): {
              scriptfile_getsymbol(script, __cxx_lvalue_2);
            }
            (gflags = i32((gflags & 2047)));
            break;
            case i32(4): {
              scriptfile_getsymbol(script, __cxx_lvalue_3);
            }
            break;
            case i32(2): {
              scriptfile_getsymbol(script, __cxx_lvalue_1);
            }
            break;
            case i32(3): {
              scriptfile_getnumber(script, __cxx_lvalue_0);
            }
            break;
            default: {
              break;
            }
          }
          let fg = cRecordPointer(xcalloc__header_f56cc3cbe1e9(u64(1), 64), {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {});
          (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).next = __cxx_global_cell_3cc3e74cc237b178311ec8e2().value);
          (__cxx_global_cell_3cc3e74cc237b178311ec8e2().value = fg);
          if (gname) {
            (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).name = xstrdup__header_494316c42119(gname));
          }
          (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).size = i32(gsize));
          (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).crcval = i32(gcrcval));
          (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).dependency = i32(gdepcrc));
          (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).game = i32(gflags));
          if (gscript) {
            (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).scriptname = dup_filename__header_c6f914529149(gscript));
          }
          if (gdef) {
            (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).defname = dup_filename__header_c6f914529149(gdef));
          }
          if (grts) {
            (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).rtsname = dup_filename__header_c6f914529149(grts));
          }
        }
        break;
      }
      default: {
        break;
      }
    }
  }
  scriptfile_close(script);
  scriptfile_clearsymbols();
}

// C/C++ source: source/duke3d/src/grpscan.cpp:219
let __static_LoadGameList_base = (() => { const bytes = new Uint8Array(2); bytes.set([47]); return bytes; })();
const __cxx_literal_ac5aa1c09021720941ab = Uint8Array.from([42, 46, 103, 114, 112, 105, 110, 102, 111, 0]);
export function LoadGameList() {
  for (let i = u64(0); (i < ARRAY_SIZE__header_20ca03f8871f(internalgrpfiles)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    let fg = cRecordPointer(xcalloc__header_f56cc3cbe1e9(u64(1), 64), {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {});
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).name = xstrdup__header_494316c42119((cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).name));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).crcval = i32((cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).crcval));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).size = i32((cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).size));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).game = i32((cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).game));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).dependency = i32((cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).dependency));
    if ((cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).scriptname) {
      (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).scriptname = dup_filename__header_c6f914529149((cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).scriptname));
    }
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).postprocessing = (cPointerElementRef(cRecordPointer(internalgrpfiles, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "postprocessing": {"offset": 32, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 40, "union": false}, {}), i).value).postprocessing);
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).next = __cxx_global_cell_3cc3e74cc237b178311ec8e2().value);
    (__cxx_global_cell_3cc3e74cc237b178311ec8e2().value = fg);
  }

  let srch = klistpath(__static_LoadGameList_base, __cxx_literal_ac5aa1c09021720941ab, i32(1));
  for (let sidx = srch; sidx; (sidx = cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next)) {
    LoadList(cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name);
  }
  klistfree(srch);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:255
export function FreeGameList() {
  while (__cxx_global_cell_3cc3e74cc237b178311ec8e2().value) {
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(__cxx_global_cell_3cc3e74cc237b178311ec8e2().value, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).name);
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(__cxx_global_cell_3cc3e74cc237b178311ec8e2().value, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).scriptname);
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(__cxx_global_cell_3cc3e74cc237b178311ec8e2().value, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).defname);
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(__cxx_global_cell_3cc3e74cc237b178311ec8e2().value, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).rtsname);
    let fg = cRecordObject(cRecordPointer(__cxx_global_cell_3cc3e74cc237b178311ec8e2().value, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).next;
    xfree__header_14dfd5b92158(__cxx_global_cell_3cc3e74cc237b178311ec8e2().value);
    (__cxx_global_cell_3cc3e74cc237b178311ec8e2().value = fg);
  }
}

// C/C++ source: source/duke3d/src/grpscan.cpp:282
const __cxx_literal_7b5c4245bbac26e57cfb = Uint8Array.from([103, 114, 112, 102, 105, 108, 101, 115, 46, 99, 97, 99, 104, 101, 0]);
export function LoadGroupsCache() {
  let fg;
  let fsize;
  const __cxx_lvalue_0 = cRef(() => fsize, __cxx_lvalue_4 => { fsize = i32(__cxx_lvalue_4); });
  let fmtime;
  const __cxx_lvalue_1 = cRef(() => fmtime, __cxx_lvalue_5 => { fmtime = i32(__cxx_lvalue_5); });
  let fcrcval;
  const __cxx_lvalue_2 = cRef(() => fcrcval, __cxx_lvalue_6 => { fcrcval = i32(__cxx_lvalue_6); });
  let fname;
  const __cxx_lvalue_3 = cRef(() => fname, __cxx_lvalue_7 => { fname = __cxx_lvalue_7; });
  let script;
  (script = scriptfile_fromfile(__cxx_literal_7b5c4245bbac26e57cfb));
  if ((!script)) {
    return i32((-1));
  }
  while ((!Boolean(scriptfile_eof(script)))) {
    if (Boolean(scriptfile_getstring(script, __cxx_lvalue_3))) {
      break;
    }
    if (Boolean(scriptfile_getnumber(script, __cxx_lvalue_0))) {
      break;
    }
    if (Boolean(scriptfile_getnumber(script, __cxx_lvalue_1))) {
      break;
    }
    if (Boolean(scriptfile_getnumber(script, __cxx_lvalue_2))) {
      break;
    }
    (fg = cRecordPointer(xcalloc__header_f56cc3cbe1e9(u64(1), 280), {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {}));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).next = __cxx_private_cell_02fb52639d513d6a4f2de69e().value);
    (__cxx_private_cell_02fb52639d513d6a4f2de69e().value = fg);
    Bstrncpyz__header_784ccb518823(cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).name, fname, u64(256));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).size = i32(fsize));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).mtime = i32(fmtime));
    (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).crcval = i32(fcrcval));
  }
  scriptfile_close(script);
  return i32(0);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:315
export function FreeGroupsCache() {
  while (__cxx_private_cell_02fb52639d513d6a4f2de69e().value) {
    let fg = cRecordObject(cRecordPointer(__cxx_private_cell_02fb52639d513d6a4f2de69e().value, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).next;
    xfree__header_14dfd5b92158(__cxx_private_cell_02fb52639d513d6a4f2de69e().value);
    (__cxx_private_cell_02fb52639d513d6a4f2de69e().value = fg);
  }
}

// C/C++ source: source/duke3d/src/grpscan.cpp:325
export function RemoveGroup(igrp) {
  for (let prev = null, grp = __cxx_global_cell_57be1c803b4f67589d421f5a().value; grp; (grp = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next)) {
    if (cPointerCompare(grp, igrp, "==")) {
      if (cPointerCompare(grp, __cxx_global_cell_57be1c803b4f67589d421f5a().value, "==")) {
        (__cxx_global_cell_57be1c803b4f67589d421f5a().value = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next);
      } else {
        (cRecordObject(cRecordPointer(prev, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next);
      }
      xfree__header_14dfd5b92158(cTypedPointer(cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).filename, Uint8Array));
      xfree__header_14dfd5b92158(grp);
      return;
    }
    (prev = grp);
  }
}

// C/C++ source: source/duke3d/src/grpscan.cpp:346
export function FindGroup(crcval) {
  let grp;
  for ((grp = __cxx_global_cell_57be1c803b4f67589d421f5a().value); grp; (grp = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next)) {
    if ((cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).type, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).crcval == crcval)) {
      return grp;
    }
  }
  return null;
}

// C/C++ source: source/duke3d/src/grpscan.cpp:360
export function FindGrpInfo(crcval, size) {
  let grpinfo;
  for ((grpinfo = __cxx_global_cell_3cc3e74cc237b178311ec8e2().value); grpinfo; (grpinfo = cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).next)) {
    if (((cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).crcval == crcval) && (cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).size == size))) {
      return grpinfo;
    }
  }
  return null;
}

// C/C++ source: source/duke3d/src/grpscan.cpp:373
let __static_ProcessGroups_ReadSize = i32(65536);
const __cxx_literal_296bdd9cba94d87d22e8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 114, 112, 115, 99, 97, 110, 46, 99, 112, 112, 0]);
const __cxx_literal_09ce1e8566a33ef9cb3e = Uint8Array.from([32, 37, 115, 32, 104, 97, 115, 32, 99, 104, 101, 99, 107, 115, 117, 109, 32, 48, 120, 37, 48, 56, 120, 0]);
export function ProcessGroups(srch, maxsize) {
  let sidx;
  let fg;
  let fgg;
  let fn;
  const __cxx_lvalue_0 = cRef(() => fn, __cxx_lvalue_1 => { fn = __cxx_lvalue_1; });
  let st = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"__glibc_reserved": {"length": 3, "native": "BigInt64Array", "offset": 120, "size": 24}, "__pad0": {"native": "Int32Array", "offset": 36, "size": 4}, "st_atim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 72}, "st_blksize": {"native": "BigInt64Array", "offset": 56, "size": 8}, "st_blocks": {"native": "BigInt64Array", "offset": 64, "size": 8}, "st_ctim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 104}, "st_dev": {"native": "BigUint64Array", "offset": 0, "size": 8}, "st_gid": {"native": "Uint32Array", "offset": 32, "size": 4}, "st_ino": {"native": "BigUint64Array", "offset": 8, "size": 8}, "st_mode": {"native": "Uint32Array", "offset": 24, "size": 4}, "st_mtim": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"tv_nsec": {"native": "BigInt64Array", "offset": 8, "size": 8}, "tv_sec": {"native": "BigInt64Array", "offset": 0, "size": 8}}, "overlaps": false, "size": 16, "union": false}, "offset": 88}, "st_nlink": {"native": "BigUint64Array", "offset": 16, "size": 8}, "st_rdev": {"native": "BigUint64Array", "offset": 40, "size": 8}, "st_size": {"native": "BigInt64Array", "offset": 48, "size": 8}, "st_uid": {"native": "Uint32Array", "offset": 28, "size": 4}}, "overlaps": false, "size": 144, "union": false}}, {});

  let buf = cTypedPointer(xmalloc__header_7ea3db72425d(u64(__static_ProcessGroups_ReadSize)), Uint8Array);
  for ((sidx = srch); sidx; (sidx = cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).next)) {
    for ((fg = __cxx_private_cell_02fb52639d513d6a4f2de69e().value); fg; (fg = cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).next)) {
      if ((!Boolean(strcmp(cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).name, cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name)))) {
        break;
      }
    }
    if (fg) {
      if (Boolean(findfrompath(cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name, __cxx_lvalue_0))) {
        continue;
      }
      if (Boolean(stat(fn, st))) {
        xfree__header_14dfd5b92158(fn);
        continue;
      }
      xfree__header_14dfd5b92158(fn);
      if (((Boolean(st.st_size) && (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).size == i32(st.st_size))) && (cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).mtime == i32(st.st_mtim.tv_sec)))) {
        let grptype = FindGrpInfo(cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).crcval, cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).size);
        if (grptype) {
          let grp = cRecordPointer(xcalloc__header_f56cc3cbe1e9(u64(1), 24), {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {});
          (cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).filename = xstrdup__header_494316c42119(cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name));
          (cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).type = grptype);
          (cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next = __cxx_global_cell_57be1c803b4f67589d421f5a().value);
          (__cxx_global_cell_57be1c803b4f67589d421f5a().value = grp);
        }
        (fgg = cRecordPointer(xcalloc__header_f56cc3cbe1e9(u64(1), 280), {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {}));
        strcpy(cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).name, cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).name);
        (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).size = i32(cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).size));
        (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).mtime = i32(cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).mtime));
        (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).crcval = i32(cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).crcval));
        (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).next = __cxx_private_cell_9ebf8c3d8dd35ce201f9e893().value);
        (__cxx_private_cell_9ebf8c3d8dd35ce201f9e893().value = fgg);
        continue;
      }
    }
    {
      let b;
      let fh;
      let crcval = i32(0);
      (fh = i32(openfrompath(cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name, i32((0 | 0)), 256)));
      if ((fh < 0)) {
        continue;
      }
      if (Boolean(fstat(fh, st))) {
        continue;
      }
      if (((!Boolean(st.st_size)) || (st.st_size > maxsize))) {
        continue;
      }
      do {
        SILENCE_UNUSED__header_daec83bbd7f8(" Checksumming %s...", cObjectFieldRef(cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})), "name"));
      } while (Boolean(0));
      do {
        (b = i32(read(fh, buf, u64(__static_ProcessGroups_ReadSize))));
        if ((b > 0)) {
          (crcval = i32(Bcrc32(cTypedPointer(buf, Uint8Array), b, u32(crcval))));
        }
      } while ((b == __static_ProcessGroups_ReadSize));
      close(fh);
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_296bdd9cba94d87d22e8, u32(442), __cxx_literal_09ce1e8566a33ef9cb3e, cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name, crcval));
      let grptype = FindGrpInfo(crcval, i32(st.st_size));
      if (grptype) {
        let grp = cRecordPointer(xcalloc__header_f56cc3cbe1e9(u64(1), 24), {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {});
        (cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).filename = xstrdup__header_494316c42119(cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name));
        (cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).type = grptype);
        (cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next = __cxx_global_cell_57be1c803b4f67589d421f5a().value);
        (__cxx_global_cell_57be1c803b4f67589d421f5a().value = grp);
      }
      (fgg = cRecordPointer(xcalloc__header_f56cc3cbe1e9(u64(1), 280), {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {}));
      Bstrncpyz__header_784ccb518823(cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).name, cRecordObject(cRecordPointer(sidx, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "prev": {"offset": 24, "pointer": true, "size": 8}, "source": {"native": "Int32Array", "offset": 12, "size": 4}, "type": {"native": "Int32Array", "offset": 8, "size": 4}, "usera": {"offset": 32, "pointer": true, "size": 8}, "userb": {"offset": 40, "pointer": true, "size": 8}}, "overlaps": false, "size": 48, "union": false}, {})).name, u64(256));
      (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).size = i32(st.st_size));
      (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).mtime = i32(st.st_mtim.tv_sec));
      (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).crcval = i32(crcval));
      (cRecordObject(cRecordPointer(fgg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).next = __cxx_private_cell_9ebf8c3d8dd35ce201f9e893().value);
      (__cxx_private_cell_9ebf8c3d8dd35ce201f9e893().value = fgg);
    }
  }
  xfree__header_14dfd5b92158(buf);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:469
const __cxx_literal_8df9780f26f688bb1e0f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 114, 112, 115, 99, 97, 110, 46, 99, 112, 112, 0]);
const __cxx_literal_5550130e419e9273145b = Uint8Array.from([83, 101, 97, 114, 99, 104, 105, 110, 103, 32, 102, 111, 114, 32, 103, 97, 109, 101, 32, 100, 97, 116, 97, 46, 46, 46, 0]);
let __static_ScanGroups_extensions = cPointerArray(4, () => [Uint8Array.from([42, 46, 103, 114, 112, 0]), Uint8Array.from([42, 46, 115, 115, 105, 0]), Uint8Array.from([42, 46, 100, 97, 116, 0]), Uint8Array.from([42, 46, 122, 105, 112, 0])]);
const __cxx_literal_ef32fffab5f1a406f1dc = Uint8Array.from([47, 0]);
const __cxx_literal_b0e32e26322cb24bfe3a = Uint8Array.from([103, 114, 112, 102, 105, 108, 101, 115, 46, 99, 97, 99, 104, 101, 0]);
const __cxx_literal_ec1d1876ec78694a1468 = Uint8Array.from([119, 98, 0]);
const __cxx_literal_9bb4a500278fb28370f3 = Uint8Array.from([34, 37, 115, 34, 32, 37, 100, 32, 37, 100, 32, 37, 100, 10, 0]);
const __cxx_literal_5216499d659edc0bb6d0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 114, 112, 115, 99, 97, 110, 46, 99, 112, 112, 0]);
const __cxx_literal_28917deaaf22a0a53c2c = Uint8Array.from([70, 111, 117, 110, 100, 32, 110, 111, 32, 114, 101, 99, 111, 103, 110, 105, 122, 101, 100, 32, 103, 97, 109, 101, 32, 100, 97, 116, 97, 33, 0]);
export function ScanGroups() {
  let fg;
  let fgg;
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_8df9780f26f688bb1e0f, u32(474), __cxx_literal_5550130e419e9273145b));
  LoadGameList();
  LoadGroupsCache();
  let maxsize = i64(0);
  for (let grpinfo = __cxx_global_cell_3cc3e74cc237b178311ec8e2().value; grpinfo; (grpinfo = cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).next)) {
    if ((maxsize < i64(cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).size))) {
      (maxsize = i64(cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).size));
    }
  }

  {
    const __cxx_range_array_0 = __static_ScanGroups_extensions;
    if (__cxx_range_array_0.length !== 4) throw new RangeError("C array extent mismatch");
    if (!__cxx_range_array_0[Symbol.for("source-first.clang-pointer-array/1")]) throw new TypeError("C pointer array storage ABI missing");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 4; ++__cxx_range_index_0) {
      let extension = __cxx_range_array_0[__cxx_range_index_0];
      let srch = klistpath(__cxx_literal_ef32fffab5f1a406f1dc, extension, i32(1));
      ProcessGroups(srch, maxsize);
      klistfree(srch);
    }
  }
  FreeGroupsCache();
  for (let grp = __cxx_global_cell_57be1c803b4f67589d421f5a().value; grp; ) {
    if (Boolean(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).type, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).dependency)) {
      if (cPointerCompare(FindGroup(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).type, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).dependency), null, "==")) {
        RemoveGroup(grp);
        (grp = __cxx_global_cell_57be1c803b4f67589d421f5a().value);
        continue;
      }
    }
    (grp = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next);
  }
  if (__cxx_private_cell_9ebf8c3d8dd35ce201f9e893().value) {
    let fp = fopen(__cxx_literal_b0e32e26322cb24bfe3a, __cxx_literal_ec1d1876ec78694a1468);
    if (fp) {
      for ((fg = __cxx_private_cell_9ebf8c3d8dd35ce201f9e893().value); fg; (fg = fgg)) {
        (fgg = cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).next);
        fprintf(fp, __cxx_literal_9bb4a500278fb28370f3, cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).name, cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).size, cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).mtime, cRecordObject(cRecordPointer(fg, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 16, "size": 4}, "mtime": {"native": "Int32Array", "offset": 12, "size": 4}, "name": {"length": 256, "native": "Uint8Array", "offset": 20, "size": 256}, "next": {"offset": 0, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 280, "union": false}, {})).crcval);
        xfree__header_14dfd5b92158(fg);
      }
      fclose(fp);
    }
    return i32(0);
  }
  ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_5216499d659edc0bb6d0, u32(538), __cxx_literal_28917deaaf22a0a53c2c));
  return i32(0);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:545
export function FreeGroups() {
  while (__cxx_global_cell_57be1c803b4f67589d421f5a().value) {
    xfree__header_14dfd5b92158(cTypedPointer(cRecordObject(cRecordPointer(__cxx_global_cell_57be1c803b4f67589d421f5a().value, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).filename, Uint8Array));
    let fg = cRecordObject(cRecordPointer(__cxx_global_cell_57be1c803b4f67589d421f5a().value, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next;
    xfree__header_14dfd5b92158(__cxx_global_cell_57be1c803b4f67589d421f5a().value);
    (__cxx_global_cell_57be1c803b4f67589d421f5a().value = fg);
  }
  FreeGameList();
}

// C/C++ source: source/duke3d/src/grpscan.cpp:559
const __cxx_literal_4cd52453d52743c66c42 = Uint8Array.from([65, 68, 68, 82, 69, 69, 46, 86, 79, 67, 0]);
const __cxx_literal_115755c49cd8e8183612 = Uint8Array.from([66, 65, 76, 76, 66, 79, 79, 77, 46, 86, 79, 67, 0]);
const __cxx_literal_7b2745eae4919c4fdb93 = Uint8Array.from([66, 65, 82, 77, 85, 83, 73, 67, 46, 86, 79, 67, 0]);
const __cxx_literal_b5eb38123eab47537c82 = Uint8Array.from([66, 67, 72, 66, 65, 76, 76, 46, 86, 79, 67, 0]);
const __cxx_literal_3bd72693b4e1cb877ecb = Uint8Array.from([66, 79, 73, 78, 71, 46, 86, 79, 67, 0]);
const __cxx_literal_52c9d55f689a8d475563 = Uint8Array.from([67, 72, 65, 67, 72, 65, 46, 86, 79, 67, 0]);
const __cxx_literal_e0a4a5c6d3dadb93e1d8 = Uint8Array.from([67, 72, 65, 73, 78, 68, 82, 86, 46, 86, 79, 67, 0]);
const __cxx_literal_5a08912cf7a3b664ab53 = Uint8Array.from([67, 72, 69, 65, 80, 48, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_a1a2c2af144708dad752 = Uint8Array.from([67, 72, 69, 69, 82, 46, 86, 79, 67, 0]);
const __cxx_literal_74bce7418da02b096947 = Uint8Array.from([67, 72, 78, 83, 81, 82, 84, 46, 86, 79, 67, 0]);
const __cxx_literal_4634f3f80b5540650316 = Uint8Array.from([67, 79, 67, 79, 65, 78, 85, 84, 46, 86, 79, 67, 0]);
const __cxx_literal_1fb7059fc259f760169e = Uint8Array.from([67, 82, 85, 83, 72, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_2e291abe4a57b17cab52 = Uint8Array.from([68, 69, 70, 76, 65, 84, 69, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_cc7b2776de94feee5d51 = Uint8Array.from([68, 82, 65, 71, 72, 85, 82, 84, 46, 86, 79, 67, 0]);
const __cxx_literal_5d810673db6417a1d135 = Uint8Array.from([68, 82, 65, 71, 82, 79, 65, 77, 46, 86, 79, 67, 0]);
const __cxx_literal_90937236ba4ba95d561e = Uint8Array.from([68, 82, 65, 71, 83, 72, 79, 84, 46, 86, 79, 67, 0]);
const __cxx_literal_b0ee4130a01011dfe93c = Uint8Array.from([68, 85, 75, 69, 48, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_cbc8fbc90340b7c697d2 = Uint8Array.from([69, 76, 69, 86, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_d5d49ddccd138b086cc9 = Uint8Array.from([71, 77, 69, 79, 86, 82, 48, 53, 46, 86, 79, 67, 0]);
const __cxx_literal_571845e17ed2115f506d = Uint8Array.from([71, 85, 76, 76, 68, 73, 69, 46, 86, 79, 67, 0]);
const __cxx_literal_27b9970d0581fc6ec2cd = Uint8Array.from([71, 85, 76, 76, 72, 85, 82, 84, 46, 86, 79, 67, 0]);
const __cxx_literal_2c5a12502d7bb3bbb332 = Uint8Array.from([71, 85, 76, 76, 82, 79, 65, 77, 46, 86, 79, 67, 0]);
const __cxx_literal_c61e556aa53cc54deda4 = Uint8Array.from([71, 85, 76, 76, 83, 72, 73, 84, 46, 86, 79, 67, 0]);
const __cxx_literal_aaae0e3ad750bf8b6e01 = Uint8Array.from([72, 69, 76, 80, 48, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_aa236d90f94b11678585 = Uint8Array.from([73, 67, 69, 67, 79, 78, 67, 72, 46, 86, 79, 67, 0]);
const __cxx_literal_3d44d9498b37dec925d5 = Uint8Array.from([73, 68, 76, 69, 66, 79, 65, 84, 46, 86, 79, 67, 0]);
const __cxx_literal_63099d5ee78985049c88 = Uint8Array.from([75, 73, 67, 75, 72, 69, 65, 68, 46, 86, 79, 67, 0]);
const __cxx_literal_add807323bfd378e08c2 = Uint8Array.from([76, 65, 78, 73, 48, 53, 46, 86, 79, 67, 0]);
const __cxx_literal_accbf7e8c9a21735efdf = Uint8Array.from([76, 65, 78, 73, 48, 56, 46, 86, 79, 67, 0]);
const __cxx_literal_c030039121a0912cb5e2 = Uint8Array.from([76, 65, 78, 73, 68, 85, 75, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_6fa6387bbd2d79d7b1e1 = Uint8Array.from([77, 85, 83, 67, 76, 69, 48, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_17ac036d0b71f284ebe3 = Uint8Array.from([77, 85, 83, 67, 76, 69, 48, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_a218c05d356de4485dca = Uint8Array.from([77, 85, 90, 65, 75, 46, 86, 79, 67, 0]);
const __cxx_literal_2879ebbb02d2ce6e93c1 = Uint8Array.from([80, 73, 78, 69, 70, 65, 76, 76, 46, 86, 79, 67, 0]);
const __cxx_literal_22611c2a9f3bd2ea52df = Uint8Array.from([80, 79, 73, 78, 84, 48, 55, 46, 86, 79, 67, 0]);
const __cxx_literal_f7388a2761812a58e517 = Uint8Array.from([80, 79, 73, 78, 84, 48, 56, 46, 86, 79, 67, 0]);
const __cxx_literal_eb793288d35b43c43d02 = Uint8Array.from([82, 65, 68, 73, 79, 46, 86, 79, 67, 0]);
const __cxx_literal_39b69bc1b83bebb18b6a = Uint8Array.from([82, 85, 73, 78, 48, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_3f634b2520e3a79b1e23 = Uint8Array.from([83, 67, 82, 69, 65, 77, 46, 86, 79, 67, 0]);
const __cxx_literal_b66ef608eac20bb65ba4 = Uint8Array.from([83, 67, 82, 69, 65, 77, 48, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_dd470f426678f2940fef = Uint8Array.from([83, 67, 82, 69, 65, 77, 57, 46, 86, 79, 67, 0]);
const __cxx_literal_be9ac655fd502b7a57ed = Uint8Array.from([83, 72, 73, 80, 72, 79, 82, 78, 46, 86, 79, 67, 0]);
const __cxx_literal_98d533886896a77fb5be = Uint8Array.from([83, 78, 71, 76, 71, 85, 76, 76, 46, 86, 79, 67, 0]);
const __cxx_literal_6e621aaaaf162f762b0e = Uint8Array.from([83, 81, 82, 84, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_9de77848d031e3055e9b = Uint8Array.from([83, 81, 85, 73, 82, 84, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_34b2457c47dccbbfb56a = Uint8Array.from([83, 83, 67, 79, 79, 76, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_fd9bacb895489e2b5370 = Uint8Array.from([83, 83, 67, 79, 79, 76, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_fdb237acbab4433aba8f = Uint8Array.from([83, 83, 67, 79, 79, 76, 51, 46, 86, 79, 67, 0]);
const __cxx_literal_0b965bed499f3ce2c295 = Uint8Array.from([83, 83, 68, 73, 69, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_255779815c273a0ed6f4 = Uint8Array.from([83, 83, 68, 73, 69, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_757372f7aa4bbae3820d = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_ae4b00b9ca266e367e6f = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_ef254df2f0d6d22a430c = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 51, 46, 86, 79, 67, 0]);
const __cxx_literal_849ecd0f440753a51c3a = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_8620faeafdd0258edb0b = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 53, 46, 86, 79, 67, 0]);
const __cxx_literal_13e21488eba553d5fe00 = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 54, 46, 86, 79, 67, 0]);
const __cxx_literal_915790778f32986f3dfd = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 55, 46, 86, 79, 67, 0]);
const __cxx_literal_11fdf8e6477a0e9a0443 = Uint8Array.from([83, 83, 78, 79, 82, 77, 48, 56, 46, 86, 79, 67, 0]);
const __cxx_literal_f3ff4f5f81035a53cf93 = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 48, 46, 86, 79, 67, 0]);
const __cxx_literal_8058282e03d9ae8349be = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_77d556ad509a6954dc6c = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_04a059209c061db6f249 = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 51, 46, 86, 79, 67, 0]);
const __cxx_literal_beb59367bf629f915c23 = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_0568ceb347e020f283b6 = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 53, 46, 86, 79, 67, 0]);
const __cxx_literal_fbdacb2a7424f4af6607 = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 54, 46, 86, 79, 67, 0]);
const __cxx_literal_02c9ba7c392c682bedbe = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 55, 46, 86, 79, 67, 0]);
const __cxx_literal_40646d43792d53995fdd = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 56, 46, 86, 79, 67, 0]);
const __cxx_literal_5c1069740ee2ad727cf1 = Uint8Array.from([83, 83, 78, 79, 82, 77, 49, 57, 46, 86, 79, 67, 0]);
const __cxx_literal_70bb486e38270940a589 = Uint8Array.from([83, 83, 78, 79, 82, 77, 50, 48, 46, 86, 79, 67, 0]);
const __cxx_literal_bc82fdbe198d9582abf2 = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_568a32842aa82dc43d33 = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 50, 46, 86, 79, 67, 0]);
const __cxx_literal_8bec434398ad623001f4 = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 51, 46, 86, 79, 67, 0]);
const __cxx_literal_5da8f781288a89896e14 = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_d20641c5b3853769b90f = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 53, 46, 86, 79, 67, 0]);
const __cxx_literal_f0cbcb8c237e6ecf1dc7 = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 54, 46, 86, 79, 67, 0]);
const __cxx_literal_aab59745400b481c1c42 = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 55, 46, 86, 79, 67, 0]);
const __cxx_literal_a233812a9108344738a7 = Uint8Array.from([83, 83, 84, 65, 85, 78, 84, 56, 46, 86, 79, 67, 0]);
const __cxx_literal_6eab9f0ca57250d2e45f = Uint8Array.from([83, 85, 82, 70, 46, 86, 79, 67, 0]);
const __cxx_literal_8d96fd33d857ea79b01a = Uint8Array.from([84, 65, 78, 48, 49, 46, 86, 79, 67, 0]);
const __cxx_literal_9f8d9f486540c80ae87c = Uint8Array.from([84, 65, 78, 48, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_4c28abb698b858599879 = Uint8Array.from([86, 73, 78, 69, 83, 78, 65, 80, 46, 86, 79, 67, 0]);
const __cxx_literal_05776ffc06aed9802a05 = Uint8Array.from([86, 79, 79, 68, 82, 85, 77, 83, 46, 86, 79, 67, 0]);
const __cxx_literal_30dbe223e4d8bc8290a8 = Uint8Array.from([87, 73, 78, 68, 53, 52, 46, 86, 79, 67, 0]);
const __cxx_literal_d29dda8b41e830c97c2c = Uint8Array.from([68, 79, 79, 77, 83, 68, 65, 89, 46, 77, 73, 68, 0]);
const __cxx_literal_e0f1745a2acdbec56d46 = Uint8Array.from([68, 85, 75, 69, 45, 79, 46, 77, 73, 68, 0]);
const __cxx_literal_13f84811ed2ec0a6abbf = Uint8Array.from([73, 82, 73, 69, 80, 82, 84, 89, 46, 77, 73, 68, 0]);
const __cxx_literal_4f380f39b66b70ea6248 = Uint8Array.from([74, 85, 78, 71, 86, 69, 73, 78, 46, 77, 73, 68, 0]);
const __cxx_literal_849342e04b2d10437016 = Uint8Array.from([80, 82, 84, 89, 67, 82, 85, 90, 46, 77, 73, 68, 0]);
const __cxx_literal_1d2d27b44d9da79fb8b5 = Uint8Array.from([83, 79, 76, 45, 77, 65, 78, 49, 46, 77, 73, 68, 0]);
const __cxx_literal_c0435d5496f9108dada6 = Uint8Array.from([67, 73, 78, 69, 79, 86, 51, 46, 65, 78, 77, 0]);
const __cxx_literal_9852fa0919186d55d467 = Uint8Array.from([68, 85, 75, 69, 84, 69, 65, 77, 46, 65, 78, 77, 0]);
const __cxx_literal_b2f4d186abadef92e841 = Uint8Array.from([66, 69, 65, 67, 72, 66, 65, 66, 46, 67, 79, 78, 0]);
const __cxx_literal_d96a8bd8e2a795e5052b = Uint8Array.from([66, 69, 65, 67, 72, 66, 65, 76, 46, 67, 79, 78, 0]);
const __cxx_literal_8aa50eaacb6f31fe5152 = Uint8Array.from([66, 69, 65, 67, 72, 66, 84, 72, 46, 67, 79, 78, 0]);
const __cxx_literal_6d84f9f5b74d3dfcfab3 = Uint8Array.from([68, 69, 70, 83, 46, 67, 79, 78, 0]);
const __cxx_literal_28ec73aa77a2d20ba5af = Uint8Array.from([68, 82, 65, 71, 79, 78, 46, 67, 79, 78, 0]);
const __cxx_literal_0f45878690d5c583a2dd = Uint8Array.from([71, 65, 77, 69, 46, 67, 79, 78, 0]);
const __cxx_literal_ca83803dc7abae61939c = Uint8Array.from([83, 69, 65, 71, 85, 76, 76, 46, 67, 79, 78, 0]);
const __cxx_literal_a2717e024265f123a19c = Uint8Array.from([83, 79, 85, 78, 68, 83, 46, 67, 79, 78, 0]);
const __cxx_literal_31c42985ba79ee526e2b = Uint8Array.from([85, 83, 69, 82, 46, 67, 79, 78, 0]);
const __cxx_literal_1624d912a09902d3cb90 = Uint8Array.from([68, 69, 77, 79, 49, 46, 68, 77, 79, 0]);
const __cxx_literal_d7cd6e92d434638a585d = Uint8Array.from([68, 69, 77, 79, 50, 46, 68, 77, 79, 0]);
const __cxx_literal_b7a52859b691aadac7e7 = Uint8Array.from([68, 69, 77, 79, 51, 46, 68, 77, 79, 0]);
const __cxx_literal_8b749b7fd1aebdbfd306 = Uint8Array.from([86, 65, 67, 65, 49, 46, 77, 65, 80, 0]);
const __cxx_literal_a6d92bd6604e3bd29412 = Uint8Array.from([86, 65, 67, 65, 50, 46, 77, 65, 80, 0]);
const __cxx_literal_552d7fa757f461c56e10 = Uint8Array.from([86, 65, 67, 65, 51, 46, 77, 65, 80, 0]);
const __cxx_literal_14841037fceb67a3bbee = Uint8Array.from([86, 65, 67, 65, 52, 46, 77, 65, 80, 0]);
const __cxx_literal_d3d9c7bbde3ce874c950 = Uint8Array.from([86, 65, 67, 65, 53, 46, 77, 65, 80, 0]);
const __cxx_literal_4fa675cf2f4f94c459c4 = Uint8Array.from([86, 65, 67, 65, 54, 46, 77, 65, 80, 0]);
const __cxx_literal_4790d0cc448b1638ae5a = Uint8Array.from([86, 65, 67, 65, 55, 46, 77, 65, 80, 0]);
const __cxx_literal_3682b328bee628a56d26 = Uint8Array.from([86, 65, 67, 65, 68, 77, 49, 46, 77, 65, 80, 0]);
const __cxx_literal_eb14f2c39e4e2394fae3 = Uint8Array.from([86, 65, 67, 65, 68, 77, 50, 46, 77, 65, 80, 0]);
const __cxx_literal_09c45bf2ce1d43e36169 = Uint8Array.from([86, 65, 67, 65, 68, 77, 51, 46, 77, 65, 80, 0]);
const __cxx_literal_263aed7a5cda7f4b54c0 = Uint8Array.from([86, 65, 67, 65, 68, 77, 52, 46, 77, 65, 80, 0]);
const __cxx_literal_50960f0d9b47f72cba23 = Uint8Array.from([86, 65, 67, 65, 83, 76, 46, 77, 65, 80, 0]);
const __cxx_literal_e76608f38651e2bf4687 = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 48, 46, 65, 82, 84, 0]);
const __cxx_literal_271ca8a56c42d43557d9 = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 49, 46, 65, 82, 84, 0]);
const __cxx_literal_3713faee2328504ee44d = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 51, 46, 65, 82, 84, 0]);
const __cxx_literal_bd748d806ea9f1d3f65a = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 53, 46, 65, 82, 84, 0]);
const __cxx_literal_f80df144b00f5e98df3b = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 54, 46, 65, 82, 84, 0]);
const __cxx_literal_47b5d87ebd610764a0d6 = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 55, 46, 65, 82, 84, 0]);
const __cxx_literal_4d36f95b29a612269412 = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 56, 46, 65, 82, 84, 0]);
const __cxx_literal_df39d725b743ea23bf4a = Uint8Array.from([84, 73, 76, 69, 83, 48, 48, 57, 46, 65, 82, 84, 0]);
const __cxx_literal_d5ef226c37034d975d2b = Uint8Array.from([84, 73, 76, 69, 83, 48, 49, 48, 46, 65, 82, 84, 0]);
const __cxx_literal_e747372b6422f31ad81f = Uint8Array.from([84, 73, 76, 69, 83, 48, 49, 50, 46, 65, 82, 84, 0]);
const __cxx_literal_3e6f866c324602a9526b = Uint8Array.from([84, 73, 76, 69, 83, 48, 49, 52, 46, 65, 82, 84, 0]);
export function process_vaca13(crcval) {
  krename(crcval, 0, __cxx_literal_4cd52453d52743c66c42);
  krename(crcval, 1, __cxx_literal_115755c49cd8e8183612);
  krename(crcval, 2, __cxx_literal_7b2745eae4919c4fdb93);
  krename(crcval, 3, __cxx_literal_b5eb38123eab47537c82);
  krename(crcval, 4, __cxx_literal_3bd72693b4e1cb877ecb);
  krename(crcval, 5, __cxx_literal_52c9d55f689a8d475563);
  krename(crcval, 6, __cxx_literal_e0a4a5c6d3dadb93e1d8);
  krename(crcval, 7, __cxx_literal_5a08912cf7a3b664ab53);
  krename(crcval, 8, __cxx_literal_a1a2c2af144708dad752);
  krename(crcval, 9, __cxx_literal_74bce7418da02b096947);
  krename(crcval, 10, __cxx_literal_4634f3f80b5540650316);
  krename(crcval, 11, __cxx_literal_1fb7059fc259f760169e);
  krename(crcval, 12, __cxx_literal_2e291abe4a57b17cab52);
  krename(crcval, 13, __cxx_literal_cc7b2776de94feee5d51);
  krename(crcval, 14, __cxx_literal_5d810673db6417a1d135);
  krename(crcval, 15, __cxx_literal_90937236ba4ba95d561e);
  krename(crcval, 16, __cxx_literal_b0ee4130a01011dfe93c);
  krename(crcval, 17, __cxx_literal_cbc8fbc90340b7c697d2);
  krename(crcval, 18, __cxx_literal_d5d49ddccd138b086cc9);
  krename(crcval, 19, __cxx_literal_571845e17ed2115f506d);
  krename(crcval, 20, __cxx_literal_27b9970d0581fc6ec2cd);
  krename(crcval, 21, __cxx_literal_2c5a12502d7bb3bbb332);
  krename(crcval, 22, __cxx_literal_c61e556aa53cc54deda4);
  krename(crcval, 23, __cxx_literal_aaae0e3ad750bf8b6e01);
  krename(crcval, 24, __cxx_literal_aa236d90f94b11678585);
  krename(crcval, 25, __cxx_literal_3d44d9498b37dec925d5);
  krename(crcval, 26, __cxx_literal_63099d5ee78985049c88);
  krename(crcval, 27, __cxx_literal_add807323bfd378e08c2);
  krename(crcval, 28, __cxx_literal_accbf7e8c9a21735efdf);
  krename(crcval, 29, __cxx_literal_c030039121a0912cb5e2);
  krename(crcval, 30, __cxx_literal_6fa6387bbd2d79d7b1e1);
  krename(crcval, 31, __cxx_literal_17ac036d0b71f284ebe3);
  krename(crcval, 32, __cxx_literal_a218c05d356de4485dca);
  krename(crcval, 33, __cxx_literal_2879ebbb02d2ce6e93c1);
  krename(crcval, 34, __cxx_literal_22611c2a9f3bd2ea52df);
  krename(crcval, 35, __cxx_literal_f7388a2761812a58e517);
  krename(crcval, 36, __cxx_literal_eb793288d35b43c43d02);
  krename(crcval, 37, __cxx_literal_39b69bc1b83bebb18b6a);
  krename(crcval, 38, __cxx_literal_3f634b2520e3a79b1e23);
  krename(crcval, 39, __cxx_literal_b66ef608eac20bb65ba4);
  krename(crcval, 40, __cxx_literal_dd470f426678f2940fef);
  krename(crcval, 41, __cxx_literal_be9ac655fd502b7a57ed);
  krename(crcval, 42, __cxx_literal_98d533886896a77fb5be);
  krename(crcval, 43, __cxx_literal_6e621aaaaf162f762b0e);
  krename(crcval, 44, __cxx_literal_9de77848d031e3055e9b);
  krename(crcval, 45, __cxx_literal_34b2457c47dccbbfb56a);
  krename(crcval, 46, __cxx_literal_fd9bacb895489e2b5370);
  krename(crcval, 47, __cxx_literal_fdb237acbab4433aba8f);
  krename(crcval, 48, __cxx_literal_0b965bed499f3ce2c295);
  krename(crcval, 49, __cxx_literal_255779815c273a0ed6f4);
  krename(crcval, 50, __cxx_literal_757372f7aa4bbae3820d);
  krename(crcval, 51, __cxx_literal_ae4b00b9ca266e367e6f);
  krename(crcval, 52, __cxx_literal_ef254df2f0d6d22a430c);
  krename(crcval, 53, __cxx_literal_849ecd0f440753a51c3a);
  krename(crcval, 54, __cxx_literal_8620faeafdd0258edb0b);
  krename(crcval, 55, __cxx_literal_13e21488eba553d5fe00);
  krename(crcval, 56, __cxx_literal_915790778f32986f3dfd);
  krename(crcval, 57, __cxx_literal_11fdf8e6477a0e9a0443);
  krename(crcval, 58, __cxx_literal_f3ff4f5f81035a53cf93);
  krename(crcval, 59, __cxx_literal_8058282e03d9ae8349be);
  krename(crcval, 60, __cxx_literal_77d556ad509a6954dc6c);
  krename(crcval, 61, __cxx_literal_04a059209c061db6f249);
  krename(crcval, 62, __cxx_literal_beb59367bf629f915c23);
  krename(crcval, 63, __cxx_literal_0568ceb347e020f283b6);
  krename(crcval, 64, __cxx_literal_fbdacb2a7424f4af6607);
  krename(crcval, 65, __cxx_literal_02c9ba7c392c682bedbe);
  krename(crcval, 66, __cxx_literal_40646d43792d53995fdd);
  krename(crcval, 67, __cxx_literal_5c1069740ee2ad727cf1);
  krename(crcval, 68, __cxx_literal_70bb486e38270940a589);
  krename(crcval, 69, __cxx_literal_bc82fdbe198d9582abf2);
  krename(crcval, 70, __cxx_literal_568a32842aa82dc43d33);
  krename(crcval, 71, __cxx_literal_8bec434398ad623001f4);
  krename(crcval, 72, __cxx_literal_5da8f781288a89896e14);
  krename(crcval, 73, __cxx_literal_d20641c5b3853769b90f);
  krename(crcval, 74, __cxx_literal_f0cbcb8c237e6ecf1dc7);
  krename(crcval, 75, __cxx_literal_aab59745400b481c1c42);
  krename(crcval, 76, __cxx_literal_a233812a9108344738a7);
  krename(crcval, 77, __cxx_literal_6eab9f0ca57250d2e45f);
  krename(crcval, 78, __cxx_literal_8d96fd33d857ea79b01a);
  krename(crcval, 79, __cxx_literal_9f8d9f486540c80ae87c);
  krename(crcval, 80, __cxx_literal_4c28abb698b858599879);
  krename(crcval, 81, __cxx_literal_05776ffc06aed9802a05);
  krename(crcval, 82, __cxx_literal_30dbe223e4d8bc8290a8);
  krename(crcval, 83, __cxx_literal_d29dda8b41e830c97c2c);
  krename(crcval, 84, __cxx_literal_e0f1745a2acdbec56d46);
  krename(crcval, 85, __cxx_literal_13f84811ed2ec0a6abbf);
  krename(crcval, 86, __cxx_literal_4f380f39b66b70ea6248);
  krename(crcval, 87, __cxx_literal_849342e04b2d10437016);
  krename(crcval, 88, __cxx_literal_1d2d27b44d9da79fb8b5);
  krename(crcval, 90, __cxx_literal_c0435d5496f9108dada6);
  krename(crcval, 91, __cxx_literal_9852fa0919186d55d467);
  krename(crcval, 92, __cxx_literal_b2f4d186abadef92e841);
  krename(crcval, 93, __cxx_literal_d96a8bd8e2a795e5052b);
  krename(crcval, 94, __cxx_literal_8aa50eaacb6f31fe5152);
  krename(crcval, 95, __cxx_literal_6d84f9f5b74d3dfcfab3);
  krename(crcval, 96, __cxx_literal_28ec73aa77a2d20ba5af);
  krename(crcval, 97, __cxx_literal_0f45878690d5c583a2dd);
  krename(crcval, 98, __cxx_literal_ca83803dc7abae61939c);
  krename(crcval, 99, __cxx_literal_a2717e024265f123a19c);
  krename(crcval, 100, __cxx_literal_31c42985ba79ee526e2b);
  krename(crcval, 101, __cxx_literal_1624d912a09902d3cb90);
  krename(crcval, 102, __cxx_literal_d7cd6e92d434638a585d);
  krename(crcval, 103, __cxx_literal_b7a52859b691aadac7e7);
  krename(crcval, 104, __cxx_literal_8b749b7fd1aebdbfd306);
  krename(crcval, 105, __cxx_literal_a6d92bd6604e3bd29412);
  krename(crcval, 106, __cxx_literal_552d7fa757f461c56e10);
  krename(crcval, 107, __cxx_literal_14841037fceb67a3bbee);
  krename(crcval, 108, __cxx_literal_d3d9c7bbde3ce874c950);
  krename(crcval, 109, __cxx_literal_4fa675cf2f4f94c459c4);
  krename(crcval, 110, __cxx_literal_4790d0cc448b1638ae5a);
  krename(crcval, 111, __cxx_literal_3682b328bee628a56d26);
  krename(crcval, 112, __cxx_literal_eb14f2c39e4e2394fae3);
  krename(crcval, 113, __cxx_literal_09c45bf2ce1d43e36169);
  krename(crcval, 114, __cxx_literal_263aed7a5cda7f4b54c0);
  krename(crcval, 115, __cxx_literal_50960f0d9b47f72cba23);
  krename(crcval, 120, __cxx_literal_e76608f38651e2bf4687);
  krename(crcval, 121, __cxx_literal_271ca8a56c42d43557d9);
  krename(crcval, 122, __cxx_literal_3713faee2328504ee44d);
  krename(crcval, 123, __cxx_literal_bd748d806ea9f1d3f65a);
  krename(crcval, 124, __cxx_literal_f80df144b00f5e98df3b);
  krename(crcval, 125, __cxx_literal_47b5d87ebd610764a0d6);
  krename(crcval, 126, __cxx_literal_4d36f95b29a612269412);
  krename(crcval, 127, __cxx_literal_df39d725b743ea23bf4a);
  krename(crcval, 128, __cxx_literal_d5ef226c37034d975d2b);
  krename(crcval, 129, __cxx_literal_e747372b6422f31ad81f);
  krename(crcval, 130, __cxx_literal_3e6f866c324602a9526b);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:689
const __cxx_literal_54292b9def0217b2e735 = Uint8Array.from([68, 69, 70, 83, 46, 67, 79, 78, 0]);
const __cxx_literal_a4374ec4856783e8b28e = Uint8Array.from([71, 65, 77, 69, 46, 67, 79, 78, 0]);
const __cxx_literal_b5cafe3ce5e44cde0032 = Uint8Array.from([85, 83, 69, 82, 46, 67, 79, 78, 0]);
const __cxx_literal_bcfc90febfcc6be675bd = Uint8Array.from([68, 69, 77, 79, 49, 46, 68, 77, 79, 0]);
const __cxx_literal_63d2b82af229fd2f2078 = Uint8Array.from([68, 69, 77, 79, 50, 46, 68, 77, 79, 0]);
const __cxx_literal_ae7e302c85129d3bf283 = Uint8Array.from([68, 69, 77, 79, 51, 46, 68, 77, 79, 0]);
const __cxx_literal_39c44727168c6bd5783b = Uint8Array.from([86, 65, 67, 65, 84, 73, 79, 78, 46, 80, 82, 71, 0]);
export function process_vacapp15(crcval) {
  krename(crcval, 5, __cxx_literal_54292b9def0217b2e735);
  krename(crcval, 6, __cxx_literal_a4374ec4856783e8b28e);
  krename(crcval, 7, __cxx_literal_b5cafe3ce5e44cde0032);
  krename(crcval, 8, __cxx_literal_bcfc90febfcc6be675bd);
  krename(crcval, 9, __cxx_literal_63d2b82af229fd2f2078);
  krename(crcval, 10, __cxx_literal_ae7e302c85129d3bf283);
  initgroupfile(__cxx_literal_39c44727168c6bd5783b);
}

export function ARRAY_SIZE__header_c13a16ef3227(arg0) {
  return u64(1n);
}

export function ARRAY_SIZE__header_75c07013efc9(arg0) {
  return u64(8n);
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc__header_f56cc3cbe1e9(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup__header_494316c42119(s) {
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

// C/C++ source: source/build/include/common.h:76
export function dup_filename__header_c6f914529149(fn) {
  let buf = cTypedPointer(xmalloc__header_7ea3db72425d(u64(256)), Uint8Array);
  return Bstrncpyz__header_784ccb518823(buf, fn, u64(256));
}

export function ARRAY_SIZE__header_20ca03f8871f(arg0) {
  return u64(33n);
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_14dfd5b92158(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1235
export function Bstrncpyz__header_784ccb518823(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_7ea3db72425d(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function SILENCE_UNUSED__header_daec83bbd7f8(arg0, arg1) {

}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}
