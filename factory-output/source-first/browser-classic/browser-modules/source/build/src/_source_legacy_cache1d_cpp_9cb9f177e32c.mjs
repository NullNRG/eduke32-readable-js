// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/cache1d.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "./smmalloc_generic.cpp.mjs";
import { Bgetpagesize } from "./compat.cpp.mjs";
import { Destroy__cxx_static_777d0ae31c789182 } from "./smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { OSD_RegisterFunction } from "./osd.cpp.mjs";
import { classicht } from "./engine.cpp.mjs";
import { copybufbyte } from "./pragmas.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { handle_memerr } from "./compat.cpp.mjs";
import { initprintf } from "./baselayer.cpp.mjs";
import { inthash_add } from "./hash.cpp.mjs";
import { inthash_find } from "./hash.cpp.mjs";
import { inthash_free } from "./hash.cpp.mjs";
import { inthash_init } from "./hash.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { snprintf } from "../../../browser-abi/libc_provider.mjs";
import { strcat } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_88248ca6ca50548115e47549 } from "./pragmas.cpp.mjs";
import { tiletovox } from "./engine.cpp.mjs";
import { voxoff } from "./engine.cpp.mjs";
import { waloff } from "./engine.cpp.mjs";
import { wm_msgbox } from "./sdlayer.cpp.mjs";

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



const cStackAlloc = amount => {
  if (typeof amount !== 'number' && typeof amount !== 'bigint')
    throw new TypeError('C stack allocation needs an integral byte count');
  const count=Number(amount);
  if (!Number.isSafeInteger(count) || count<0 || count>8388608)
    throw new RangeError('C stack allocation outside bounded byte extent');
  return new Uint8Array(count || 1);
};
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

// Browser-hosted termination for an exactly verified ISO C exit(int) ABI.
// Throwing stops the current stack; the launcher decides whether to close the
// native browser runtime. This does not emulate a CPU or import an SDL library.
const cProcess = Object.freeze({
  exit(status) {
    const code = Number(status);
    if (!Number.isFinite(code) || !Number.isSafeInteger(code))
      throw new TypeError('C exit status must be an integer');
    const stopped = new Error(`C process terminated with status ${code | 0}`);
    stopped.name = 'CProcessExit';
    stopped.status = code | 0;
    throw stopped;
  }
});

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/cache1d.h:33
export function cache1d() {
  return cache1d.type || (cache1d.type = class cache1d__implementation {
  constructor() {
    this.m_index = null;
    this.m_baseAddress = i64(0n);
    this.m_totalSize = i32(0);
    this.m_maxBlocks = i32(0);
    this.m_numBlocks = i32(0);
  }
  numBlocks() {
    return i32(this.m_numBlocks);
  }
  getIndex() {
    return this.m_index;
  }
});
}

