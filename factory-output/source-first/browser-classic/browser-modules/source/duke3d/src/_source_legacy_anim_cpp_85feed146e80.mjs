// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/anim.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Anim_Create } from "./anim.cpp.mjs";
import { __cxx_global_cell_a2e00eb89732a70e73d11a7e } from "./dnames.cpp.mjs";
import { __cxx_global_cell_ac13fdf9b875363f704809de } from "./dnames.cpp.mjs";
import { __cxx_global_cell_cfb0930e809e881d6e7afebd } from "./dnames.cpp.mjs";
import { __cxx_global_cell_2f44457650d3ec8abdcb9ef2 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_156fb000c29189fb4261b8ce } from "./dnames.cpp.mjs";
import { __cxx_global_cell_86d668208a2274b7715555bc } from "./dnames.cpp.mjs";
import { __cxx_global_cell_e07b2dfb58be394cd87ed1af } from "./dnames.cpp.mjs";
import { __cxx_global_cell_1b453948167dd8a2dcae22ab } from "./dnames.cpp.mjs";
import { __cxx_global_cell_f4f9ca1997b85e3b08911fc4 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_b8e3a09fa4abcbfd2c3adb84 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_4db8447a7cbeaddfd0fb6254 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_41eb6f697355c97c1a66d472 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_5df367a5711256d0688fd9ad } from "./dnames.cpp.mjs";
import { __cxx_global_cell_19d3ea85cec7cc2d9c262de9 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_cea6452795d539cf77f06ec6 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_d6e41610ce4160fd303b5449 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_ba161790ca79a36a61e857a1 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_a60fb3901d5473acb3808487 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_65affbdde03fbeedb4cfc2f6 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_bae2f1b5dfbd218acbac5246 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_d64778c674e35fc03d3d3880 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_67dc7ed1d6c5c61acdd4e736 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_7baf39150d1d7699f75e50e6 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_d78097aa21249629b8c8009b } from "./dnames.cpp.mjs";
import { StopAllSounds } from "./anim.cpp.mjs";
import { __cxx_global_cell_71322ede3ac7d10567f6e634 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_422d21a06caca8addb883ca7 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_fc40495ed21e368da252b6d3 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_1f57c95d2e2edab7e0aeb538 } from "./dnames.cpp.mjs";
import { __cxx_global_cell_3a38f8c8b6f6893d17a8666c } from "./dnames.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_688eef96adecfa82b6b8d71c } from "./anim.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_init } from "../../build/src/hash.cpp.mjs";

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
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/duke3d/src/anim.cpp:87
let __static_Anim_Init_logo;
let __static_Anim_Init_logo__init = 0;
let __static_Anim_Init_cineov2;
let __static_Anim_Init_cineov2__init = 0;
let __static_Anim_Init_cineov3;
let __static_Anim_Init_cineov3__init = 0;
let __static_Anim_Init_vol42a;
let __static_Anim_Init_vol42a__init = 0;
let __static_Anim_Init_vol41a;
let __static_Anim_Init_vol41a__init = 0;
let __static_Anim_Init_vol43a;
let __static_Anim_Init_vol43a__init = 0;
let __static_Anim_Init_vol4e1;
let __static_Anim_Init_vol4e1__init = 0;
let __static_Anim_Init_vol4e2;
let __static_Anim_Init_vol4e2__init = 0;
let __static_Anim_Init_vol4e3;
let __static_Anim_Init_vol4e3__init = 0;
const __cxx_literal_629f5159332cc5313e4c = Uint8Array.from([108, 111, 103, 111, 46, 97, 110, 109, 0]);
const __cxx_literal_95be03bd9a05d659c9c7 = Uint8Array.from([51, 100, 114, 46, 97, 110, 109, 0]);
const __cxx_literal_7787d28ee97e4ca713e7 = Uint8Array.from([118, 111, 108, 52, 101, 49, 46, 97, 110, 109, 0]);
const __cxx_literal_e1fc8b8f15efa2202067 = Uint8Array.from([118, 111, 108, 52, 101, 50, 46, 97, 110, 109, 0]);
const __cxx_literal_f896036940c0a9b5288c = Uint8Array.from([118, 111, 108, 52, 101, 51, 46, 97, 110, 109, 0]);
const __cxx_literal_0360b3de76e279d8afbb = Uint8Array.from([118, 111, 108, 52, 49, 97, 46, 97, 110, 109, 0]);
const __cxx_literal_aad15fcdb7de3d739bef = Uint8Array.from([118, 111, 108, 52, 50, 97, 46, 97, 110, 109, 0]);
const __cxx_literal_1cf85d15c150f51cab4e = Uint8Array.from([118, 111, 108, 52, 51, 97, 46, 97, 110, 109, 0]);
const __cxx_literal_4cc7accc01a47bdc5948 = Uint8Array.from([100, 117, 107, 101, 116, 101, 97, 109, 46, 97, 110, 109, 0]);
const __cxx_literal_b7953de79ec2753e3f54 = Uint8Array.from([114, 97, 100, 108, 111, 103, 111, 46, 97, 110, 109, 0]);
const __cxx_literal_cd86fa8e09e83d87da83 = Uint8Array.from([99, 105, 110, 101, 111, 118, 50, 46, 97, 110, 109, 0]);
const __cxx_literal_b93e86884b13b1e2d597 = Uint8Array.from([99, 105, 110, 101, 111, 118, 51, 46, 97, 110, 109, 0]);
let __static_Anim_Init_anms;
let __static_Anim_Init_anms__init = 0;
export function Anim_Init() {
  hash_init(__cxx_global_cell_688eef96adecfa82b6b8d71c().value);

  if (__static_Anim_Init_logo__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_logo__init === 0) {
    __static_Anim_Init_logo__init = 1;
    try { __static_Anim_Init_logo = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [2], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_19d3ea85cec7cc2d9c262de9().value)), "frame": (u32(1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_67dc7ed1d6c5c61acdd4e736().value)), "frame": (u32(19) & 255)}, null, {})]); __static_Anim_Init_logo__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_logo__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_cineov2__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_cineov2__init === 0) {
    __static_Anim_Init_cineov2__init = 1;
    try { __static_Anim_Init_cineov2 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [9], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_1f57c95d2e2edab7e0aeb538().value)), "frame": (u32(1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_3) => cRef(() => __cxx_lvalue_3, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_156fb000c29189fb4261b8ce().value)), "frame": (u32(26) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_4) => cRef(() => __cxx_lvalue_4, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_86d668208a2274b7715555bc().value)), "frame": (u32(36) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_5) => cRef(() => __cxx_lvalue_5, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_71322ede3ac7d10567f6e634().value)), "frame": (u32(54) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_6) => cRef(() => __cxx_lvalue_6, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_e07b2dfb58be394cd87ed1af().value)), "frame": (u32(62) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_7) => cRef(() => __cxx_lvalue_7, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_1b453948167dd8a2dcae22ab().value)), "frame": (u32(75) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_8) => cRef(() => __cxx_lvalue_8, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_f4f9ca1997b85e3b08911fc4().value)), "frame": (u32(81) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_9) => cRef(() => __cxx_lvalue_9, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_b8e3a09fa4abcbfd2c3adb84().value)), "frame": (u32(115) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_10) => cRef(() => __cxx_lvalue_10, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_4db8447a7cbeaddfd0fb6254().value)), "frame": (u32(124) & 255)}, null, {})]); __static_Anim_Init_cineov2__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_cineov2__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_cineov3__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_cineov3__init === 0) {
    __static_Anim_Init_cineov3__init = 1;
    try { __static_Anim_Init_cineov3 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [7], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_11) => cRef(() => __cxx_lvalue_11, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_3a38f8c8b6f6893d17a8666c().value)), "frame": (u32(1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_12) => cRef(() => __cxx_lvalue_12, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_cfb0930e809e881d6e7afebd().value)), "frame": (u32(98) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_13) => cRef(() => __cxx_lvalue_13, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_71322ede3ac7d10567f6e634().value)), "frame": (u32(i32((82 + 20))) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_14) => cRef(() => __cxx_lvalue_14, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_d78097aa21249629b8c8009b().value)), "frame": (u32(i32((82 + 20))) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_15) => cRef(() => __cxx_lvalue_15, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_5df367a5711256d0688fd9ad().value)), "frame": (u32(i32((104 + 20))) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_16) => cRef(() => __cxx_lvalue_16, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_41eb6f697355c97c1a66d472().value)), "frame": (u32(i32((114 + 20))) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_17) => cRef(() => __cxx_lvalue_17, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_67dc7ed1d6c5c61acdd4e736().value)), "frame": (u32(158) & 255)}, null, {})]); __static_Anim_Init_cineov3__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_cineov3__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_vol42a__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_vol42a__init === 0) {
    __static_Anim_Init_vol42a__init = 1;
    try { __static_Anim_Init_vol42a = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [4], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_18) => cRef(() => __cxx_lvalue_18, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_d64778c674e35fc03d3d3880().value)), "frame": (u32(1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_19) => cRef(() => __cxx_lvalue_19, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_7baf39150d1d7699f75e50e6().value)), "frame": (u32(12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_20) => cRef(() => __cxx_lvalue_20, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_65affbdde03fbeedb4cfc2f6().value)), "frame": (u32(18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_21) => cRef(() => __cxx_lvalue_21, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_7baf39150d1d7699f75e50e6().value)), "frame": (u32(34) & 255)}, null, {})]); __static_Anim_Init_vol42a__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_vol42a__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_vol41a__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_vol41a__init === 0) {
    __static_Anim_Init_vol41a__init = 1;
    try { __static_Anim_Init_vol41a = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [4], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_22) => cRef(() => __cxx_lvalue_22, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_cea6452795d539cf77f06ec6().value)), "frame": (u32(1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_23) => cRef(() => __cxx_lvalue_23, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_ba161790ca79a36a61e857a1().value)), "frame": (u32(7) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_24) => cRef(() => __cxx_lvalue_24, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_d6e41610ce4160fd303b5449().value)), "frame": (u32(12) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_25) => cRef(() => __cxx_lvalue_25, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_a60fb3901d5473acb3808487().value)), "frame": (u32(26) & 255)}, null, {})]); __static_Anim_Init_vol41a__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_vol41a__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_vol43a__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_vol43a__init === 0) {
    __static_Anim_Init_vol43a__init = 1;
    try { __static_Anim_Init_vol43a = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [1], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_26) => cRef(() => __cxx_lvalue_26, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_bae2f1b5dfbd218acbac5246().value)), "frame": (u32(10) & 255)}, null, {})]); __static_Anim_Init_vol43a__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_vol43a__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_vol4e1__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_vol4e1__init === 0) {
    __static_Anim_Init_vol4e1__init = 1;
    try { __static_Anim_Init_vol4e1 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [2], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_27) => cRef(() => __cxx_lvalue_27, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_2f44457650d3ec8abdcb9ef2().value)), "frame": (u32(3) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_28) => cRef(() => __cxx_lvalue_28, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_422d21a06caca8addb883ca7().value)), "frame": (u32(35) & 255)}, null, {})]); __static_Anim_Init_vol4e1__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_vol4e1__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_vol4e2__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_vol4e2__init === 0) {
    __static_Anim_Init_vol4e2__init = 1;
    try { __static_Anim_Init_vol4e2 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [4], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_29) => cRef(() => __cxx_lvalue_29, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_2f44457650d3ec8abdcb9ef2().value)), "frame": (u32(11) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_30) => cRef(() => __cxx_lvalue_30, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_422d21a06caca8addb883ca7().value)), "frame": (u32(20) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_31) => cRef(() => __cxx_lvalue_31, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_fc40495ed21e368da252b6d3().value)), "frame": (u32(39) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": cRef(() => StopAllSounds, __cxx_lvalue_32 => { StopAllSounds = __cxx_lvalue_32; }), "frame": (u32(50) & 255)}, null, {})]); __static_Anim_Init_vol4e2__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_vol4e2__init = 0; throw __cxx_static_error; }
  }
  if (__static_Anim_Init_vol4e3__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_vol4e3__init === 0) {
    __static_Anim_Init_vol4e3__init = 1;
    try { __static_Anim_Init_vol4e3 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, [4], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_33) => cRef(() => __cxx_lvalue_33, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_ac13fdf9b875363f704809de().value)), "frame": (u32(1) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_34) => cRef(() => __cxx_lvalue_34, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_422d21a06caca8addb883ca7().value)), "frame": (u32(40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_35) => cRef(() => __cxx_lvalue_35, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_2f44457650d3ec8abdcb9ef2().value)), "frame": (u32(40) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"sound": ((__cxx_lvalue_36) => cRef(() => __cxx_lvalue_36, () => { throw new TypeError("const C++ reference write"); }))(i32(__cxx_global_cell_a2e00eb89732a70e73d11a7e().value)), "frame": (u32(50) & 255)}, null, {})]); __static_Anim_Init_vol4e3__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_vol4e3__init = 0; throw __cxx_static_error; }
  }

  if (__static_Anim_Init_anms__init === 1) throw new TypeError("recursive C++ static initialization");
  if (__static_Anim_Init_anms__init === 0) {
    __static_Anim_Init_anms__init = 1;
    try { __static_Anim_Init_anms = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, [12], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_629f5159332cc5313e4c, "sounds": __static_Anim_Init_logo, "numsounds": (u32(ARRAY_SIZE__header_e7e29b814591(__static_Anim_Init_logo)) & 255), "fdelay": (u32(9) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_95be03bd9a05d659c9c7, "sounds": null, "numsounds": (u32(0) & 255), "fdelay": (u32(10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_7787d28ee97e4ca713e7, "sounds": __static_Anim_Init_vol4e1, "numsounds": (u32(ARRAY_SIZE__header_e7e29b814591(__static_Anim_Init_vol4e1)) & 255), "fdelay": (u32(10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_e1fc8b8f15efa2202067, "sounds": __static_Anim_Init_vol4e2, "numsounds": (u32(ARRAY_SIZE__header_4ec6da3a00fd(__static_Anim_Init_vol4e2)) & 255), "fdelay": (u32(14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_f896036940c0a9b5288c, "sounds": __static_Anim_Init_vol4e3, "numsounds": (u32(ARRAY_SIZE__header_4ec6da3a00fd(__static_Anim_Init_vol4e3)) & 255), "fdelay": (u32(10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_0360b3de76e279d8afbb, "sounds": __static_Anim_Init_vol41a, "numsounds": (u32(ARRAY_SIZE__header_4ec6da3a00fd(__static_Anim_Init_vol41a)) & 255), "fdelay": (u32(14) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_aad15fcdb7de3d739bef, "sounds": __static_Anim_Init_vol42a, "numsounds": (u32(ARRAY_SIZE__header_4ec6da3a00fd(__static_Anim_Init_vol42a)) & 255), "fdelay": (u32(18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_1cf85d15c150f51cab4e, "sounds": __static_Anim_Init_vol43a, "numsounds": (u32(ARRAY_SIZE__header_54d30a5d17fc(__static_Anim_Init_vol43a)) & 255), "fdelay": (u32(10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_4cc7accc01a47bdc5948, "sounds": null, "numsounds": (u32(0) & 255), "fdelay": (u32(10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_b7953de79ec2753e3f54, "sounds": __static_Anim_Init_cineov3, "numsounds": (u32(ARRAY_SIZE__header_c92f95127ed8(__static_Anim_Init_cineov3)) & 255), "fdelay": (u32(10) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_cd86fa8e09e83d87da83, "sounds": __static_Anim_Init_cineov2, "numsounds": (u32(ARRAY_SIZE__header_182df29bb857(__static_Anim_Init_cineov2)) & 255), "fdelay": (u32(18) & 255)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"fdelay": {"native": "Uint8Array", "offset": 17, "size": 1}, "fn": {"offset": 0, "pointer": true, "size": 8}, "numsounds": {"native": "Uint8Array", "offset": 16, "size": 1}, "sounds": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {"fn": __cxx_literal_b93e86884b13b1e2d597, "sounds": __static_Anim_Init_cineov3, "numsounds": (u32(ARRAY_SIZE__header_c92f95127ed8(__static_Anim_Init_cineov3)) & 255), "fdelay": (u32(10) & 255)}, null, {})]); __static_Anim_Init_anms__init = 2; }
    catch (__cxx_static_error) { __static_Anim_Init_anms__init = 0; throw __cxx_static_error; }
  }
  {
    const __cxx_range_array_0 = __static_Anim_Init_anms;
    if (__cxx_range_array_0.length !== 12) throw new RangeError("C array extent mismatch");
    for (let __cxx_range_index_0 = 0; __cxx_range_index_0 < 12; ++__cxx_range_index_0) {
      let anim = Anim_Create(__cxx_range_array_0[__cxx_range_index_0].fn);
      (cRecordObject(cRecordPointer(anim, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).framedelay = (u32(__cxx_range_array_0[__cxx_range_index_0].fdelay) & 255));
      if (Boolean(__cxx_range_array_0[__cxx_range_index_0].numsounds)) {
        (cRecordObject(cRecordPointer(anim, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds = cRecordPointer(xmalloc__header_94feb8bebd3d(u64((BigInt(u64(__cxx_range_array_0[__cxx_range_index_0].numsounds)) * BigInt(4)))), {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}));
        let numsounds = i32(__cxx_range_array_0[__cxx_range_index_0].numsounds);
        for (let i = i32(0); (i < numsounds); ((__cxx_lvalue_37) => { const previous = __cxx_lvalue_37.value; const next = i32((previous + 1)); __cxx_lvalue_37.value = next; return next; })(cRef(() => i, __cxx_lvalue_38 => { i = __cxx_lvalue_38; }))) {
          let src = (cPointerElementRef(cRecordPointer(__cxx_range_array_0[__cxx_range_index_0].sounds, {"align": 8, "arrayAlign": 1, "fields": {"frame": {"native": "Uint8Array", "offset": 8, "size": 1}, "sound": {"offset": 0, "reference": true, "referenceType": "const int32_t &", "size": 8}}, "overlaps": false, "size": 16, "union": false}, {}), i).value);
          let dst = (cPointerElementRef(cRecordPointer(cRecordObject(cRecordPointer(anim, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds, {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), i).value);
          (dst.sound = ((u32(((u32(src.sound.value) << 16) >> 16)) << 16) >> 16));
          (dst.frame = (u32((u32(src.frame) & 65535)) & 65535));
        }
        (cRecordObject(cRecordPointer(anim, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).numsounds = (u32((u32(numsounds) & 65535)) & 65535));
      }
      (cRecordObject(cRecordPointer(anim, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).frameflags = (u32((u32(0) & 255)) & 255));
    }
  }
}

export function ARRAY_SIZE__header_e7e29b814591(arg0) {
  return u64(2n);
}

export function ARRAY_SIZE__header_4ec6da3a00fd(arg0) {
  return u64(4n);
}

export function ARRAY_SIZE__header_54d30a5d17fc(arg0) {
  return u64(1n);
}

export function ARRAY_SIZE__header_c92f95127ed8(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_182df29bb857(arg0) {
  return u64(9n);
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_94feb8bebd3d(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}
