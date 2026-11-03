// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/baselayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { OSD_RegisterCvar } from "./osd.cpp.mjs";
import { divtable64 } from "./pragmas.cpp.mjs";
import { __cxx_global_cell_5669eb8f22367bb78b701754 } from "./baselayer.cpp.mjs";
import { g_keyRemapTable } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_eb7ec64efb5dec6e758a65c7 } from "./engine.cpp.mjs";
import { __cxx_global_cell_92f6ec0c3a993b574f308abb } from "./engine.cpp.mjs";
import { __cxx_global_cell_a6f1e8c839618189cf2ebd7a } from "./engine.cpp.mjs";
import { __cxx_global_cell_f8287b2e627d0e3f51b90c55 } from "./pragmas.cpp.mjs";
import { libdivide_s64_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s64_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { __cxx_global_cell_2e953df8db08c3fc6f0c3e07 } from "./vfs.cpp.mjs";
import { __cxx_global_cell_4723a60d88a1aa0814b17967 } from "./engine.cpp.mjs";
import { __cxx_global_cell_7e42dba8ea8f9a8bc3318fdc } from "./engine.cpp.mjs";
import { osdcmd_cvar_set } from "./osd.cpp.mjs";
import { __cxx_global_cell_67da6fc124c3ab1d5da4a606 } from "./engine.cpp.mjs";
import { __cxx_global_cell_d33e7d272649317fa29cc706 } from "./engine.cpp.mjs";
import { __cxx_global_cell_9856254f6c33ff5182a27f76 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_839b6dd579d4126718a101c3 } from "./engine.cpp.mjs";
import { __cxx_global_cell_585083e70b316eace630e342 } from "./engine.cpp.mjs";
import { __cxx_global_cell_8afc3f1714c50fd848123c08 } from "./engine.cpp.mjs";
import { __cxx_global_cell_1719e7bd91d790092d913225 } from "./engine.cpp.mjs";
import { __cxx_global_cell_84c518e352f66f31d8eaf74c } from "./sdlayer.cpp.mjs";
import { screenshot_dir } from "./screenshot.cpp.mjs";
import { strcasecmp } from "../../../browser-abi/libc_provider.mjs";
import { timerGetNanoTickRate } from "./timer.cpp.mjs";
import { __cxx_global_cell_528ff86eb213577eb56b717e } from "./hightile.cpp.mjs";
import { __cxx_global_cell_77d5c24237b7b046074e378d } from "./engine.cpp.mjs";
import { videoSetPalette } from "./palette.cpp.mjs";

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
const floor = a => Math.floor(a);
const ceil = a => Math.ceil(a);

// C/C++ source: source/build/src/baselayer.cpp:775
const __cxx_literal_860ec2c071c08ff6b785 = Uint8Array.from([118, 105, 100, 95, 103, 97, 109, 109, 97, 0]);
const __cxx_literal_8c9a256a15231821f4c1 = Uint8Array.from([118, 105, 100, 95, 99, 111, 110, 116, 114, 97, 115, 116, 0]);
const __cxx_literal_c50326d5dde3a5247337 = Uint8Array.from([118, 105, 100, 95, 115, 97, 116, 117, 114, 97, 116, 105, 111, 110, 0]);
const __cxx_literal_b15669bf748a004568ba = Uint8Array.from([114, 95, 109, 97, 120, 102, 112, 115, 0]);
export function osdcmd_cvar_set_baselayer(parm) {
  let r = i32(osdcmd_cvar_set(parm));
  if ((r != 0)) {
    return i32(r);
  }
  if ((((!Boolean(strcasecmp(cRecordObject(cRecordPointer(parm, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 8, "pointer": true, "size": 8}, "numparms": {"native": "Int32Array", "offset": 0, "size": 4}, "parms": {"offset": 16, "pointer": true, "size": 8}, "raw": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name, __cxx_literal_860ec2c071c08ff6b785))) || (!Boolean(strcasecmp(cRecordObject(cRecordPointer(parm, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 8, "pointer": true, "size": 8}, "numparms": {"native": "Int32Array", "offset": 0, "size": 4}, "parms": {"offset": 16, "pointer": true, "size": 8}, "raw": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name, __cxx_literal_8c9a256a15231821f4c1)))) || (!Boolean(strcasecmp(cRecordObject(cRecordPointer(parm, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 8, "pointer": true, "size": 8}, "numparms": {"native": "Int32Array", "offset": 0, "size": 4}, "parms": {"offset": 16, "pointer": true, "size": 8}, "raw": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name, __cxx_literal_c50326d5dde3a5247337))))) {
    videoSetPalette((u32(i32((min__template_d0e4358054a560bb(max__template_9f711f2400ba566e(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(Math.fround((Math.fround((__cxx_global_cell_92f6ec0c3a993b574f308abb().value - Math.fround(1))) * Math.fround(10))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(0))), ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(15)))).value)) & 255), (u32(0) & 255), (u32(0) & 255));
    return i32(r);
  } else {
    if ((!Boolean(strcasecmp(cRecordObject(cRecordPointer(parm, {"align": 8, "arrayAlign": 1, "fields": {"name": {"offset": 8, "pointer": true, "size": 8}, "numparms": {"native": "Int32Array", "offset": 0, "size": 4}, "parms": {"offset": 16, "pointer": true, "size": 8}, "raw": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 32, "union": false}, {})).name, __cxx_literal_b15669bf748a004568ba)))) {
      if ((__cxx_global_cell_9856254f6c33ff5182a27f76().value > 0)) {
        (__cxx_global_cell_9856254f6c33ff5182a27f76().value = i32(clamp__header_1ecf5feb2977(__cxx_global_cell_9856254f6c33ff5182a27f76().value, 30, 1000)));
      }
      (__cxx_global_cell_5669eb8f22367bb78b701754().value = u64(calcFrameDelay__header_71d089a3b620(__cxx_global_cell_9856254f6c33ff5182a27f76().value)));
    }
  }
  return i32(r);
}

// C/C++ source: source/build/src/baselayer.cpp:794
const __cxx_literal_08a02ea8f261d491842a = Uint8Array.from([108, 122, 52, 99, 111, 109, 112, 114, 101, 115, 115, 105, 111, 110, 108, 101, 118, 101, 108, 0]);
const __cxx_literal_8ef2f28b124c38ff9771 = Uint8Array.from([97, 100, 106, 117, 115, 116, 32, 76, 90, 52, 32, 99, 111, 109, 112, 114, 101, 115, 115, 105, 111, 110, 32, 108, 101, 118, 101, 108, 32, 117, 115, 101, 100, 32, 102, 111, 114, 32, 115, 97, 118, 101, 103, 97, 109, 101, 115, 0]);
const __cxx_literal_dfc78d314befe352b6b3 = Uint8Array.from([114, 95, 98, 111, 114, 100, 101, 114, 108, 101, 115, 115, 0]);
const __cxx_literal_872fc40e350d9dc92d36 = Uint8Array.from([98, 111, 114, 100, 101, 114, 108, 101, 115, 115, 32, 119, 105, 110, 100, 111, 119, 101, 100, 32, 109, 111, 100, 101, 58, 32, 48, 58, 32, 110, 101, 118, 101, 114, 32, 32, 49, 58, 32, 97, 108, 119, 97, 121, 115, 32, 32, 50, 58, 32, 105, 102, 32, 114, 101, 115, 111, 108, 117, 116, 105, 111, 110, 32, 109, 97, 116, 99, 104, 101, 115, 32, 100, 101, 115, 107, 116, 111, 112, 0]);
const __cxx_literal_38ba07b6e4fd7b517c14 = Uint8Array.from([114, 95, 117, 115, 101, 110, 101, 119, 97, 115, 112, 101, 99, 116, 0]);
const __cxx_literal_c38225ebad87f0e89d82 = Uint8Array.from([101, 110, 97, 98, 108, 101, 47, 100, 105, 115, 97, 98, 108, 101, 32, 110, 101, 119, 32, 115, 99, 114, 101, 101, 110, 32, 97, 115, 112, 101, 99, 116, 32, 114, 97, 116, 105, 111, 32, 100, 101, 116, 101, 114, 109, 105, 110, 97, 116, 105, 111, 110, 32, 99, 111, 100, 101, 0]);
const __cxx_literal_eab58ca9309bc61858ae = Uint8Array.from([114, 95, 115, 99, 114, 101, 101, 110, 97, 115, 112, 101, 99, 116, 0]);
const __cxx_literal_f0a0b7753c843f70dada = Uint8Array.from([105, 102, 32, 117, 115, 105, 110, 103, 32, 114, 95, 117, 115, 101, 110, 101, 119, 97, 115, 112, 101, 99, 116, 32, 97, 110, 100, 32, 105, 110, 32, 102, 117, 108, 108, 115, 99, 114, 101, 101, 110, 44, 32, 115, 99, 114, 101, 101, 110, 32, 97, 115, 112, 101, 99, 116, 32, 114, 97, 116, 105, 111, 32, 105, 110, 32, 116, 104, 101, 32, 102, 111, 114, 109, 32, 88, 88, 89, 89, 44, 32, 101, 46, 103, 46, 32, 49, 54, 48, 57, 32, 102, 111, 114, 32, 49, 54, 58, 57, 0]);
const __cxx_literal_892771ef80ae821c371b = Uint8Array.from([114, 95, 102, 112, 103, 114, 111, 117, 115, 99, 97, 110, 0]);
const __cxx_literal_0e288a62a9cd8109c571 = Uint8Array.from([117, 115, 101, 32, 102, 108, 111, 97, 116, 105, 110, 103, 45, 112, 111, 105, 110, 116, 32, 110, 117, 109, 98, 101, 114, 115, 32, 102, 111, 114, 32, 115, 108, 111, 112, 101, 32, 114, 101, 110, 100, 101, 114, 105, 110, 103, 0]);
const __cxx_literal_c47569d4b026a5beb553 = Uint8Array.from([114, 95, 104, 105, 103, 104, 116, 105, 108, 101, 0]);
const __cxx_literal_819a544f41b56b2de6c7 = Uint8Array.from([101, 110, 97, 98, 108, 101, 47, 100, 105, 115, 97, 98, 108, 101, 32, 104, 105, 103, 104, 116, 105, 108, 101, 32, 116, 101, 120, 116, 117, 114, 101, 32, 114, 101, 110, 100, 101, 114, 105, 110, 103, 0]);
const __cxx_literal_2d5b54845a5776387bfc = Uint8Array.from([114, 95, 109, 97, 120, 115, 112, 114, 105, 116, 101, 115, 111, 110, 115, 99, 114, 101, 101, 110, 0]);
const __cxx_literal_1fc7f76f1a1a4a52f93a = Uint8Array.from([109, 97, 120, 105, 109, 117, 109, 32, 110, 117, 109, 98, 101, 114, 32, 111, 102, 32, 115, 112, 114, 105, 116, 101, 115, 32, 116, 111, 32, 100, 114, 97, 119, 32, 112, 101, 114, 32, 102, 114, 97, 109, 101, 0]);
const __cxx_literal_6a1e58a1c3a024dde8b8 = Uint8Array.from([114, 95, 110, 111, 118, 111, 120, 109, 105, 112, 115, 0]);
const __cxx_literal_862f53e5dd66ce30fa73 = Uint8Array.from([116, 117, 114, 110, 32, 111, 102, 102, 47, 111, 110, 32, 116, 104, 101, 32, 117, 115, 101, 32, 111, 102, 32, 109, 105, 112, 109, 97, 112, 115, 32, 119, 104, 101, 110, 32, 114, 101, 110, 100, 101, 114, 105, 110, 103, 32, 56, 45, 98, 105, 116, 32, 118, 111, 120, 101, 108, 115, 0]);
const __cxx_literal_3a1261bd35832a018c2c = Uint8Array.from([114, 95, 114, 111, 116, 97, 116, 101, 115, 112, 114, 105, 116, 101, 105, 110, 116, 101, 114, 112, 0]);
const __cxx_literal_da633468d842e34ee2d5 = Uint8Array.from([105, 110, 116, 101, 114, 112, 111, 108, 97, 116, 101, 32, 114, 101, 112, 101, 97, 116, 101, 100, 32, 114, 111, 116, 97, 116, 101, 115, 112, 114, 105, 116, 101, 32, 99, 97, 108, 108, 115, 0]);
const __cxx_literal_d24bd692b6c8e1a15435 = Uint8Array.from([114, 95, 118, 111, 120, 101, 108, 115, 0]);
const __cxx_literal_a7a15ccebac55eec426a = Uint8Array.from([101, 110, 97, 98, 108, 101, 47, 100, 105, 115, 97, 98, 108, 101, 32, 97, 117, 116, 111, 109, 97, 116, 105, 99, 32, 115, 112, 114, 105, 116, 101, 45, 62, 118, 111, 120, 101, 108, 32, 114, 101, 110, 100, 101, 114, 105, 110, 103, 0]);
const __cxx_literal_39c915d33eccea8e99c9 = Uint8Array.from([114, 95, 109, 97, 120, 102, 112, 115, 0]);
const __cxx_literal_10fcbe73d3e073bf0e7a = Uint8Array.from([108, 105, 109, 105, 116, 32, 116, 104, 101, 32, 102, 114, 97, 109, 101, 32, 114, 97, 116, 101, 0]);
const __cxx_literal_4ea9666bc0dbbc0e6f00 = Uint8Array.from([114, 95, 116, 114, 111, 114, 95, 110, 111, 109, 97, 115, 107, 112, 97, 115, 115, 0]);
const __cxx_literal_cbf0232536f984ba940b = Uint8Array.from([101, 110, 97, 98, 108, 101, 47, 100, 105, 115, 97, 98, 108, 101, 32, 97, 100, 100, 105, 116, 105, 111, 110, 97, 108, 32, 112, 97, 115, 115, 32, 105, 110, 32, 84, 82, 79, 82, 32, 115, 111, 102, 116, 119, 97, 114, 101, 32, 114, 101, 110, 100, 101, 114, 105, 110, 103, 0]);
const __cxx_literal_cf32775ee05d68d04046 = Uint8Array.from([118, 105, 100, 95, 103, 97, 109, 109, 97, 0]);
const __cxx_literal_0df4821be8e17190d4c2 = Uint8Array.from([103, 97, 109, 109, 97, 47, 98, 114, 105, 103, 104, 116, 110, 101, 115, 115, 32, 99, 111, 114, 114, 101, 99, 116, 105, 111, 110, 0]);
const __cxx_literal_d29fdf41de78acb29eb7 = Uint8Array.from([118, 105, 100, 95, 99, 111, 110, 116, 114, 97, 115, 116, 0]);
const __cxx_literal_fefd3776334840ca8de3 = Uint8Array.from([99, 111, 110, 116, 114, 97, 115, 116, 32, 99, 111, 114, 114, 101, 99, 116, 105, 111, 110, 0]);
const __cxx_literal_5c520c1f9e683b4b6314 = Uint8Array.from([118, 105, 100, 95, 115, 97, 116, 117, 114, 97, 116, 105, 111, 110, 0]);
const __cxx_literal_8ac1eb2de7bbd055f7b5 = Uint8Array.from([115, 97, 116, 117, 114, 97, 116, 105, 111, 110, 32, 99, 111, 114, 114, 101, 99, 116, 105, 111, 110, 0]);
const __cxx_literal_415107ff3be1e0a1a43e = Uint8Array.from([115, 99, 114, 101, 101, 110, 115, 104, 111, 116, 95, 100, 105, 114, 0]);
const __cxx_literal_eaea98123966ae175e87 = Uint8Array.from([83, 99, 114, 101, 101, 110, 115, 104, 111, 116, 32, 115, 97, 118, 101, 32, 112, 97, 116, 104, 0]);
let __static_baselayer_init_cvars_engine;
let __static_baselayer_init_cvars_engine__init = 0;
export function baselayer_init() {
  if (__static_baselayer_init_cvars_engine__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_baselayer_init_cvars_engine__init === 0) {
    __static_baselayer_init_cvars_engine__init = 1;
    try { __static_baselayer_init_cvars_engine = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, [16], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_08a02ea8f261d491842a, "desc": __cxx_literal_8ef2f28b124c38ff9771, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_2e953df8db08c3fc6f0c3e07()}, null, {}), "flags": u32(2), "min": 1, "max": 32}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_dfc78d314befe352b6b3, "desc": __cxx_literal_872fc40e350d9dc92d36, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_67da6fc124c3ab1d5da4a606()}, null, {}), "flags": u32(i32((i32(2) | i32(1024)))), "min": 0, "max": 2}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_38ba07b6e4fd7b517c14, "desc": __cxx_literal_c38225ebad87f0e89d82, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_1719e7bd91d790092d913225()}, null, {}), "flags": u32(8), "min": 0, "max": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_eab58ca9309bc61858ae, "desc": __cxx_literal_f0a0b7753c843f70dada, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_585083e70b316eace630e342()}, null, {}), "flags": u32(4), "min": 0, "max": 9999}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_892771ef80ae821c371b, "desc": __cxx_literal_0e288a62a9cd8109c571, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_d33e7d272649317fa29cc706()}, null, {}), "flags": u32(8), "min": 0, "max": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_c47569d4b026a5beb553, "desc": __cxx_literal_819a544f41b56b2de6c7, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_528ff86eb213577eb56b717e()}, null, {}), "flags": u32(8), "min": 0, "max": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_2d5b54845a5776387bfc, "desc": __cxx_literal_1fc7f76f1a1a4a52f93a, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_4723a60d88a1aa0814b17967()}, null, {}), "flags": u32(2), "min": 0, "max": 4096}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_6a1e58a1c3a024dde8b8, "desc": __cxx_literal_862f53e5dd66ce30fa73, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_7e42dba8ea8f9a8bc3318fdc()}, null, {}), "flags": u32(8), "min": 0, "max": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_3a1261bd35832a018c2c, "desc": __cxx_literal_da633468d842e34ee2d5, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_839b6dd579d4126718a101c3()}, null, {}), "flags": u32(8), "min": 0, "max": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_d24bd692b6c8e1a15435, "desc": __cxx_literal_a7a15ccebac55eec426a, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_77d5c24237b7b046074e378d()}, null, {}), "flags": u32(8), "min": 0, "max": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_39c915d33eccea8e99c9, "desc": __cxx_literal_10fcbe73d3e073bf0e7a, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_9856254f6c33ff5182a27f76()}, null, {}), "flags": u32(i32((i32(2) | i32(512)))), "min": (-2), "max": 1000}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_4ea9666bc0dbbc0e6f00, "desc": __cxx_literal_cbf0232536f984ba940b, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_8afc3f1714c50fd848123c08()}, null, {}), "flags": u32(8), "min": 0, "max": 1}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_cf32775ee05d68d04046, "desc": __cxx_literal_0df4821be8e17190d4c2, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_92f6ec0c3a993b574f308abb()}, null, {}), "flags": u32(i32((i32(1) | i32(512)))), "min": i32(floor(Math.fround(0.75))), "max": i32(ceil(Math.fround(1.25)))}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_d29fdf41de78acb29eb7, "desc": __cxx_literal_fefd3776334840ca8de3, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_eb7ec64efb5dec6e758a65c7()}, null, {}), "flags": u32(i32((i32(1) | i32(512)))), "min": i32(floor(Math.fround(0.5))), "max": i32(ceil(Math.fround(1.5)))}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_5c520c1f9e683b4b6314, "desc": __cxx_literal_8ac1eb2de7bbd055f7b5, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": __cxx_global_cell_a6f1e8c839618189cf2ebd7a()}, null, {}), "flags": u32(i32((i32(1) | i32(512)))), "min": i32(floor(Math.fround(0))), "max": i32(ceil(Math.fround(2)))}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_2": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 16}, "desc": {"offset": 8, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 24, "size": 4}, "max": {"native": "Int32Array", "offset": 32, "size": 4}, "min": {"native": "Int32Array", "offset": 28, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 40, "union": false}, {"name": __cxx_literal_415107ff3be1e0a1a43e, "desc": __cxx_literal_eaea98123966ae175e87, "__cxx_anonymous_2": cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"d": {"offset": 0, "pointer": true, "size": 8}, "f": {"offset": 0, "pointer": true, "size": 8}, "i32": {"offset": 0, "pointer": true, "size": 8}, "ptr": {"offset": 0, "pointer": true, "size": 8}, "string": {"offset": 0, "pointer": true, "size": 8}, "u32": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, {"ptr": screenshot_dir}, null, {}), "flags": u32(16), "min": 0, "max": i32(u64((BigInt(256) - BigInt(u64(1)))))}, null, {})]); __static_baselayer_init_cvars_engine__init = 2; }
    catch (__cxx_static_error) { __static_baselayer_init_cvars_engine__init = 0; throw __cxx_static_error; }
  }
  {
    const __cxx_range_array_0 = __static_baselayer_init_cvars_engine;
    if (__cxx_range_array_0.length !== 16) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 16; ++__cxx_range_index_0) {
      OSD_RegisterCvar(cPointerOffset(__cxx_range_array_0, __cxx_range_index_0, 40), (Boolean(u32((__cxx_range_array_0[__cxx_range_index_0].flags & u32(512)))) ? osdcmd_cvar_set_baselayer : osdcmd_cvar_set));
    }
  }
  for (let i = i64(0); (i < i64(256)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((i32((cDeref(cPointerOffset(g_keyRemapTable, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)) {
      ((cDeref(cPointerOffset(g_keyRemapTable, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i) & 255)) & 255));
    }
  }
  return i32(0);
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_d0e4358054a560bb(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_9f711f2400ba566e(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

export function clamp__header_1ecf5feb2977(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/build/include/baselayer.h:348
export function calcFrameDelay__header_71d089a3b620(maxFPS) {
  switch (maxFPS) {
    case (-2): {
      return u64(0);
    }
    case (-1): {
      (maxFPS = i32(__cxx_global_cell_84c518e352f66f31d8eaf74c().value));
    }
    break;
    case 0: {
      (maxFPS = i32(1000));
    }
    break;
  }
  return u64(tabledivide64__header_4c9e43263490(i64(timerGetNanoTickRate()), i64(maxFPS)));
}

// C/C++ source: source/build/include/pragmas.h:111
export function tabledivide64__header_4c9e43263490(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_f8287b2e627d0e3f51b90c55().value)) & i32((!(u64(d) < u64(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable64, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}, {}), 0).value), libdivide_s64_gen((__cxx_global_cell_f8287b2e627d0e3f51b90c55().value = i64(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "BigInt64Array", "offset": 0, "size": 8}, "more": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 9, "union": false}});
  }
  return i64(libdivide_s64_do(n, cPointerOffset(divtable64, i64((BigInt(i64((u64(d) < u64(16384)))) * BigInt(d))), 9)));
}