// C/C++ source: source/build/src/cache1d.cpp:46
export let g_cacheInit = false;
function __cxx_static_address_52e781d7fd281b42cf78811c() {
  return __cxx_static_address_52e781d7fd281b42cf78811c.reference || (__cxx_static_address_52e781d7fd281b42cf78811c.reference = {
    __cReference: true,
    get value() { return g_cacheInit; },
    set value(__cxx_lvalue_0) { g_cacheInit = Boolean(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_52e781d7fd281b42cf78811c() { return __cxx_static_address_52e781d7fd281b42cf78811c(); }

// C/C++ source: source/build/src/cache1d.cpp:47
export let zerochar = 0;
function __cxx_static_address_47a364e6d09683396c15baaf() {
  return __cxx_static_address_47a364e6d09683396c15baaf.reference || (__cxx_static_address_47a364e6d09683396c15baaf.reference = {
    __cReference: true,
    get value() { return zerochar; },
    set value(__cxx_lvalue_0) { zerochar = (u32(__cxx_lvalue_0) & 255); }
  });
}
export function __cxx_private_cell_47a364e6d09683396c15baaf() { return __cxx_static_address_47a364e6d09683396c15baaf(); }

// C/C++ source: source/build/src/cache1d.cpp:48
export let lockrecip = new Int32Array(200);
function __cxx_static_address_0e962bd6e6f4c4f0b092870d() {
  return __cxx_static_address_0e962bd6e6f4c4f0b092870d.reference || (__cxx_static_address_0e962bd6e6f4c4f0b092870d.reference = {
    __cReference: true,
    get value() { return lockrecip; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_0e962bd6e6f4c4f0b092870d() { return __cxx_static_address_0e962bd6e6f4c4f0b092870d(); }

// C/C++ source: source/build/src/cache1d.cpp:50
export let g_cache = new (cache1d())();
export function __cxx_global_cell_244052970f7b7b3f1ddb8062() {
  return __cxx_global_cell_244052970f7b7b3f1ddb8062.reference || (__cxx_global_cell_244052970f7b7b3f1ddb8062.reference = {
    __cReference: true,
    get value() { return g_cache; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/cache1d.cpp:53
export function osdfunc_cacheinfo(UNUSED_parm) {
  ;
  report__cxx_instance_062971c8f6e47a11f323.call(g_cache);
  return i32(0);
}

// C/C++ source: source/build/src/cache1d.cpp:64
export function reset__cxx_instance_4f5a03a1a6697d4ac394() {
  memset(this.m_index, 0, u64((BigInt(u64(this.m_maxBlocks)) * BigInt(24))));
  ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), 0).value).leng = i32(this.m_totalSize));
  ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), 0).value).lock = cScalarLValueIO(__cxx_static_address_47a364e6d09683396c15baaf(), Uint8Array));
  (this.m_numBlocks = i32(1));
}

// C/C++ source: source/build/src/cache1d.cpp:74
const __cxx_literal_dad152715c9b8487df90 = Uint8Array.from([99, 97, 99, 104, 101, 105, 110, 102, 111, 0]);
const __cxx_literal_8b5e4eef04e81babe63b = Uint8Array.from([99, 97, 99, 104, 101, 105, 110, 102, 111, 58, 32, 100, 105, 115, 112, 108, 97, 121, 115, 32, 99, 97, 99, 104, 101, 32, 115, 116, 97, 116, 105, 115, 116, 105, 99, 115, 0]);
const __cxx_literal_b286191651ae03edb752 = Uint8Array.from([67, 97, 99, 104, 101, 32, 111, 98, 106, 101, 99, 116, 32, 97, 114, 114, 97, 121, 32, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 32, 119, 105, 116, 104, 32, 37, 100, 32, 101, 110, 116, 114, 105, 101, 115, 46, 0]);
const __cxx_literal_fc6afcc6f00f4e652122 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_1fddb43599ca4f316270 = Uint8Array.from([73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 32, 37, 46, 49, 102, 77, 32, 99, 97, 99, 104, 101, 0]);
export function initBuffer__cxx_instance_f5bf267877099b7e3273(dacachestart, dacachesize, arg2) {
  if ((!g_cacheInit)) {
    for (let i = i32(1); (i < 200); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      ((cDeref(cPointerOffset(lockrecip, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(__cxx_global_cell_88248ca6ca50548115e47549().value(i32((1 << 28)), i32((200 - i)))));
    }
    OSD_RegisterFunction(__cxx_literal_dad152715c9b8487df90, __cxx_literal_8b5e4eef04e81babe63b, osdfunc_cacheinfo);
    (g_cacheInit = Boolean(true));
  }
  (this.m_baseAddress = i64(u64((BigInt(u64((BigInt(u64(dacachestart)) + BigInt(u64(15))))) & BigInt(u64((~u64(15))))))));
  (this.m_totalSize = i32(u64((BigInt(u64((BigInt(u64(dacachesize)) - BigInt(u64((BigInt(u64(dacachestart)) & BigInt(u64(15)))))))) & BigInt(u64((~u64(15))))))));
  (this.m_maxBlocks = i32(16384));
  (this.m_index = cRecordPointer(xaligned_alloc__header_42fe08f704a9(u64(16), u64((BigInt(u64(this.m_maxBlocks)) * BigInt(24)))), {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}));
  reset__cxx_instance_4f5a03a1a6697d4ac394.call(this);
  do {
    SILENCE_UNUSED__header_f270c6fea349(__cxx_literal_b286191651ae03edb752, cObjectFieldRef(this, "m_maxBlocks"));
  } while (Boolean(0));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_fc6afcc6f00f4e652122, u32(98), __cxx_literal_1fddb43599ca4f316270, Math.fround(Math.fround((Math.fround((Math.fround(dacachesize) / Math.fround(1024))) / Math.fround(1024))))));
}

// C/C++ source: source/build/src/cache1d.cpp:102
const __cxx_literal_fa846bf71dc02adad04e = Uint8Array.from([67, 97, 99, 104, 101, 32, 115, 105, 122, 101, 32, 105, 110, 99, 114, 101, 97, 115, 101, 100, 32, 98, 121, 32, 37, 100, 32, 116, 111, 32, 110, 101, 119, 32, 109, 97, 120, 32, 111, 102, 32, 37, 100, 32, 101, 110, 116, 114, 105, 101, 115, 0]);
export function inc_and_check_cacnum__cxx_instance_8e3b6bef2f7424aa36b1() {
  if ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cObjectFieldRef(this, "m_numBlocks")) >= this.m_maxBlocks)) {
    let new_index = cRecordPointer(xaligned_alloc__header_42fe08f704a9(u64(Bgetpagesize()), u64((BigInt(u64(i32((this.m_maxBlocks + 1024)))) * BigInt(24)))), {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {});
    memset(cPointerOffset(new_index, this.m_maxBlocks, 24), 0, u64((BigInt(u64(1024)) * BigInt(24))));
    memcpy(new_index, this.m_index, u64((BigInt(u64(this.m_maxBlocks)) * BigInt(24))));
    xaligned_free__header_95a187c835e2(this.m_index);
    (this.m_index = new_index);
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(1024)))))(cObjectFieldRef(this, "m_maxBlocks"));
    do {
      SILENCE_UNUSED__header_5df8ec5a9ab9(__cxx_literal_fa846bf71dc02adad04e, ((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(1024), cObjectFieldRef(this, "m_maxBlocks"));
    } while (Boolean(0));
  }
}

// C/C++ source: source/build/src/cache1d.cpp:120
const __cxx_literal_63979d6c04f29dad619f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_cae6435a581a4781277a = Uint8Array.from([67, 97, 99, 104, 101, 32, 115, 105, 122, 101, 58, 32, 37, 100, 0]);
const __cxx_literal_1a5fa6273a22f34528e9 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_a9d1d10ac9fceb7f856e = Uint8Array.from([42, 78, 101, 119, 104, 97, 110, 100, 108, 101, 58, 32, 48, 120, 37, 48, 56, 108, 120, 44, 32, 78, 101, 119, 98, 121, 116, 101, 115, 58, 32, 37, 100, 44, 32, 42, 78, 101, 119, 108, 111, 99, 107, 58, 32, 37, 100, 0]);
const __cxx_literal_df982bf5731d41fa1890 = Uint8Array.from([102, 97, 116, 97, 108, 95, 101, 120, 105, 116, 40, 37, 115, 41, 32, 97, 116, 32, 37, 115, 58, 37, 100, 32, 105, 110, 32, 37, 115, 40, 41, 10, 0]);
const __cxx_literal_8ab410ca9de320042050 = Uint8Array.from([66, 85, 70, 70, 69, 82, 32, 84, 79, 79, 32, 66, 73, 71, 32, 84, 79, 32, 70, 73, 84, 32, 73, 78, 32, 67, 65, 67, 72, 69, 33, 0]);
const __cxx_literal_97a709d3bd10bada6409 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_fbcb1ea2c517e360b044 = Uint8Array.from([97, 108, 108, 111, 99, 97, 116, 101, 66, 108, 111, 99, 107, 0]);
const __cxx_literal_089fd2176919884a7450 = Uint8Array.from([70, 97, 116, 97, 108, 32, 69, 114, 114, 111, 114, 0]);
const __cxx_literal_d31a54c7cc33c250ed41 = Uint8Array.from([37, 115, 0]);
const __cxx_literal_66501147564c7d3cc3ff = Uint8Array.from([66, 85, 70, 70, 69, 82, 32, 84, 79, 79, 32, 66, 73, 71, 32, 84, 79, 32, 70, 73, 84, 32, 73, 78, 32, 67, 65, 67, 72, 69, 33, 0]);
const __cxx_literal_28b49a3e12326f565912 = Uint8Array.from([102, 97, 116, 97, 108, 95, 101, 120, 105, 116, 40, 37, 115, 41, 32, 97, 116, 32, 37, 115, 58, 37, 100, 32, 105, 110, 32, 37, 115, 40, 41, 10, 0]);
const __cxx_literal_f41756f3e633dd525b8d = Uint8Array.from([65, 76, 76, 79, 67, 65, 67, 72, 69, 32, 67, 65, 76, 76, 69, 68, 32, 87, 73, 84, 72, 32, 76, 79, 67, 75, 32, 79, 70, 32, 48, 33, 0]);
const __cxx_literal_22d8e617ff49153feebe = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_b5fb00cd2c8528a4bf72 = Uint8Array.from([97, 108, 108, 111, 99, 97, 116, 101, 66, 108, 111, 99, 107, 0]);
const __cxx_literal_df120956025866c4b460 = Uint8Array.from([70, 97, 116, 97, 108, 32, 69, 114, 114, 111, 114, 0]);
const __cxx_literal_9fea8a8c09098be303ec = Uint8Array.from([37, 115, 0]);
const __cxx_literal_bbf74c53b15d2d8a39fc = Uint8Array.from([65, 76, 76, 79, 67, 65, 67, 72, 69, 32, 67, 65, 76, 76, 69, 68, 32, 87, 73, 84, 72, 32, 76, 79, 67, 75, 32, 79, 70, 32, 48, 33, 0]);
const __cxx_literal_bfb54537e613509c83e5 = Uint8Array.from([102, 97, 116, 97, 108, 95, 101, 120, 105, 116, 40, 37, 115, 41, 32, 97, 116, 32, 37, 115, 58, 37, 100, 32, 105, 110, 32, 37, 115, 40, 41, 10, 0]);
const __cxx_literal_a2df3695ee1149950af8 = Uint8Array.from([67, 65, 67, 72, 69, 32, 83, 80, 65, 67, 69, 32, 65, 76, 76, 32, 76, 79, 67, 75, 69, 68, 32, 85, 80, 33, 0]);
const __cxx_literal_2e22930bd7002a3535e0 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_52bf5889fcb959710207 = Uint8Array.from([97, 108, 108, 111, 99, 97, 116, 101, 66, 108, 111, 99, 107, 0]);
const __cxx_literal_468307d0843865e44c25 = Uint8Array.from([70, 97, 116, 97, 108, 32, 69, 114, 114, 111, 114, 0]);
const __cxx_literal_2864afc0384b28142b69 = Uint8Array.from([37, 115, 0]);
const __cxx_literal_3a88d82f569acb172c8b = Uint8Array.from([67, 65, 67, 72, 69, 32, 83, 80, 65, 67, 69, 32, 65, 76, 76, 32, 76, 79, 67, 75, 69, 68, 32, 85, 80, 33, 0]);
export function allocateBlock__cxx_instance_99800f45e11302f01003(newhandle, newbytes, newlockptr) {
  let i;
  let z;
  let zz;
  let bestz = i32(0);
  let daval;
  let bestval;
  let besto = i32(0);
  let o1;
  let o2;
  let sucklen;
  let suckz;
  (newbytes = i32((i32((newbytes + 15)) & (~15))));
  if ((u32(newbytes) > u32(this.m_totalSize))) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_63979d6c04f29dad619f, u32(128), __cxx_literal_cae6435a581a4781277a, this.m_totalSize));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_1a5fa6273a22f34528e9, u32(129), __cxx_literal_a9d1d10ac9fceb7f856e, i64(cSourceAddresses.encode(newhandle)), newbytes, i32((cDeref(newlockptr, Uint8Array).value))));
    report__cxx_instance_062971c8f6e47a11f323.call(this);
    do {
      initprintf(__cxx_literal_df982bf5731d41fa1890, __cxx_literal_8ab410ca9de320042050, __cxx_literal_97a709d3bd10bada6409, 131, __cxx_literal_fbcb1ea2c517e360b044);
      engineDestroyAllocator__header_011d00a16827();
      do {
        wm_msgbox(__cxx_literal_089fd2176919884a7450, __cxx_literal_d31a54c7cc33c250ed41, __cxx_literal_66501147564c7d3cc3ff);
        cProcess.exit(1);
      } while (Boolean(0));
    } while (Boolean(0));
  }
  if ((i32((cDeref(newlockptr, Uint8Array).value)) == 0)) {
    report__cxx_instance_062971c8f6e47a11f323.call(this);
    do {
      initprintf(__cxx_literal_28b49a3e12326f565912, __cxx_literal_f41756f3e633dd525b8d, __cxx_literal_22d8e617ff49153feebe, 137, __cxx_literal_b5fb00cd2c8528a4bf72);
      engineDestroyAllocator__header_011d00a16827();
      do {
        wm_msgbox(__cxx_literal_df120956025866c4b460, __cxx_literal_9fea8a8c09098be303ec, __cxx_literal_bbf74c53b15d2d8a39fc);
        cProcess.exit(1);
      } while (Boolean(0));
    } while (Boolean(0));
  }
  (bestval = i32(2147483647));
  (o1 = i32(this.m_totalSize));
  for ((z = i32((this.m_numBlocks - 1))); (z >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => z, __cxx_lvalue_1 => { z = __cxx_lvalue_1; }))) {
    (o1 = i32((Number(o1) - Number((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), z).value).leng))));
    (o2 = i32((o1 + newbytes)));
    if ((o2 > this.m_totalSize)) {
      continue;
    }
    (daval = i32(0));
    for (((i = i32(o1)), (zz = i32(z))); (i < o2); (i = i32((Number(i) + Number((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => zz, __cxx_lvalue_3 => { zz = __cxx_lvalue_3; }))).value).leng))))) {
      if ((i32((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), zz).value).lock, Uint8Array).value)) == 0)) {
        continue;
      } else {
        if ((i32((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), zz).value).lock, Uint8Array).value)) >= i32(200))) {
          (daval = i32(2147483647));
          break;
        }
      }
      (daval = i32((Number(daval) + Number(mulscale32__header_87e16da1b6e2(i32(((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), zz).value).leng + 65536)), (cDeref(cPointerOffset(lockrecip, (cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), zz).value).lock, Uint8Array).value), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))));
      if ((daval >= bestval)) {
        break;
      }
    }
    if ((daval < bestval)) {
      (bestval = i32(daval));
      (besto = i32(o1));
      (bestz = i32(z));
      if ((bestval == 0)) {
        break;
      }
    }
  }
  if ((bestval == 2147483647)) {
    report__cxx_instance_062971c8f6e47a11f323.call(this);
    do {
      initprintf(__cxx_literal_bfb54537e613509c83e5, __cxx_literal_a2df3695ee1149950af8, __cxx_literal_2e22930bd7002a3535e0, 183, __cxx_literal_52bf5889fcb959710207);
      engineDestroyAllocator__header_011d00a16827();
      do {
        wm_msgbox(__cxx_literal_468307d0843865e44c25, __cxx_literal_2864afc0384b28142b69, __cxx_literal_3a88d82f569acb172c8b);
        cProcess.exit(1);
      } while (Boolean(0));
    } while (Boolean(0));
  }
  for (((sucklen = i32((-newbytes))), (suckz = i32(bestz))); (sucklen < 0); (sucklen = i32((Number(sucklen) + Number((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => suckz, __cxx_lvalue_5 => { suckz = __cxx_lvalue_5; }))).value).leng))))) {
    if (Boolean((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), suckz).value).lock, Uint8Array).value))) {
      ((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), suckz).value).hand, BigInt64Array).value) = i64(0));
    }
  }
  (suckz = i32((Number(suckz) - Number(i32((bestz + 1))))));
  ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = i32((Number(__cxx_lvalue_6.value) - Number(suckz)))))(cObjectFieldRef(this, "m_numBlocks"));
  copybufbyte(cPointerOffset(this.m_index, i32((bestz + suckz)), 24), cPointerOffset(this.m_index, bestz, 24), i32(u64((BigInt(u64(i32((this.m_numBlocks - bestz)))) * BigInt(24)))));
  ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).hand = newhandle);
  ((cDeref(newhandle, BigInt64Array).value) = i64((BigInt(this.m_baseAddress) + BigInt(i64(besto)))));
  ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).leng = i32(newbytes));
  ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).lock = newlockptr);
  if ((sucklen <= 0)) {
    return;
  }
  if ((((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = i32((previous + 1)); __cxx_lvalue_7.value = next; return next; })(cRef(() => bestz, __cxx_lvalue_8 => { bestz = __cxx_lvalue_8; })) == this.m_numBlocks)) {
    inc_and_check_cacnum__cxx_instance_8e3b6bef2f7424aa36b1.call(this);
    ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).leng = i32(sucklen));
    ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).lock = cScalarLValueIO(__cxx_static_address_47a364e6d09683396c15baaf(), Uint8Array));
    return;
  }
  if ((i32((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).lock, Uint8Array).value)) == 0)) {
    ((__cxx_lvalue_9) => (__cxx_lvalue_9.value = i32((Number(__cxx_lvalue_9.value) + Number(sucklen)))))(cObjectFieldRef((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value), "leng"));
    return;
  }
  inc_and_check_cacnum__cxx_instance_8e3b6bef2f7424aa36b1.call(this);
  for ((z = i32((this.m_numBlocks - 1))); (z > bestz); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i32((previous - 1)); __cxx_lvalue_10.value = next; return previous; })(cRef(() => z, __cxx_lvalue_11 => { z = __cxx_lvalue_11; }))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), z).value), (cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i32((z - 1))).value), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "clang-trivial-implicit-byte-copy", "clang_assignment_signature": "cacheindex_t &(const cacheindex_t &) noexcept", "clang_method_id": "0x24616bc6ab0", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "f4316f483b037698f956b4b4c9ed799c448368f7bed5b0716da6e9721df8736d"}, "record_name": "cacheindex_t", "source_record": "cacheindex_t"});
  }
  ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).leng = i32(sucklen));
  ((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), bestz).value).lock = cScalarLValueIO(__cxx_static_address_47a364e6d09683396c15baaf(), Uint8Array));
}

