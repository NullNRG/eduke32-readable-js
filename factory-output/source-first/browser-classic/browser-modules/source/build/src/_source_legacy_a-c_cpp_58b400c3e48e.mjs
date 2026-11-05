// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/a-c.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_global_cell_82092c85dd1ef591b7bfad4d } from "./engine.cpp.mjs";
import { __cxx_global_cell_895032355ce4415fcae21c5a } from "./engine.cpp.mjs";
import { __cxx_global_cell_18730c9a0e44ac303abc65ca } from "./engine.cpp.mjs";
import { __cxx_private_cell_08e39f37b042ed02c5013c69 } from "./a-c.cpp.mjs";
import { bufplce } from "./engine.cpp.mjs";
import { divtable32 } from "./pragmas.cpp.mjs";
import { __cxx_global_cell_0dfc66b4b4d22501236ea95d } from "./engine.cpp.mjs";
import { __cxx_global_cell_17e326d906bfd20495e4467e } from "./engine.cpp.mjs";
import { __cxx_global_cell_b7e0057dd4e0a0e8decb5847 } from "./engine.cpp.mjs";
import { __cxx_global_cell_a6e3cfd4eba13fb9886cb240 } from "./pragmas.cpp.mjs";
import { libdivide_s32_do } from "../../../browser-abi/libdivide_source.mjs";
import { libdivide_s32_gen } from "../../../browser-abi/libdivide_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { palookupoffse } from "./engine.cpp.mjs";
import { sloptable } from "./engine.cpp.mjs";
import { vince } from "./engine.cpp.mjs";
import { vplce } from "./engine.cpp.mjs";

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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_a7d1ff7e793747d5 = i32(3754936);
function __cxx_static_address_55e37a253533e3e7c7a145eb() {
  return __cxx_static_address_55e37a253533e3e7c7a145eb.reference || (__cxx_static_address_55e37a253533e3e7c7a145eb.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_a7d1ff7e793747d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_e78a7657337498de = i32(1144);
function __cxx_static_address_086aad3710e1ab0b7abf5e0b() {
  return __cxx_static_address_086aad3710e1ab0b7abf5e0b.reference || (__cxx_static_address_086aad3710e1ab0b7abf5e0b.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_e78a7657337498de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let transmode = i32(0);
function __cxx_static_address_9aa917fe275d0cd39c0e94bf() {
  return __cxx_static_address_9aa917fe275d0cd39c0e94bf.reference || (__cxx_static_address_9aa917fe275d0cd39c0e94bf.reference = {
    __cReference: true,
    get value() { return transmode; },
    set value(__cxx_lvalue_0) { transmode = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_9aa917fe275d0cd39c0e94bf() { return __cxx_static_address_9aa917fe275d0cd39c0e94bf(); }

// C/C++ source: source/build/src/a-c.cpp:31
export let gbuf = null;
function __cxx_static_address_22041f041b11566b4a219496() {
  return __cxx_static_address_22041f041b11566b4a219496.reference || (__cxx_static_address_22041f041b11566b4a219496.reference = {
    __cReference: true,
    get value() { return gbuf; },
    set value(__cxx_lvalue_0) { gbuf = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_22041f041b11566b4a219496() { return __cxx_static_address_22041f041b11566b4a219496(); }

// C/C++ source: source/build/src/a-c.cpp:32
export let glogx = 0;
function __cxx_static_address_7570717bd938431cbd93672c() {
  return __cxx_static_address_7570717bd938431cbd93672c.reference || (__cxx_static_address_7570717bd938431cbd93672c.reference = {
    __cReference: true,
    get value() { return glogx; },
    set value(__cxx_lvalue_0) { glogx = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_7570717bd938431cbd93672c() { return __cxx_static_address_7570717bd938431cbd93672c(); }

export let glogy = 0;
function __cxx_static_address_d44ff7f9144b4a045ba0e5d9() {
  return __cxx_static_address_d44ff7f9144b4a045ba0e5d9.reference || (__cxx_static_address_d44ff7f9144b4a045ba0e5d9.reference = {
    __cReference: true,
    get value() { return glogy; },
    set value(__cxx_lvalue_0) { glogy = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_d44ff7f9144b4a045ba0e5d9() { return __cxx_static_address_d44ff7f9144b4a045ba0e5d9(); }

// C/C++ source: source/build/src/a-c.cpp:33
export let gpinc = 0;
export function __cxx_global_cell_f73a7c611278ae39b7b9ad95() {
  return __cxx_global_cell_f73a7c611278ae39b7b9ad95.reference || (__cxx_global_cell_f73a7c611278ae39b7b9ad95.reference = {
    __cReference: true,
    get value() { return gpinc; },
    set value(__cxx_lvalue_0) { gpinc = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:34
export let gbxinc = 0;
function __cxx_static_address_746de1f23df795448427ba94() {
  return __cxx_static_address_746de1f23df795448427ba94.reference || (__cxx_static_address_746de1f23df795448427ba94.reference = {
    __cReference: true,
    get value() { return gbxinc; },
    set value(__cxx_lvalue_0) { gbxinc = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_746de1f23df795448427ba94() { return __cxx_static_address_746de1f23df795448427ba94(); }

export let gbyinc = 0;
function __cxx_static_address_4ae885815807b83a5016eb2f() {
  return __cxx_static_address_4ae885815807b83a5016eb2f.reference || (__cxx_static_address_4ae885815807b83a5016eb2f.reference = {
    __cReference: true,
    get value() { return gbyinc; },
    set value(__cxx_lvalue_0) { gbyinc = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_4ae885815807b83a5016eb2f() { return __cxx_static_address_4ae885815807b83a5016eb2f(); }

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_c9123f4f75cb056b = i32(2147483647);
function __cxx_static_address_7f34366c1603b079c45b1d92() {
  return __cxx_static_address_7f34366c1603b079c45b1d92.reference || (__cxx_static_address_7f34366c1603b079c45b1d92.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_c9123f4f75cb056b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_f2c0a39d05116715 = i32(2147483648);
function __cxx_static_address_f290ff8f285eb3e8e26746e7() {
  return __cxx_static_address_f290ff8f285eb3e8e26746e7.reference || (__cxx_static_address_f290ff8f285eb3e8e26746e7.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_f2c0a39d05116715; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c99f1792c3a553a6 = i32(2147483648);
function __cxx_static_address_9738d8767c372602cf002c32() {
  return __cxx_static_address_9738d8767c372602cf002c32.reference || (__cxx_static_address_9738d8767c372602cf002c32.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c99f1792c3a553a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_b9fb9d14c629fddb = i32(65536);
function __cxx_static_address_22d6e0cfde8d70a034d1a397() {
  return __cxx_static_address_22d6e0cfde8d70a034d1a397.reference || (__cxx_static_address_22d6e0cfde8d70a034d1a397.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_b9fb9d14c629fddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_3d2360ac85a99e08 = i32(32768);
function __cxx_static_address_a39689cc6dd54d1ebac80c39() {
  return __cxx_static_address_a39689cc6dd54d1ebac80c39.reference || (__cxx_static_address_a39689cc6dd54d1ebac80c39.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_3d2360ac85a99e08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_67ef219796cc7ffc = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_c8d6528c236357cf30d7cef9() {
  return __cxx_static_address_c8d6528c236357cf30d7cef9.reference || (__cxx_static_address_c8d6528c236357cf30d7cef9.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_67ef219796cc7ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:35
export let gpal = null;
function __cxx_static_address_d1618eacc5ba224050538fb0() {
  return __cxx_static_address_d1618eacc5ba224050538fb0.reference || (__cxx_static_address_d1618eacc5ba224050538fb0.reference = {
    __cReference: true,
    get value() { return gpal; },
    set value(__cxx_lvalue_0) { gpal = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_d1618eacc5ba224050538fb0() { return __cxx_static_address_d1618eacc5ba224050538fb0(); }

export let ghlinepal = null;
function __cxx_static_address_cc1156dd7b32ac0a09a14194() {
  return __cxx_static_address_cc1156dd7b32ac0a09a14194.reference || (__cxx_static_address_cc1156dd7b32ac0a09a14194.reference = {
    __cReference: true,
    get value() { return ghlinepal; },
    set value(__cxx_lvalue_0) { ghlinepal = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_cc1156dd7b32ac0a09a14194() { return __cxx_static_address_cc1156dd7b32ac0a09a14194(); }

export let gtrans = null;
function __cxx_static_address_e49878c5ee3c24762fc31d7c() {
  return __cxx_static_address_e49878c5ee3c24762fc31d7c.reference || (__cxx_static_address_e49878c5ee3c24762fc31d7c.reference = {
    __cReference: true,
    get value() { return gtrans; },
    set value(__cxx_lvalue_0) { gtrans = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_e49878c5ee3c24762fc31d7c() { return __cxx_static_address_e49878c5ee3c24762fc31d7c(); }

// C/C++ source: source/build/src/a-c.cpp:36
export let gpal2 = null;
function __cxx_static_address_90869b78067f120311d76d19() {
  return __cxx_static_address_90869b78067f120311d76d19.reference || (__cxx_static_address_90869b78067f120311d76d19.reference = {
    __cReference: true,
    get value() { return gpal2; },
    set value(__cxx_lvalue_0) { gpal2 = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_90869b78067f120311d76d19() { return __cxx_static_address_90869b78067f120311d76d19(); }

// C/C++ source: source/build/src/a-c.cpp:39
export function setvlinebpl(dabpl) {
  (__cxx_private_cell_08e39f37b042ed02c5013c69().value = i32(dabpl));
}

// C/C++ source: source/build/src/a-c.cpp:40
export function fixtransluscence(datransoff) {
  (gtrans = cTypedPointer(cSourceAddresses.decode(datransoff), Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:44
export function settransnormal() {
  (transmode = i32(0));
}

// C/C++ source: source/build/src/a-c.cpp:45
export function settransreverse() {
  (transmode = i32(1));
}

// C/C++ source: source/build/src/a-c.cpp:50
export function sethlinesizes(logx, logy, bufplc) {
  (glogx = i32(logx));
  (glogy = i32(logy));
  (gbuf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:52
export function setpalookupaddress(paladdr) {
  (ghlinepal = paladdr);
}

// C/C++ source: source/build/src/a-c.cpp:53
export function setuphlineasm4(bxinc, byinc) {
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
}

// C/C++ source: source/build/src/a-c.cpp:54
export function hlineasm4(cnt, skiploadincs, paloffs, by, bx, p) {
  void 0;
  if ((!Boolean(skiploadincs))) {
    (gbxinc = i32(__cxx_global_cell_82092c85dd1ef591b7bfad4d().value));
    (gbyinc = i32(__cxx_global_cell_895032355ce4415fcae21c5a().value));
  }
  let palptr = cPointerOffset(ghlinepal, paloffs, Uint8Array.BYTES_PER_ELEMENT);
  let buf = gbuf;
  let inc = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": gbxinc, "y": gbyinc}, null, {});
  let log = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": glogx, "y": glogy}, null, {});
  let log32 = cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, {"x": i32((32 - log.x)), "y": i32((32 - log.y))}, null, {});
  let pp = cTypedPointer(cSourceAddresses.decode(p), Uint8Array);
  for (; (cnt >= i64(4)); ((cnt = i64((BigInt(cnt) - BigInt(i64(4))))), (pp = cPointerOffset(pp, -(4), Uint8Array.BYTES_PER_ELEMENT)))) {
    ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(palptr, (cDeref(cPointerOffset(buf, u32((u32(((bx >>> log32.x) << log.y)) + (by >>> log32.y))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(pp, -(1), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(palptr, (cDeref(cPointerOffset(buf, u32((u32(((u32((bx - u32(inc.x))) >>> log32.x) << log.y)) + (u32((by - u32(inc.y))) >>> log32.y))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(pp, -(2), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(palptr, (cDeref(cPointerOffset(buf, u32((u32(((u32((bx - u32(i32((inc.x << 1))))) >>> log32.x) << log.y)) + (u32((by - u32(i32((inc.y << 1))))) >>> log32.y))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(pp, -(3), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(palptr, (cDeref(cPointerOffset(buf, u32((u32(((u32((bx - u32(i32(Math.imul(inc.x, 3))))) >>> log32.x) << log.y)) + (u32((by - u32(i32(Math.imul(inc.y, 3))))) >>> log32.y))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    (bx = u32((Number(bx) - Number(u32(i32((inc.x << 2)))))));
    (by = u32((Number(by) - Number(u32(i32((inc.y << 2)))))));
  }
  for (; (cnt >= i64(0)); (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; })), ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, -1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => pp, __cxx_lvalue_3 => { pp = __cxx_lvalue_3; })))) {
    ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(palptr, (cDeref(cPointerOffset(buf, u32((u32(((bx >>> log32.x) << log.y)) + (by >>> log32.y))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    (bx = u32((Number(bx) - Number(u32(inc.x)))));
    (by = u32((Number(by) - Number(u32(inc.y)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:96
export function slopevlin(p, i, slopaloffs, cnt, bx, by) {
  let slopalptr;
  let bz;
  let bzinc;
  let u;
  let v;
  (bz = i32(__cxx_global_cell_18730c9a0e44ac303abc65ca().value));
  (bzinc = i32(i64((BigInt(__cxx_global_cell_82092c85dd1ef591b7bfad4d().value) >> BigInt(3)))));
  (slopalptr = cTypedPointer(cSourceAddresses.decode(slopaloffs), BigInt64Array));
  for (; (cnt > i64(0)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))) {
    (i = i32((cDeref(cPointerOffset(sloptable, i32((i32((bz >> 6)) + i32((32768 >> 1)))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    (bz = i32((Number(bz) + Number(bzinc))));
    (u = u32(i64((BigInt(i64(bx)) + BigInt(i64((BigInt(i64(__cxx_global_cell_17e326d906bfd20495e4467e().value)) * BigInt(i64(i)))))))));
    (v = u32(i64((BigInt(i64(by)) + BigInt(i64((BigInt(i64(__cxx_global_cell_b7e0057dd4e0a0e8decb5847().value)) * BigInt(i64(i)))))))));
    ((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value) = (u32((cDeref(cTypedPointer(cSourceAddresses.decode(i64((BigInt(i64((cDeref(cPointerOffset(slopalptr, 0, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value))) + BigInt(i64((cDeref(cPointerOffset(gbuf, u32((u32(((u >>> i32((32 - glogx))) << glogy)) + (v >>> i32((32 - glogy))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), Uint8Array), Uint8Array).value)) & 255));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, -1, BigInt64Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => slopalptr, __cxx_lvalue_3 => { slopalptr = __cxx_lvalue_3; }));
    (p = i64((BigInt(p) + BigInt(i64(gpinc)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:121
export function ourmulscale32(a, b) {
  return u32(u64((BigInt(u64((BigInt(u64(a)) * BigInt(u64(b))))) >> BigInt(32))));
}

// C/C++ source: source/build/src/a-c.cpp:126
export function getpix(logy, buf, vplc) {
  return i32((Boolean(logy) ? (cDeref(cPointerOffset(buf, (vplc >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) : (cDeref(cPointerOffset(buf, ourmulscale32(vplc, u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
}

// C/C++ source: source/build/src/a-c.cpp:131
export function setupvlineasm(neglogy) {
  (glogy = i32(neglogy));
}

// C/C++ source: source/build/src/a-c.cpp:133
export function vlineasm1(vinc, paloffs, cnt, vplc, bufplc, p) {
  let buf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array);
  let pal = cTypedPointer(cSourceAddresses.decode(paloffs), Uint8Array);
  let logy = i32(glogy);
  let ourbpl = i32(__cxx_private_cell_08e39f37b042ed02c5013c69().value);
  let pp = cTypedPointer(cSourceAddresses.decode(p), Uint8Array);
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }));
  if (Boolean(logy)) {
    for (; (cnt >= i64(4)); (cnt = i64((BigInt(cnt) - BigInt(i64(4)))))) {
      ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, (vplc >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, (u32((vplc + u32(vinc))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(pp, i32((ourbpl << 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, (u32((vplc + u32(i32((vinc << 1))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(pp, i32(Math.imul(ourbpl, 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, (u32((vplc + u32(i32(Math.imul(vinc, 3))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      (pp = cPointerOffset(pp, i32((ourbpl << 2)), Uint8Array.BYTES_PER_ELEMENT));
      (vplc = u32((Number(vplc) + Number(u32(i32((vinc << 2)))))));
    }
    while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_3 => { cnt = __cxx_lvalue_3; })))) {
      ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, (vplc >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      (pp = cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
      (vplc = u32((Number(vplc) + Number(u32(vinc)))));
    }
  } else {
    for (; (cnt >= i64(4)); (cnt = i64((BigInt(cnt) - BigInt(i64(4)))))) {
      ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, ourmulscale32(vplc, u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, ourmulscale32(u32((vplc + u32(vinc))), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(pp, i32((ourbpl << 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, ourmulscale32(u32((vplc + u32(i32((vinc << 1))))), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(pp, i32(Math.imul(ourbpl, 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, ourmulscale32(u32((vplc + u32(i32(Math.imul(vinc, 3))))), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      (pp = cPointerOffset(pp, i32((ourbpl << 2)), Uint8Array.BYTES_PER_ELEMENT));
      (vplc = u32((Number(vplc) + Number(u32(i32((vinc << 2)))))));
    }
    while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i64((previous - 1n)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_5 => { cnt = __cxx_lvalue_5; })))) {
      (((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, ourmulscale32(vplc, u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)), (pp = cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT)));
      (vplc = u32((Number(vplc) + Number(u32(vinc)))));
    }
  }
  return i32(vplc);
}

// C/C++ source: source/build/src/a-c.cpp:219
export function vlineasm4nlogy(cnt, p, pal, buf, vplc, vinc) {
  let ourbpl = i32(__cxx_private_cell_08e39f37b042ed02c5013c69().value);
  do {
    ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), ourmulscale32((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), ourmulscale32((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), ourmulscale32((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), ourmulscale32((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = u32((Number(__cxx_lvalue_1.value) + Number(u32((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((Number(__cxx_lvalue_2.value) + Number(u32((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((Number(__cxx_lvalue_3.value) + Number(u32((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    (p = cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
  } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i64((previous - 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_5 => { cnt = __cxx_lvalue_5; }))));
  memcpy(cPointerOffset(vplce, 0, Uint32Array.BYTES_PER_ELEMENT), cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), u64((BigInt(4) * BigInt(u64(4)))));
}

// C/C++ source: source/build/src/a-c.cpp:251
export function vlineasm4(cnt, p) {
  let pal = cPointerArray(4, [cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 0, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 1, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 2, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 3, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array)]);
  let buf = cPointerArray(4, [cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 0, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 1, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 2, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 3, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array)]);
  let vinc = new Int32Array([(cDeref(cPointerOffset(vince, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(vince, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(vince, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(vince, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)]);
  let vplc = new Uint32Array([(cDeref(cPointerOffset(vplce, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), (cDeref(cPointerOffset(vplce, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), (cDeref(cPointerOffset(vplce, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), (cDeref(cPointerOffset(vplce, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)]);
  let logy = i32(glogy);
  let ourbpl = i32(__cxx_private_cell_08e39f37b042ed02c5013c69().value);
  if ((!Boolean(logy))) {
    vlineasm4nlogy(cnt, p, pal, buf, vplc, vinc);
    return;
  }
  for (; (cnt >= i64(4)); (cnt = i64((BigInt(cnt) - BigInt(i64(4)))))) {
    ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), ((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), ((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), ((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), ((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), (u32(((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT), 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), (u32(((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT), 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), (u32(((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT), 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), (u32(((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32((ourbpl << 1)), Uint8Array.BYTES_PER_ELEMENT), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), (u32(((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 1))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32((ourbpl << 1)), Uint8Array.BYTES_PER_ELEMENT), 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), (u32(((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 1))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32((ourbpl << 1)), Uint8Array.BYTES_PER_ELEMENT), 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), (u32(((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 1))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32((ourbpl << 1)), Uint8Array.BYTES_PER_ELEMENT), 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), (u32(((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 1))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32(Math.imul(ourbpl, 3)), Uint8Array.BYTES_PER_ELEMENT), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), (u32(((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(Math.imul((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 3))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32(Math.imul(ourbpl, 3)), Uint8Array.BYTES_PER_ELEMENT), 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), (u32(((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(Math.imul((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 3))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32(Math.imul(ourbpl, 3)), Uint8Array.BYTES_PER_ELEMENT), 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), (u32(((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(Math.imul((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 3))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(cPointerOffset(p, i32(Math.imul(ourbpl, 3)), Uint8Array.BYTES_PER_ELEMENT), 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), (u32(((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) + u32(i32(Math.imul((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), 3))))) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32(i32(((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 2))))))))(cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = u32((Number(__cxx_lvalue_1.value) + Number(u32(i32(((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 2))))))))(cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((Number(__cxx_lvalue_2.value) + Number(u32(i32(((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 2))))))))(cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((Number(__cxx_lvalue_3.value) + Number(u32(i32(((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) << 2))))))))(cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    (p = cPointerOffset(p, i32((ourbpl << 2)), Uint8Array.BYTES_PER_ELEMENT));
  }
  while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i64((previous - 1n)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_5 => { cnt = __cxx_lvalue_5; })))) {
    ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), ((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), ((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), ((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), (cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), ((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = u32((Number(__cxx_lvalue_6.value) + Number(u32((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = u32((Number(__cxx_lvalue_7.value) + Number(u32((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_8) => (__cxx_lvalue_8.value = u32((Number(__cxx_lvalue_8.value) + Number(u32((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    ((__cxx_lvalue_9) => (__cxx_lvalue_9.value = u32((Number(__cxx_lvalue_9.value) + Number(u32((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
    (p = cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
  }
  memcpy(cPointerOffset(vplce, 0, Uint32Array.BYTES_PER_ELEMENT), cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), u64((BigInt(4) * BigInt(u64(4)))));
}

// C/C++ source: source/build/src/a-c.cpp:330
export let g_saturate = 0;
function __cxx_static_address_97546b2e341941f0fb9652d0() {
  return __cxx_static_address_97546b2e341941f0fb9652d0.reference || (__cxx_static_address_97546b2e341941f0fb9652d0.reference = {
    __cReference: true,
    get value() { return g_saturate; },
    set value(__cxx_lvalue_0) { g_saturate = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_97546b2e341941f0fb9652d0() { return __cxx_static_address_97546b2e341941f0fb9652d0(); }

// C/C++ source: source/build/src/a-c.cpp:336
export function setupmvlineasm(neglogy, dosaturate) {
  (glogy = i32(neglogy));
  (g_saturate = i32((-i32((!(!Boolean(dosaturate)))))));
}

// C/C++ source: source/build/src/a-c.cpp:343
export function mvlineasm1(vinc, paloffs, cnt, vplc, bufplc, p) {
  let ch;
  let buf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array);
  let pal = cTypedPointer(cSourceAddresses.decode(paloffs), Uint8Array);
  let logy = i32(glogy);
  let ourbpl = i32(__cxx_private_cell_08e39f37b042ed02c5013c69().value);
  let pp = cTypedPointer(cSourceAddresses.decode(p), Uint8Array);
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }));
  if ((!Boolean(logy))) {
    do {
      (ch = (u32((cDeref(cPointerOffset(buf, ourmulscale32(vplc, u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (pp = cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
      (vplc = u32((Number(vplc) + Number(u32(vinc)))));
      (vplc = u32((vplc | u32(i32((g_saturate & (-i32((vplc < u32(vinc))))))))));
    } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_3 => { cnt = __cxx_lvalue_3; }))));
    return i32(vplc);
  }
  do {
    if ((i32((cDeref(cPointerOffset(buf, (vplc >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 255)) {
      ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(pal, (cDeref(cPointerOffset(buf, (vplc >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (pp = cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
    (vplc = u32((Number(vplc) + Number(u32(vinc)))));
    (vplc = u32((vplc | u32(i32((g_saturate & (-i32((vplc < u32(vinc))))))))));
  } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i64((previous - 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_5 => { cnt = __cxx_lvalue_5; }))));
  return i32(vplc);
}

// C/C++ source: source/build/src/a-c.cpp:384
export function mvlineasm4(cnt, p) {
  let pal = cPointerArray(4, [cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 0, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 1, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 2, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(palookupoffse, 3, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array)]);
  let buf = cPointerArray(4, [cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 0, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 1, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 2, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array), cTypedPointer(cSourceAddresses.decode((cDeref(cPointerOffset(bufplce, 3, BigInt64Array.BYTES_PER_ELEMENT), BigInt64Array).value)), Uint8Array)]);
  let vinc = new Int32Array([(cDeref(cPointerOffset(vince, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(vince, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(vince, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value), (cDeref(cPointerOffset(vince, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)]);
  let vplc = new Uint32Array([(cDeref(cPointerOffset(vplce, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), (cDeref(cPointerOffset(vplce, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), (cDeref(cPointerOffset(vplce, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), (cDeref(cPointerOffset(vplce, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value)]);
  let logy = i32(glogy);
  let ourbpl = i32(__cxx_private_cell_08e39f37b042ed02c5013c69().value);
  let ch;
  if (Boolean(logy)) {
    do {
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), ((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), ((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), ((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), ((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> logy), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u32((Number(__cxx_lvalue_0.value) + Number(u32((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = u32((Number(__cxx_lvalue_1.value) + Number(u32((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = u32((Number(__cxx_lvalue_2.value) + Number(u32((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = u32((Number(__cxx_lvalue_3.value) + Number(u32((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = u32((__cxx_lvalue_4.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_5) => (__cxx_lvalue_5.value = u32((__cxx_lvalue_5.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = u32((__cxx_lvalue_6.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = u32((__cxx_lvalue_7.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      (p = cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
    } while (Boolean(((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i64((previous - 1n)); __cxx_lvalue_8.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_9 => { cnt = __cxx_lvalue_9; }))));
  } else {
    do {
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 0).value), ourmulscale32((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 0).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 1).value), ourmulscale32((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 1).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 2).value), ourmulscale32((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 2).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      (ch = (u32((cDeref(cPointerOffset((cPointerElementRef(buf, 3).value), ourmulscale32((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value), u32(__cxx_global_cell_0dfc66b4b4d22501236ea95d().value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      if ((i32(ch) != 255)) {
        ((cDeref(cPointerOffset(p, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset((cPointerElementRef(pal, 3).value), ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      }
      ((__cxx_lvalue_10) => (__cxx_lvalue_10.value = u32((Number(__cxx_lvalue_10.value) + Number(u32((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_11) => (__cxx_lvalue_11.value = u32((Number(__cxx_lvalue_11.value) + Number(u32((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_12) => (__cxx_lvalue_12.value = u32((Number(__cxx_lvalue_12.value) + Number(u32((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_13) => (__cxx_lvalue_13.value = u32((Number(__cxx_lvalue_13.value) + Number(u32((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)))))))(cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_14) => (__cxx_lvalue_14.value = u32((__cxx_lvalue_14.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 0, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_15) => (__cxx_lvalue_15.value = u32((__cxx_lvalue_15.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 1, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 1, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_16) => (__cxx_lvalue_16.value = u32((__cxx_lvalue_16.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 2, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      ((__cxx_lvalue_17) => (__cxx_lvalue_17.value = u32((__cxx_lvalue_17.value | u32(i32((g_saturate & (-i32(((cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) < u32((cDeref(cPointerOffset(vinc, 3, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))))))))))(cDeref(cPointerOffset(vplc, 3, Uint32Array.BYTES_PER_ELEMENT), Uint32Array));
      (p = cPointerOffset(p, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
    } while (Boolean(((__cxx_lvalue_18) => { const previous = __cxx_lvalue_18.value; const next = i64((previous - 1n)); __cxx_lvalue_18.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_19 => { cnt = __cxx_lvalue_19; }))));
  }
  memcpy(cPointerOffset(vplce, 0, Uint32Array.BYTES_PER_ELEMENT), cPointerOffset(vplc, 0, Uint32Array.BYTES_PER_ELEMENT), u64((BigInt(4) * BigInt(u64(4)))));
}

// C/C++ source: source/build/src/a-c.cpp:462
export function setuptvlineasm(neglogy, dosaturate) {
  (glogy = i32(neglogy));
  (g_saturate = i32((-i32((!(!Boolean(dosaturate)))))));
}

// C/C++ source: source/build/src/a-c.cpp:469
export function tvlineasm1(vinc, paloffs, cnt, vplc, bufplc, p) {
  let ch;
  let buf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array);
  let pal = cTypedPointer(cSourceAddresses.decode(paloffs), Uint8Array);
  let trans = cTypedPointer(gtrans, Uint8Array);
  let logy = i32(glogy);
  let ourbpl = i32(__cxx_private_cell_08e39f37b042ed02c5013c69().value);
  let transm = i32(transmode);
  let pp = cTypedPointer(cSourceAddresses.decode(p), Uint8Array);
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }));
  let shift = (u32((u32(i32((transm << 3))) & 255)) & 255);
  do {
    (ch = (u32((u32(getpix(logy, buf, vplc)) & 255)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(pp, Uint8Array).value) = (u32((cDeref(cPointerOffset(trans, i32((i32((i32((cDeref(pp, Uint8Array).value)) << i32((8 - i32(shift))))) | i32((i32((cDeref(cPointerOffset(pal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32(shift))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (pp = cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
    (vplc = u32((Number(vplc) + Number(u32(vinc)))));
    ;
  } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_3 => { cnt = __cxx_lvalue_3; }))));
  return i32(vplc);
}

// C/C++ source: source/build/src/a-c.cpp:496
export function setuptvlineasm2(neglogy, paloffs1, paloffs2) {
  (glogy = i32(neglogy));
  (gpal = cTypedPointer(cSourceAddresses.decode(paloffs1), Uint8Array));
  (gpal2 = cTypedPointer(cSourceAddresses.decode(paloffs2), Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:505
export function tvlineasm2(vplc2, vinc1, bufplc1, bufplc2, vplc1, p) {
  let ch;
  let cnt = i64(tabledivide32__header_ae98b977268b(i32(i64((BigInt(i64((BigInt(__cxx_global_cell_895032355ce4415fcae21c5a().value) - BigInt(p)))) - BigInt(i64(1))))), __cxx_private_cell_08e39f37b042ed02c5013c69().value));
  let vinc2 = i32(__cxx_global_cell_82092c85dd1ef591b7bfad4d().value);
  let buf1 = cTypedPointer(cSourceAddresses.decode(bufplc1), Uint8Array);
  let buf2 = cTypedPointer(cSourceAddresses.decode(bufplc2), Uint8Array);
  let logy = i32(glogy);
  let ourbpl = i32(__cxx_private_cell_08e39f37b042ed02c5013c69().value);
  let transm = i32(transmode);
  let pp = cTypedPointer(cSourceAddresses.decode(p), Uint8Array);
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }));
  let shift = (u32((u32(i32((transm << 3))) & 255)) & 255);
  do {
    (ch = (u32((u32(getpix(logy, buf1, vplc1)) & 255)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cPointerOffset(pp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(gtrans, i32((i32((i32((cDeref(cPointerOffset(pp, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32((8 - i32(shift))))) | i32((i32((cDeref(cPointerOffset(gpal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32(shift))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (vplc1 = u32((Number(vplc1) + Number(u32(vinc1)))));
    ;
    (ch = (u32((u32(getpix(logy, buf2, vplc2)) & 255)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cPointerOffset(pp, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((cDeref(cPointerOffset(gtrans, i32((i32((i32((cDeref(cPointerOffset(pp, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32((8 - i32(shift))))) | i32((i32((cDeref(cPointerOffset(gpal2, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32(shift))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (vplc2 = u32((Number(vplc2) + Number(u32(vinc2)))));
    ;
    (pp = cPointerOffset(pp, ourbpl, Uint8Array.BYTES_PER_ELEMENT));
  } while ((((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => cnt, __cxx_lvalue_3 => { cnt = __cxx_lvalue_3; })) > i64(0)));
  (__cxx_global_cell_82092c85dd1ef591b7bfad4d().value = i64(vplc1));
  (__cxx_global_cell_895032355ce4415fcae21c5a().value = i64(vplc2));
}

// C/C++ source: source/build/src/a-c.cpp:543
export function msethlineshift(logx, logy) {
  (glogx = i32(logx));
  (glogy = i32(logy));
}

// C/C++ source: source/build/src/a-c.cpp:545
export function mhline(bufplc, bx, cntup16, junk, by, p) {
  let ch;
  let xinc = i32(__cxx_global_cell_82092c85dd1ef591b7bfad4d().value);
  let yinc = i32(__cxx_global_cell_895032355ce4415fcae21c5a().value);
  (junk = i32(junk));
  (gbuf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array));
  (gpal = cTypedPointer(cSourceAddresses.decode(__cxx_global_cell_18730c9a0e44ac303abc65ca().value), Uint8Array));
  (cntup16 = i32((cntup16 >> 16)));
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cntup16, __cxx_lvalue_1 => { cntup16 = __cxx_lvalue_1; }));
  do {
    (ch = (u32((cDeref(cPointerOffset(gbuf, u32((u32(((bx >>> i32((32 - glogx))) << glogy)) + (by >>> i32((32 - glogy))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value) = (u32((cDeref(cPointerOffset(gpal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (bx = u32((Number(bx) + Number(u32(xinc)))));
    (by = u32((Number(by) + Number(u32(yinc)))));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous + 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; }));
  } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => cntup16, __cxx_lvalue_5 => { cntup16 = __cxx_lvalue_5; }))));
}

// C/C++ source: source/build/src/a-c.cpp:569
export function tsethlineshift(logx, logy) {
  (glogx = i32(logx));
  (glogy = i32(logy));
}

// C/C++ source: source/build/src/a-c.cpp:571
export function thline(bufplc, bx, cntup16, junk, by, p) {
  let ch;
  let xinc = i32(__cxx_global_cell_82092c85dd1ef591b7bfad4d().value);
  let yinc = i32(__cxx_global_cell_895032355ce4415fcae21c5a().value);
  (junk = i32(junk));
  (gbuf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array));
  (gpal = cTypedPointer(cSourceAddresses.decode(__cxx_global_cell_18730c9a0e44ac303abc65ca().value), Uint8Array));
  (cntup16 = i32((cntup16 >> 16)));
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cntup16, __cxx_lvalue_1 => { cntup16 = __cxx_lvalue_1; }));
  let shift = (u32((u32(i32((transmode << 3))) & 255)) & 255);
  do {
    (ch = (u32((cDeref(cPointerOffset(gbuf, u32((u32(((bx >>> i32((32 - glogx))) << glogy)) + (by >>> i32((32 - glogy))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value) = (u32((cDeref(cPointerOffset(gtrans, i32((i32((i32((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value)) << i32((8 - i32(shift))))) | i32((i32((cDeref(cPointerOffset(gpal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32(shift))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (bx = u32((Number(bx) + Number(u32(xinc)))));
    (by = u32((Number(by) + Number(u32(yinc)))));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i64((previous + 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; }));
  } while (Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => cntup16, __cxx_lvalue_5 => { cntup16 = __cxx_lvalue_5; }))));
}

// C/C++ source: source/build/src/a-c.cpp:600
export function setupspritevline(paloffs, bxinc, byinc, ysiz) {
  (gpal = cTypedPointer(cSourceAddresses.decode(paloffs), Uint8Array));
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
  (glogy = i32(ysiz));
}

// C/C++ source: source/build/src/a-c.cpp:607
export function spritevline(bx, by, cnt, bufplc, p) {
  (gbuf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array));
  for (; (cnt > i64(1)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))) {
    ((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value) = (u32((cDeref(cPointerOffset(gpal, (cDeref(cPointerOffset(gbuf, i32((i32(Math.imul(i32((bx >> 16)), glogy)) + i32((by >> 16)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    (bx = i32((Number(bx) + Number(gbxinc))));
    (by = i32((Number(by) + Number(gbyinc))));
    (p = i64((BigInt(p) + BigInt(i64(__cxx_private_cell_08e39f37b042ed02c5013c69().value)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:620
export function msetupspritevline(paloffs, bxinc, byinc, ysiz) {
  (gpal = cTypedPointer(cSourceAddresses.decode(paloffs), Uint8Array));
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
  (glogy = i32(ysiz));
}

// C/C++ source: source/build/src/a-c.cpp:627
export function mspritevline(bx, by, cnt, bufplc, p) {
  let ch;
  (gbuf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array));
  for (; (cnt > i64(1)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))) {
    (ch = (u32((cDeref(cPointerOffset(gbuf, i32((i32(Math.imul(i32((bx >> 16)), glogy)) + i32((by >> 16)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value) = (u32((cDeref(cPointerOffset(gpal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (bx = i32((Number(bx) + Number(gbxinc))));
    (by = i32((Number(by) + Number(gbyinc))));
    (p = i64((BigInt(p) + BigInt(i64(__cxx_private_cell_08e39f37b042ed02c5013c69().value)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:642
export function tsetupspritevline(paloffs, bxinc, byinc, ysiz) {
  (gpal = cTypedPointer(cSourceAddresses.decode(paloffs), Uint8Array));
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
  (glogy = i32(ysiz));
}

// C/C++ source: source/build/src/a-c.cpp:649
export function tspritevline(bx, by, cnt, bufplc, p) {
  let ch;
  (gbuf = cTypedPointer(cSourceAddresses.decode(bufplc), Uint8Array));
  let shift = (u32((u32(i32((transmode << 3))) & 255)) & 255);
  for (; (cnt > i64(1)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))) {
    (ch = (u32((cDeref(cPointerOffset(gbuf, i32((i32(Math.imul(i32((bx >> 16)), glogy)) + i32((by >> 16)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value) = (u32((cDeref(cPointerOffset(gtrans, i32((i32((i32((cDeref(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), Uint8Array).value)) << i32((8 - i32(shift))))) + i32((i32((cDeref(cPointerOffset(gpal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32(shift))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (bx = i32((Number(bx) + Number(gbxinc))));
    (by = i32((Number(by) + Number(gbyinc))));
    (p = i64((BigInt(p) + BigInt(i64(__cxx_private_cell_08e39f37b042ed02c5013c69().value)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:667
export function setupdrawslab(dabpl, pal) {
  (__cxx_private_cell_08e39f37b042ed02c5013c69().value = i32(dabpl));
  (gpal = cTypedPointer(cSourceAddresses.decode(pal), Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:673
export function drawslab(dx, v, dy, vi, vptr, p) {
  do {
    let c = (u32((cDeref(cPointerOffset(gpal, i32((cDeref(cTypedPointer(cSourceAddresses.decode(i64((BigInt(i64(i32((v >> 16)))) + BigInt(vptr)))), Uint8Array), Uint8Array).value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
    for (let x = i32(0); (x < dx); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; }))) {
      ((cDeref(cPointerOffset(cTypedPointer(cSourceAddresses.decode(p), Uint8Array), x, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(c) & 255));
    }
    (p = i64((BigInt(p) + BigInt(i64(__cxx_private_cell_08e39f37b042ed02c5013c69().value)))));
    (v = i32((Number(v) + Number(vi))));
  } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => dy, __cxx_lvalue_3 => { dy = __cxx_lvalue_3; }))));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_57cafba49656a1f1 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_56c35658398e128fe4dd492b() {
  return __cxx_static_address_56c35658398e128fe4dd492b.reference || (__cxx_static_address_56c35658398e128fe4dd492b.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_57cafba49656a1f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_56c35658398e128fe4dd492b() { return __cxx_static_address_56c35658398e128fe4dd492b(); }

// C/C++ source: source/build/include/pragmas.h:121
export function tabledivide32__header_ae98b977268b(n, d) {

  if (Boolean(i32((i32((d != __cxx_global_cell_a6e3cfd4eba13fb9886cb240().value)) & i32((!(u32(d) < u32(16384)))))))) {
    cAssignAggregate((cPointerElementRef(cRecordPointer(divtable32, {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, {}), 0).value), libdivide_s32_gen((__cxx_global_cell_a6e3cfd4eba13fb9886cb240().value = i32(d))), {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Int32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}});
  }
  return i32(libdivide_s32_do(n, cPointerOffset(divtable32, i32(Math.imul(i32((u32(d) < u32(16384))), d)), 5)));
}