// C/C++ source: source/build/src/cache1d.cpp:253
let __static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount = 0;
export function ageBlocks__cxx_instance_be1e22cc822ed06bb0bc() {

  if ((__static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount >= this.m_numBlocks)) {
    (__static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount = i32((this.m_numBlocks - 1)));
  }
  if ((__static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount < 0)) {
    return;
  }
  let cnt = i32((min__template_774131ccff66371d(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(i32((this.m_maxBlocks >> 4))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(i32((this.m_numBlocks - 1))))).value);
  let ch;
  while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_3 => { cnt = __cxx_lvalue_3; })))) {
    (ch = (u32((u32((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), __static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount).value).lock, Uint8Array).value)) & 255)) & 255));
    if ((i32((i32((i32(ch) - 2)) & 255)) < i32((i32(199) - 1)))) {
      ((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), __static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount).value).lock, Uint8Array).value) = (u32((u32(i32((i32(ch) - 1))) & 255)) & 255));
    }
    if ((((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => __static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount, __cxx_lvalue_5 => { __static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount = __cxx_lvalue_5; })) < 0)) {
      (__static_ageBlocks__cxx_instance_be1e22cc822ed06bb0bc_agecount = i32((this.m_numBlocks - 1)));
    }
  }
}

// C/C++ source: source/build/src/cache1d.cpp:278
const __cxx_literal_8a0c67e55459123fc014 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_b588f020e017fcf3b7b9 = Uint8Array.from([66, 108, 111, 99, 107, 32, 108, 105, 115, 116, 105, 110, 103, 58, 0]);
const __cxx_literal_7d823f9beaeb36174ee3 = Uint8Array.from([37, 52, 100, 32, 0]);
const __cxx_literal_e0585ae9f8693655b407 = Uint8Array.from([64, 32, 37, 120, 58, 32, 0]);
const __cxx_literal_7c2a666ea60df2a311bc = Uint8Array.from([70, 82, 69, 69, 0]);
const __cxx_literal_7556a9a16fdf6502f6e4 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_033345c64d5a1f9918ed = Uint8Array.from([37, 115, 0]);
const __cxx_literal_341072359179768724ba = Uint8Array.from([83, 73, 90, 58, 37, 53, 100, 32, 0]);
const __cxx_literal_00c13c501a4e09921065 = Uint8Array.from([76, 67, 75, 58, 37, 100, 32, 0]);
const __cxx_literal_3b7e95e12b1bc67dbd4c = Uint8Array.from([65, 82, 84, 58, 37, 52, 100, 32, 0]);
const __cxx_literal_c7fbeb0cb1c012797208 = Uint8Array.from([72, 73, 58, 37, 52, 100, 32, 0]);
const __cxx_literal_a92d71664c67646a4166 = Uint8Array.from([86, 79, 88, 58, 37, 52, 100, 32, 0]);
const __cxx_literal_92f81b3773b6867f96a2 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_ea3b9f7b9196cd67a40a = Uint8Array.from([37, 115, 0]);
const __cxx_literal_01b98b4a790e0039327d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_77484fda66c285774f2e = Uint8Array.from([67, 97, 99, 104, 101, 32, 115, 105, 122, 101, 58, 32, 32, 37, 100, 75, 66, 0]);
const __cxx_literal_8eb1c7eef22274c8e68b = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_91f43e27897a14d9eccf = Uint8Array.from([85, 115, 101, 100, 58, 32, 32, 32, 32, 32, 32, 32, 32, 37, 100, 75, 66, 0]);
const __cxx_literal_1b76c6dc527a3abb3498 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_d35d76ea7af902347432 = Uint8Array.from([82, 101, 109, 97, 105, 110, 105, 110, 103, 58, 32, 32, 32, 37, 100, 75, 66, 0]);
const __cxx_literal_353198398a59a43b533d = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 99, 97, 99, 104, 101, 49, 100, 46, 99, 112, 112, 0]);
const __cxx_literal_5ce861339037f5e1099d = Uint8Array.from([66, 108, 111, 99, 107, 32, 99, 111, 117, 110, 116, 58, 32, 37, 100, 47, 37, 100, 0]);
export function report__cxx_instance_062971c8f6e47a11f323() {
  let usedSize = i32(0);
  let h_blocktotile = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 8}, "items": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, {"items": null, "__cxx_anonymous_1": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"count": {"native": "Uint32Array", "offset": 0, "size": 4}, "prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, {"count": u32((Math.trunc(u32(Math.imul(u32(this.m_maxBlocks), 4)) / 3) | 1))}, null, {})}, null, {});
  inthash_init(h_blocktotile);
  for (let j = i64(0); (j < i64(i32((30720 - 1)))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => j, __cxx_lvalue_1 => { j = __cxx_lvalue_1; }))) {
    if (Boolean((cDeref(cPointerOffset(waloff, j, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value))) {
      inthash_add(h_blocktotile, (cDeref(cPointerOffset(waloff, j, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value), j, i32(true));
    }
    if (Boolean((cPointerElementRef(cRecordPointer(classicht, {"align": 8, "arrayAlign": 1, "fields": {"lock": {"native": "Uint8Array", "offset": 12, "size": 1}, "ptr": {"native": "BigInt64Array", "offset": 0, "size": 8}, "upscale": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 8}}, "overlaps": false, "size": 16, "union": false}, {}), j).value).ptr)) {
      inthash_add(h_blocktotile, (cPointerElementRef(cRecordPointer(classicht, {"align": 8, "arrayAlign": 1, "fields": {"lock": {"native": "Uint8Array", "offset": 12, "size": 1}, "ptr": {"native": "BigInt64Array", "offset": 0, "size": 8}, "upscale": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 8}}, "overlaps": false, "size": 16, "union": false}, {}), j).value).ptr, j, i32(true));
    }
    if ((i32((cDeref(cPointerOffset(tiletovox, j, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)) != (-1))) {
      for (let i = i32(0); (i < 5); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
        if (Boolean((cDeref(cPointerOffset((cPointerElementRef(voxoff, (cDeref(cPointerOffset(tiletovox, j, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value), i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value))) {
          inthash_add(h_blocktotile, i64((cDeref(cPointerOffset((cPointerElementRef(voxoff, (cDeref(cPointerOffset(tiletovox, j, Int16Array.BYTES_PER_ELEMENT), Int16Array).value)).value), i, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), j, i32(true));
        }
      }
    }
  }
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_8a0c67e55459123fc014, u32(301), __cxx_literal_b588f020e017fcf3b7b9));
  let reportLineSize = i32(128);
  let buf = cTypedPointer(cStackAlloc(u64(reportLineSize)), Uint8Array);
  for (let i = i32(0); (i < this.m_numBlocks); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    ((cDeref(cPointerOffset(buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    let len = i32(snprintf(buf, u64(reportLineSize), __cxx_literal_7d823f9beaeb36174ee3, i));
    (usedSize = i32((Number(usedSize) + Number((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).leng))));
    if (((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).hand && Boolean((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).hand, BigInt64Array).value)))) {
      (len = i32((Number(len) + Number(snprintf(cPointerOffset(buf, len, Uint8Array.BYTES_PER_ELEMENT), u64(i32((reportLineSize - len))), __cxx_literal_e0585ae9f8693655b407, i32(i64((BigInt((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).hand, BigInt64Array).value)) - BigInt(this.m_baseAddress)))))))));
    } else {
      strcat(buf, __cxx_literal_7c2a666ea60df2a311bc);
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_7556a9a16fdf6502f6e4, u32(320), __cxx_literal_033345c64d5a1f9918ed, buf));
      continue;
    }
    (len = i32((Number(len) + Number(snprintf(cPointerOffset(buf, len, Uint8Array.BYTES_PER_ELEMENT), u64(i32((reportLineSize - len))), __cxx_literal_341072359179768724ba, (cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).leng)))));
    (len = i32((Number(len) + Number(snprintf(cPointerOffset(buf, len, Uint8Array.BYTES_PER_ELEMENT), u64(i32((reportLineSize - len))), __cxx_literal_00c13c501a4e09921065, i32((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).lock, Uint8Array).value)))))));
    let tile = i32(inthash_find(h_blocktotile, (cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).hand, BigInt64Array).value)));
    if ((tile != (-1))) {
      let typestr = (((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).hand, BigInt64Array).value) == (cDeref(cPointerOffset(waloff, tile, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)) ? __cxx_literal_3b7e95e12b1bc67dbd4c : (((cDeref((cPointerElementRef(cRecordPointer(this.m_index, {"align": 8, "arrayAlign": 1, "fields": {"hand": {"offset": 8, "pointer": true, "size": 8}, "leng": {"native": "Int32Array", "offset": 16, "size": 4}, "lock": {"offset": 0, "pointer": true, "size": 8}, "ovh": {"native": "Int32Array", "offset": 20, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {}), i).value).hand, BigInt64Array).value) == (cPointerElementRef(cRecordPointer(classicht, {"align": 8, "arrayAlign": 1, "fields": {"lock": {"native": "Uint8Array", "offset": 12, "size": 1}, "ptr": {"native": "BigInt64Array", "offset": 0, "size": 8}, "upscale": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 8}}, "overlaps": false, "size": 16, "union": false}, {}), tile).value).ptr) ? __cxx_literal_c7fbeb0cb1c012797208 : __cxx_literal_a92d71664c67646a4166));
      (len = i32((Number(len) + Number(snprintf(cPointerOffset(buf, len, Uint8Array.BYTES_PER_ELEMENT), u64(i32((reportLineSize - len))), typestr, tile)))));
    }
    if ((len < reportLineSize)) {
      ((cDeref(cPointerOffset(buf, i32((len - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
    }
    ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_92f81b3773b6867f96a2, u32(341), __cxx_literal_ea3b9f7b9196cd67a40a, buf));
  }
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_01b98b4a790e0039327d, u32(344), __cxx_literal_77484fda66c285774f2e, i32((this.m_totalSize >> 10))));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_8eb1c7eef22274c8e68b, u32(345), __cxx_literal_91f43e27897a14d9eccf, i32((usedSize >> 10))));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_1b76c6dc527a3abb3498, u32(346), __cxx_literal_d35d76ea7af902347432, i32((i32((this.m_totalSize - usedSize)) >> 10))));
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_353198398a59a43b533d, u32(347), __cxx_literal_5ce861339037f5e1099d, this.m_numBlocks, this.m_maxBlocks));
  inthash_free(h_blocktotile);
}

// C/C++ source: source/build/include/compat.h:1428
export function xaligned_alloc__header_42fe08f704a9(alignment, size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function SILENCE_UNUSED__header_f270c6fea349(arg0, arg1) {

}

// C/C++ source: source/build/include/compat.h:1367
export function engineDestroyAllocator__header_011d00a16827() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

export function mulscale32__header_87e16da1b6e2(eax, edx) {
  return i32(i64((BigInt(i64((BigInt(i64(eax)) * BigInt(i64(edx))))) >> BigInt(i32((u32((u32(32) & 255)) & 255))))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: source/build/include/compat.h:1450
export function xaligned_free__header_95a187c835e2(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

export function SILENCE_UNUSED__header_5df8ec5a9ab9(arg0, arg1, arg2) {

}
