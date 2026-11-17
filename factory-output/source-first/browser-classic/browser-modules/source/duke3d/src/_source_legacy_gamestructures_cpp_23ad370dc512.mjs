// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gamestructures.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { actor } from "./global.cpp.mjs";
import { boardfilename } from "./game.cpp.mjs";
import { getangle } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_4a046e33ecf7aced9bfd0007 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_e6d5c05c99c236717ba2a685 } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba } from "./global.cpp.mjs";
import { __cxx_global_cell_781692351a9d53402cd867ca } from "./gamedef.cpp.mjs";
import { __cxx_global_cell_4d8aaa64f68587b18e27604c } from "../../build/src/engine.cpp.mjs";
import { __cxx_global_cell_64b1dd24a985c284baf44a16 } from "../../build/src/engine.cpp.mjs";

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
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_cd10079c566651a6 = i32(3754936);
function __cxx_static_address_8fd27681d35fa5d06cc5076d() {
  return __cxx_static_address_8fd27681d35fa5d06cc5076d.reference || (__cxx_static_address_8fd27681d35fa5d06cc5076d.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_cd10079c566651a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_dcda9a0c9fd9649f = i32(1144);
function __cxx_static_address_27017aea38191320f4587e0b() {
  return __cxx_static_address_27017aea38191320f4587e0b.reference || (__cxx_static_address_27017aea38191320f4587e0b.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_dcda9a0c9fd9649f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_86d1ec829dfdaa5b = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51f292239fe988779faa70a7() {
  return __cxx_static_address_51f292239fe988779faa70a7.reference || (__cxx_static_address_51f292239fe988779faa70a7.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_86d1ec829dfdaa5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_0b3ca7321552c13b = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_523a2c0280960c7569c6ef88() {
  return __cxx_static_address_523a2c0280960c7569c6ef88.reference || (__cxx_static_address_523a2c0280960c7569c6ef88.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_0b3ca7321552c13b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_af3a0e5d7a730393 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f465ff7f240e3ae0937992f5() {
  return __cxx_static_address_f465ff7f240e3ae0937992f5.reference || (__cxx_static_address_f465ff7f240e3ae0937992f5.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_af3a0e5d7a730393; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_155cf8a3accf6bc8 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61f87ac7113e3e0afa6099c5() {
  return __cxx_static_address_61f87ac7113e3e0afa6099c5.reference || (__cxx_static_address_61f87ac7113e3e0afa6099c5.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_155cf8a3accf6bc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_5135f23928b10600 = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ded346a5daf3cdcdbd47f8e() {
  return __cxx_static_address_6ded346a5daf3cdcdbd47f8e.reference || (__cxx_static_address_6ded346a5daf3cdcdbd47f8e.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_5135f23928b10600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_acee745dbbd0143e = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_237ffa376bff5ce51931c3fe() {
  return __cxx_static_address_237ffa376bff5ce51931c3fe.reference || (__cxx_static_address_237ffa376bff5ce51931c3fe.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_acee745dbbd0143e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_787f3a43b1c6c21a = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad0253afe9c18228f5f280b6() {
  return __cxx_static_address_ad0253afe9c18228f5f280b6.reference || (__cxx_static_address_ad0253afe9c18228f5f280b6.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_787f3a43b1c6c21a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_ed2ad8f42434d724 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd892042cf48bb4d9930b442() {
  return __cxx_static_address_fd892042cf48bb4d9930b442.reference || (__cxx_static_address_fd892042cf48bb4d9930b442.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_ed2ad8f42434d724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_e8962274817ac58b = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42f1be141def74a0c8d69006() {
  return __cxx_static_address_42f1be141def74a0c8d69006.reference || (__cxx_static_address_42f1be141def74a0c8d69006.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_e8962274817ac58b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_8b0d7fa1b7914ebe = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6b7bd2cdb2e29abddd10ebb() {
  return __cxx_static_address_a6b7bd2cdb2e29abddd10ebb.reference || (__cxx_static_address_a6b7bd2cdb2e29abddd10ebb.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_8b0d7fa1b7914ebe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_48f3cefd552b0b41 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4daf64370805794bea75e1b() {
  return __cxx_static_address_a4daf64370805794bea75e1b.reference || (__cxx_static_address_a4daf64370805794bea75e1b.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_48f3cefd552b0b41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_4bb2409b6c329d4f = ((u32(((u32(11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97c8e749a5100f8be88ca17b() {
  return __cxx_static_address_97c8e749a5100f8be88ca17b.reference || (__cxx_static_address_97c8e749a5100f8be88ca17b.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_4bb2409b6c329d4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_2a2da2b53f504497 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6735f4ec02965579bbd3043() {
  return __cxx_static_address_b6735f4ec02965579bbd3043.reference || (__cxx_static_address_b6735f4ec02965579bbd3043.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_2a2da2b53f504497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_6649a5853f9353dc = ((u32(((u32(14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba352d3fe585505c9105f98c() {
  return __cxx_static_address_ba352d3fe585505c9105f98c.reference || (__cxx_static_address_ba352d3fe585505c9105f98c.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_6649a5853f9353dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_ea7cbfedb71d0b25 = ((u32(((u32(15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_706a897d36f526c25baf0c39() {
  return __cxx_static_address_706a897d36f526c25baf0c39.reference || (__cxx_static_address_706a897d36f526c25baf0c39.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_ea7cbfedb71d0b25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_c567fb2eee6e39ca = ((u32(((u32(16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebac68f27bf64640d2a1aa22() {
  return __cxx_static_address_ebac68f27bf64640d2a1aa22.reference || (__cxx_static_address_ebac68f27bf64640d2a1aa22.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_c567fb2eee6e39ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_dc1b8bd746e2b74d = ((u32(((u32(17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_704a49f8c77a8034c5481697() {
  return __cxx_static_address_704a49f8c77a8034c5481697.reference || (__cxx_static_address_704a49f8c77a8034c5481697.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_dc1b8bd746e2b74d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_1829fdc10761ce66 = ((u32(((u32(18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9b6a658b2372b1370ce227d() {
  return __cxx_static_address_f9b6a658b2372b1370ce227d.reference || (__cxx_static_address_f9b6a658b2372b1370ce227d.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_1829fdc10761ce66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_4166353948aa9ea5 = ((u32(((u32(19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b270a01c0ac88f699612541() {
  return __cxx_static_address_8b270a01c0ac88f699612541.reference || (__cxx_static_address_8b270a01c0ac88f699612541.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_4166353948aa9ea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_2274a70e2a1f75ac = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d82deec18082635eda6c4ac() {
  return __cxx_static_address_0d82deec18082635eda6c4ac.reference || (__cxx_static_address_0d82deec18082635eda6c4ac.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_2274a70e2a1f75ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_9421f533155b45e3 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9223f56b3a4cab5b16ef7acd() {
  return __cxx_static_address_9223f56b3a4cab5b16ef7acd.reference || (__cxx_static_address_9223f56b3a4cab5b16ef7acd.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_9421f533155b45e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_823d95a5fb25157a = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f8faafda7ad969864aca6e4() {
  return __cxx_static_address_1f8faafda7ad969864aca6e4.reference || (__cxx_static_address_1f8faafda7ad969864aca6e4.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_823d95a5fb25157a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_e292f297ab9be20b = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d2eb4027a97bc1031beb3ed() {
  return __cxx_static_address_8d2eb4027a97bc1031beb3ed.reference || (__cxx_static_address_8d2eb4027a97bc1031beb3ed.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_e292f297ab9be20b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_57ebf8a6d1f7254e = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7064839d97248c290f3ed230() {
  return __cxx_static_address_7064839d97248c290f3ed230.reference || (__cxx_static_address_7064839d97248c290f3ed230.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_57ebf8a6d1f7254e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_5f20179a8f00f514 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c64da4f07a1f4863294ec8bd() {
  return __cxx_static_address_c64da4f07a1f4863294ec8bd.reference || (__cxx_static_address_c64da4f07a1f4863294ec8bd.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_5f20179a8f00f514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_3947f1ef11e5e205 = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f2c1a2e2d918cf23a5155df() {
  return __cxx_static_address_0f2c1a2e2d918cf23a5155df.reference || (__cxx_static_address_0f2c1a2e2d918cf23a5155df.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_3947f1ef11e5e205; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_c6a631d8486fc90a = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0dfdb71f4f68beb05272d956() {
  return __cxx_static_address_0dfdb71f4f68beb05272d956.reference || (__cxx_static_address_0dfdb71f4f68beb05272d956.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_c6a631d8486fc90a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_14b21879f5049d31 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c947375ec7e29f6e77f1ba85() {
  return __cxx_static_address_c947375ec7e29f6e77f1ba85.reference || (__cxx_static_address_c947375ec7e29f6e77f1ba85.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_14b21879f5049d31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_dac0b78096b25e4b = ((u32(((u32(34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8278a7ba6a02308e395ebc8f() {
  return __cxx_static_address_8278a7ba6a02308e395ebc8f.reference || (__cxx_static_address_8278a7ba6a02308e395ebc8f.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_dac0b78096b25e4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_e7eee44ee99a5a6a = ((u32(((u32(35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_528868a70b0e059e511cfd59() {
  return __cxx_static_address_528868a70b0e059e511cfd59.reference || (__cxx_static_address_528868a70b0e059e511cfd59.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_e7eee44ee99a5a6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_d595b3159641cc37 = ((u32(((u32(36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbbd7931b9ea64368608c2da() {
  return __cxx_static_address_fbbd7931b9ea64368608c2da.reference || (__cxx_static_address_fbbd7931b9ea64368608c2da.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_d595b3159641cc37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_e72017ceb76671c7 = ((u32(((u32(38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fd41ce5086e938089b75035() {
  return __cxx_static_address_9fd41ce5086e938089b75035.reference || (__cxx_static_address_9fd41ce5086e938089b75035.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_e72017ceb76671c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_14fc97292e9fd0d1 = ((u32(((u32(39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05e1c3ed29bb52e90ccac203() {
  return __cxx_static_address_05e1c3ed29bb52e90ccac203.reference || (__cxx_static_address_05e1c3ed29bb52e90ccac203.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_14fc97292e9fd0d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_0b36dd9dbf89939a = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9047f8531e2707458054d763() {
  return __cxx_static_address_9047f8531e2707458054d763.reference || (__cxx_static_address_9047f8531e2707458054d763.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_0b36dd9dbf89939a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_483906ccc000689e = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c2a54cc7c089985b62a73f6() {
  return __cxx_static_address_2c2a54cc7c089985b62a73f6.reference || (__cxx_static_address_2c2a54cc7c089985b62a73f6.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_483906ccc000689e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_9df27c83be63440d = ((u32(((u32(43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe69cd805d6df1c72b203362() {
  return __cxx_static_address_fe69cd805d6df1c72b203362.reference || (__cxx_static_address_fe69cd805d6df1c72b203362.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_9df27c83be63440d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_cb7431cd0d2d78af = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_316536ae1ead46aed026c12e() {
  return __cxx_static_address_316536ae1ead46aed026c12e.reference || (__cxx_static_address_316536ae1ead46aed026c12e.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_cb7431cd0d2d78af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_4e7c622e30799e04 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15672aadaccc2bf8644f689c() {
  return __cxx_static_address_15672aadaccc2bf8644f689c.reference || (__cxx_static_address_15672aadaccc2bf8644f689c.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_4e7c622e30799e04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_59a1e8d8668c5970 = ((u32(((u32(50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db6caf05c983a4e98ddf006() {
  return __cxx_static_address_5db6caf05c983a4e98ddf006.reference || (__cxx_static_address_5db6caf05c983a4e98ddf006.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_59a1e8d8668c5970; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_e58f3377d1986c35 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee7586ed689fedf2c841c774() {
  return __cxx_static_address_ee7586ed689fedf2c841c774.reference || (__cxx_static_address_ee7586ed689fedf2c841c774.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_e58f3377d1986c35; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_e4e2521fdb5eb294 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07adc62760056cbfdd1d918f() {
  return __cxx_static_address_07adc62760056cbfdd1d918f.reference || (__cxx_static_address_07adc62760056cbfdd1d918f.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_e4e2521fdb5eb294; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_3716a32f810c405c = ((u32(((u32(69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d91d284cadc3834ed3a1cd5d() {
  return __cxx_static_address_d91d284cadc3834ed3a1cd5d.reference || (__cxx_static_address_d91d284cadc3834ed3a1cd5d.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_3716a32f810c405c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_a01d152a1e88e9b0 = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_111ce7add409311f78409bbb() {
  return __cxx_static_address_111ce7add409311f78409bbb.reference || (__cxx_static_address_111ce7add409311f78409bbb.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_a01d152a1e88e9b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_2b08d1daae049729 = ((u32(((u32(71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1869657ce0e966c8205bc76() {
  return __cxx_static_address_c1869657ce0e966c8205bc76.reference || (__cxx_static_address_c1869657ce0e966c8205bc76.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_2b08d1daae049729; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_e17bfe285130fca2 = ((u32(((u32(73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b710bd29fc56f2230f666124() {
  return __cxx_static_address_b710bd29fc56f2230f666124.reference || (__cxx_static_address_b710bd29fc56f2230f666124.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_e17bfe285130fca2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_486225bca71ef8a6 = ((u32(((u32(75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_814c6388844582a361098589() {
  return __cxx_static_address_814c6388844582a361098589.reference || (__cxx_static_address_814c6388844582a361098589.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_486225bca71ef8a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_92376746d9b49f15 = ((u32(((u32(76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_981c7893bc4f52b107771ee1() {
  return __cxx_static_address_981c7893bc4f52b107771ee1.reference || (__cxx_static_address_981c7893bc4f52b107771ee1.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_92376746d9b49f15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_3f742adc6ffdccb5 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0eb9889801c78e1e5378503d() {
  return __cxx_static_address_0eb9889801c78e1e5378503d.reference || (__cxx_static_address_0eb9889801c78e1e5378503d.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_3f742adc6ffdccb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_9f0b5d7c75231ee1 = ((u32(((u32(81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ac92595fb41aa618f646cfe() {
  return __cxx_static_address_0ac92595fb41aa618f646cfe.reference || (__cxx_static_address_0ac92595fb41aa618f646cfe.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_9f0b5d7c75231ee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_6ee540a4537743af = ((u32(((u32(83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b4e8e50e6e84bfd47c4d60b() {
  return __cxx_static_address_3b4e8e50e6e84bfd47c4d60b.reference || (__cxx_static_address_3b4e8e50e6e84bfd47c4d60b.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_6ee540a4537743af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_9a3e14e8b93c4d41 = ((u32(((u32(91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8f2546cf7e97246f723a5ec() {
  return __cxx_static_address_a8f2546cf7e97246f723a5ec.reference || (__cxx_static_address_a8f2546cf7e97246f723a5ec.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_9a3e14e8b93c4d41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_2725dc53489b16e2 = ((u32(((u32(92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37ac06a40e9b0268184e01cf() {
  return __cxx_static_address_37ac06a40e9b0268184e01cf.reference || (__cxx_static_address_37ac06a40e9b0268184e01cf.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_2725dc53489b16e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_d2c816485ab2fcda = ((u32(((u32(97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9d6b879bbf94b93dd6aa79b() {
  return __cxx_static_address_a9d6b879bbf94b93dd6aa79b.reference || (__cxx_static_address_a9d6b879bbf94b93dd6aa79b.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_d2c816485ab2fcda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_8ce7a41d81f73754 = ((u32(((u32(102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ccea0997bc0757596bc8db37() {
  return __cxx_static_address_ccea0997bc0757596bc8db37.reference || (__cxx_static_address_ccea0997bc0757596bc8db37.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_8ce7a41d81f73754; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_83dfcf7ea9aa915e = ((u32(((u32(107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_649ddba94215a88b0f614829() {
  return __cxx_static_address_649ddba94215a88b0f614829.reference || (__cxx_static_address_649ddba94215a88b0f614829.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_83dfcf7ea9aa915e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_907a305523e2f3a5 = ((u32(((u32(109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f92d6f3c840ebf10d1013aa() {
  return __cxx_static_address_1f92d6f3c840ebf10d1013aa.reference || (__cxx_static_address_1f92d6f3c840ebf10d1013aa.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_907a305523e2f3a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_a36b1cbab2de3625 = ((u32(((u32(111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46954aa1d0d97b86716c814a() {
  return __cxx_static_address_46954aa1d0d97b86716c814a.reference || (__cxx_static_address_46954aa1d0d97b86716c814a.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_a36b1cbab2de3625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_d0b99b72a5a8f7c8 = ((u32(((u32(117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3690d9909773a47044e627ec() {
  return __cxx_static_address_3690d9909773a47044e627ec.reference || (__cxx_static_address_3690d9909773a47044e627ec.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_d0b99b72a5a8f7c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_aff61fb4db06a417 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36bd01ac6e9a1ee5f3a8c340() {
  return __cxx_static_address_36bd01ac6e9a1ee5f3a8c340.reference || (__cxx_static_address_36bd01ac6e9a1ee5f3a8c340.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_aff61fb4db06a417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_3623c901db21fef2 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e318d99aa454cd9c72c0d6d() {
  return __cxx_static_address_0e318d99aa454cd9c72c0d6d.reference || (__cxx_static_address_0e318d99aa454cd9c72c0d6d.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_3623c901db21fef2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_ecd6ec3d4bc8ab0b = ((u32(((u32(126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0c6131559c6cd1edd101615() {
  return __cxx_static_address_f0c6131559c6cd1edd101615.reference || (__cxx_static_address_f0c6131559c6cd1edd101615.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_ecd6ec3d4bc8ab0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_3fecc20d9287afdd = ((u32(((u32(127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82f20231f62e8ec3ebfb0ddf() {
  return __cxx_static_address_82f20231f62e8ec3ebfb0ddf.reference || (__cxx_static_address_82f20231f62e8ec3ebfb0ddf.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_3fecc20d9287afdd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_b7e61dabec8c9a07 = ((u32(((u32(128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6151172b377f55b7fc2d13f7() {
  return __cxx_static_address_6151172b377f55b7fc2d13f7.reference || (__cxx_static_address_6151172b377f55b7fc2d13f7.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_b7e61dabec8c9a07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_62ea42ee61f493e1 = ((u32(((u32(131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7a316414ce4130c397ae1b0() {
  return __cxx_static_address_d7a316414ce4130c397ae1b0.reference || (__cxx_static_address_d7a316414ce4130c397ae1b0.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_62ea42ee61f493e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_e74771d541390476 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f50948860fd4c748291ddb3f() {
  return __cxx_static_address_f50948860fd4c748291ddb3f.reference || (__cxx_static_address_f50948860fd4c748291ddb3f.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_e74771d541390476; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_f4ad2214982b0ea0 = ((u32(((u32(141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1baabfbdd5e70e67c1e7c23c() {
  return __cxx_static_address_1baabfbdd5e70e67c1e7c23c.reference || (__cxx_static_address_1baabfbdd5e70e67c1e7c23c.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_f4ad2214982b0ea0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_5a8ef3a6b8162573 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d29135c1bf501002919cd546() {
  return __cxx_static_address_d29135c1bf501002919cd546.reference || (__cxx_static_address_d29135c1bf501002919cd546.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_5a8ef3a6b8162573; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_d9c4c53e017371c3 = ((u32(((u32(149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec7a0bbeb90f14172a06e5ed() {
  return __cxx_static_address_ec7a0bbeb90f14172a06e5ed.reference || (__cxx_static_address_ec7a0bbeb90f14172a06e5ed.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_d9c4c53e017371c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_9188ba662802ff9d = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23395edddf06f92083fbc7b0() {
  return __cxx_static_address_23395edddf06f92083fbc7b0.reference || (__cxx_static_address_23395edddf06f92083fbc7b0.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_9188ba662802ff9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_f85ce92daa59cf1d = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c44be0507b1b7743d52b5fc() {
  return __cxx_static_address_2c44be0507b1b7743d52b5fc.reference || (__cxx_static_address_2c44be0507b1b7743d52b5fc.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_f85ce92daa59cf1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_9adf0bffea23d5e9 = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bd06dd06b8bf26b5ffca562() {
  return __cxx_static_address_9bd06dd06b8bf26b5ffca562.reference || (__cxx_static_address_9bd06dd06b8bf26b5ffca562.reference = {
    __cReference: true,
    get value() { return THUD____header_global_9adf0bffea23d5e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_24a9ceae6e0b35f2 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b1a50118ccaea181d7b5c60() {
  return __cxx_static_address_2b1a50118ccaea181d7b5c60.reference || (__cxx_static_address_2b1a50118ccaea181d7b5c60.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_24a9ceae6e0b35f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_69838e197a20ecbf = ((u32(((u32(163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52ab4d2487a2469ae284cd9f() {
  return __cxx_static_address_52ab4d2487a2469ae284cd9f.reference || (__cxx_static_address_52ab4d2487a2469ae284cd9f.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_69838e197a20ecbf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_edf5cc1a23935254 = ((u32(((u32(169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8606b3e2790f248c6e4b8df() {
  return __cxx_static_address_c8606b3e2790f248c6e4b8df.reference || (__cxx_static_address_c8606b3e2790f248c6e4b8df.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_edf5cc1a23935254; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_0f1ee1f2e8bca4d0 = ((u32(((u32(177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c316dc7018cdb5a938c5bd57() {
  return __cxx_static_address_c316dc7018cdb5a938c5bd57.reference || (__cxx_static_address_c316dc7018cdb5a938c5bd57.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_0f1ee1f2e8bca4d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_ace17fba1d25accb = ((u32(((u32(195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68cf8b19ae990f9a5f4cc34e() {
  return __cxx_static_address_68cf8b19ae990f9a5f4cc34e.reference || (__cxx_static_address_68cf8b19ae990f9a5f4cc34e.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_ace17fba1d25accb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_e48d12ebd795835a = ((u32(((u32(196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a17ad4b5f68a13f7d551c044() {
  return __cxx_static_address_a17ad4b5f68a13f7d551c044.reference || (__cxx_static_address_a17ad4b5f68a13f7d551c044.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_e48d12ebd795835a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_970635d2ef42f066 = ((u32(((u32(197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5324eb83d2dbe2a90bd4386a() {
  return __cxx_static_address_5324eb83d2dbe2a90bd4386a.reference || (__cxx_static_address_5324eb83d2dbe2a90bd4386a.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_970635d2ef42f066; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_98cab4b077030f87 = ((u32(((u32(199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57c26ecea3c3b77a09ed5b77() {
  return __cxx_static_address_57c26ecea3c3b77a09ed5b77.reference || (__cxx_static_address_57c26ecea3c3b77a09ed5b77.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_98cab4b077030f87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_586ed86877943f90 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5598c3cb9cc9f4d4ce0b356() {
  return __cxx_static_address_b5598c3cb9cc9f4d4ce0b356.reference || (__cxx_static_address_b5598c3cb9cc9f4d4ce0b356.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_586ed86877943f90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_703aff45aa52a7bf = ((u32(((u32(207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f95dcfddc3074f6bf3a9cf7() {
  return __cxx_static_address_9f95dcfddc3074f6bf3a9cf7.reference || (__cxx_static_address_9f95dcfddc3074f6bf3a9cf7.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_703aff45aa52a7bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_e495fe6a439af2fc = ((u32(((u32(208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0722fd45ccad4a5723e5c723() {
  return __cxx_static_address_0722fd45ccad4a5723e5c723.reference || (__cxx_static_address_0722fd45ccad4a5723e5c723.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_e495fe6a439af2fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_e4d9e95ad4d9d5d7 = ((u32(((u32(209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51f49add96fcb729b9e4efc0() {
  return __cxx_static_address_51f49add96fcb729b9e4efc0.reference || (__cxx_static_address_51f49add96fcb729b9e4efc0.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_e4d9e95ad4d9d5d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_c3221b64a7f6ee90 = ((u32(((u32(210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ea4b8419d54691b4c9dcde0() {
  return __cxx_static_address_2ea4b8419d54691b4c9dcde0.reference || (__cxx_static_address_2ea4b8419d54691b4c9dcde0.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_c3221b64a7f6ee90; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_4aa5b050058e4ed6 = ((u32(((u32(211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be14589dce4927c79450cbab() {
  return __cxx_static_address_be14589dce4927c79450cbab.reference || (__cxx_static_address_be14589dce4927c79450cbab.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_4aa5b050058e4ed6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_6478f6cb710df081 = ((u32(((u32(212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9c656433b6f586b8a1767cd() {
  return __cxx_static_address_a9c656433b6f586b8a1767cd.reference || (__cxx_static_address_a9c656433b6f586b8a1767cd.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_6478f6cb710df081; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_dfbdc5ff439a07a3 = ((u32(((u32(213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f1af071b8a55631650baef1() {
  return __cxx_static_address_6f1af071b8a55631650baef1.reference || (__cxx_static_address_6f1af071b8a55631650baef1.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_dfbdc5ff439a07a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_c1d7e82994f51ffe = ((u32(((u32(215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a31880bc46db4d230f0251e5() {
  return __cxx_static_address_a31880bc46db4d230f0251e5.reference || (__cxx_static_address_a31880bc46db4d230f0251e5.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_c1d7e82994f51ffe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_67cfc8e8923f82a2 = ((u32(((u32(216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e4a8769c3b4d500125cee4d() {
  return __cxx_static_address_4e4a8769c3b4d500125cee4d.reference || (__cxx_static_address_4e4a8769c3b4d500125cee4d.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_67cfc8e8923f82a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_df2ed0aa2f7d5726 = ((u32(((u32(217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4ccdc3d4d3f1b0c813620884() {
  return __cxx_static_address_4ccdc3d4d3f1b0c813620884.reference || (__cxx_static_address_4ccdc3d4d3f1b0c813620884.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_df2ed0aa2f7d5726; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_bde0f525b1ded985 = ((u32(((u32(218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0d86be6c1b72650072385c3() {
  return __cxx_static_address_f0d86be6c1b72650072385c3.reference || (__cxx_static_address_f0d86be6c1b72650072385c3.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_bde0f525b1ded985; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_a3726eaa4dbefa37 = ((u32(((u32(219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db720e2cfcebd7183b7fad2() {
  return __cxx_static_address_8db720e2cfcebd7183b7fad2.reference || (__cxx_static_address_8db720e2cfcebd7183b7fad2.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_a3726eaa4dbefa37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_077a68770e24b7e1 = ((u32(((u32(226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fce555e2e1b99a37f486c70() {
  return __cxx_static_address_3fce555e2e1b99a37f486c70.reference || (__cxx_static_address_3fce555e2e1b99a37f486c70.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_077a68770e24b7e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_a61f44537c21ea36 = ((u32(((u32(227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c7a6e48064299a4b9ededf6() {
  return __cxx_static_address_0c7a6e48064299a4b9ededf6.reference || (__cxx_static_address_0c7a6e48064299a4b9ededf6.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_a61f44537c21ea36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_4b959c007ee8b450 = ((u32(((u32(229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e41b3c72dbe222bab83a480() {
  return __cxx_static_address_4e41b3c72dbe222bab83a480.reference || (__cxx_static_address_4e41b3c72dbe222bab83a480.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_4b959c007ee8b450; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_5c7b454041d1d5d0 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33c32e048e7656e50ab7cd81() {
  return __cxx_static_address_33c32e048e7656e50ab7cd81.reference || (__cxx_static_address_33c32e048e7656e50ab7cd81.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_5c7b454041d1d5d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_94ece742cd31ec6d = ((u32(((u32(232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bd767e94012b3aad920937d() {
  return __cxx_static_address_5bd767e94012b3aad920937d.reference || (__cxx_static_address_5bd767e94012b3aad920937d.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_94ece742cd31ec6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_daacb58e94e32e1b = ((u32(((u32(243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c51779d6ee7c93c734d6b2b() {
  return __cxx_static_address_7c51779d6ee7c93c734d6b2b.reference || (__cxx_static_address_7c51779d6ee7c93c734d6b2b.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_daacb58e94e32e1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_7170f7c66d3aeba0 = ((u32(((u32(244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64599837c2fb5e87ea72fe9c() {
  return __cxx_static_address_64599837c2fb5e87ea72fe9c.reference || (__cxx_static_address_64599837c2fb5e87ea72fe9c.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_7170f7c66d3aeba0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_fdb9bafa1a9f2a4b = ((u32(((u32(245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_961406821a77b1f8d130f270() {
  return __cxx_static_address_961406821a77b1f8d130f270.reference || (__cxx_static_address_961406821a77b1f8d130f270.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_fdb9bafa1a9f2a4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_8e360e52fd090479 = ((u32(((u32(246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14b9fcd79064a51b8a06f855() {
  return __cxx_static_address_14b9fcd79064a51b8a06f855.reference || (__cxx_static_address_14b9fcd79064a51b8a06f855.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_8e360e52fd090479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_91d8eb7925e7e68e = ((u32(((u32(247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_181c6bfd2f047974dc6ffd78() {
  return __cxx_static_address_181c6bfd2f047974dc6ffd78.reference || (__cxx_static_address_181c6bfd2f047974dc6ffd78.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_91d8eb7925e7e68e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_0a037da750567f5e = ((u32(((u32(249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_17f424ca2bdce89d51d65151() {
  return __cxx_static_address_17f424ca2bdce89d51d65151.reference || (__cxx_static_address_17f424ca2bdce89d51d65151.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_0a037da750567f5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_ba52841b4370c7bc = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0009d1f6e4c98e182535dc9e() {
  return __cxx_static_address_0009d1f6e4c98e182535dc9e.reference || (__cxx_static_address_0009d1f6e4c98e182535dc9e.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_ba52841b4370c7bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_54557da082f3032f = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63640ed197976db44d60c233() {
  return __cxx_static_address_63640ed197976db44d60c233.reference || (__cxx_static_address_63640ed197976db44d60c233.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_54557da082f3032f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_8ef775bdf7d0d6e7 = ((u32(((u32(284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f4a449b7415b8ab8906ee78() {
  return __cxx_static_address_5f4a449b7415b8ab8906ee78.reference || (__cxx_static_address_5f4a449b7415b8ab8906ee78.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_8ef775bdf7d0d6e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_19e0f9a2248c9345 = ((u32(((u32(288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6bec518311340db744fcaa3() {
  return __cxx_static_address_b6bec518311340db744fcaa3.reference || (__cxx_static_address_b6bec518311340db744fcaa3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_19e0f9a2248c9345; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_a89d58b736999428 = ((u32(((u32(289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c38bba0f0421d8c4bef9eb4() {
  return __cxx_static_address_7c38bba0f0421d8c4bef9eb4.reference || (__cxx_static_address_7c38bba0f0421d8c4bef9eb4.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_a89d58b736999428; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_0a9846d193bfba7d = ((u32(((u32(290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00e56fb87e4e24b2e925297b() {
  return __cxx_static_address_00e56fb87e4e24b2e925297b.reference || (__cxx_static_address_00e56fb87e4e24b2e925297b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_0a9846d193bfba7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_309389e849818944 = ((u32(((u32(291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ce9ae37ee54ddcb8f5d62b7() {
  return __cxx_static_address_7ce9ae37ee54ddcb8f5d62b7.reference || (__cxx_static_address_7ce9ae37ee54ddcb8f5d62b7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_309389e849818944; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_bb7de8936455b028 = ((u32(((u32(292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1efe3b9874931047e3e75628() {
  return __cxx_static_address_1efe3b9874931047e3e75628.reference || (__cxx_static_address_1efe3b9874931047e3e75628.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_bb7de8936455b028; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_4bdfd71be3ba1f18 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c47d4340ddf527df0b43e79() {
  return __cxx_static_address_4c47d4340ddf527df0b43e79.reference || (__cxx_static_address_4c47d4340ddf527df0b43e79.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_4bdfd71be3ba1f18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_bfce869ca587f8d5 = ((u32(((u32(294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f359238228d520a38cb70a9b() {
  return __cxx_static_address_f359238228d520a38cb70a9b.reference || (__cxx_static_address_f359238228d520a38cb70a9b.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_bfce869ca587f8d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_a2102a184b83185a = ((u32(((u32(295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b6d13603275f7c4f695a7e7() {
  return __cxx_static_address_8b6d13603275f7c4f695a7e7.reference || (__cxx_static_address_8b6d13603275f7c4f695a7e7.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_a2102a184b83185a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_50b2c08fecdef61e = ((u32(((u32(296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7104a436d84e9c2672b3eca0() {
  return __cxx_static_address_7104a436d84e9c2672b3eca0.reference || (__cxx_static_address_7104a436d84e9c2672b3eca0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_50b2c08fecdef61e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_e9a25857a920d83e = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb73ead31404cd68b2937c44() {
  return __cxx_static_address_eb73ead31404cd68b2937c44.reference || (__cxx_static_address_eb73ead31404cd68b2937c44.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_e9a25857a920d83e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_84b561b09f16df29 = ((u32(((u32(298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de2710af56c382554ddc78cb() {
  return __cxx_static_address_de2710af56c382554ddc78cb.reference || (__cxx_static_address_de2710af56c382554ddc78cb.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_84b561b09f16df29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_2286c5fa8a848ee1 = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a884c9fd9c84a99758f4f444() {
  return __cxx_static_address_a884c9fd9c84a99758f4f444.reference || (__cxx_static_address_a884c9fd9c84a99758f4f444.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_2286c5fa8a848ee1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_75b31e1dba3ed6bd = ((u32(((u32(300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18a98b980ef5ec4e741a872a() {
  return __cxx_static_address_18a98b980ef5ec4e741a872a.reference || (__cxx_static_address_18a98b980ef5ec4e741a872a.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_75b31e1dba3ed6bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_e08192d4ce5a1092 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21c9a53565065a91e61f61df() {
  return __cxx_static_address_21c9a53565065a91e61f61df.reference || (__cxx_static_address_21c9a53565065a91e61f61df.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_e08192d4ce5a1092; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_e1b165a08643251d = ((u32(((u32(303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af99e4786ce104753e2611a8() {
  return __cxx_static_address_af99e4786ce104753e2611a8.reference || (__cxx_static_address_af99e4786ce104753e2611a8.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_e1b165a08643251d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_33af433d842e984c = ((u32(((u32(308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00d37019b17fe4ba302c7ec1() {
  return __cxx_static_address_00d37019b17fe4ba302c7ec1.reference || (__cxx_static_address_00d37019b17fe4ba302c7ec1.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_33af433d842e984c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_249005326c022b8d = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3651a13f53638862298e3166() {
  return __cxx_static_address_3651a13f53638862298e3166.reference || (__cxx_static_address_3651a13f53638862298e3166.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_249005326c022b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_d9d9513821af5625 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01ec9140e8a87eeaf62a8860() {
  return __cxx_static_address_01ec9140e8a87eeaf62a8860.reference || (__cxx_static_address_01ec9140e8a87eeaf62a8860.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_d9d9513821af5625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_9b1b92104e3fbb04 = ((u32(((u32(352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1aa8fd6fea3b55d7286a1357() {
  return __cxx_static_address_1aa8fd6fea3b55d7286a1357.reference || (__cxx_static_address_1aa8fd6fea3b55d7286a1357.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_9b1b92104e3fbb04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_03265eb26082d76c = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebed352dcd49907924dccce1() {
  return __cxx_static_address_ebed352dcd49907924dccce1.reference || (__cxx_static_address_ebed352dcd49907924dccce1.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_03265eb26082d76c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_ddab2cfbfe6a05e1 = ((u32(((u32(364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3082b60b6fd0c36851757053() {
  return __cxx_static_address_3082b60b6fd0c36851757053.reference || (__cxx_static_address_3082b60b6fd0c36851757053.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_ddab2cfbfe6a05e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_b9781f9230e0441e = ((u32(((u32(365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1234922f02dc1aab8c4743b5() {
  return __cxx_static_address_1234922f02dc1aab8c4743b5.reference || (__cxx_static_address_1234922f02dc1aab8c4743b5.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_b9781f9230e0441e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_86215e82b715d2b1 = ((u32(((u32(366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a899f13234b7b0e5006f0c05() {
  return __cxx_static_address_a899f13234b7b0e5006f0c05.reference || (__cxx_static_address_a899f13234b7b0e5006f0c05.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_86215e82b715d2b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_d096361da84f3c1c = ((u32(((u32(367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99bfe707d6ac5cc4c4736a7f() {
  return __cxx_static_address_99bfe707d6ac5cc4c4736a7f.reference || (__cxx_static_address_99bfe707d6ac5cc4c4736a7f.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_d096361da84f3c1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_c7c471f320e70069 = ((u32(((u32(368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d425d4ad5968bcc19c63c896() {
  return __cxx_static_address_d425d4ad5968bcc19c63c896.reference || (__cxx_static_address_d425d4ad5968bcc19c63c896.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_c7c471f320e70069; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_6f5c0fd0b607cb47 = ((u32(((u32(370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de719b821f21ee500c006565() {
  return __cxx_static_address_de719b821f21ee500c006565.reference || (__cxx_static_address_de719b821f21ee500c006565.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_6f5c0fd0b607cb47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_1ad76d76ab29ffec = ((u32(((u32(371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e14341cf1f13cc8b1312a4f() {
  return __cxx_static_address_3e14341cf1f13cc8b1312a4f.reference || (__cxx_static_address_3e14341cf1f13cc8b1312a4f.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_1ad76d76ab29ffec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_3e9fe01c77303a87 = ((u32(((u32(384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_369cba2d437074fe5eccc960() {
  return __cxx_static_address_369cba2d437074fe5eccc960.reference || (__cxx_static_address_369cba2d437074fe5eccc960.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_3e9fe01c77303a87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_6fde6725dd5a4cd1 = ((u32(((u32(385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f83056f6d55bde6b2263e06() {
  return __cxx_static_address_7f83056f6d55bde6b2263e06.reference || (__cxx_static_address_7f83056f6d55bde6b2263e06.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_6fde6725dd5a4cd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_890d97eb3b3777d5 = ((u32(((u32(388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25237c99df0dcc664304cf07() {
  return __cxx_static_address_25237c99df0dcc664304cf07.reference || (__cxx_static_address_25237c99df0dcc664304cf07.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_890d97eb3b3777d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_e0a333e6da7922db = ((u32(((u32(392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1abce10f1c64dd6ac2d53db() {
  return __cxx_static_address_c1abce10f1c64dd6ac2d53db.reference || (__cxx_static_address_c1abce10f1c64dd6ac2d53db.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_e0a333e6da7922db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_a66f2692ebf83eb9 = ((u32(((u32(393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37f4e3853dec852799dc8b46() {
  return __cxx_static_address_37f4e3853dec852799dc8b46.reference || (__cxx_static_address_37f4e3853dec852799dc8b46.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_a66f2692ebf83eb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_a979b2521d4652ee = ((u32(((u32(398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32227dacb06862d5d458fbcd() {
  return __cxx_static_address_32227dacb06862d5d458fbcd.reference || (__cxx_static_address_32227dacb06862d5d458fbcd.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_a979b2521d4652ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_7113bbf6fba0d800 = ((u32(((u32(399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_633194dad8aa82e9ab547b6f() {
  return __cxx_static_address_633194dad8aa82e9ab547b6f.reference || (__cxx_static_address_633194dad8aa82e9ab547b6f.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_7113bbf6fba0d800; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_c2a5ccf2c49e9e69 = ((u32(((u32(400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7e61e3a94521452a30217d8() {
  return __cxx_static_address_e7e61e3a94521452a30217d8.reference || (__cxx_static_address_e7e61e3a94521452a30217d8.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_c2a5ccf2c49e9e69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_e214ac7afe67308f = ((u32(((u32(401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec96b75397a4ef881cd0e62a() {
  return __cxx_static_address_ec96b75397a4ef881cd0e62a.reference || (__cxx_static_address_ec96b75397a4ef881cd0e62a.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_e214ac7afe67308f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_7662b02e171847ef = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4fae68cecb604ecda97507e() {
  return __cxx_static_address_e4fae68cecb604ecda97507e.reference || (__cxx_static_address_e4fae68cecb604ecda97507e.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_7662b02e171847ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_45e6201600ec2795 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f3c52d0070b4a854a761514() {
  return __cxx_static_address_2f3c52d0070b4a854a761514.reference || (__cxx_static_address_2f3c52d0070b4a854a761514.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_45e6201600ec2795; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_043cb5d865d61fd3 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f45aed2ef2356f81171b45a4() {
  return __cxx_static_address_f45aed2ef2356f81171b45a4.reference || (__cxx_static_address_f45aed2ef2356f81171b45a4.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_043cb5d865d61fd3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_906314648403787d = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0df2d7826ea83e5edf9cfe3() {
  return __cxx_static_address_f0df2d7826ea83e5edf9cfe3.reference || (__cxx_static_address_f0df2d7826ea83e5edf9cfe3.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_906314648403787d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_65634d786c788799 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d292ff4b04895c25043be1e1() {
  return __cxx_static_address_d292ff4b04895c25043be1e1.reference || (__cxx_static_address_d292ff4b04895c25043be1e1.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_65634d786c788799; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_2371b7436eecca60 = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f985d087e85d2311277327de() {
  return __cxx_static_address_f985d087e85d2311277327de.reference || (__cxx_static_address_f985d087e85d2311277327de.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_2371b7436eecca60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_aeec9bb16d6b22a3 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb7d2fe93e279fac61f2fa17() {
  return __cxx_static_address_fb7d2fe93e279fac61f2fa17.reference || (__cxx_static_address_fb7d2fe93e279fac61f2fa17.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_aeec9bb16d6b22a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_92933e75f3568301 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db4f2db0073a24ed428afb2() {
  return __cxx_static_address_5db4f2db0073a24ed428afb2.reference || (__cxx_static_address_5db4f2db0073a24ed428afb2.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_92933e75f3568301; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_a209a6c1651ed684 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e51c492685b7f08261472b68() {
  return __cxx_static_address_e51c492685b7f08261472b68.reference || (__cxx_static_address_e51c492685b7f08261472b68.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_a209a6c1651ed684; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_ca6f3d27c0245d11 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_735be926985aaee90140e27a() {
  return __cxx_static_address_735be926985aaee90140e27a.reference || (__cxx_static_address_735be926985aaee90140e27a.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_ca6f3d27c0245d11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_2997fa0a77a9d4f8 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a42ce24814d0837108eb50f5() {
  return __cxx_static_address_a42ce24814d0837108eb50f5.reference || (__cxx_static_address_a42ce24814d0837108eb50f5.reference = {
    __cReference: true,
    get value() { return FOF____header_global_2997fa0a77a9d4f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_5aa045fffe61b952 = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f7d01ce6c77a71ec467344a() {
  return __cxx_static_address_2f7d01ce6c77a71ec467344a.reference || (__cxx_static_address_2f7d01ce6c77a71ec467344a.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_5aa045fffe61b952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_d12a513e359da26b = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7e81d0024c0f0141058ef47() {
  return __cxx_static_address_b7e81d0024c0f0141058ef47.reference || (__cxx_static_address_b7e81d0024c0f0141058ef47.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_d12a513e359da26b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_8b8ec9e7927ac5c5 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a9916b5c23929a4f06a9551() {
  return __cxx_static_address_7a9916b5c23929a4f06a9551.reference || (__cxx_static_address_7a9916b5c23929a4f06a9551.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_8b8ec9e7927ac5c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_846ff9f25060f191 = ((u32(((u32(23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_624c5d36d43a6c0163e03e0d() {
  return __cxx_static_address_624c5d36d43a6c0163e03e0d.reference || (__cxx_static_address_624c5d36d43a6c0163e03e0d.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_846ff9f25060f191; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_627b5b6231624e43 = ((u32(((u32(24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69977d529409db14c571b1ca() {
  return __cxx_static_address_69977d529409db14c571b1ca.reference || (__cxx_static_address_69977d529409db14c571b1ca.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_627b5b6231624e43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_755d6866e059ad9e = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_470e3a1ad54bf7ba8a66de58() {
  return __cxx_static_address_470e3a1ad54bf7ba8a66de58.reference || (__cxx_static_address_470e3a1ad54bf7ba8a66de58.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_755d6866e059ad9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_dee236ebd09ec256 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6d773b1c440d6d036e2c21b() {
  return __cxx_static_address_b6d773b1c440d6d036e2c21b.reference || (__cxx_static_address_b6d773b1c440d6d036e2c21b.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_dee236ebd09ec256; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_1da46de31757596b = ((u32(((u32(27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02a28d4f2e39906d56c7f089() {
  return __cxx_static_address_02a28d4f2e39906d56c7f089.reference || (__cxx_static_address_02a28d4f2e39906d56c7f089.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_1da46de31757596b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_713fae5548fc5ec9 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01ee540b7973dae8db4f53b0() {
  return __cxx_static_address_01ee540b7973dae8db4f53b0.reference || (__cxx_static_address_01ee540b7973dae8db4f53b0.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_713fae5548fc5ec9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_1441ba5cebd74835 = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b0fe11739216173c71adb5a() {
  return __cxx_static_address_3b0fe11739216173c71adb5a.reference || (__cxx_static_address_3b0fe11739216173c71adb5a.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_1441ba5cebd74835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_2cac3e5408fdce62 = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb4ef9a2c94550164ddd45e() {
  return __cxx_static_address_dfb4ef9a2c94550164ddd45e.reference || (__cxx_static_address_dfb4ef9a2c94550164ddd45e.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_2cac3e5408fdce62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_dc53b512803c6af9 = ((u32(((u32(31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7df98725d951c39ed9abe123() {
  return __cxx_static_address_7df98725d951c39ed9abe123.reference || (__cxx_static_address_7df98725d951c39ed9abe123.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_dc53b512803c6af9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_d2631c9684821d03 = ((u32(((u32(32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7c84762234d0491845af6b8() {
  return __cxx_static_address_c7c84762234d0491845af6b8.reference || (__cxx_static_address_c7c84762234d0491845af6b8.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_d2631c9684821d03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_af8c880630a1db68 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96fd7f6907ef75c0c881283f() {
  return __cxx_static_address_96fd7f6907ef75c0c881283f.reference || (__cxx_static_address_96fd7f6907ef75c0c881283f.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_af8c880630a1db68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_d6798cc49c25977e = ((u32(((u32(37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a31eef0e7c098edf81ad358c() {
  return __cxx_static_address_a31eef0e7c098edf81ad358c.reference || (__cxx_static_address_a31eef0e7c098edf81ad358c.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_d6798cc49c25977e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_e04db5deea5d7b92 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf755c3fbf8874b9f7ed83ad() {
  return __cxx_static_address_bf755c3fbf8874b9f7ed83ad.reference || (__cxx_static_address_bf755c3fbf8874b9f7ed83ad.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_e04db5deea5d7b92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_d6d75194ad4b9c47 = ((u32(((u32(41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f3d4853ca98953f2c5d48be() {
  return __cxx_static_address_2f3d4853ca98953f2c5d48be.reference || (__cxx_static_address_2f3d4853ca98953f2c5d48be.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_d6d75194ad4b9c47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_f8f02b7ec1ebe99f = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cfe4d98f9bfc8b2b6cc44f1() {
  return __cxx_static_address_6cfe4d98f9bfc8b2b6cc44f1.reference || (__cxx_static_address_6cfe4d98f9bfc8b2b6cc44f1.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_f8f02b7ec1ebe99f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_6d261207fc1175fb = ((u32(((u32(44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d819078f65cb69cf0df760d2() {
  return __cxx_static_address_d819078f65cb69cf0df760d2.reference || (__cxx_static_address_d819078f65cb69cf0df760d2.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_6d261207fc1175fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_8ef5bd658e918263 = ((u32(((u32(45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32a626e9f9d3e7bca89488f2() {
  return __cxx_static_address_32a626e9f9d3e7bca89488f2.reference || (__cxx_static_address_32a626e9f9d3e7bca89488f2.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_8ef5bd658e918263; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_57bc8ff864ea3431 = ((u32(((u32(46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0185d7700fa25c24e93b6792() {
  return __cxx_static_address_0185d7700fa25c24e93b6792.reference || (__cxx_static_address_0185d7700fa25c24e93b6792.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_57bc8ff864ea3431; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_8b489a553b1f48a1 = ((u32(((u32(47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1c28b67b1f4cf94646fed98() {
  return __cxx_static_address_a1c28b67b1f4cf94646fed98.reference || (__cxx_static_address_a1c28b67b1f4cf94646fed98.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_8b489a553b1f48a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_564b80d617ba8d52 = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_157b330dbc05a3c22170e909() {
  return __cxx_static_address_157b330dbc05a3c22170e909.reference || (__cxx_static_address_157b330dbc05a3c22170e909.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_564b80d617ba8d52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_36e4ce135f906f22 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd03c938c015ce8e24107acf() {
  return __cxx_static_address_bd03c938c015ce8e24107acf.reference || (__cxx_static_address_bd03c938c015ce8e24107acf.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_36e4ce135f906f22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_1e59cded2667f226 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aeeef0625d4b45c221e9abcb() {
  return __cxx_static_address_aeeef0625d4b45c221e9abcb.reference || (__cxx_static_address_aeeef0625d4b45c221e9abcb.reference = {
    __cReference: true,
    get value() { return COLA____header_global_1e59cded2667f226; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_8439c091fa8a13b8 = ((u32(((u32(52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b11bbeb32a98c08064453b92() {
  return __cxx_static_address_b11bbeb32a98c08064453b92.reference || (__cxx_static_address_b11bbeb32a98c08064453b92.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_8439c091fa8a13b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_ab31d76fe2669fe2 = ((u32(((u32(53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86fc648d79a542cd8f8c00c1() {
  return __cxx_static_address_86fc648d79a542cd8f8c00c1.reference || (__cxx_static_address_86fc648d79a542cd8f8c00c1.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_ab31d76fe2669fe2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_afd4a4063bb03761 = ((u32(((u32(54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06daee4457833fa33eed9f19() {
  return __cxx_static_address_06daee4457833fa33eed9f19.reference || (__cxx_static_address_06daee4457833fa33eed9f19.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_afd4a4063bb03761; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_ea862e069bdd8c8c = ((u32(((u32(55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5a8275612654fbd2e0ef14c() {
  return __cxx_static_address_a5a8275612654fbd2e0ef14c.reference || (__cxx_static_address_a5a8275612654fbd2e0ef14c.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_ea862e069bdd8c8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_82d1c7b922af70c9 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_664a2755e50c0f359654deb5() {
  return __cxx_static_address_664a2755e50c0f359654deb5.reference || (__cxx_static_address_664a2755e50c0f359654deb5.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_82d1c7b922af70c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_cfac39e1ed55e7bc = ((u32(((u32(57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ad2c5ef756a38615f9e6b21() {
  return __cxx_static_address_7ad2c5ef756a38615f9e6b21.reference || (__cxx_static_address_7ad2c5ef756a38615f9e6b21.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_cfac39e1ed55e7bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_e05c4fda569cdd3e = ((u32(((u32(59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebeeafc27f5ef0a68198d0ee() {
  return __cxx_static_address_ebeeafc27f5ef0a68198d0ee.reference || (__cxx_static_address_ebeeafc27f5ef0a68198d0ee.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_e05c4fda569cdd3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_9ace22dca9940ef1 = ((u32(((u32(60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95e64df27c0ad8371a03b90e() {
  return __cxx_static_address_95e64df27c0ad8371a03b90e.reference || (__cxx_static_address_95e64df27c0ad8371a03b90e.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_9ace22dca9940ef1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_84c8070d86992051 = ((u32(((u32(61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a03bb524285d58cc86520f2() {
  return __cxx_static_address_0a03bb524285d58cc86520f2.reference || (__cxx_static_address_0a03bb524285d58cc86520f2.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_84c8070d86992051; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_e83952a88bd46adc = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54e937c309bcb21020760daa() {
  return __cxx_static_address_54e937c309bcb21020760daa.reference || (__cxx_static_address_54e937c309bcb21020760daa.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_e83952a88bd46adc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_f9b0700605a5afed = ((u32(((u32(78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebe3a05bd58353dd4cbe3dbc() {
  return __cxx_static_address_ebe3a05bd58353dd4cbe3dbc.reference || (__cxx_static_address_ebe3a05bd58353dd4cbe3dbc.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_f9b0700605a5afed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_fb2cda2bb9574c12 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d00ad6177eb9b239c92de53() {
  return __cxx_static_address_7d00ad6177eb9b239c92de53.reference || (__cxx_static_address_7d00ad6177eb9b239c92de53.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_fb2cda2bb9574c12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_f1a689093f0c6b91 = ((u32(((u32(80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cae3be095ac6c7af1b2f39a7() {
  return __cxx_static_address_cae3be095ac6c7af1b2f39a7.reference || (__cxx_static_address_cae3be095ac6c7af1b2f39a7.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_f1a689093f0c6b91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_4b0c49b971fdfc1a = ((u32(((u32(84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e74f7ea3d752fffebd4a8ecd() {
  return __cxx_static_address_e74f7ea3d752fffebd4a8ecd.reference || (__cxx_static_address_e74f7ea3d752fffebd4a8ecd.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_4b0c49b971fdfc1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_7987b778e4bad2da = ((u32(((u32(89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb3c8f2bde4cc7b946d5aabe() {
  return __cxx_static_address_bb3c8f2bde4cc7b946d5aabe.reference || (__cxx_static_address_bb3c8f2bde4cc7b946d5aabe.reference = {
    __cReference: true,
    get value() { return LA____header_global_7987b778e4bad2da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_c5a5523489ec58f7 = ((u32(((u32(100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e47d2d5e4a9ac0e5c15b216() {
  return __cxx_static_address_7e47d2d5e4a9ac0e5c15b216.reference || (__cxx_static_address_7e47d2d5e4a9ac0e5c15b216.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_c5a5523489ec58f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_52a0968a29750f9f = ((u32(((u32(120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08d32fe63f6533ac7b42ab7e() {
  return __cxx_static_address_08d32fe63f6533ac7b42ab7e.reference || (__cxx_static_address_08d32fe63f6533ac7b42ab7e.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_52a0968a29750f9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_7a486e33877f4a60 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24a41cdb1a0c8b2889ff9f72() {
  return __cxx_static_address_24a41cdb1a0c8b2889ff9f72.reference || (__cxx_static_address_24a41cdb1a0c8b2889ff9f72.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_7a486e33877f4a60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_37a293cbc9878c3e = ((u32(((u32(122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_256459f46bc56aca4bcba4e4() {
  return __cxx_static_address_256459f46bc56aca4bcba4e4.reference || (__cxx_static_address_256459f46bc56aca4bcba4e4.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_37a293cbc9878c3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_2106cdd949b3bdfc = ((u32(((u32(123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_006a997d5b07f9f477ece68d() {
  return __cxx_static_address_006a997d5b07f9f477ece68d.reference || (__cxx_static_address_006a997d5b07f9f477ece68d.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_2106cdd949b3bdfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_4d105ef095788caf = ((u32(((u32(124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb1c7e6ae8e9a976280bcb0e() {
  return __cxx_static_address_cb1c7e6ae8e9a976280bcb0e.reference || (__cxx_static_address_cb1c7e6ae8e9a976280bcb0e.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_4d105ef095788caf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_c246d8f12a035aa7 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f313c5c15896fecd424f14a() {
  return __cxx_static_address_0f313c5c15896fecd424f14a.reference || (__cxx_static_address_0f313c5c15896fecd424f14a.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_c246d8f12a035aa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_1408c7139e9f0f6f = ((u32(((u32(130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe7beb9b25dca8ca63e4115e() {
  return __cxx_static_address_fe7beb9b25dca8ca63e4115e.reference || (__cxx_static_address_fe7beb9b25dca8ca63e4115e.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_1408c7139e9f0f6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_36cb3e78d6914f38 = ((u32(((u32(132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f935c066d79809a1a8d2aa4() {
  return __cxx_static_address_0f935c066d79809a1a8d2aa4.reference || (__cxx_static_address_0f935c066d79809a1a8d2aa4.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_36cb3e78d6914f38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_9f1d345f2142bab1 = ((u32(((u32(134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b9853e5b42d28b2b3e29565() {
  return __cxx_static_address_9b9853e5b42d28b2b3e29565.reference || (__cxx_static_address_9b9853e5b42d28b2b3e29565.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_9f1d345f2142bab1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_d663e77e0f333ab5 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_199c951b01fdc4bdfa2e5ddb() {
  return __cxx_static_address_199c951b01fdc4bdfa2e5ddb.reference || (__cxx_static_address_199c951b01fdc4bdfa2e5ddb.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_d663e77e0f333ab5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_1ffd968b31b1575c = ((u32(((u32(138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_667d78d3cdb02aeeebc1fe7d() {
  return __cxx_static_address_667d78d3cdb02aeeebc1fe7d.reference || (__cxx_static_address_667d78d3cdb02aeeebc1fe7d.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_1ffd968b31b1575c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_5ffabbcebfa5a706 = ((u32(((u32(140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a833401eb16b583d4f6a07d() {
  return __cxx_static_address_1a833401eb16b583d4f6a07d.reference || (__cxx_static_address_1a833401eb16b583d4f6a07d.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_5ffabbcebfa5a706; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_e8ec4575dd56b5af = ((u32(((u32(142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_899e803239fbba1f05533122() {
  return __cxx_static_address_899e803239fbba1f05533122.reference || (__cxx_static_address_899e803239fbba1f05533122.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_e8ec4575dd56b5af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_4480bb200d7468ca = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b75dca1f8ea6088d6bc1b4b() {
  return __cxx_static_address_0b75dca1f8ea6088d6bc1b4b.reference || (__cxx_static_address_0b75dca1f8ea6088d6bc1b4b.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_4480bb200d7468ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_61d7b4a353e58ca1 = ((u32(((u32(150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c8a061be654f7a2a7e9d9d8() {
  return __cxx_static_address_2c8a061be654f7a2a7e9d9d8.reference || (__cxx_static_address_2c8a061be654f7a2a7e9d9d8.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_61d7b4a353e58ca1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_7a07d7134549bf58 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7512685ae03bee7718098d12() {
  return __cxx_static_address_7512685ae03bee7718098d12.reference || (__cxx_static_address_7512685ae03bee7718098d12.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_7a07d7134549bf58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_c96f373c37834d88 = ((u32(((u32(152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e266c09b0573a56f8da5f571() {
  return __cxx_static_address_e266c09b0573a56f8da5f571.reference || (__cxx_static_address_e266c09b0573a56f8da5f571.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_c96f373c37834d88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_ab7d6aef12303cb8 = ((u32(((u32(153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2349d70eb0b2e02132bfb544() {
  return __cxx_static_address_2349d70eb0b2e02132bfb544.reference || (__cxx_static_address_2349d70eb0b2e02132bfb544.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_ab7d6aef12303cb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_25a5757a7993bf02 = ((u32(((u32(154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fc3182a7e30334d62137f0bb() {
  return __cxx_static_address_fc3182a7e30334d62137f0bb.reference || (__cxx_static_address_fc3182a7e30334d62137f0bb.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_25a5757a7993bf02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_ffdd9a2360a488fe = ((u32(((u32(155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8444550d179bfa1ccff58364() {
  return __cxx_static_address_8444550d179bfa1ccff58364.reference || (__cxx_static_address_8444550d179bfa1ccff58364.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_ffdd9a2360a488fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_6f5a997a43a9c764 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55b3ad9ff24ba53f5858d3d3() {
  return __cxx_static_address_55b3ad9ff24ba53f5858d3d3.reference || (__cxx_static_address_55b3ad9ff24ba53f5858d3d3.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_6f5a997a43a9c764; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_c5ef8bd04f1a223a = ((u32(((u32(157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16061fd361b4c0bd40ec9f17() {
  return __cxx_static_address_16061fd361b4c0bd40ec9f17.reference || (__cxx_static_address_16061fd361b4c0bd40ec9f17.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_c5ef8bd04f1a223a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_a8539c0a5d66ca5f = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86dfb043fabccc2de7050def() {
  return __cxx_static_address_86dfb043fabccc2de7050def.reference || (__cxx_static_address_86dfb043fabccc2de7050def.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_a8539c0a5d66ca5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_080cd687e0a83b16 = ((u32(((u32(159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3247314bb416c77703d2307c() {
  return __cxx_static_address_3247314bb416c77703d2307c.reference || (__cxx_static_address_3247314bb416c77703d2307c.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_080cd687e0a83b16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_f57f9332e3082a94 = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43357ef327646d99c9dff9c7() {
  return __cxx_static_address_43357ef327646d99c9dff9c7.reference || (__cxx_static_address_43357ef327646d99c9dff9c7.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_f57f9332e3082a94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_846819114e921489 = ((u32(((u32(162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_991507df3daec24bce8409e0() {
  return __cxx_static_address_991507df3daec24bce8409e0.reference || (__cxx_static_address_991507df3daec24bce8409e0.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_846819114e921489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_91ebc26ce5193e1e = ((u32(((u32(164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52dc8df411400c3191d28716() {
  return __cxx_static_address_52dc8df411400c3191d28716.reference || (__cxx_static_address_52dc8df411400c3191d28716.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_91ebc26ce5193e1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_32bca32b6a882515 = ((u32(((u32(166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_857d8df9fce66029e42a5393() {
  return __cxx_static_address_857d8df9fce66029e42a5393.reference || (__cxx_static_address_857d8df9fce66029e42a5393.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_32bca32b6a882515; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_20fe352d957d4c6b = ((u32(((u32(168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdb00bdaa39204c7fbf9b036() {
  return __cxx_static_address_bdb00bdaa39204c7fbf9b036.reference || (__cxx_static_address_bdb00bdaa39204c7fbf9b036.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_20fe352d957d4c6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_c65da5d7a4195f95 = ((u32(((u32(170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b159eae939cb4314cccbfdf0() {
  return __cxx_static_address_b159eae939cb4314cccbfdf0.reference || (__cxx_static_address_b159eae939cb4314cccbfdf0.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_c65da5d7a4195f95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_96157b1e922151ed = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70c1f80dc87abc4cb00fa35c() {
  return __cxx_static_address_70c1f80dc87abc4cb00fa35c.reference || (__cxx_static_address_70c1f80dc87abc4cb00fa35c.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_96157b1e922151ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_8c0cf791620a5bed = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c199ca99344686ebf9d8e66() {
  return __cxx_static_address_2c199ca99344686ebf9d8e66.reference || (__cxx_static_address_2c199ca99344686ebf9d8e66.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_8c0cf791620a5bed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_8c9b12954f349be1 = ((u32(((u32(255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a22aee9dbf8ca4d2dc33a72() {
  return __cxx_static_address_0a22aee9dbf8ca4d2dc33a72.reference || (__cxx_static_address_0a22aee9dbf8ca4d2dc33a72.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_8c9b12954f349be1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_6d390889741da183 = ((u32(((u32(263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58b2e52797072e81729e8b22() {
  return __cxx_static_address_58b2e52797072e81729e8b22.reference || (__cxx_static_address_58b2e52797072e81729e8b22.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_6d390889741da183; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_c9a57cbd40ecda62 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a8781bfebf412bbaa31691c() {
  return __cxx_static_address_8a8781bfebf412bbaa31691c.reference || (__cxx_static_address_8a8781bfebf412bbaa31691c.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_c9a57cbd40ecda62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_a8ed80adbb8b8bf6 = ((u32(((u32(265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_869657b831bbec9b0ed7e4a6() {
  return __cxx_static_address_869657b831bbec9b0ed7e4a6.reference || (__cxx_static_address_869657b831bbec9b0ed7e4a6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_a8ed80adbb8b8bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_5cb6b3a24f70d4f6 = ((u32(((u32(266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08fa028e4651c21b9cc981b4() {
  return __cxx_static_address_08fa028e4651c21b9cc981b4.reference || (__cxx_static_address_08fa028e4651c21b9cc981b4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_5cb6b3a24f70d4f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_bb7cf2d96954116c = ((u32(((u32(267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5db4aa0354c35579498ceffd() {
  return __cxx_static_address_5db4aa0354c35579498ceffd.reference || (__cxx_static_address_5db4aa0354c35579498ceffd.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_bb7cf2d96954116c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_e030b3fba61d5bb4 = ((u32(((u32(268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a7bc960d79a68e0b5a90f79() {
  return __cxx_static_address_6a7bc960d79a68e0b5a90f79.reference || (__cxx_static_address_6a7bc960d79a68e0b5a90f79.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_e030b3fba61d5bb4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_217bc8c4a32ab705 = ((u32(((u32(269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b6e9c5b0bfa53c870c7a5b0() {
  return __cxx_static_address_2b6e9c5b0bfa53c870c7a5b0.reference || (__cxx_static_address_2b6e9c5b0bfa53c870c7a5b0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_217bc8c4a32ab705; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_6def1e459e933e87 = ((u32(((u32(270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f87a61fd4bf4f1e349eb18d5() {
  return __cxx_static_address_f87a61fd4bf4f1e349eb18d5.reference || (__cxx_static_address_f87a61fd4bf4f1e349eb18d5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_6def1e459e933e87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_8d7165b8dfe7f40a = ((u32(((u32(271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b976629dfa0bcdea6a5a32b() {
  return __cxx_static_address_0b976629dfa0bcdea6a5a32b.reference || (__cxx_static_address_0b976629dfa0bcdea6a5a32b.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_8d7165b8dfe7f40a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_7e41aec7c72b28b9 = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94839d2bb589fbc0cebf7a54() {
  return __cxx_static_address_94839d2bb589fbc0cebf7a54.reference || (__cxx_static_address_94839d2bb589fbc0cebf7a54.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_7e41aec7c72b28b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_4fb34c269d9c8de5 = ((u32(((u32(273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c660aec1ae26f701aeba925() {
  return __cxx_static_address_9c660aec1ae26f701aeba925.reference || (__cxx_static_address_9c660aec1ae26f701aeba925.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_4fb34c269d9c8de5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_b450f7c7aad642e1 = ((u32(((u32(274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7f31a35492a3499be23798f() {
  return __cxx_static_address_c7f31a35492a3499be23798f.reference || (__cxx_static_address_c7f31a35492a3499be23798f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_b450f7c7aad642e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_4bf00c6cbc3de11c = ((u32(((u32(275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e414bcc07a9c52e9d2a1e29() {
  return __cxx_static_address_1e414bcc07a9c52e9d2a1e29.reference || (__cxx_static_address_1e414bcc07a9c52e9d2a1e29.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_4bf00c6cbc3de11c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_9e0c96708a386f2b = ((u32(((u32(285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f43e050ade238c78cfa6b671() {
  return __cxx_static_address_f43e050ade238c78cfa6b671.reference || (__cxx_static_address_f43e050ade238c78cfa6b671.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_9e0c96708a386f2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_1db734a6f77857a3 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2da415e2a1bfe473c541fe1() {
  return __cxx_static_address_a2da415e2a1bfe473c541fe1.reference || (__cxx_static_address_a2da415e2a1bfe473c541fe1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_1db734a6f77857a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_fc8700a47b1386e0 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fb6a96f4691ca4f16167ec8() {
  return __cxx_static_address_7fb6a96f4691ca4f16167ec8.reference || (__cxx_static_address_7fb6a96f4691ca4f16167ec8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_fc8700a47b1386e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_3fa13053de196d0b = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51fb25e428b773461238e80e() {
  return __cxx_static_address_51fb25e428b773461238e80e.reference || (__cxx_static_address_51fb25e428b773461238e80e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_3fa13053de196d0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_b921c466ae1a5078 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a983135274fc868ad40a04e() {
  return __cxx_static_address_2a983135274fc868ad40a04e.reference || (__cxx_static_address_2a983135274fc868ad40a04e.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_b921c466ae1a5078; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_616db81223ed2e2e = ((u32(((u32(305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6caa58ea8beb155696dfef58() {
  return __cxx_static_address_6caa58ea8beb155696dfef58.reference || (__cxx_static_address_6caa58ea8beb155696dfef58.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_616db81223ed2e2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_6d3388a4db5eb8ea = ((u32(((u32(306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f573b8371b81005f7346d19() {
  return __cxx_static_address_1f573b8371b81005f7346d19.reference || (__cxx_static_address_1f573b8371b81005f7346d19.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_6d3388a4db5eb8ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_fbcc5327e67373e9 = ((u32(((u32(307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78420faa124c6c30c35764e6() {
  return __cxx_static_address_78420faa124c6c30c35764e6.reference || (__cxx_static_address_78420faa124c6c30c35764e6.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_fbcc5327e67373e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_b54872e2b4de42b1 = ((u32(((u32(336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_646a3232dbcc84539f266d59() {
  return __cxx_static_address_646a3232dbcc84539f266d59.reference || (__cxx_static_address_646a3232dbcc84539f266d59.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_b54872e2b4de42b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_13cbcc71bd09e329 = ((u32(((u32(341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08fe892b1a06d2ab633bd028() {
  return __cxx_static_address_08fe892b1a06d2ab633bd028.reference || (__cxx_static_address_08fe892b1a06d2ab633bd028.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_13cbcc71bd09e329; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_98ba3a7d06f351a8 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c9ad7877d0eb94aae45d1a8() {
  return __cxx_static_address_1c9ad7877d0eb94aae45d1a8.reference || (__cxx_static_address_1c9ad7877d0eb94aae45d1a8.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_98ba3a7d06f351a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_1dbef2efc58c8988 = ((u32(((u32(343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db3786334ce0cc973520455f() {
  return __cxx_static_address_db3786334ce0cc973520455f.reference || (__cxx_static_address_db3786334ce0cc973520455f.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_1dbef2efc58c8988; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_034bcd0f8d3ef63d = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_56b06ca21ba31f8ca07cffa2() {
  return __cxx_static_address_56b06ca21ba31f8ca07cffa2.reference || (__cxx_static_address_56b06ca21ba31f8ca07cffa2.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_034bcd0f8d3ef63d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_5fd08fd7dcf89e08 = ((u32(((u32(357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97592fdb742837ade0486ab6() {
  return __cxx_static_address_97592fdb742837ade0486ab6.reference || (__cxx_static_address_97592fdb742837ade0486ab6.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_5fd08fd7dcf89e08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_aef90ee3cf19495e = ((u32(((u32(360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d78090676867a8c129c0fa0d() {
  return __cxx_static_address_d78090676867a8c129c0fa0d.reference || (__cxx_static_address_d78090676867a8c129c0fa0d.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_aef90ee3cf19495e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_b6dfefea758ffa6d = ((u32(((u32(361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4b608d533f3d7e06d6aea08() {
  return __cxx_static_address_f4b608d533f3d7e06d6aea08.reference || (__cxx_static_address_f4b608d533f3d7e06d6aea08.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_b6dfefea758ffa6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_57aab55a4ae16f79 = ((u32(((u32(362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b5cc663a76201adaebc2e49() {
  return __cxx_static_address_4b5cc663a76201adaebc2e49.reference || (__cxx_static_address_4b5cc663a76201adaebc2e49.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_57aab55a4ae16f79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_7a02a5c727b22468 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c39efb528e3efe65a3fb02aa() {
  return __cxx_static_address_c39efb528e3efe65a3fb02aa.reference || (__cxx_static_address_c39efb528e3efe65a3fb02aa.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_7a02a5c727b22468; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_660ff3e63e7f14fa = ((u32(((u32(387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_16fcc156422291d86f4dd00d() {
  return __cxx_static_address_16fcc156422291d86f4dd00d.reference || (__cxx_static_address_16fcc156422291d86f4dd00d.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_660ff3e63e7f14fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_c540d00690522a76 = ((u32(((u32(391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dccd76f7c159f74ffac454ed() {
  return __cxx_static_address_dccd76f7c159f74ffac454ed.reference || (__cxx_static_address_dccd76f7c159f74ffac454ed.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_c540d00690522a76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_0f3f62765db36695 = ((u32(((u32(395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24dada9167673ce38564b7b7() {
  return __cxx_static_address_24dada9167673ce38564b7b7.reference || (__cxx_static_address_24dada9167673ce38564b7b7.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_0f3f62765db36695; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_863196cf88d3e823 = ((u32(((u32(407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_960834a9bc007842cfdb2ffa() {
  return __cxx_static_address_960834a9bc007842cfdb2ffa.reference || (__cxx_static_address_960834a9bc007842cfdb2ffa.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_863196cf88d3e823; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_318544c56991a50f = ((u32(((u32(411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f145117972345451bfe75c8() {
  return __cxx_static_address_5f145117972345451bfe75c8.reference || (__cxx_static_address_5f145117972345451bfe75c8.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_318544c56991a50f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_018c76951119484f = ((u32(((u32(412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_473c0dde183b98bdc4683bf3() {
  return __cxx_static_address_473c0dde183b98bdc4683bf3.reference || (__cxx_static_address_473c0dde183b98bdc4683bf3.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_018c76951119484f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_6a7fd09064624cda = ((u32(((u32(416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7266412208150573443943ae() {
  return __cxx_static_address_7266412208150573443943ae.reference || (__cxx_static_address_7266412208150573443943ae.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_6a7fd09064624cda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_f6415720725b94ed = ((u32(((u32(447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc65fc8238bfd0c4f7c8f8e2() {
  return __cxx_static_address_cc65fc8238bfd0c4f7c8f8e2.reference || (__cxx_static_address_cc65fc8238bfd0c4f7c8f8e2.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_f6415720725b94ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_c9befc16ed05e637 = ((u32(((u32(448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_313fd8225945ba7fef35873d() {
  return __cxx_static_address_313fd8225945ba7fef35873d.reference || (__cxx_static_address_313fd8225945ba7fef35873d.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_c9befc16ed05e637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_3d435e8e338ce2bc = ((u32(((u32(449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a289528bce3aae780b35dd4() {
  return __cxx_static_address_7a289528bce3aae780b35dd4.reference || (__cxx_static_address_7a289528bce3aae780b35dd4.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_3d435e8e338ce2bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_f64b6c755c413ceb = ((u32(((u32(499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e99cdf014db57dc2f3cc8a3d() {
  return __cxx_static_address_e99cdf014db57dc2f3cc8a3d.reference || (__cxx_static_address_e99cdf014db57dc2f3cc8a3d.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_f64b6c755c413ceb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_fc0c23394c6615cb = ((u32(((u32(502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_156f7200789561fb318470c4() {
  return __cxx_static_address_156f7200789561fb318470c4.reference || (__cxx_static_address_156f7200789561fb318470c4.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_fc0c23394c6615cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_7627d3be794c3fde = ((u32(((u32(503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e3fc1eb392f5e139db5feaa() {
  return __cxx_static_address_5e3fc1eb392f5e139db5feaa.reference || (__cxx_static_address_5e3fc1eb392f5e139db5feaa.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_7627d3be794c3fde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_ec36d6b4923c2fbc = ((u32(((u32(504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0cfa5dd3c2370445c084b756() {
  return __cxx_static_address_0cfa5dd3c2370445c084b756.reference || (__cxx_static_address_0cfa5dd3c2370445c084b756.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_ec36d6b4923c2fbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_60dee9bd2cca452b = ((u32(((u32(510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba380f40a8b9f9bf818d664b() {
  return __cxx_static_address_ba380f40a8b9f9bf818d664b.reference || (__cxx_static_address_ba380f40a8b9f9bf818d664b.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_60dee9bd2cca452b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_1c085a46f5005694 = ((u32(((u32(514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e4c7192e8061a4a2ec1c46c() {
  return __cxx_static_address_6e4c7192e8061a4a2ec1c46c.reference || (__cxx_static_address_6e4c7192e8061a4a2ec1c46c.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_1c085a46f5005694; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_db89fd4b0213c44e = ((u32(((u32(516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_34bd8b8db10fb7140c0d3b6c() {
  return __cxx_static_address_34bd8b8db10fb7140c0d3b6c.reference || (__cxx_static_address_34bd8b8db10fb7140c0d3b6c.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_db89fd4b0213c44e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_6845d189abf0c016 = ((u32(((u32(517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c8759e7b90b2adde17b9f62() {
  return __cxx_static_address_1c8759e7b90b2adde17b9f62.reference || (__cxx_static_address_1c8759e7b90b2adde17b9f62.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_6845d189abf0c016; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_8ef7d581494dde1e = ((u32(((u32(546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7353c128b9bb1126c13a749() {
  return __cxx_static_address_b7353c128b9bb1126c13a749.reference || (__cxx_static_address_b7353c128b9bb1126c13a749.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_8ef7d581494dde1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_6ff26cff972ec055 = ((u32(((u32(547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cd568586eb82dbb74964616() {
  return __cxx_static_address_6cd568586eb82dbb74964616.reference || (__cxx_static_address_6cd568586eb82dbb74964616.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_6ff26cff972ec055; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_321db530a155cd85 = ((u32(((u32(548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32578b29fc97571bc2880c38() {
  return __cxx_static_address_32578b29fc97571bc2880c38.reference || (__cxx_static_address_32578b29fc97571bc2880c38.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_321db530a155cd85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_9d7eefa4360f2ed6 = ((u32(((u32(549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3997e489ede903b983aa0887() {
  return __cxx_static_address_3997e489ede903b983aa0887.reference || (__cxx_static_address_3997e489ede903b983aa0887.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_9d7eefa4360f2ed6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_69ba8e862de50432 = ((u32(((u32(550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94957eef6439df1462bca336() {
  return __cxx_static_address_94957eef6439df1462bca336.reference || (__cxx_static_address_94957eef6439df1462bca336.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_69ba8e862de50432; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_57fdb146dd12cc50 = ((u32(((u32(551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5362e97fa4564c1add62a26() {
  return __cxx_static_address_d5362e97fa4564c1add62a26.reference || (__cxx_static_address_d5362e97fa4564c1add62a26.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_57fdb146dd12cc50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_ef28f9138a56d18c = ((u32(((u32(554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bad09628c4ac2f5fe1b80ffe() {
  return __cxx_static_address_bad09628c4ac2f5fe1b80ffe.reference || (__cxx_static_address_bad09628c4ac2f5fe1b80ffe.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_ef28f9138a56d18c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_a2e6a2f1ed4dead3 = ((u32(((u32(556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31f4512af10bd8be4121d90b() {
  return __cxx_static_address_31f4512af10bd8be4121d90b.reference || (__cxx_static_address_31f4512af10bd8be4121d90b.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_a2e6a2f1ed4dead3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_b07a65d352ad1062 = ((u32(((u32(557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58f13ca3a8b68e3f20582989() {
  return __cxx_static_address_58f13ca3a8b68e3f20582989.reference || (__cxx_static_address_58f13ca3a8b68e3f20582989.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_b07a65d352ad1062; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_a9f4818c0a7f0390 = ((u32(((u32(559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e06b85f00fd9bad53a7459f0() {
  return __cxx_static_address_e06b85f00fd9bad53a7459f0.reference || (__cxx_static_address_e06b85f00fd9bad53a7459f0.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_a9f4818c0a7f0390; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_d7f6db8c6a278198 = ((u32(((u32(560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3abc248060fc8349e868a30e() {
  return __cxx_static_address_3abc248060fc8349e868a30e.reference || (__cxx_static_address_3abc248060fc8349e868a30e.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_d7f6db8c6a278198; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_8e03f823271b2657 = ((u32(((u32(563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10c748ea9d216da940189ea8() {
  return __cxx_static_address_10c748ea9d216da940189ea8.reference || (__cxx_static_address_10c748ea9d216da940189ea8.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_8e03f823271b2657; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_5e5441ba1f40af95 = ((u32(((u32(567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd3711cea36d7cad05c04352() {
  return __cxx_static_address_bd3711cea36d7cad05c04352.reference || (__cxx_static_address_bd3711cea36d7cad05c04352.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_5e5441ba1f40af95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_cd0bb4d4c5b4cc06 = ((u32(((u32(568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcad8124223e6483556cb4c7() {
  return __cxx_static_address_dcad8124223e6483556cb4c7.reference || (__cxx_static_address_dcad8124223e6483556cb4c7.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_cd0bb4d4c5b4cc06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_f19e6be93ac276d9 = ((u32(((u32(569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae34fd532ef77c8e0d682099() {
  return __cxx_static_address_ae34fd532ef77c8e0d682099.reference || (__cxx_static_address_ae34fd532ef77c8e0d682099.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_f19e6be93ac276d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_b3be3ed6ad3404ab = ((u32(((u32(571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3c73f608cb10ada863b02ed() {
  return __cxx_static_address_a3c73f608cb10ada863b02ed.reference || (__cxx_static_address_a3c73f608cb10ada863b02ed.reference = {
    __cReference: true,
    get value() { return STALL____header_global_b3be3ed6ad3404ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_2549630ec9ff7a9b = ((u32(((u32(573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5bc052864be5b4b7cb1dd45f() {
  return __cxx_static_address_5bc052864be5b4b7cb1dd45f.reference || (__cxx_static_address_5bc052864be5b4b7cb1dd45f.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_2549630ec9ff7a9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_b5314e35e9891349 = ((u32(((u32(577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5777691b1f430eb1d2b92fa() {
  return __cxx_static_address_e5777691b1f430eb1d2b92fa.reference || (__cxx_static_address_e5777691b1f430eb1d2b92fa.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_b5314e35e9891349; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_083e256c2383231c = ((u32(((u32(578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66d7176082146c0d3eb8e846() {
  return __cxx_static_address_66d7176082146c0d3eb8e846.reference || (__cxx_static_address_66d7176082146c0d3eb8e846.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_083e256c2383231c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_fb37b07e953f499b = ((u32(((u32(579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4de0b9b1a4755ef0ff899e59() {
  return __cxx_static_address_4de0b9b1a4755ef0ff899e59.reference || (__cxx_static_address_4de0b9b1a4755ef0ff899e59.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_fb37b07e953f499b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_c43f5b5425627cb9 = ((u32(((u32(580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96741c133b6a26bf1c04f6eb() {
  return __cxx_static_address_96741c133b6a26bf1c04f6eb.reference || (__cxx_static_address_96741c133b6a26bf1c04f6eb.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_c43f5b5425627cb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_b1afe6f64a675b7d = ((u32(((u32(595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c63f244ee5dc0fa415811a4() {
  return __cxx_static_address_2c63f244ee5dc0fa415811a4.reference || (__cxx_static_address_2c63f244ee5dc0fa415811a4.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_b1afe6f64a675b7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_b91f74c3030d12b1 = ((u32(((u32(596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_214ea268e25f6e9cf82fe6c6() {
  return __cxx_static_address_214ea268e25f6e9cf82fe6c6.reference || (__cxx_static_address_214ea268e25f6e9cf82fe6c6.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_b91f74c3030d12b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_0ad3299b81db7be6 = ((u32(((u32(602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0c30764e11cae457fe54e41() {
  return __cxx_static_address_b0c30764e11cae457fe54e41.reference || (__cxx_static_address_b0c30764e11cae457fe54e41.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_0ad3299b81db7be6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_011d9f4c1d491f4d = ((u32(((u32(603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d553519cd7a369676622cc3d() {
  return __cxx_static_address_d553519cd7a369676622cc3d.reference || (__cxx_static_address_d553519cd7a369676622cc3d.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_011d9f4c1d491f4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_88eeb441da0ec44d = ((u32(((u32(607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_afb2ba34ff1dbf3a9fc3c165() {
  return __cxx_static_address_afb2ba34ff1dbf3a9fc3c165.reference || (__cxx_static_address_afb2ba34ff1dbf3a9fc3c165.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_88eeb441da0ec44d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_e2e8fa17f401e69f = ((u32(((u32(609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aab0b59785b1935d8c32027a() {
  return __cxx_static_address_aab0b59785b1935d8c32027a.reference || (__cxx_static_address_aab0b59785b1935d8c32027a.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_e2e8fa17f401e69f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_e64db960cb710107 = ((u32(((u32(615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24e203d67adf0181a2b03024() {
  return __cxx_static_address_24e203d67adf0181a2b03024.reference || (__cxx_static_address_24e203d67adf0181a2b03024.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_e64db960cb710107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_afbe9ed6d5a4fd4a = ((u32(((u32(616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0e00582ad0bb96ea72973e8() {
  return __cxx_static_address_f0e00582ad0bb96ea72973e8.reference || (__cxx_static_address_f0e00582ad0bb96ea72973e8.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_afbe9ed6d5a4fd4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_2beb682b9d658dc3 = ((u32(((u32(617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03b78e8064b0fedd903ed3e6() {
  return __cxx_static_address_03b78e8064b0fedd903ed3e6.reference || (__cxx_static_address_03b78e8064b0fedd903ed3e6.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_2beb682b9d658dc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_0dabc0c5b4da8abe = ((u32(((u32(618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d07e0811cc67a5d35e2eef9d() {
  return __cxx_static_address_d07e0811cc67a5d35e2eef9d.reference || (__cxx_static_address_d07e0811cc67a5d35e2eef9d.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_0dabc0c5b4da8abe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_2fcfdd3da5f1a317 = ((u32(((u32(619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_97b0bddf7fff2b278b896903() {
  return __cxx_static_address_97b0bddf7fff2b278b896903.reference || (__cxx_static_address_97b0bddf7fff2b278b896903.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_2fcfdd3da5f1a317; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_71e915fba1c83cf9 = ((u32(((u32(621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc61785549f09c6eb4dfc9c4() {
  return __cxx_static_address_dc61785549f09c6eb4dfc9c4.reference || (__cxx_static_address_dc61785549f09c6eb4dfc9c4.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_71e915fba1c83cf9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_468b587eeefa9cef = ((u32(((u32(633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94a471f75593268a50fa4c11() {
  return __cxx_static_address_94a471f75593268a50fa4c11.reference || (__cxx_static_address_94a471f75593268a50fa4c11.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_468b587eeefa9cef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_556b9659870b1958 = ((u32(((u32(634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be646606b7406aa3c59a908b() {
  return __cxx_static_address_be646606b7406aa3c59a908b.reference || (__cxx_static_address_be646606b7406aa3c59a908b.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_556b9659870b1958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_78edc5bb0f3467fc = ((u32(((u32(640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0714c67e090a021099e1ea0d() {
  return __cxx_static_address_0714c67e090a021099e1ea0d.reference || (__cxx_static_address_0714c67e090a021099e1ea0d.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_78edc5bb0f3467fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_7b5681650da6c91d = ((u32(((u32(660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2736fb0856e2e488a2c7afb() {
  return __cxx_static_address_b2736fb0856e2e488a2c7afb.reference || (__cxx_static_address_b2736fb0856e2e488a2c7afb.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_7b5681650da6c91d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_cf0db02c5b74f6f5 = ((u32(((u32(661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7428acf4edc3b8cb883d976() {
  return __cxx_static_address_c7428acf4edc3b8cb883d976.reference || (__cxx_static_address_c7428acf4edc3b8cb883d976.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_cf0db02c5b74f6f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_02c4f7d19b33a0b9 = ((u32(((u32(662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d1cf196027d6002e53b6a4e() {
  return __cxx_static_address_4d1cf196027d6002e53b6a4e.reference || (__cxx_static_address_4d1cf196027d6002e53b6a4e.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_02c4f7d19b33a0b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_7f8c19de70b0751a = ((u32(((u32(663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81031f1943620f3905d73904() {
  return __cxx_static_address_81031f1943620f3905d73904.reference || (__cxx_static_address_81031f1943620f3905d73904.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_7f8c19de70b0751a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_5a2ba341d618ab5a = ((u32(((u32(669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2b15bc222a81349cf464bae() {
  return __cxx_static_address_b2b15bc222a81349cf464bae.reference || (__cxx_static_address_b2b15bc222a81349cf464bae.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_5a2ba341d618ab5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_42c54b6c4fd8c80f = ((u32(((u32(672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f458d606097f69fb43d584d0() {
  return __cxx_static_address_f458d606097f69fb43d584d0.reference || (__cxx_static_address_f458d606097f69fb43d584d0.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_42c54b6c4fd8c80f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_e518337e8719dadd = ((u32(((u32(673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_031dac6ee75767c6ac70fdbf() {
  return __cxx_static_address_031dac6ee75767c6ac70fdbf.reference || (__cxx_static_address_031dac6ee75767c6ac70fdbf.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_e518337e8719dadd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_bdce66f8d7765ad9 = ((u32(((u32(674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4e290238cf5960f23f2ef13() {
  return __cxx_static_address_b4e290238cf5960f23f2ef13.reference || (__cxx_static_address_b4e290238cf5960f23f2ef13.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_bdce66f8d7765ad9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_1bdce393e9b86dfb = ((u32(((u32(675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91b263c47d57577be813253a() {
  return __cxx_static_address_91b263c47d57577be813253a.reference || (__cxx_static_address_91b263c47d57577be813253a.reference = {
    __cReference: true,
    get value() { return EGG____header_global_1bdce393e9b86dfb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_138cb513a126adec = ((u32(((u32(678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d469860d75336bbb3dfe7d5() {
  return __cxx_static_address_9d469860d75336bbb3dfe7d5.reference || (__cxx_static_address_9d469860d75336bbb3dfe7d5.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_138cb513a126adec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_bfeacc1f9f74f9e9 = ((u32(((u32(680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1732329a0d9bf5a952aaac8() {
  return __cxx_static_address_a1732329a0d9bf5a952aaac8.reference || (__cxx_static_address_a1732329a0d9bf5a952aaac8.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_bfeacc1f9f74f9e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_5ea1b64408f2846a = ((u32(((u32(685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_002bf29fb55a47c20f096dab() {
  return __cxx_static_address_002bf29fb55a47c20f096dab.reference || (__cxx_static_address_002bf29fb55a47c20f096dab.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_5ea1b64408f2846a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_ccaf69b8a081627d = ((u32(((u32(686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a525eeeda28be30a5deb2e8f() {
  return __cxx_static_address_a525eeeda28be30a5deb2e8f.reference || (__cxx_static_address_a525eeeda28be30a5deb2e8f.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_ccaf69b8a081627d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_9d0324280a6773cc = ((u32(((u32(689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_509dd3b15596564828548604() {
  return __cxx_static_address_509dd3b15596564828548604.reference || (__cxx_static_address_509dd3b15596564828548604.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_9d0324280a6773cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_7c02aafa1fbe0c55 = ((u32(((u32(694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e7612e5fa00463bc9a3ffcd() {
  return __cxx_static_address_5e7612e5fa00463bc9a3ffcd.reference || (__cxx_static_address_5e7612e5fa00463bc9a3ffcd.reference = {
    __cReference: true,
    get value() { return POT1____header_global_7c02aafa1fbe0c55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_55c348328a8251b4 = ((u32(((u32(695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4f4763ab1803dec9b7285ca() {
  return __cxx_static_address_b4f4763ab1803dec9b7285ca.reference || (__cxx_static_address_b4f4763ab1803dec9b7285ca.reference = {
    __cReference: true,
    get value() { return POT2____header_global_55c348328a8251b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_bc282d07ae20e5cb = ((u32(((u32(697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9084b525d56a4ad0dbe48a09() {
  return __cxx_static_address_9084b525d56a4ad0dbe48a09.reference || (__cxx_static_address_9084b525d56a4ad0dbe48a09.reference = {
    __cReference: true,
    get value() { return POT3____header_global_bc282d07ae20e5cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_a5d5007e23a5a01e = ((u32(((u32(700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fd2df60a5be3efba7ff3c1a() {
  return __cxx_static_address_2fd2df60a5be3efba7ff3c1a.reference || (__cxx_static_address_2fd2df60a5be3efba7ff3c1a.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_a5d5007e23a5a01e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_b1cacc92aaffe3a3 = ((u32(((u32(701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20d651f7b79e565253795836() {
  return __cxx_static_address_20d651f7b79e565253795836.reference || (__cxx_static_address_20d651f7b79e565253795836.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_b1cacc92aaffe3a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_4ad01679a37d4aef = ((u32(((u32(702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e15104d6abc94529ab0532f0() {
  return __cxx_static_address_e15104d6abc94529ab0532f0.reference || (__cxx_static_address_e15104d6abc94529ab0532f0.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_4ad01679a37d4aef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_3f025a4779564c46 = ((u32(((u32(703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14609a326571379abd2b0141() {
  return __cxx_static_address_14609a326571379abd2b0141.reference || (__cxx_static_address_14609a326571379abd2b0141.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_3f025a4779564c46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_0f483391c5ee6e58 = ((u32(((u32(704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_035b5483e7cbdc806ee1c04e() {
  return __cxx_static_address_035b5483e7cbdc806ee1c04e.reference || (__cxx_static_address_035b5483e7cbdc806ee1c04e.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_0f483391c5ee6e58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_33b62accd8c42f3d = ((u32(((u32(705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_358cc2e9b8767e66791a97c8() {
  return __cxx_static_address_358cc2e9b8767e66791a97c8.reference || (__cxx_static_address_358cc2e9b8767e66791a97c8.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_33b62accd8c42f3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_8dbfb5c2e308140e = ((u32(((u32(706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3141dad64931ef769c8865ed() {
  return __cxx_static_address_3141dad64931ef769c8865ed.reference || (__cxx_static_address_3141dad64931ef769c8865ed.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_8dbfb5c2e308140e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_b281f574ac9627a8 = ((u32(((u32(712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ab133da32e75341899243d6() {
  return __cxx_static_address_1ab133da32e75341899243d6.reference || (__cxx_static_address_1ab133da32e75341899243d6.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_b281f574ac9627a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_ed94c898c1c42785 = ((u32(((u32(716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc8b1c5d760263633aa04405() {
  return __cxx_static_address_bc8b1c5d760263633aa04405.reference || (__cxx_static_address_bc8b1c5d760263633aa04405.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_ed94c898c1c42785; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_9af603d0a13bebeb = ((u32(((u32(717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f2f523d6ef12b42958b6d13() {
  return __cxx_static_address_3f2f523d6ef12b42958b6d13.reference || (__cxx_static_address_3f2f523d6ef12b42958b6d13.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_9af603d0a13bebeb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_d8d5b83d1bcb9759 = ((u32(((u32(753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b060003ee37f090fc810dbe() {
  return __cxx_static_address_7b060003ee37f090fc810dbe.reference || (__cxx_static_address_7b060003ee37f090fc810dbe.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_d8d5b83d1bcb9759; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_c6291d94542f9597 = ((u32(((u32(762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70db70bbf32ffe8b282e5cde() {
  return __cxx_static_address_70db70bbf32ffe8b282e5cde.reference || (__cxx_static_address_70db70bbf32ffe8b282e5cde.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_c6291d94542f9597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_938672d6c0011e57 = ((u32(((u32(765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51b6cef8d3f67d6bfc84ca0b() {
  return __cxx_static_address_51b6cef8d3f67d6bfc84ca0b.reference || (__cxx_static_address_51b6cef8d3f67d6bfc84ca0b.reference = {
    __cReference: true,
    get value() { return VASE____header_global_938672d6c0011e57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_36df4391bf7e5a40 = ((u32(((u32(768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7b32a608a4ce4d95c6bf921() {
  return __cxx_static_address_d7b32a608a4ce4d95c6bf921.reference || (__cxx_static_address_d7b32a608a4ce4d95c6bf921.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_36df4391bf7e5a40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_498cbbce578d8d1e = ((u32(((u32(769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d91799a1e471b6451d64f9c() {
  return __cxx_static_address_5d91799a1e471b6451d64f9c.reference || (__cxx_static_address_5d91799a1e471b6451d64f9c.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_498cbbce578d8d1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_3dc234d9c9bba20b = ((u32(((u32(774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80fa87ad4e53f898e4115b15() {
  return __cxx_static_address_80fa87ad4e53f898e4115b15.reference || (__cxx_static_address_80fa87ad4e53f898e4115b15.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_3dc234d9c9bba20b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_85ae759d8cf956de = ((u32(((u32(779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_330e7bcc545d4fabd0a2c153() {
  return __cxx_static_address_330e7bcc545d4fabd0a2c153.reference || (__cxx_static_address_330e7bcc545d4fabd0a2c153.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_85ae759d8cf956de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_569009ce4e3c7cc1 = ((u32(((u32(781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_036d4bb2edba281ecb6d8cb4() {
  return __cxx_static_address_036d4bb2edba281ecb6d8cb4.reference || (__cxx_static_address_036d4bb2edba281ecb6d8cb4.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_569009ce4e3c7cc1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_5e1014ebe97516d6 = ((u32(((u32(792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a99e7c83715fea651343c049() {
  return __cxx_static_address_a99e7c83715fea651343c049.reference || (__cxx_static_address_a99e7c83715fea651343c049.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_5e1014ebe97516d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_8d6fc91383d13eae = ((u32(((u32(806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5d21a3cd92eaa125fb2b555() {
  return __cxx_static_address_f5d21a3cd92eaa125fb2b555.reference || (__cxx_static_address_f5d21a3cd92eaa125fb2b555.reference = {
    __cReference: true,
    get value() { return OJ____header_global_8d6fc91383d13eae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_797e9c2d2b79a813 = ((u32(((u32(830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffe7c7d0ccf0725512fc5871() {
  return __cxx_static_address_ffe7c7d0ccf0725512fc5871.reference || (__cxx_static_address_ffe7c7d0ccf0725512fc5871.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_797e9c2d2b79a813; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_4f347f5f571afc76 = ((u32(((u32(859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d0d9b78eb584bea48e37395() {
  return __cxx_static_address_8d0d9b78eb584bea48e37395.reference || (__cxx_static_address_8d0d9b78eb584bea48e37395.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_4f347f5f571afc76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_150cfa8793d5e970 = ((u32(((u32(860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9f5f36da94994e1838577b8() {
  return __cxx_static_address_d9f5f36da94994e1838577b8.reference || (__cxx_static_address_d9f5f36da94994e1838577b8.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_150cfa8793d5e970; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_8ff23fdbede039fc = ((u32(((u32(862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_282b57085a4c742c896b97f1() {
  return __cxx_static_address_282b57085a4c742c896b97f1.reference || (__cxx_static_address_282b57085a4c742c896b97f1.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_8ff23fdbede039fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_ec8be41e3903eb0a = ((u32(((u32(864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4806fb4c1fcd5a862ef6c7d7() {
  return __cxx_static_address_4806fb4c1fcd5a862ef6c7d7.reference || (__cxx_static_address_4806fb4c1fcd5a862ef6c7d7.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_ec8be41e3903eb0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_82d7f49464fe4d3d = ((u32(((u32(867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb46fe8692f95da38db5190c() {
  return __cxx_static_address_eb46fe8692f95da38db5190c.reference || (__cxx_static_address_eb46fe8692f95da38db5190c.reference = {
    __cReference: true,
    get value() { return ATM____header_global_82d7f49464fe4d3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_30144bdc6546405e = ((u32(((u32(869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08817be8966362ddcd8876fe() {
  return __cxx_static_address_08817be8966362ddcd8876fe.reference || (__cxx_static_address_08817be8966362ddcd8876fe.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_30144bdc6546405e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_a2e4c4eb67ca9f8d = ((u32(((u32(888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_964ac4db61f86b6dd6a6935d() {
  return __cxx_static_address_964ac4db61f86b6dd6a6935d.reference || (__cxx_static_address_964ac4db61f86b6dd6a6935d.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_a2e4c4eb67ca9f8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_ad0737ff53cd6178 = ((u32(((u32(901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6906dba0407891d82110d58b() {
  return __cxx_static_address_6906dba0407891d82110d58b.reference || (__cxx_static_address_6906dba0407891d82110d58b.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_ad0737ff53cd6178; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_8b50c77ac8c5cf03 = ((u32(((u32(902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e72f8ea5f64e9bf26a5f662() {
  return __cxx_static_address_1e72f8ea5f64e9bf26a5f662.reference || (__cxx_static_address_1e72f8ea5f64e9bf26a5f662.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_8b50c77ac8c5cf03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_79142cac1a89ee6b = ((u32(((u32(903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78753383fe4770a366388f6f() {
  return __cxx_static_address_78753383fe4770a366388f6f.reference || (__cxx_static_address_78753383fe4770a366388f6f.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_79142cac1a89ee6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_8d00e795fbdd330d = ((u32(((u32(904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_416271f675768bac6d61bf79() {
  return __cxx_static_address_416271f675768bac6d61bf79.reference || (__cxx_static_address_416271f675768bac6d61bf79.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_8d00e795fbdd330d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_7191cd8d8d61ec0a = ((u32(((u32(908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e11dbf228376e78505867247() {
  return __cxx_static_address_e11dbf228376e78505867247.reference || (__cxx_static_address_e11dbf228376e78505867247.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_7191cd8d8d61ec0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_bc97d1969c5f9ddb = ((u32(((u32(910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba6bc7026b925e85850aa8c3() {
  return __cxx_static_address_ba6bc7026b925e85850aa8c3.reference || (__cxx_static_address_ba6bc7026b925e85850aa8c3.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_bc97d1969c5f9ddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_e1faeaad205c7e05 = ((u32(((u32(911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ab8b5a0b71534e9055c5f8b() {
  return __cxx_static_address_7ab8b5a0b71534e9055c5f8b.reference || (__cxx_static_address_7ab8b5a0b71534e9055c5f8b.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_e1faeaad205c7e05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_c48396b5ab339d2d = ((u32(((u32(913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1dff9700b28b32967a298d54() {
  return __cxx_static_address_1dff9700b28b32967a298d54.reference || (__cxx_static_address_1dff9700b28b32967a298d54.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_c48396b5ab339d2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_24ee26e0f757dfa7 = ((u32(((u32(914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bce14421547ade4dc6370405() {
  return __cxx_static_address_bce14421547ade4dc6370405.reference || (__cxx_static_address_bce14421547ade4dc6370405.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_24ee26e0f757dfa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_74ba2573b9731309 = ((u32(((u32(915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aeffebaa73f264de2cafcb9c() {
  return __cxx_static_address_aeffebaa73f264de2cafcb9c.reference || (__cxx_static_address_aeffebaa73f264de2cafcb9c.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_74ba2573b9731309; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_c5542a1bb5a27ea9 = ((u32(((u32(916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e811822589f4b12482d4fea() {
  return __cxx_static_address_3e811822589f4b12482d4fea.reference || (__cxx_static_address_3e811822589f4b12482d4fea.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_c5542a1bb5a27ea9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_c5ae351975c1e9db = ((u32(((u32(921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3be87da059d8f63e9a1aec32() {
  return __cxx_static_address_3be87da059d8f63e9a1aec32.reference || (__cxx_static_address_3be87da059d8f63e9a1aec32.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_c5ae351975c1e9db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_80c6f1c8a730f9b3 = ((u32(((u32(925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_11c8819f9f1df1f9bf6220ca() {
  return __cxx_static_address_11c8819f9f1df1f9bf6220ca.reference || (__cxx_static_address_11c8819f9f1df1f9bf6220ca.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_80c6f1c8a730f9b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_bf01ef6f7175a925 = ((u32(((u32(926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf26c1a8ba8ff43f3abc34f8() {
  return __cxx_static_address_bf26c1a8ba8ff43f3abc34f8.reference || (__cxx_static_address_bf26c1a8ba8ff43f3abc34f8.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_bf01ef6f7175a925; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_75202f8aa81bd9f9 = ((u32(((u32(939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f7c4ee79e54e2467eeb7c19() {
  return __cxx_static_address_8f7c4ee79e54e2467eeb7c19.reference || (__cxx_static_address_8f7c4ee79e54e2467eeb7c19.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_75202f8aa81bd9f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_d9d97e5e3d8fe2bb = ((u32(((u32(940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa41219f38b91329af606aeb() {
  return __cxx_static_address_aa41219f38b91329af606aeb.reference || (__cxx_static_address_aa41219f38b91329af606aeb.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_d9d97e5e3d8fe2bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_569386375250fc50 = ((u32(((u32(950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4cf31c36169a4569f399d9e() {
  return __cxx_static_address_c4cf31c36169a4569f399d9e.reference || (__cxx_static_address_c4cf31c36169a4569f399d9e.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_569386375250fc50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_01bf6d55edf2d3a5 = ((u32(((u32(951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dcc9231ec97eb11cdd007eb() {
  return __cxx_static_address_2dcc9231ec97eb11cdd007eb.reference || (__cxx_static_address_2dcc9231ec97eb11cdd007eb.reference = {
    __cReference: true,
    get value() { return BOX____header_global_01bf6d55edf2d3a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_ab30460214c3482e = ((u32(((u32(952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a31a846efac658a35bf1ee13() {
  return __cxx_static_address_a31a846efac658a35bf1ee13.reference || (__cxx_static_address_a31a846efac658a35bf1ee13.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_ab30460214c3482e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_2411ea245287f1f9 = ((u32(((u32(954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f7e23704e6dcd4fbac265e0() {
  return __cxx_static_address_1f7e23704e6dcd4fbac265e0.reference || (__cxx_static_address_1f7e23704e6dcd4fbac265e0.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_2411ea245287f1f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_22e529f1278c4c2d = ((u32(((u32(955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51b467863e84b18851a2a714() {
  return __cxx_static_address_51b467863e84b18851a2a714.reference || (__cxx_static_address_51b467863e84b18851a2a714.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_22e529f1278c4c2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_079c2ca7362a412b = ((u32(((u32(956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d3c7000ff48e2ba3ad37e343() {
  return __cxx_static_address_d3c7000ff48e2ba3ad37e343.reference || (__cxx_static_address_d3c7000ff48e2ba3ad37e343.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_079c2ca7362a412b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_101dc66d68fc549e = ((u32(((u32(957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e41a6b62a723f20564790e6e() {
  return __cxx_static_address_e41a6b62a723f20564790e6e.reference || (__cxx_static_address_e41a6b62a723f20564790e6e.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_101dc66d68fc549e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_d8cf19b178daf929 = ((u32(((u32(963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c075b43a7dff1568ec06dc5() {
  return __cxx_static_address_7c075b43a7dff1568ec06dc5.reference || (__cxx_static_address_7c075b43a7dff1568ec06dc5.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_d8cf19b178daf929; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_47a9e27ee1c8a65a = ((u32(((u32(964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27bab9a50ff0e600753bf2a7() {
  return __cxx_static_address_27bab9a50ff0e600753bf2a7.reference || (__cxx_static_address_27bab9a50ff0e600753bf2a7.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_47a9e27ee1c8a65a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_82720c0f2f5ea5b4 = ((u32(((u32(965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc6fa0e01ac46eed249cd0b2() {
  return __cxx_static_address_cc6fa0e01ac46eed249cd0b2.reference || (__cxx_static_address_cc6fa0e01ac46eed249cd0b2.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_82720c0f2f5ea5b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_818b09c59bf9dc36 = ((u32(((u32(969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db3145762c455a443ed0019d() {
  return __cxx_static_address_db3145762c455a443ed0019d.reference || (__cxx_static_address_db3145762c455a443ed0019d.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_818b09c59bf9dc36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_4453edfd23a0c61c = ((u32(((u32(971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f037e06bc1bc365fa8d7b71() {
  return __cxx_static_address_2f037e06bc1bc365fa8d7b71.reference || (__cxx_static_address_2f037e06bc1bc365fa8d7b71.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_4453edfd23a0c61c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_3d2db1fb85f464b6 = ((u32(((u32(972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe2adf2acb17cf010189a9e3() {
  return __cxx_static_address_fe2adf2acb17cf010189a9e3.reference || (__cxx_static_address_fe2adf2acb17cf010189a9e3.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_3d2db1fb85f464b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_3f505aba9314a644 = ((u32(((u32(973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd4b58e158b40a31749f6713() {
  return __cxx_static_address_dd4b58e158b40a31749f6713.reference || (__cxx_static_address_dd4b58e158b40a31749f6713.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_3f505aba9314a644; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_4f3dd5a02192efa5 = ((u32(((u32(974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_84170945eabe86c063ffd333() {
  return __cxx_static_address_84170945eabe86c063ffd333.reference || (__cxx_static_address_84170945eabe86c063ffd333.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_4f3dd5a02192efa5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_03c04477785c7739 = ((u32(((u32(975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec939361e78aa858e4931d36() {
  return __cxx_static_address_ec939361e78aa858e4931d36.reference || (__cxx_static_address_ec939361e78aa858e4931d36.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_03c04477785c7739; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_edf4216b23c26ef0 = ((u32(((u32(977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dbb8288afac01da36af1353() {
  return __cxx_static_address_5dbb8288afac01da36af1353.reference || (__cxx_static_address_5dbb8288afac01da36af1353.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_edf4216b23c26ef0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_64808f4dad7c744e = ((u32(((u32(978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ebb03603a3c5a72b53fe0364() {
  return __cxx_static_address_ebb03603a3c5a72b53fe0364.reference || (__cxx_static_address_ebb03603a3c5a72b53fe0364.reference = {
    __cReference: true,
    get value() { return CONE____header_global_64808f4dad7c744e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_7d05c22f88265c9e = ((u32(((u32(979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71fecf3fac1a7003673e3811() {
  return __cxx_static_address_71fecf3fac1a7003673e3811.reference || (__cxx_static_address_71fecf3fac1a7003673e3811.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_7d05c22f88265c9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_3acba21a32afd24e = ((u32(((u32(981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3749dade63490df7c978feb() {
  return __cxx_static_address_b3749dade63490df7c978feb.reference || (__cxx_static_address_b3749dade63490df7c978feb.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_3acba21a32afd24e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_24af6b9982e6ff40 = ((u32(((u32(988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7423afd55e95a1d9bde2d296() {
  return __cxx_static_address_7423afd55e95a1d9bde2d296.reference || (__cxx_static_address_7423afd55e95a1d9bde2d296.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_24af6b9982e6ff40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_9b282572ceeef7f1 = ((u32(((u32(990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c116e46acc230d9e92cacd2() {
  return __cxx_static_address_2c116e46acc230d9e92cacd2.reference || (__cxx_static_address_2c116e46acc230d9e92cacd2.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_9b282572ceeef7f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_f067e62408f11cbd = ((u32(((u32(994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8470d4c18aff435c94304ee5() {
  return __cxx_static_address_8470d4c18aff435c94304ee5.reference || (__cxx_static_address_8470d4c18aff435c94304ee5.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_f067e62408f11cbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_dc46478123c1f4a0 = ((u32(((u32(995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71a3946d7df1ab382e2cf052() {
  return __cxx_static_address_71a3946d7df1ab382e2cf052.reference || (__cxx_static_address_71a3946d7df1ab382e2cf052.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_dc46478123c1f4a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_caa80a3a0e8ea7d6 = ((u32(((u32(996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87b12c1022d04b2450569e8f() {
  return __cxx_static_address_87b12c1022d04b2450569e8f.reference || (__cxx_static_address_87b12c1022d04b2450569e8f.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_caa80a3a0e8ea7d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_b7f157f9dfff42f9 = ((u32(((u32(997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3bc71d3c2700f6cd85ba7b2() {
  return __cxx_static_address_a3bc71d3c2700f6cd85ba7b2.reference || (__cxx_static_address_a3bc71d3c2700f6cd85ba7b2.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_b7f157f9dfff42f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_ac3aa9bf4753cc44 = ((u32(((u32(1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c44322a5cc14465cec63ae8c() {
  return __cxx_static_address_c44322a5cc14465cec63ae8c.reference || (__cxx_static_address_c44322a5cc14465cec63ae8c.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_ac3aa9bf4753cc44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_75b33124bc6a0324 = ((u32(((u32(1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5e648fd38329be9e07ad594() {
  return __cxx_static_address_c5e648fd38329be9e07ad594.reference || (__cxx_static_address_c5e648fd38329be9e07ad594.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_75b33124bc6a0324; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_407747bdf9f4c52e = ((u32(((u32(1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f15a995dbda82d0ed6b6960() {
  return __cxx_static_address_9f15a995dbda82d0ed6b6960.reference || (__cxx_static_address_9f15a995dbda82d0ed6b6960.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_407747bdf9f4c52e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_b1069aca3c21bb83 = ((u32(((u32(1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d04c53c4027bb4b2f9efcf18() {
  return __cxx_static_address_d04c53c4027bb4b2f9efcf18.reference || (__cxx_static_address_d04c53c4027bb4b2f9efcf18.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_b1069aca3c21bb83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_5e0d9056d79d1a75 = ((u32(((u32(1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_149f6ecdc5c8c8fae4c079e6() {
  return __cxx_static_address_149f6ecdc5c8c8fae4c079e6.reference || (__cxx_static_address_149f6ecdc5c8c8fae4c079e6.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_5e0d9056d79d1a75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_884e552185d79a11 = ((u32(((u32(1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02b8f8ced1cf12f18da0c7ce() {
  return __cxx_static_address_02b8f8ced1cf12f18da0c7ce.reference || (__cxx_static_address_02b8f8ced1cf12f18da0c7ce.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_884e552185d79a11; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_5e42872ffe38e1f8 = ((u32(((u32(1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd9cc3b1b87a989cf0e965d2() {
  return __cxx_static_address_fd9cc3b1b87a989cf0e965d2.reference || (__cxx_static_address_fd9cc3b1b87a989cf0e965d2.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_5e42872ffe38e1f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_b2dd021e023de0f8 = ((u32(((u32(1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_116d3b03b0397d5bbc387b04() {
  return __cxx_static_address_116d3b03b0397d5bbc387b04.reference || (__cxx_static_address_116d3b03b0397d5bbc387b04.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_b2dd021e023de0f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_fcb0556640344549 = ((u32(((u32(1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9682df326f449216124de30c() {
  return __cxx_static_address_9682df326f449216124de30c.reference || (__cxx_static_address_9682df326f449216124de30c.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_fcb0556640344549; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_44eb9b128623d25d = ((u32(((u32(1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff269fbf7682689adbb20162() {
  return __cxx_static_address_ff269fbf7682689adbb20162.reference || (__cxx_static_address_ff269fbf7682689adbb20162.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_44eb9b128623d25d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_fb94a37cca6b31fa = ((u32(((u32(1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53b50a08f8ef720f9b7d9b52() {
  return __cxx_static_address_53b50a08f8ef720f9b7d9b52.reference || (__cxx_static_address_53b50a08f8ef720f9b7d9b52.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_fb94a37cca6b31fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_be1bc9eb572edf18 = ((u32(((u32(1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbbe349290f5997d7a9a8491() {
  return __cxx_static_address_cbbe349290f5997d7a9a8491.reference || (__cxx_static_address_cbbe349290f5997d7a9a8491.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_be1bc9eb572edf18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_e36dedd9188409b8 = ((u32(((u32(1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c870ea8b4a7891d9c7f598c9() {
  return __cxx_static_address_c870ea8b4a7891d9c7f598c9.reference || (__cxx_static_address_c870ea8b4a7891d9c7f598c9.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_e36dedd9188409b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_70afbd29dfb3548f = ((u32(((u32(1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71b42e46e9a94e9ea6c9673b() {
  return __cxx_static_address_71b42e46e9a94e9ea6c9673b.reference || (__cxx_static_address_71b42e46e9a94e9ea6c9673b.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_70afbd29dfb3548f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_2fc7639270cd6ad8 = ((u32(((u32(1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8f39343207d9e7d18246cd9() {
  return __cxx_static_address_f8f39343207d9e7d18246cd9.reference || (__cxx_static_address_f8f39343207d9e7d18246cd9.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_2fc7639270cd6ad8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_2afc4501436bf17b = ((u32(((u32(1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62af2d1eddf9caa27a53429f() {
  return __cxx_static_address_62af2d1eddf9caa27a53429f.reference || (__cxx_static_address_62af2d1eddf9caa27a53429f.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_2afc4501436bf17b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_4e3e361db490dc0f = ((u32(((u32(1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_094146d5318d97b74147e538() {
  return __cxx_static_address_094146d5318d97b74147e538.reference || (__cxx_static_address_094146d5318d97b74147e538.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_4e3e361db490dc0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_fb61b709fcd2bdc0 = ((u32(((u32(1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2757fff62c964c9ce2112902() {
  return __cxx_static_address_2757fff62c964c9ce2112902.reference || (__cxx_static_address_2757fff62c964c9ce2112902.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_fb61b709fcd2bdc0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_c7b2c2b05303d26f = ((u32(((u32(1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf24761cf0c9316263d413cc() {
  return __cxx_static_address_bf24761cf0c9316263d413cc.reference || (__cxx_static_address_bf24761cf0c9316263d413cc.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_c7b2c2b05303d26f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_5a1480dec1d29497 = ((u32(((u32(1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c03b50e0795fdba2e3624dd() {
  return __cxx_static_address_8c03b50e0795fdba2e3624dd.reference || (__cxx_static_address_8c03b50e0795fdba2e3624dd.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_5a1480dec1d29497; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_39c6b58e1c461a25 = ((u32(((u32(1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f19310a26965873f3ce69ebb() {
  return __cxx_static_address_f19310a26965873f3ce69ebb.reference || (__cxx_static_address_f19310a26965873f3ce69ebb.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_39c6b58e1c461a25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_d6474e3e85638259 = ((u32(((u32(1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1483e7bd9aa795ab7bdbb80a() {
  return __cxx_static_address_1483e7bd9aa795ab7bdbb80a.reference || (__cxx_static_address_1483e7bd9aa795ab7bdbb80a.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_d6474e3e85638259; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_f7578f1df985ae56 = ((u32(((u32(1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ecb43aa493d177e0d1acce1() {
  return __cxx_static_address_7ecb43aa493d177e0d1acce1.reference || (__cxx_static_address_7ecb43aa493d177e0d1acce1.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_f7578f1df985ae56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_1a8cac2d3653b966 = ((u32(((u32(1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e6c5bd8a1d7333f13db1a3e() {
  return __cxx_static_address_9e6c5bd8a1d7333f13db1a3e.reference || (__cxx_static_address_9e6c5bd8a1d7333f13db1a3e.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_1a8cac2d3653b966; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_99e28b7799186444 = ((u32(((u32(1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe060bf0e5584f0f65e373ea() {
  return __cxx_static_address_fe060bf0e5584f0f65e373ea.reference || (__cxx_static_address_fe060bf0e5584f0f65e373ea.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_99e28b7799186444; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_4214dd9bc7cc3804 = ((u32(((u32(1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7721d59389fd37c9104308b4() {
  return __cxx_static_address_7721d59389fd37c9104308b4.reference || (__cxx_static_address_7721d59389fd37c9104308b4.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_4214dd9bc7cc3804; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_a175a99b9de00829 = ((u32(((u32(1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_152db7424afae8e73119452e() {
  return __cxx_static_address_152db7424afae8e73119452e.reference || (__cxx_static_address_152db7424afae8e73119452e.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_a175a99b9de00829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_7d5e4ebe5f48d724 = ((u32(((u32(1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55a08038452e57dcece2017b() {
  return __cxx_static_address_55a08038452e57dcece2017b.reference || (__cxx_static_address_55a08038452e57dcece2017b.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_7d5e4ebe5f48d724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_6d8313364a46e340 = ((u32(((u32(1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9406cf44bf1e9b3ca9af7a55() {
  return __cxx_static_address_9406cf44bf1e9b3ca9af7a55.reference || (__cxx_static_address_9406cf44bf1e9b3ca9af7a55.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_6d8313364a46e340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_4f761650195f29d6 = ((u32(((u32(1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2c68b983bd2748a00cf8458() {
  return __cxx_static_address_c2c68b983bd2748a00cf8458.reference || (__cxx_static_address_c2c68b983bd2748a00cf8458.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_4f761650195f29d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_cb7ea57dad3b565b = ((u32(((u32(1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_869f42ddb1a9078fe6222002() {
  return __cxx_static_address_869f42ddb1a9078fe6222002.reference || (__cxx_static_address_869f42ddb1a9078fe6222002.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_cb7ea57dad3b565b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_0aba70d4fea74ac2 = ((u32(((u32(1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47b31869c9c341b9c9c64ef1() {
  return __cxx_static_address_47b31869c9c341b9c9c64ef1.reference || (__cxx_static_address_47b31869c9c341b9c9c64ef1.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_0aba70d4fea74ac2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_95325d5fb34f8284 = ((u32(((u32(1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e19674f424751e0a6dbf201() {
  return __cxx_static_address_1e19674f424751e0a6dbf201.reference || (__cxx_static_address_1e19674f424751e0a6dbf201.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_95325d5fb34f8284; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_f1d4e1bff4b4dcbd = ((u32(((u32(1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2aea05aaa69707f11181277a() {
  return __cxx_static_address_2aea05aaa69707f11181277a.reference || (__cxx_static_address_2aea05aaa69707f11181277a.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_f1d4e1bff4b4dcbd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_f7b48e768e90c3ed = ((u32(((u32(1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_790b00101daaad20e9d03080() {
  return __cxx_static_address_790b00101daaad20e9d03080.reference || (__cxx_static_address_790b00101daaad20e9d03080.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_f7b48e768e90c3ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_09fae95c4a73eb2d = ((u32(((u32(1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2d460a72cf7059339349281() {
  return __cxx_static_address_d2d460a72cf7059339349281.reference || (__cxx_static_address_d2d460a72cf7059339349281.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_09fae95c4a73eb2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_7af5e342d29d0561 = ((u32(((u32(1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a57d4efcd4cabc04da4db1b3() {
  return __cxx_static_address_a57d4efcd4cabc04da4db1b3.reference || (__cxx_static_address_a57d4efcd4cabc04da4db1b3.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_7af5e342d29d0561; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_854cb3fccd6511b1 = ((u32(((u32(1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1ecf9efe74a1c320c34b7c1() {
  return __cxx_static_address_b1ecf9efe74a1c320c34b7c1.reference || (__cxx_static_address_b1ecf9efe74a1c320c34b7c1.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_854cb3fccd6511b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_20bf777b79066e09 = ((u32(((u32(1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fb07fb32f67c82aea52bb50() {
  return __cxx_static_address_3fb07fb32f67c82aea52bb50.reference || (__cxx_static_address_3fb07fb32f67c82aea52bb50.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_20bf777b79066e09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_c380c3d579b4598d = ((u32(((u32(1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c2f322e4f1120f1d3f7ef6b() {
  return __cxx_static_address_5c2f322e4f1120f1d3f7ef6b.reference || (__cxx_static_address_5c2f322e4f1120f1d3f7ef6b.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_c380c3d579b4598d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_5db7f6e6d5647429 = ((u32(((u32(1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0d6f326c3be9e72545fd04e() {
  return __cxx_static_address_d0d6f326c3be9e72545fd04e.reference || (__cxx_static_address_d0d6f326c3be9e72545fd04e.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_5db7f6e6d5647429; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_2526663042312919 = ((u32(((u32(1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9008149b6d5fd3b8ba1df7b() {
  return __cxx_static_address_c9008149b6d5fd3b8ba1df7b.reference || (__cxx_static_address_c9008149b6d5fd3b8ba1df7b.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_2526663042312919; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_9efff124d1b5090f = ((u32(((u32(1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_205b7ef234462ebaed0918d4() {
  return __cxx_static_address_205b7ef234462ebaed0918d4.reference || (__cxx_static_address_205b7ef234462ebaed0918d4.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_9efff124d1b5090f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_88c8fcf1c54d4ef6 = ((u32(((u32(1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_066bf526f1a6b0df5d337e52() {
  return __cxx_static_address_066bf526f1a6b0df5d337e52.reference || (__cxx_static_address_066bf526f1a6b0df5d337e52.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_88c8fcf1c54d4ef6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_b9d264e47cc2248e = ((u32(((u32(1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d35a6db260375c70b8dc8cdf() {
  return __cxx_static_address_d35a6db260375c70b8dc8cdf.reference || (__cxx_static_address_d35a6db260375c70b8dc8cdf.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_b9d264e47cc2248e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_9d392f085d19c5ce = ((u32(((u32(1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05494cddee5b44d612593f3a() {
  return __cxx_static_address_05494cddee5b44d612593f3a.reference || (__cxx_static_address_05494cddee5b44d612593f3a.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_9d392f085d19c5ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_5401b37530da24fb = ((u32(((u32(1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c144a966147879ce9dd7466f() {
  return __cxx_static_address_c144a966147879ce9dd7466f.reference || (__cxx_static_address_c144a966147879ce9dd7466f.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_5401b37530da24fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_fd78a8c8177bfef1 = ((u32(((u32(1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac844020a6ebf3a75a073141() {
  return __cxx_static_address_ac844020a6ebf3a75a073141.reference || (__cxx_static_address_ac844020a6ebf3a75a073141.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_fd78a8c8177bfef1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_8ef89f7255c996ee = ((u32(((u32(1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27cd59ed30bd77460b004263() {
  return __cxx_static_address_27cd59ed30bd77460b004263.reference || (__cxx_static_address_27cd59ed30bd77460b004263.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_8ef89f7255c996ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_2d52656437d05553 = ((u32(((u32(1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c736a04243cb16d883240292() {
  return __cxx_static_address_c736a04243cb16d883240292.reference || (__cxx_static_address_c736a04243cb16d883240292.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_2d52656437d05553; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_093ccb8a45ac4827 = ((u32(((u32(1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4471b9e0e703892cd808685b() {
  return __cxx_static_address_4471b9e0e703892cd808685b.reference || (__cxx_static_address_4471b9e0e703892cd808685b.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_093ccb8a45ac4827; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_30e7af51fb373570 = ((u32(((u32(1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee56fb027e4475acdd8ab9b3() {
  return __cxx_static_address_ee56fb027e4475acdd8ab9b3.reference || (__cxx_static_address_ee56fb027e4475acdd8ab9b3.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_30e7af51fb373570; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_41ddeb30dd04bc8c = ((u32(((u32(1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10aefe6561e457b978ad22a1() {
  return __cxx_static_address_10aefe6561e457b978ad22a1.reference || (__cxx_static_address_10aefe6561e457b978ad22a1.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_41ddeb30dd04bc8c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_c85c2df311a02d4e = ((u32(((u32(1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a36b5934731341915efd8ce5() {
  return __cxx_static_address_a36b5934731341915efd8ce5.reference || (__cxx_static_address_a36b5934731341915efd8ce5.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_c85c2df311a02d4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_76b4615de419a15e = ((u32(((u32(1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_692e12b50e596e39ed26716e() {
  return __cxx_static_address_692e12b50e596e39ed26716e.reference || (__cxx_static_address_692e12b50e596e39ed26716e.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_76b4615de419a15e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_b66c801d5c1b51c9 = ((u32(((u32(1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bca7e4a948950976695da6d0() {
  return __cxx_static_address_bca7e4a948950976695da6d0.reference || (__cxx_static_address_bca7e4a948950976695da6d0.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_b66c801d5c1b51c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_4def997f93b31482 = ((u32(((u32(1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4084eeeb79a94f743033b92f() {
  return __cxx_static_address_4084eeeb79a94f743033b92f.reference || (__cxx_static_address_4084eeeb79a94f743033b92f.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_4def997f93b31482; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_a2d04351d0798854 = ((u32(((u32(1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be7ed674b0cc5d62d40e4fe1() {
  return __cxx_static_address_be7ed674b0cc5d62d40e4fe1.reference || (__cxx_static_address_be7ed674b0cc5d62d40e4fe1.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_a2d04351d0798854; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_46616427bb2472c1 = ((u32(((u32(1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea5d7f32566deadd356977cb() {
  return __cxx_static_address_ea5d7f32566deadd356977cb.reference || (__cxx_static_address_ea5d7f32566deadd356977cb.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_46616427bb2472c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_bd11bd2455d249ea = ((u32(((u32(1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ccacd17431e04fef0a7e91d() {
  return __cxx_static_address_7ccacd17431e04fef0a7e91d.reference || (__cxx_static_address_7ccacd17431e04fef0a7e91d.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_bd11bd2455d249ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_a262c31cad084a64 = ((u32(((u32(1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_221c8755dcbbdbf35100d0c0() {
  return __cxx_static_address_221c8755dcbbdbf35100d0c0.reference || (__cxx_static_address_221c8755dcbbdbf35100d0c0.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_a262c31cad084a64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_0b92f10b2ae48285 = ((u32(((u32(1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d18f28de4e610096d264fef0() {
  return __cxx_static_address_d18f28de4e610096d264fef0.reference || (__cxx_static_address_d18f28de4e610096d264fef0.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_0b92f10b2ae48285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_3e6e6d01dc128bfc = ((u32(((u32(1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3aa0c2b24fd0b20821c58df() {
  return __cxx_static_address_f3aa0c2b24fd0b20821c58df.reference || (__cxx_static_address_f3aa0c2b24fd0b20821c58df.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_3e6e6d01dc128bfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_68765e14174a83c4 = ((u32(((u32(1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72afb75a28c83ad578df659f() {
  return __cxx_static_address_72afb75a28c83ad578df659f.reference || (__cxx_static_address_72afb75a28c83ad578df659f.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_68765e14174a83c4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_70f9f7086ff714a9 = ((u32(((u32(1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_169273105e27a2dd6fb9fc1c() {
  return __cxx_static_address_169273105e27a2dd6fb9fc1c.reference || (__cxx_static_address_169273105e27a2dd6fb9fc1c.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_70f9f7086ff714a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_9e2e1f8b783b169f = ((u32(((u32(1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d158d0fecb1b8e3e37599ce4() {
  return __cxx_static_address_d158d0fecb1b8e3e37599ce4.reference || (__cxx_static_address_d158d0fecb1b8e3e37599ce4.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_9e2e1f8b783b169f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_83d000b84eaf1e31 = ((u32(((u32(1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4dd2028f7a0494c3a96a7fa() {
  return __cxx_static_address_e4dd2028f7a0494c3a96a7fa.reference || (__cxx_static_address_e4dd2028f7a0494c3a96a7fa.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_83d000b84eaf1e31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_3ce8e106f8ee4fb0 = ((u32(((u32(1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c55b4452a25d01960faf82a() {
  return __cxx_static_address_8c55b4452a25d01960faf82a.reference || (__cxx_static_address_8c55b4452a25d01960faf82a.reference = {
    __cReference: true,
    get value() { return RAT____header_global_3ce8e106f8ee4fb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_5fff661dbb28a023 = ((u32(((u32(1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8d61c494d8b6f2933d997061() {
  return __cxx_static_address_8d61c494d8b6f2933d997061.reference || (__cxx_static_address_8d61c494d8b6f2933d997061.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_5fff661dbb28a023; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_1bb0cc70f58e54a8 = ((u32(((u32(1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63f112a8b207d131104843a5() {
  return __cxx_static_address_63f112a8b207d131104843a5.reference || (__cxx_static_address_63f112a8b207d131104843a5.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_1bb0cc70f58e54a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_046257bd16d9ad49 = ((u32(((u32(1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f430551bf07f02c74fff708() {
  return __cxx_static_address_5f430551bf07f02c74fff708.reference || (__cxx_static_address_5f430551bf07f02c74fff708.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_046257bd16d9ad49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_cf4d79107c79ecc5 = ((u32(((u32(1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83bcb6551084403d46171c6a() {
  return __cxx_static_address_83bcb6551084403d46171c6a.reference || (__cxx_static_address_83bcb6551084403d46171c6a.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_cf4d79107c79ecc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_29d7617ea6abee69 = ((u32(((u32(1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_508e0419394ceedff33f50cc() {
  return __cxx_static_address_508e0419394ceedff33f50cc.reference || (__cxx_static_address_508e0419394ceedff33f50cc.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_29d7617ea6abee69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_aca3a460dc58e36d = ((u32(((u32(1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51982bbd6cb9bfe97346b43e() {
  return __cxx_static_address_51982bbd6cb9bfe97346b43e.reference || (__cxx_static_address_51982bbd6cb9bfe97346b43e.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_aca3a460dc58e36d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_b02729920b51f30f = ((u32(((u32(1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c3dfba8aa85a53edba73828() {
  return __cxx_static_address_5c3dfba8aa85a53edba73828.reference || (__cxx_static_address_5c3dfba8aa85a53edba73828.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_b02729920b51f30f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_c049239852629e3f = ((u32(((u32(1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a162b2e616018dd0eec694ac() {
  return __cxx_static_address_a162b2e616018dd0eec694ac.reference || (__cxx_static_address_a162b2e616018dd0eec694ac.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_c049239852629e3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_4df1a31242ae34d5 = ((u32(((u32(1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e515ca7649afa142c91002d() {
  return __cxx_static_address_5e515ca7649afa142c91002d.reference || (__cxx_static_address_5e515ca7649afa142c91002d.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_4df1a31242ae34d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_e10129cc7e47ca4d = ((u32(((u32(1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f994170c143a6823ec26bc00() {
  return __cxx_static_address_f994170c143a6823ec26bc00.reference || (__cxx_static_address_f994170c143a6823ec26bc00.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_e10129cc7e47ca4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_deaac708a6dcd50a = ((u32(((u32(1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8150fee6f44be3dd3ac4bbf3() {
  return __cxx_static_address_8150fee6f44be3dd3ac4bbf3.reference || (__cxx_static_address_8150fee6f44be3dd3ac4bbf3.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_deaac708a6dcd50a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_203a0639e834a0f1 = ((u32(((u32(1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdd43d805287d2ec95d50ac6() {
  return __cxx_static_address_bdd43d805287d2ec95d50ac6.reference || (__cxx_static_address_bdd43d805287d2ec95d50ac6.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_203a0639e834a0f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_d6d38f799709b99c = ((u32(((u32(1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe52df83b3f6c71dd62125c2() {
  return __cxx_static_address_fe52df83b3f6c71dd62125c2.reference || (__cxx_static_address_fe52df83b3f6c71dd62125c2.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_d6d38f799709b99c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_561e7791ed7f6e56 = ((u32(((u32(1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_846a4a9a9edeaf20c495f43b() {
  return __cxx_static_address_846a4a9a9edeaf20c495f43b.reference || (__cxx_static_address_846a4a9a9edeaf20c495f43b.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_561e7791ed7f6e56; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_330bf6ca4745b52d = ((u32(((u32(1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_967cd64ab9467bbee8161667() {
  return __cxx_static_address_967cd64ab9467bbee8161667.reference || (__cxx_static_address_967cd64ab9467bbee8161667.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_330bf6ca4745b52d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_d362de55c183d1a1 = ((u32(((u32(1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e71d776c641f43732668e0b1() {
  return __cxx_static_address_e71d776c641f43732668e0b1.reference || (__cxx_static_address_e71d776c641f43732668e0b1.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_d362de55c183d1a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_35ae23bdb8b94b64 = ((u32(((u32(1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91a5dc75997ddff3e0c33e8c() {
  return __cxx_static_address_91a5dc75997ddff3e0c33e8c.reference || (__cxx_static_address_91a5dc75997ddff3e0c33e8c.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_35ae23bdb8b94b64; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_e79bff601c4d9caf = ((u32(((u32(1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5827962b3d45ae1fb51db505() {
  return __cxx_static_address_5827962b3d45ae1fb51db505.reference || (__cxx_static_address_5827962b3d45ae1fb51db505.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_e79bff601c4d9caf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_3204d9807358b804 = ((u32(((u32(1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe98ca8e115ab0e0ac3ae53e() {
  return __cxx_static_address_fe98ca8e115ab0e0ac3ae53e.reference || (__cxx_static_address_fe98ca8e115ab0e0ac3ae53e.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_3204d9807358b804; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_2c83866ddd946b41 = ((u32(((u32(1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03f327a1e0153874fbe86c0b() {
  return __cxx_static_address_03f327a1e0153874fbe86c0b.reference || (__cxx_static_address_03f327a1e0153874fbe86c0b.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_2c83866ddd946b41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_0b3766de90b555a6 = ((u32(((u32(1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e87936e3718d00308bd926d() {
  return __cxx_static_address_0e87936e3718d00308bd926d.reference || (__cxx_static_address_0e87936e3718d00308bd926d.reference = {
    __cReference: true,
    get value() { return INDY____header_global_0b3766de90b555a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_6fb2d239686a1453 = ((u32(((u32(1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef9c534e6a7c639ad99a532d() {
  return __cxx_static_address_ef9c534e6a7c639ad99a532d.reference || (__cxx_static_address_ef9c534e6a7c639ad99a532d.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_6fb2d239686a1453; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_c5fa9fdccea74782 = ((u32(((u32(1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fe28dbf641b1415b6c8504f() {
  return __cxx_static_address_9fe28dbf641b1415b6c8504f.reference || (__cxx_static_address_9fe28dbf641b1415b6c8504f.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_c5fa9fdccea74782; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_80a65eb96777905b = ((u32(((u32(1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_102e92ff65e20bb9c0570cf6() {
  return __cxx_static_address_102e92ff65e20bb9c0570cf6.reference || (__cxx_static_address_102e92ff65e20bb9c0570cf6.reference = {
    __cReference: true,
    get value() { return MONK____header_global_80a65eb96777905b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_bc1f446218531a42 = ((u32(((u32(1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_20748aabaff2baaa7a8eca42() {
  return __cxx_static_address_20748aabaff2baaa7a8eca42.reference || (__cxx_static_address_20748aabaff2baaa7a8eca42.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_bc1f446218531a42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_54a2774ef3a88941 = ((u32(((u32(1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d58021b785336b60471afef() {
  return __cxx_static_address_7d58021b785336b60471afef.reference || (__cxx_static_address_7d58021b785336b60471afef.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_54a2774ef3a88941; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_f25cb42e840f797a = ((u32(((u32(1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24d84b27f80d0888ef55bb36() {
  return __cxx_static_address_24d84b27f80d0888ef55bb36.reference || (__cxx_static_address_24d84b27f80d0888ef55bb36.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_f25cb42e840f797a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_4b35485901b720d2 = ((u32(((u32(1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e897d18842a83f61f630e971() {
  return __cxx_static_address_e897d18842a83f61f630e971.reference || (__cxx_static_address_e897d18842a83f61f630e971.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_4b35485901b720d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_127087f6dc947e4d = ((u32(((u32(1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06e5fea0bf2906f8666676bf() {
  return __cxx_static_address_06e5fea0bf2906f8666676bf.reference || (__cxx_static_address_06e5fea0bf2906f8666676bf.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_127087f6dc947e4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_fce32b5a086d9795 = ((u32(((u32(1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a60bb16722b0856f855223d() {
  return __cxx_static_address_6a60bb16722b0856f855223d.reference || (__cxx_static_address_6a60bb16722b0856f855223d.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_fce32b5a086d9795; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_a6966ded9624d283 = ((u32(((u32(1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92da5f87eba6ee896492a79f() {
  return __cxx_static_address_92da5f87eba6ee896492a79f.reference || (__cxx_static_address_92da5f87eba6ee896492a79f.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_a6966ded9624d283; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_7142434447807651 = ((u32(((u32(1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e23ddf5c8b5bf4497220eb4() {
  return __cxx_static_address_4e23ddf5c8b5bf4497220eb4.reference || (__cxx_static_address_4e23ddf5c8b5bf4497220eb4.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_7142434447807651; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_822c55bedc9834fe = ((u32(((u32(1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_134efa583760f9bfe3589e9a() {
  return __cxx_static_address_134efa583760f9bfe3589e9a.reference || (__cxx_static_address_134efa583760f9bfe3589e9a.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_822c55bedc9834fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_4fb33af615e582e8 = ((u32(((u32(1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ea0b168cc4d44da010bcc18() {
  return __cxx_static_address_9ea0b168cc4d44da010bcc18.reference || (__cxx_static_address_9ea0b168cc4d44da010bcc18.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_4fb33af615e582e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_d9120c0273a64108 = ((u32(((u32(1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_373f53b4dd55b7552b3f855b() {
  return __cxx_static_address_373f53b4dd55b7552b3f855b.reference || (__cxx_static_address_373f53b4dd55b7552b3f855b.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_d9120c0273a64108; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_745afe60396d3b83 = ((u32(((u32(1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2db1f3ee3fcc63670d6fa21f() {
  return __cxx_static_address_2db1f3ee3fcc63670d6fa21f.reference || (__cxx_static_address_2db1f3ee3fcc63670d6fa21f.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_745afe60396d3b83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_1ff050c9b7dd0416 = ((u32(((u32(1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1451de680917e438b77aa48c() {
  return __cxx_static_address_1451de680917e438b77aa48c.reference || (__cxx_static_address_1451de680917e438b77aa48c.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_1ff050c9b7dd0416; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_124722568bc5581f = ((u32(((u32(1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ffead88acede353ffe27e1d() {
  return __cxx_static_address_8ffead88acede353ffe27e1d.reference || (__cxx_static_address_8ffead88acede353ffe27e1d.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_124722568bc5581f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_649dede137c0d514 = ((u32(((u32(1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_918efeda5b4879124ac397ee() {
  return __cxx_static_address_918efeda5b4879124ac397ee.reference || (__cxx_static_address_918efeda5b4879124ac397ee.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_649dede137c0d514; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_dfda391b4c0b5243 = ((u32(((u32(1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d72e906eed9a041ea51ab2b3() {
  return __cxx_static_address_d72e906eed9a041ea51ab2b3.reference || (__cxx_static_address_d72e906eed9a041ea51ab2b3.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_dfda391b4c0b5243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_5eea02acc5ae4830 = ((u32(((u32(1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ba00da0bb22577e60a55f86() {
  return __cxx_static_address_8ba00da0bb22577e60a55f86.reference || (__cxx_static_address_8ba00da0bb22577e60a55f86.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_5eea02acc5ae4830; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_40d47d0af99f1801 = ((u32(((u32(1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f44e1f3bae9c3dfab1c3449() {
  return __cxx_static_address_3f44e1f3bae9c3dfab1c3449.reference || (__cxx_static_address_3f44e1f3bae9c3dfab1c3449.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_40d47d0af99f1801; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_9d4581e80ec4b630 = ((u32(((u32(1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd117695de3dbd77c026648e() {
  return __cxx_static_address_bd117695de3dbd77c026648e.reference || (__cxx_static_address_bd117695de3dbd77c026648e.reference = {
    __cReference: true,
    get value() { return FIST____header_global_9d4581e80ec4b630; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_000e70479352c267 = ((u32(((u32(1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68368faa9255eae478b4ac7f() {
  return __cxx_static_address_68368faa9255eae478b4ac7f.reference || (__cxx_static_address_68368faa9255eae478b4ac7f.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_000e70479352c267; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_a9a7fec6dc9309ab = ((u32(((u32(1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c03e3d04c008e566b541d711() {
  return __cxx_static_address_c03e3d04c008e566b541d711.reference || (__cxx_static_address_c03e3d04c008e566b541d711.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_a9a7fec6dc9309ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_98a380e4537ecdae = ((u32(((u32(1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb9720d8a0c1f723d534be04() {
  return __cxx_static_address_cb9720d8a0c1f723d534be04.reference || (__cxx_static_address_cb9720d8a0c1f723d534be04.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_98a380e4537ecdae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_1b664ea8ff356a83 = ((u32(((u32(1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2c5803124ec0aac98b45f80() {
  return __cxx_static_address_b2c5803124ec0aac98b45f80.reference || (__cxx_static_address_b2c5803124ec0aac98b45f80.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_1b664ea8ff356a83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_5e6d3d9b0d9d0786 = ((u32(((u32(1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e05e6639642a8236c033395() {
  return __cxx_static_address_6e05e6639642a8236c033395.reference || (__cxx_static_address_6e05e6639642a8236c033395.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_5e6d3d9b0d9d0786; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_1e2c61cf94dd1135 = ((u32(((u32(1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b355d5e7439885aeb3ce79d6() {
  return __cxx_static_address_b355d5e7439885aeb3ce79d6.reference || (__cxx_static_address_b355d5e7439885aeb3ce79d6.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_1e2c61cf94dd1135; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_4e38e3a03c7f6e7c = ((u32(((u32(1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6388d602880a2f251557d7f9() {
  return __cxx_static_address_6388d602880a2f251557d7f9.reference || (__cxx_static_address_6388d602880a2f251557d7f9.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_4e38e3a03c7f6e7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_33405b8e8a58e528 = ((u32(((u32(1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39d92c254c9cce6607c1cec3() {
  return __cxx_static_address_39d92c254c9cce6607c1cec3.reference || (__cxx_static_address_39d92c254c9cce6607c1cec3.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_33405b8e8a58e528; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_11c0c6a02be55cc8 = ((u32(((u32(1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee9cb7e9679e9677d347cb38() {
  return __cxx_static_address_ee9cb7e9679e9677d347cb38.reference || (__cxx_static_address_ee9cb7e9679e9677d347cb38.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_11c0c6a02be55cc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_1534728c7a590c26 = ((u32(((u32(1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07fe9462fef6f3c4927d9686() {
  return __cxx_static_address_07fe9462fef6f3c4927d9686.reference || (__cxx_static_address_07fe9462fef6f3c4927d9686.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_1534728c7a590c26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_df3c150b161584f8 = ((u32(((u32(1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad7717a5f77ad724f93dafab() {
  return __cxx_static_address_ad7717a5f77ad724f93dafab.reference || (__cxx_static_address_ad7717a5f77ad724f93dafab.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_df3c150b161584f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_b69e8138d3d77617 = ((u32(((u32(1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e737ab8f6be088718fbe78c5() {
  return __cxx_static_address_e737ab8f6be088718fbe78c5.reference || (__cxx_static_address_e737ab8f6be088718fbe78c5.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_b69e8138d3d77617; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_e36a6e824e6056a5 = ((u32(((u32(1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f127b2c1ee630985b115ccb() {
  return __cxx_static_address_2f127b2c1ee630985b115ccb.reference || (__cxx_static_address_2f127b2c1ee630985b115ccb.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_e36a6e824e6056a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_772b007c6900df7e = ((u32(((u32(1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adcc9d953158c72b6fc5a810() {
  return __cxx_static_address_adcc9d953158c72b6fc5a810.reference || (__cxx_static_address_adcc9d953158c72b6fc5a810.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_772b007c6900df7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_880a42b5f4edf78e = ((u32(((u32(1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_944a2c90b0963decb9d3b513() {
  return __cxx_static_address_944a2c90b0963decb9d3b513.reference || (__cxx_static_address_944a2c90b0963decb9d3b513.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_880a42b5f4edf78e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_9c5071dc5ea837de = ((u32(((u32(1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5953ae40cdef8d4bb6c7f84c() {
  return __cxx_static_address_5953ae40cdef8d4bb6c7f84c.reference || (__cxx_static_address_5953ae40cdef8d4bb6c7f84c.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_9c5071dc5ea837de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_48f62d7df46c4e3c = ((u32(((u32(1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77359aa1a521ab0fb0f18173() {
  return __cxx_static_address_77359aa1a521ab0fb0f18173.reference || (__cxx_static_address_77359aa1a521ab0fb0f18173.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_48f62d7df46c4e3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_b98b385cb326c916 = ((u32(((u32(1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67017ade29208e81b33a5685() {
  return __cxx_static_address_67017ade29208e81b33a5685.reference || (__cxx_static_address_67017ade29208e81b33a5685.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_b98b385cb326c916; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_716bf9b481495019 = ((u32(((u32(1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6523245c465edddc32f9907d() {
  return __cxx_static_address_6523245c465edddc32f9907d.reference || (__cxx_static_address_6523245c465edddc32f9907d.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_716bf9b481495019; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_93703beb09855d19 = ((u32(((u32(1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_759d9290b30a32dd40e178f6() {
  return __cxx_static_address_759d9290b30a32dd40e178f6.reference || (__cxx_static_address_759d9290b30a32dd40e178f6.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_93703beb09855d19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_0a45aa3463b45ff6 = ((u32(((u32(1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c143ce526abe3b853375c8f() {
  return __cxx_static_address_8c143ce526abe3b853375c8f.reference || (__cxx_static_address_8c143ce526abe3b853375c8f.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_0a45aa3463b45ff6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_c653a0ad0e7472d3 = ((u32(((u32(1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef09c8151d575f419891c935() {
  return __cxx_static_address_ef09c8151d575f419891c935.reference || (__cxx_static_address_ef09c8151d575f419891c935.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_c653a0ad0e7472d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_c9d6a9e3cf5dccb2 = ((u32(((u32(1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bb457d839ba547a6d150911() {
  return __cxx_static_address_9bb457d839ba547a6d150911.reference || (__cxx_static_address_9bb457d839ba547a6d150911.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_c9d6a9e3cf5dccb2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_5fcb9abb2d8d286c = ((u32(((u32(1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ee8300bf27e02922ef18238() {
  return __cxx_static_address_1ee8300bf27e02922ef18238.reference || (__cxx_static_address_1ee8300bf27e02922ef18238.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_5fcb9abb2d8d286c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_d7e914b21887e0d3 = ((u32(((u32(1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54be80862bdae01b257ccb82() {
  return __cxx_static_address_54be80862bdae01b257ccb82.reference || (__cxx_static_address_54be80862bdae01b257ccb82.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_d7e914b21887e0d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_3a0bcc3928ea10fd = ((u32(((u32(1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_070c694492619930a73b5468() {
  return __cxx_static_address_070c694492619930a73b5468.reference || (__cxx_static_address_070c694492619930a73b5468.reference = {
    __cReference: true,
    get value() { return RECON____header_global_3a0bcc3928ea10fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_c5459ed053bd9a98 = ((u32(((u32(1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_020af1c1423b72f6a0efaad1() {
  return __cxx_static_address_020af1c1423b72f6a0efaad1.reference || (__cxx_static_address_020af1c1423b72f6a0efaad1.reference = {
    __cReference: true,
    get value() { return TANK____header_global_c5459ed053bd9a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_59e5ed4c56e6f174 = ((u32(((u32(2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83f250fea25c5084cf31cb6f() {
  return __cxx_static_address_83f250fea25c5084cf31cb6f.reference || (__cxx_static_address_83f250fea25c5084cf31cb6f.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_59e5ed4c56e6f174; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_7f8852073b710942 = ((u32(((u32(2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1042ee216631f75d6494a06() {
  return __cxx_static_address_a1042ee216631f75d6494a06.reference || (__cxx_static_address_a1042ee216631f75d6494a06.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_7f8852073b710942; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_1d667b1c3e5d8b19 = ((u32(((u32(2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d691f7d118e25ab98144a9ea() {
  return __cxx_static_address_d691f7d118e25ab98144a9ea.reference || (__cxx_static_address_d691f7d118e25ab98144a9ea.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_1d667b1c3e5d8b19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_ff260a18166033f0 = ((u32(((u32(2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04f5c45396370400d1c76241() {
  return __cxx_static_address_04f5c45396370400d1c76241.reference || (__cxx_static_address_04f5c45396370400d1c76241.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_ff260a18166033f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_832cd46df94aecd1 = ((u32(((u32(2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80750e1c1a2e5d66a2be63b4() {
  return __cxx_static_address_80750e1c1a2e5d66a2be63b4.reference || (__cxx_static_address_80750e1c1a2e5d66a2be63b4.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_832cd46df94aecd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_723dd46a3caa4cbb = ((u32(((u32(2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9118c81b5933ba2bd3670fa() {
  return __cxx_static_address_b9118c81b5933ba2bd3670fa.reference || (__cxx_static_address_b9118c81b5933ba2bd3670fa.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_723dd46a3caa4cbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_21563ff0c5ab0998 = ((u32(((u32(2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd936b451af5da874d067fa2() {
  return __cxx_static_address_cd936b451af5da874d067fa2.reference || (__cxx_static_address_cd936b451af5da874d067fa2.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_21563ff0c5ab0998; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_15a367bc9f53ecff = ((u32(((u32(2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2f6b29014ec38497b626204() {
  return __cxx_static_address_b2f6b29014ec38497b626204.reference || (__cxx_static_address_b2f6b29014ec38497b626204.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_15a367bc9f53ecff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_65fdcf289cc2ae28 = ((u32(((u32(2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b11cee9607e57d7a6dc9879b() {
  return __cxx_static_address_b11cee9607e57d7a6dc9879b.reference || (__cxx_static_address_b11cee9607e57d7a6dc9879b.reference = {
    __cReference: true,
    get value() { return FECES____header_global_65fdcf289cc2ae28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_4065e21adfe452e3 = ((u32(((u32(2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3663fce9c7fe81745dd85b94() {
  return __cxx_static_address_3663fce9c7fe81745dd85b94.reference || (__cxx_static_address_3663fce9c7fe81745dd85b94.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_4065e21adfe452e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_17cb550fb615e618 = ((u32(((u32(2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14fc56882a490c4ec30eb85a() {
  return __cxx_static_address_14fc56882a490c4ec30eb85a.reference || (__cxx_static_address_14fc56882a490c4ec30eb85a.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_17cb550fb615e618; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_2673946f9cd5abc6 = ((u32(((u32(2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_398fdb89eca797d7a040dab9() {
  return __cxx_static_address_398fdb89eca797d7a040dab9.reference || (__cxx_static_address_398fdb89eca797d7a040dab9.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_2673946f9cd5abc6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_65b9e791e06c3604 = ((u32(((u32(2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14c9816cfaceaca2ba01d622() {
  return __cxx_static_address_14c9816cfaceaca2ba01d622.reference || (__cxx_static_address_14c9816cfaceaca2ba01d622.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_65b9e791e06c3604; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_332754b932c93681 = ((u32(((u32(2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc90cdf41549d55ce1bd4693() {
  return __cxx_static_address_dc90cdf41549d55ce1bd4693.reference || (__cxx_static_address_dc90cdf41549d55ce1bd4693.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_332754b932c93681; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_43d058a09ae2db54 = ((u32(((u32(2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e83fbd77008564d8161b787() {
  return __cxx_static_address_9e83fbd77008564d8161b787.reference || (__cxx_static_address_9e83fbd77008564d8161b787.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_43d058a09ae2db54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_d162ae6f412993c5 = ((u32(((u32(2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_261df02bbc81ab6a03e47d17() {
  return __cxx_static_address_261df02bbc81ab6a03e47d17.reference || (__cxx_static_address_261df02bbc81ab6a03e47d17.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_d162ae6f412993c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_869c26db4966e563 = ((u32(((u32(2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e429e1ef967f854ed1f6d10() {
  return __cxx_static_address_3e429e1ef967f854ed1f6d10.reference || (__cxx_static_address_3e429e1ef967f854ed1f6d10.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_869c26db4966e563; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_8eb87a66ef72e5eb = ((u32(((u32(2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef7d482636544d0e03490209() {
  return __cxx_static_address_ef7d482636544d0e03490209.reference || (__cxx_static_address_ef7d482636544d0e03490209.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_8eb87a66ef72e5eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_1254f3cf2e3f6b18 = ((u32(((u32(2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4e2e7cd9bf5394dfe5fc3ea() {
  return __cxx_static_address_a4e2e7cd9bf5394dfe5fc3ea.reference || (__cxx_static_address_a4e2e7cd9bf5394dfe5fc3ea.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_1254f3cf2e3f6b18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_a41da2101ca2c733 = ((u32(((u32(2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac687cb45f9a7c390cc30f30() {
  return __cxx_static_address_ac687cb45f9a7c390cc30f30.reference || (__cxx_static_address_ac687cb45f9a7c390cc30f30.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_a41da2101ca2c733; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_0f83ae30bfa5f6f9 = ((u32(((u32(2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9fa7676c47906d77af0177bc() {
  return __cxx_static_address_9fa7676c47906d77af0177bc.reference || (__cxx_static_address_9fa7676c47906d77af0177bc.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_0f83ae30bfa5f6f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_70a1552d8bd3a5d8 = ((u32(((u32(2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a31f2101a524e434e7b7b655() {
  return __cxx_static_address_a31f2101a524e434e7b7b655.reference || (__cxx_static_address_a31f2101a524e434e7b7b655.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_70a1552d8bd3a5d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_52337808782d5a51 = ((u32(((u32(2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d89c2b6ab04238b57541d08() {
  return __cxx_static_address_9d89c2b6ab04238b57541d08.reference || (__cxx_static_address_9d89c2b6ab04238b57541d08.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_52337808782d5a51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_9ddc9083814310f9 = ((u32(((u32(2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b62e81ffcec05dc8ad9a6ce6() {
  return __cxx_static_address_b62e81ffcec05dc8ad9a6ce6.reference || (__cxx_static_address_b62e81ffcec05dc8ad9a6ce6.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_9ddc9083814310f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_bb6b450b7c3a9112 = ((u32(((u32(2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fc2db5c605cf1e3a3a33030() {
  return __cxx_static_address_7fc2db5c605cf1e3a3a33030.reference || (__cxx_static_address_7fc2db5c605cf1e3a3a33030.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_bb6b450b7c3a9112; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_1336fd85183fc0ea = ((u32(((u32(2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c9797df96f73b8160bc1506() {
  return __cxx_static_address_8c9797df96f73b8160bc1506.reference || (__cxx_static_address_8c9797df96f73b8160bc1506.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_1336fd85183fc0ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_2dd16f6d09892967 = ((u32(((u32(2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dec6cc298f2e975d786c575a() {
  return __cxx_static_address_dec6cc298f2e975d786c575a.reference || (__cxx_static_address_dec6cc298f2e975d786c575a.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_2dd16f6d09892967; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_0c616864ce8a3960 = ((u32(((u32(2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7882ced01536cfd382b338a() {
  return __cxx_static_address_e7882ced01536cfd382b338a.reference || (__cxx_static_address_e7882ced01536cfd382b338a.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_0c616864ce8a3960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_a4bc19245a4bfe9f = ((u32(((u32(2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eda79f1fc5c2c37e32a2454() {
  return __cxx_static_address_7eda79f1fc5c2c37e32a2454.reference || (__cxx_static_address_7eda79f1fc5c2c37e32a2454.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_a4bc19245a4bfe9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_f5297ca4e2438647 = ((u32(((u32(2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bc2e735343069dfa83e61ae() {
  return __cxx_static_address_4bc2e735343069dfa83e61ae.reference || (__cxx_static_address_4bc2e735343069dfa83e61ae.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_f5297ca4e2438647; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_9abaf871c0719c3c = ((u32(((u32(2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc50e372cca2c315aa31bf20() {
  return __cxx_static_address_dc50e372cca2c315aa31bf20.reference || (__cxx_static_address_dc50e372cca2c315aa31bf20.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_9abaf871c0719c3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_9f3496f9e1d791fe = ((u32(((u32(2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1924d74f8bafff9c87cde42() {
  return __cxx_static_address_f1924d74f8bafff9c87cde42.reference || (__cxx_static_address_f1924d74f8bafff9c87cde42.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_9f3496f9e1d791fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_f1208e499deebc20 = ((u32(((u32(2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fe22f4285594c97bcc92582() {
  return __cxx_static_address_2fe22f4285594c97bcc92582.reference || (__cxx_static_address_2fe22f4285594c97bcc92582.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_f1208e499deebc20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_3561912984ff37e4 = ((u32(((u32(2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98dde7df56b7b33baba06859() {
  return __cxx_static_address_98dde7df56b7b33baba06859.reference || (__cxx_static_address_98dde7df56b7b33baba06859.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_3561912984ff37e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_6a9a68f349c0f216 = ((u32(((u32(2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68cd0dfb1cd392d61f851706() {
  return __cxx_static_address_68cd0dfb1cd392d61f851706.reference || (__cxx_static_address_68cd0dfb1cd392d61f851706.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_6a9a68f349c0f216; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_bad06a00705f6545 = ((u32(((u32(2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae9004a77657d9a1a8ce2b86() {
  return __cxx_static_address_ae9004a77657d9a1a8ce2b86.reference || (__cxx_static_address_ae9004a77657d9a1a8ce2b86.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_bad06a00705f6545; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_39215d28cdbb6761 = ((u32(((u32(2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5aab3bc374153c6f2dc7441c() {
  return __cxx_static_address_5aab3bc374153c6f2dc7441c.reference || (__cxx_static_address_5aab3bc374153c6f2dc7441c.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_39215d28cdbb6761; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_82eb0e64024a398f = ((u32(((u32(2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c01b2782418f3e1b74b4135a() {
  return __cxx_static_address_c01b2782418f3e1b74b4135a.reference || (__cxx_static_address_c01b2782418f3e1b74b4135a.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_82eb0e64024a398f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_44f4b417d6399b0f = ((u32(((u32(2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d8e31e886d5003d57b4acb2() {
  return __cxx_static_address_7d8e31e886d5003d57b4acb2.reference || (__cxx_static_address_7d8e31e886d5003d57b4acb2.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_44f4b417d6399b0f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_7fa9284818b8429c = ((u32(((u32(2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f53c7f0aadf677ed3f0a5e5() {
  return __cxx_static_address_7f53c7f0aadf677ed3f0a5e5.reference || (__cxx_static_address_7f53c7f0aadf677ed3f0a5e5.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_7fa9284818b8429c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_29e036a08002efb9 = ((u32(((u32(2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb3db33985ba43f2f54394e9() {
  return __cxx_static_address_eb3db33985ba43f2f54394e9.reference || (__cxx_static_address_eb3db33985ba43f2f54394e9.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_29e036a08002efb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_98d46b99a375ada4 = ((u32(((u32(2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c44a8dca5d4aa23075ff948() {
  return __cxx_static_address_5c44a8dca5d4aa23075ff948.reference || (__cxx_static_address_5c44a8dca5d4aa23075ff948.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_98d46b99a375ada4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_794c6bd9436de294 = ((u32(((u32(2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dc10538c316a622b099d4f5() {
  return __cxx_static_address_2dc10538c316a622b099d4f5.reference || (__cxx_static_address_2dc10538c316a622b099d4f5.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_794c6bd9436de294; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_435045f9ede2da74 = ((u32(((u32(2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f0a7f85e06ad545e02fbc3d() {
  return __cxx_static_address_4f0a7f85e06ad545e02fbc3d.reference || (__cxx_static_address_4f0a7f85e06ad545e02fbc3d.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_435045f9ede2da74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_41898b89d4a41aaa = ((u32(((u32(2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52f039f30a90b80faff60705() {
  return __cxx_static_address_52f039f30a90b80faff60705.reference || (__cxx_static_address_52f039f30a90b80faff60705.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_41898b89d4a41aaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_d8959bcc2c00d3e6 = ((u32(((u32(2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58c9734a16e0e4a0ad01111b() {
  return __cxx_static_address_58c9734a16e0e4a0ad01111b.reference || (__cxx_static_address_58c9734a16e0e4a0ad01111b.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_d8959bcc2c00d3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_9fefabd43fd60797 = ((u32(((u32(2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b585aeff15620ca2fc628f26() {
  return __cxx_static_address_b585aeff15620ca2fc628f26.reference || (__cxx_static_address_b585aeff15620ca2fc628f26.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_9fefabd43fd60797; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_ed41e799fd02403b = ((u32(((u32(2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3e78971283742a0ec4ca14d() {
  return __cxx_static_address_c3e78971283742a0ec4ca14d.reference || (__cxx_static_address_c3e78971283742a0ec4ca14d.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_ed41e799fd02403b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_0b28f33e546e6d5d = ((u32(((u32(2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf40499d720e14f46a6c47d1() {
  return __cxx_static_address_cf40499d720e14f46a6c47d1.reference || (__cxx_static_address_cf40499d720e14f46a6c47d1.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_0b28f33e546e6d5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_424c4d39de4b9ca4 = ((u32(((u32(2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1b87132f19945230f4aac9b() {
  return __cxx_static_address_e1b87132f19945230f4aac9b.reference || (__cxx_static_address_e1b87132f19945230f4aac9b.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_424c4d39de4b9ca4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_1084047753e374d2 = ((u32(((u32(2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42e8a019b6c759b44dbee68f() {
  return __cxx_static_address_42e8a019b6c759b44dbee68f.reference || (__cxx_static_address_42e8a019b6c759b44dbee68f.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_1084047753e374d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_793a2db2f2f494f7 = ((u32(((u32(2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8917a36e8a6e7fd2035f9a6e() {
  return __cxx_static_address_8917a36e8a6e7fd2035f9a6e.reference || (__cxx_static_address_8917a36e8a6e7fd2035f9a6e.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_793a2db2f2f494f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_b768193b829221c7 = ((u32(((u32(2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2d2b38b83c854401a185fb6() {
  return __cxx_static_address_f2d2b38b83c854401a185fb6.reference || (__cxx_static_address_f2d2b38b83c854401a185fb6.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_b768193b829221c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_1464bf7f2e474b16 = ((u32(((u32(2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7fd052d6cbdb8db60475e060() {
  return __cxx_static_address_7fd052d6cbdb8db60475e060.reference || (__cxx_static_address_7fd052d6cbdb8db60475e060.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_1464bf7f2e474b16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_809724b5bcb4aaf5 = ((u32(((u32(2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_575481ea8bcd3647c72ea64e() {
  return __cxx_static_address_575481ea8bcd3647c72ea64e.reference || (__cxx_static_address_575481ea8bcd3647c72ea64e.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_809724b5bcb4aaf5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_3229411c2147da57 = ((u32(((u32(2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3e6679d28d47af8bb0a0fbe() {
  return __cxx_static_address_b3e6679d28d47af8bb0a0fbe.reference || (__cxx_static_address_b3e6679d28d47af8bb0a0fbe.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_3229411c2147da57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_1c08a7d19c9b3f82 = ((u32(((u32(2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0e585ab948ff9cf10399551() {
  return __cxx_static_address_d0e585ab948ff9cf10399551.reference || (__cxx_static_address_d0e585ab948ff9cf10399551.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_1c08a7d19c9b3f82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_53db1572ed3f5b5f = ((u32(((u32(2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8825fba42ed25089d4b71037() {
  return __cxx_static_address_8825fba42ed25089d4b71037.reference || (__cxx_static_address_8825fba42ed25089d4b71037.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_53db1572ed3f5b5f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_9a1db2625902f1e8 = ((u32(((u32(2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c171c8a6b6a4d9b5058a60() {
  return __cxx_static_address_b3c171c8a6b6a4d9b5058a60.reference || (__cxx_static_address_b3c171c8a6b6a4d9b5058a60.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_9a1db2625902f1e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_954a5efd744332bd = ((u32(((u32(2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b693b6e256681f53461be5c4() {
  return __cxx_static_address_b693b6e256681f53461be5c4.reference || (__cxx_static_address_b693b6e256681f53461be5c4.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_954a5efd744332bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_9b8264e0e0b2fc99 = ((u32(((u32(2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72f2b8fc44932ce8176364e6() {
  return __cxx_static_address_72f2b8fc44932ce8176364e6.reference || (__cxx_static_address_72f2b8fc44932ce8176364e6.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_9b8264e0e0b2fc99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_5569ab8a37d4099e = ((u32(((u32(2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5120dbfc369cde67f40903b() {
  return __cxx_static_address_d5120dbfc369cde67f40903b.reference || (__cxx_static_address_d5120dbfc369cde67f40903b.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_5569ab8a37d4099e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_b3200dbab59290f7 = ((u32(((u32(2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_029e673f350ab34e529af2b0() {
  return __cxx_static_address_029e673f350ab34e529af2b0.reference || (__cxx_static_address_029e673f350ab34e529af2b0.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_b3200dbab59290f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_4089024ede69fa28 = ((u32(((u32(2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f73fa7acb9481b92429a8f4f() {
  return __cxx_static_address_f73fa7acb9481b92429a8f4f.reference || (__cxx_static_address_f73fa7acb9481b92429a8f4f.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_4089024ede69fa28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_89f9a768eb579a02 = ((u32(((u32(2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e74adc27078d450b5e260223() {
  return __cxx_static_address_e74adc27078d450b5e260223.reference || (__cxx_static_address_e74adc27078d450b5e260223.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_89f9a768eb579a02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_aeedfa0b55ad78e9 = ((u32(((u32(2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af53a2ae376f020998b58b09() {
  return __cxx_static_address_af53a2ae376f020998b58b09.reference || (__cxx_static_address_af53a2ae376f020998b58b09.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_aeedfa0b55ad78e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_986ca2888aa6364a = ((u32(((u32(2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fe372f0cf47b795c5935b18() {
  return __cxx_static_address_3fe372f0cf47b795c5935b18.reference || (__cxx_static_address_3fe372f0cf47b795c5935b18.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_986ca2888aa6364a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_227c5a80bebf1fc8 = ((u32(((u32(2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cf60e864503a0ffc21a315c4() {
  return __cxx_static_address_cf60e864503a0ffc21a315c4.reference || (__cxx_static_address_cf60e864503a0ffc21a315c4.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_227c5a80bebf1fc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_85d287f6216bb930 = ((u32(((u32(2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26319ecceb173c254e8bd69b() {
  return __cxx_static_address_26319ecceb173c254e8bd69b.reference || (__cxx_static_address_26319ecceb173c254e8bd69b.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_85d287f6216bb930; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_fe9859166ff8468f = ((u32(((u32(2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2a1c2d26b445724260f7bd6a() {
  return __cxx_static_address_2a1c2d26b445724260f7bd6a.reference || (__cxx_static_address_2a1c2d26b445724260f7bd6a.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_fe9859166ff8468f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_01b607685186390d = ((u32(((u32(2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba3c0b97e1f76454e69043c9() {
  return __cxx_static_address_ba3c0b97e1f76454e69043c9.reference || (__cxx_static_address_ba3c0b97e1f76454e69043c9.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_01b607685186390d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_6d21f92f1d786c1a = ((u32(((u32(2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4135a19753d7cb3757c421fa() {
  return __cxx_static_address_4135a19753d7cb3757c421fa.reference || (__cxx_static_address_4135a19753d7cb3757c421fa.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_6d21f92f1d786c1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_62f72dd8f3aeaba4 = ((u32(((u32(2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_416f81a6ba4471735efecf04() {
  return __cxx_static_address_416f81a6ba4471735efecf04.reference || (__cxx_static_address_416f81a6ba4471735efecf04.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_62f72dd8f3aeaba4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_d04f56d11d895b8d = ((u32(((u32(2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8bf0b40657e9a33e8f7e2ca() {
  return __cxx_static_address_c8bf0b40657e9a33e8f7e2ca.reference || (__cxx_static_address_c8bf0b40657e9a33e8f7e2ca.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_d04f56d11d895b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_c6931d4c4c24d254 = ((u32(((u32(2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a82bd29c942d8558406ecab() {
  return __cxx_static_address_5a82bd29c942d8558406ecab.reference || (__cxx_static_address_5a82bd29c942d8558406ecab.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_c6931d4c4c24d254; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_4b35c5f5d45b78df = ((u32(((u32(2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2edbef6313c864bb305053a() {
  return __cxx_static_address_e2edbef6313c864bb305053a.reference || (__cxx_static_address_e2edbef6313c864bb305053a.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_4b35c5f5d45b78df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_f0fb5de0d140f2a1 = ((u32(((u32(2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9671b678f3dcec37fbec480() {
  return __cxx_static_address_d9671b678f3dcec37fbec480.reference || (__cxx_static_address_d9671b678f3dcec37fbec480.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_f0fb5de0d140f2a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_0b0caddc87e27331 = ((u32(((u32(2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac823785d9eaa9babcbb8301() {
  return __cxx_static_address_ac823785d9eaa9babcbb8301.reference || (__cxx_static_address_ac823785d9eaa9babcbb8301.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_0b0caddc87e27331; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_f87250e4806ee881 = ((u32(((u32(2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0f5bb11b1277050b12a1f4c() {
  return __cxx_static_address_b0f5bb11b1277050b12a1f4c.reference || (__cxx_static_address_b0f5bb11b1277050b12a1f4c.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_f87250e4806ee881; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_ff741a35f932406e = ((u32(((u32(2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d4e0652ecb170cf2737de43() {
  return __cxx_static_address_7d4e0652ecb170cf2737de43.reference || (__cxx_static_address_7d4e0652ecb170cf2737de43.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_ff741a35f932406e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_137c65361c37dae8 = ((u32(((u32(2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38061a75797f7c6be732c1e8() {
  return __cxx_static_address_38061a75797f7c6be732c1e8.reference || (__cxx_static_address_38061a75797f7c6be732c1e8.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_137c65361c37dae8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_2c2c7505f4b5469e = ((u32(((u32(2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df09ab1ef2de9049e9295b70() {
  return __cxx_static_address_df09ab1ef2de9049e9295b70.reference || (__cxx_static_address_df09ab1ef2de9049e9295b70.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_2c2c7505f4b5469e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_40c3f7fa19a119b9 = ((u32(((u32(2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8e86320f409ec8a43b76fcd() {
  return __cxx_static_address_c8e86320f409ec8a43b76fcd.reference || (__cxx_static_address_c8e86320f409ec8a43b76fcd.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_40c3f7fa19a119b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_4fb3f175e93f85b8 = ((u32(((u32(2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_957eac68a45c27a0c9d67e50() {
  return __cxx_static_address_957eac68a45c27a0c9d67e50.reference || (__cxx_static_address_957eac68a45c27a0c9d67e50.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_4fb3f175e93f85b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_62eb9d080f46ba8b = ((u32(((u32(2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94e25f5d29bec9ea3890a041() {
  return __cxx_static_address_94e25f5d29bec9ea3890a041.reference || (__cxx_static_address_94e25f5d29bec9ea3890a041.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_62eb9d080f46ba8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_4e923651c1ea1c62 = ((u32(((u32(2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_acb7044e8c5064b1a9914d82() {
  return __cxx_static_address_acb7044e8c5064b1a9914d82.reference || (__cxx_static_address_acb7044e8c5064b1a9914d82.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_4e923651c1ea1c62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_97da4a6dc2140270 = ((u32(((u32(2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a7282f1978d67dc0c24dd84() {
  return __cxx_static_address_1a7282f1978d67dc0c24dd84.reference || (__cxx_static_address_1a7282f1978d67dc0c24dd84.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_97da4a6dc2140270; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_5afaf1dd03915dff = ((u32(((u32(2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1690009a71f57dd88f99ce54() {
  return __cxx_static_address_1690009a71f57dd88f99ce54.reference || (__cxx_static_address_1690009a71f57dd88f99ce54.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_5afaf1dd03915dff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_00c198b06d597646 = ((u32(((u32(2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b372d331a4fddcbd4d625d08() {
  return __cxx_static_address_b372d331a4fddcbd4d625d08.reference || (__cxx_static_address_b372d331a4fddcbd4d625d08.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_00c198b06d597646; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_65d842406851886b = ((u32(((u32(2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79136ce66d9e13663c5383e5() {
  return __cxx_static_address_79136ce66d9e13663c5383e5.reference || (__cxx_static_address_79136ce66d9e13663c5383e5.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_65d842406851886b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_54b0ff69d8d120fa = ((u32(((u32(2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d110e437376cfbf6321a165() {
  return __cxx_static_address_9d110e437376cfbf6321a165.reference || (__cxx_static_address_9d110e437376cfbf6321a165.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_54b0ff69d8d120fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_19710dfc8df90c53 = ((u32(((u32(2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbf76bc349a43d227a663708() {
  return __cxx_static_address_bbf76bc349a43d227a663708.reference || (__cxx_static_address_bbf76bc349a43d227a663708.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_19710dfc8df90c53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_0e7706336f2e3bfc = ((u32(((u32(2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b1e68a6f5fb74c51e3eec0b() {
  return __cxx_static_address_5b1e68a6f5fb74c51e3eec0b.reference || (__cxx_static_address_5b1e68a6f5fb74c51e3eec0b.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_0e7706336f2e3bfc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_568e7f4196b08d2d = ((u32(((u32(2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59c4218bacfcf59caf8e7fa8() {
  return __cxx_static_address_59c4218bacfcf59caf8e7fa8.reference || (__cxx_static_address_59c4218bacfcf59caf8e7fa8.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_568e7f4196b08d2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_cddf303b8ea7cfed = ((u32(((u32(2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9fbb44c1cbb2115bc8981c7() {
  return __cxx_static_address_c9fbb44c1cbb2115bc8981c7.reference || (__cxx_static_address_c9fbb44c1cbb2115bc8981c7.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_cddf303b8ea7cfed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_3f2c18a77cba2c59 = ((u32(((u32(2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f0d8577705621da102ed50() {
  return __cxx_static_address_27f0d8577705621da102ed50.reference || (__cxx_static_address_27f0d8577705621da102ed50.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_3f2c18a77cba2c59; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_ac083b5ef358f097 = ((u32(((u32(2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3734ab6b06b298d7f327630() {
  return __cxx_static_address_a3734ab6b06b298d7f327630.reference || (__cxx_static_address_a3734ab6b06b298d7f327630.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_ac083b5ef358f097; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_5b7f2b932c741a49 = ((u32(((u32(2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_12f31333405e813703b236e8() {
  return __cxx_static_address_12f31333405e813703b236e8.reference || (__cxx_static_address_12f31333405e813703b236e8.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_5b7f2b932c741a49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_0a964406f8430b27 = ((u32(((u32(2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e5084e15ef263da48d5a29d() {
  return __cxx_static_address_9e5084e15ef263da48d5a29d.reference || (__cxx_static_address_9e5084e15ef263da48d5a29d.reference = {
    __cReference: true,
    get value() { return TIP____header_global_0a964406f8430b27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_ae0835c91e8e622a = ((u32(((u32(2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8aef03d623d7c8747193256a() {
  return __cxx_static_address_8aef03d623d7c8747193256a.reference || (__cxx_static_address_8aef03d623d7c8747193256a.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_ae0835c91e8e622a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_b99908f5077ea66d = ((u32(((u32(2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c5e2fedf41534444d756302() {
  return __cxx_static_address_2c5e2fedf41534444d756302.reference || (__cxx_static_address_2c5e2fedf41534444d756302.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_b99908f5077ea66d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_dc20a609f797d0bb = ((u32(((u32(2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db4db018ac2893fe93c9ae70() {
  return __cxx_static_address_db4db018ac2893fe93c9ae70.reference || (__cxx_static_address_db4db018ac2893fe93c9ae70.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_dc20a609f797d0bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_733c1a0895db4cef = ((u32(((u32(2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60c8f0d9bc77c972fd57ba95() {
  return __cxx_static_address_60c8f0d9bc77c972fd57ba95.reference || (__cxx_static_address_60c8f0d9bc77c972fd57ba95.reference = {
    __cReference: true,
    get value() { return RPG____header_global_733c1a0895db4cef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_8a3728e9c69112dc = ((u32(((u32(2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e99803d8e68bb8bbe9ddc61() {
  return __cxx_static_address_0e99803d8e68bb8bbe9ddc61.reference || (__cxx_static_address_0e99803d8e68bb8bbe9ddc61.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_8a3728e9c69112dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_7b8c76e6b125a9a0 = ((u32(((u32(2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91c431b027c7a2c8fa98ca7b() {
  return __cxx_static_address_91c431b027c7a2c8fa98ca7b.reference || (__cxx_static_address_91c431b027c7a2c8fa98ca7b.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_7b8c76e6b125a9a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_3b32ba4bfcf8074a = ((u32(((u32(2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a214e9ae9f9524d6cb0aad7() {
  return __cxx_static_address_5a214e9ae9f9524d6cb0aad7.reference || (__cxx_static_address_5a214e9ae9f9524d6cb0aad7.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_3b32ba4bfcf8074a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_af93231cc68e4296 = ((u32(((u32(2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_40f94112ce3f2606e22bcf12() {
  return __cxx_static_address_40f94112ce3f2606e22bcf12.reference || (__cxx_static_address_40f94112ce3f2606e22bcf12.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_af93231cc68e4296; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_13daf9beca99672c = ((u32(((u32(2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96c306024bf8b4ebfe484a04() {
  return __cxx_static_address_96c306024bf8b4ebfe484a04.reference || (__cxx_static_address_96c306024bf8b4ebfe484a04.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_13daf9beca99672c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_d604e4fa3886f069 = ((u32(((u32(2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f59ea994dbf3328daa3b9f75() {
  return __cxx_static_address_f59ea994dbf3328daa3b9f75.reference || (__cxx_static_address_f59ea994dbf3328daa3b9f75.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_d604e4fa3886f069; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_7e5f3126662ab044 = ((u32(((u32(2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed8cd5d9c100b3c9066b488a() {
  return __cxx_static_address_ed8cd5d9c100b3c9066b488a.reference || (__cxx_static_address_ed8cd5d9c100b3c9066b488a.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_7e5f3126662ab044; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_194364f0088a16d8 = ((u32(((u32(2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd55e4a74e225386a4d6ab04() {
  return __cxx_static_address_cd55e4a74e225386a4d6ab04.reference || (__cxx_static_address_cd55e4a74e225386a4d6ab04.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_194364f0088a16d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_8e49344340c2986f = ((u32(((u32(2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ea36bfa903906cda9ea5926() {
  return __cxx_static_address_0ea36bfa903906cda9ea5926.reference || (__cxx_static_address_0ea36bfa903906cda9ea5926.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_8e49344340c2986f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_7c5c3d54b567ac03 = ((u32(((u32(2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fa27ab6e011ae5dcb5348bf() {
  return __cxx_static_address_3fa27ab6e011ae5dcb5348bf.reference || (__cxx_static_address_3fa27ab6e011ae5dcb5348bf.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_7c5c3d54b567ac03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_0709242b3e874cee = ((u32(((u32(2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ff5467f8fdb8f59a0420743() {
  return __cxx_static_address_1ff5467f8fdb8f59a0420743.reference || (__cxx_static_address_1ff5467f8fdb8f59a0420743.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_0709242b3e874cee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_2e0da5dd73c2b0dd = ((u32(((u32(2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59d5bf0d7639705644115468() {
  return __cxx_static_address_59d5bf0d7639705644115468.reference || (__cxx_static_address_59d5bf0d7639705644115468.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_2e0da5dd73c2b0dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_10ca3165d6fd4b97 = ((u32(((u32(2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4984d1916d11cbd2074f6eb3() {
  return __cxx_static_address_4984d1916d11cbd2074f6eb3.reference || (__cxx_static_address_4984d1916d11cbd2074f6eb3.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_10ca3165d6fd4b97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_ea0d33b5e730bae9 = ((u32(((u32(2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b33d2f32044ddc04119a6e7() {
  return __cxx_static_address_1b33d2f32044ddc04119a6e7.reference || (__cxx_static_address_1b33d2f32044ddc04119a6e7.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_ea0d33b5e730bae9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_6df904c720ffe340 = ((u32(((u32(3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62fdd7425e823c8d2768e1a6() {
  return __cxx_static_address_62fdd7425e823c8d2768e1a6.reference || (__cxx_static_address_62fdd7425e823c8d2768e1a6.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_6df904c720ffe340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_def70a7a3281b33b = ((u32(((u32(3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed62c8c6bef8b552a89cb457() {
  return __cxx_static_address_ed62c8c6bef8b552a89cb457.reference || (__cxx_static_address_ed62c8c6bef8b552a89cb457.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_def70a7a3281b33b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_34fa2a501a1cc561 = ((u32(((u32(3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b33ae679ff3fb33ea7a5aec1() {
  return __cxx_static_address_b33ae679ff3fb33ea7a5aec1.reference || (__cxx_static_address_b33ae679ff3fb33ea7a5aec1.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_34fa2a501a1cc561; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_11b8ae3484fb6371 = ((u32(((u32(3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b127a591f4a37586f81d5c77() {
  return __cxx_static_address_b127a591f4a37586f81d5c77.reference || (__cxx_static_address_b127a591f4a37586f81d5c77.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_11b8ae3484fb6371; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_d80b495898eec072 = ((u32(((u32(3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8233d5779121d59806c6a5ca() {
  return __cxx_static_address_8233d5779121d59806c6a5ca.reference || (__cxx_static_address_8233d5779121d59806c6a5ca.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_d80b495898eec072; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_523eb28df23dfec5 = ((u32(((u32(3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b56ed79b6f73bf4ba23e017() {
  return __cxx_static_address_4b56ed79b6f73bf4ba23e017.reference || (__cxx_static_address_4b56ed79b6f73bf4ba23e017.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_523eb28df23dfec5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_61ef80c11140b918 = ((u32(((u32(3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a69853dd4a8d1cd6bbe5311e() {
  return __cxx_static_address_a69853dd4a8d1cd6bbe5311e.reference || (__cxx_static_address_a69853dd4a8d1cd6bbe5311e.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_61ef80c11140b918; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_8c4632eb225a669e = ((u32(((u32(3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58ce9831f39d98d4791ccb22() {
  return __cxx_static_address_58ce9831f39d98d4791ccb22.reference || (__cxx_static_address_58ce9831f39d98d4791ccb22.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_8c4632eb225a669e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_0ad6338393457a3a = ((u32(((u32(3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f987cc05f2a468944cbb34de() {
  return __cxx_static_address_f987cc05f2a468944cbb34de.reference || (__cxx_static_address_f987cc05f2a468944cbb34de.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_0ad6338393457a3a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_00b915afc065200d = ((u32(((u32(3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98a423d7b781bba7e01ab6f0() {
  return __cxx_static_address_98a423d7b781bba7e01ab6f0.reference || (__cxx_static_address_98a423d7b781bba7e01ab6f0.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_00b915afc065200d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_3bbefc477df2be22 = ((u32(((u32(3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b41792049a0d4a4891d5ed7() {
  return __cxx_static_address_3b41792049a0d4a4891d5ed7.reference || (__cxx_static_address_3b41792049a0d4a4891d5ed7.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_3bbefc477df2be22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_885dd46a598bb67e = ((u32(((u32(3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88bfb080d9a1c7aec39dc093() {
  return __cxx_static_address_88bfb080d9a1c7aec39dc093.reference || (__cxx_static_address_88bfb080d9a1c7aec39dc093.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_885dd46a598bb67e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_1729102070776549 = ((u32(((u32(3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6dfb2bdd5a49d9bcf81b406a() {
  return __cxx_static_address_6dfb2bdd5a49d9bcf81b406a.reference || (__cxx_static_address_6dfb2bdd5a49d9bcf81b406a.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_1729102070776549; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_3d6cf38e57750b8d = ((u32(((u32(3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_958cfba7e303c6a37be2f807() {
  return __cxx_static_address_958cfba7e303c6a37be2f807.reference || (__cxx_static_address_958cfba7e303c6a37be2f807.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_3d6cf38e57750b8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_e3430a5e8dcef27c = ((u32(((u32(3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_710feff56a66377fe8809ffe() {
  return __cxx_static_address_710feff56a66377fe8809ffe.reference || (__cxx_static_address_710feff56a66377fe8809ffe.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_e3430a5e8dcef27c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_1a6b7478a0ab87ac = ((u32(((u32(3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e03946357ba6b2ac73c7938b() {
  return __cxx_static_address_e03946357ba6b2ac73c7938b.reference || (__cxx_static_address_e03946357ba6b2ac73c7938b.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_1a6b7478a0ab87ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_c8d653b821b5e106 = ((u32(((u32(3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_83a650b209300e3d56d88943() {
  return __cxx_static_address_83a650b209300e3d56d88943.reference || (__cxx_static_address_83a650b209300e3d56d88943.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_c8d653b821b5e106; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_b462863aff956f67 = ((u32(((u32(3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_826ca77ac9abd08bfad8172a() {
  return __cxx_static_address_826ca77ac9abd08bfad8172a.reference || (__cxx_static_address_826ca77ac9abd08bfad8172a.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_b462863aff956f67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_ef64b6cccfc84122 = ((u32(((u32(3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_584a9a54deb5f71a88acc3d4() {
  return __cxx_static_address_584a9a54deb5f71a88acc3d4.reference || (__cxx_static_address_584a9a54deb5f71a88acc3d4.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_ef64b6cccfc84122; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_d99532e9180863b5 = ((u32(((u32(3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e428cb6070dd9d39ce5a89f9() {
  return __cxx_static_address_e428cb6070dd9d39ce5a89f9.reference || (__cxx_static_address_e428cb6070dd9d39ce5a89f9.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_d99532e9180863b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_373f337c62aa26af = ((u32(((u32(3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41ff574e3ddc5dd38c2c30a9() {
  return __cxx_static_address_41ff574e3ddc5dd38c2c30a9.reference || (__cxx_static_address_41ff574e3ddc5dd38c2c30a9.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_373f337c62aa26af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_9a1f73db58c627eb = ((u32(((u32(3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f8d8883981e06f4742a68581() {
  return __cxx_static_address_f8d8883981e06f4742a68581.reference || (__cxx_static_address_f8d8883981e06f4742a68581.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_9a1f73db58c627eb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_8707625e08b50eaa = ((u32(((u32(4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b511c7dc60a83487a077aef() {
  return __cxx_static_address_7b511c7dc60a83487a077aef.reference || (__cxx_static_address_7b511c7dc60a83487a077aef.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_8707625e08b50eaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_6545f1eed12335bf = ((u32(((u32(4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49e90eb55983b17e2f31a74d() {
  return __cxx_static_address_49e90eb55983b17e2f31a74d.reference || (__cxx_static_address_49e90eb55983b17e2f31a74d.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_6545f1eed12335bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_2840c2b2dbc625dc = ((u32(((u32(4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0436696d884ff163e0b327c6() {
  return __cxx_static_address_0436696d884ff163e0b327c6.reference || (__cxx_static_address_0436696d884ff163e0b327c6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_2840c2b2dbc625dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_74518929db3b76b7 = ((u32(((u32(4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6a469e3e4d795cda8cd4e5e() {
  return __cxx_static_address_c6a469e3e4d795cda8cd4e5e.reference || (__cxx_static_address_c6a469e3e4d795cda8cd4e5e.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_74518929db3b76b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_534385fb440b4b52 = ((u32(((u32(4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e93e2d68637109b8330c61ae() {
  return __cxx_static_address_e93e2d68637109b8330c61ae.reference || (__cxx_static_address_e93e2d68637109b8330c61ae.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_534385fb440b4b52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_5a59e3a2fdf05f8d = ((u32(((u32(4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6cda3c02c34c3f0b8766343() {
  return __cxx_static_address_f6cda3c02c34c3f0b8766343.reference || (__cxx_static_address_f6cda3c02c34c3f0b8766343.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_5a59e3a2fdf05f8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_1e9e337137761499 = ((u32(((u32(4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bce8e24123195f84b2bdcb5() {
  return __cxx_static_address_9bce8e24123195f84b2bdcb5.reference || (__cxx_static_address_9bce8e24123195f84b2bdcb5.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_1e9e337137761499; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_785c178bdc49b2c9 = ((u32(((u32(4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed5bfd6647a5178d917a0c61() {
  return __cxx_static_address_ed5bfd6647a5178d917a0c61.reference || (__cxx_static_address_ed5bfd6647a5178d917a0c61.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_785c178bdc49b2c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_c37130adbcc70a02 = ((u32(((u32(4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a3d83c999dfc4cdec0412b8() {
  return __cxx_static_address_4a3d83c999dfc4cdec0412b8.reference || (__cxx_static_address_4a3d83c999dfc4cdec0412b8.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_c37130adbcc70a02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_6e5a7c0e85345651 = ((u32(((u32(4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28cf2098aeb5c7c225d3c86c() {
  return __cxx_static_address_28cf2098aeb5c7c225d3c86c.reference || (__cxx_static_address_28cf2098aeb5c7c225d3c86c.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_6e5a7c0e85345651; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_ee59779de2dac1d4 = ((u32(((u32(4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df0696e225ac0c1cf4bc5074() {
  return __cxx_static_address_df0696e225ac0c1cf4bc5074.reference || (__cxx_static_address_df0696e225ac0c1cf4bc5074.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_ee59779de2dac1d4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_4a92b2324c71872a = ((u32(((u32(4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4756d2e81ec6c7d2d442782() {
  return __cxx_static_address_d4756d2e81ec6c7d2d442782.reference || (__cxx_static_address_d4756d2e81ec6c7d2d442782.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_4a92b2324c71872a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_a356ab998a9bb8ce = ((u32(((u32(4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b67c5ea260e9d2e19590b5e2() {
  return __cxx_static_address_b67c5ea260e9d2e19590b5e2.reference || (__cxx_static_address_b67c5ea260e9d2e19590b5e2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_a356ab998a9bb8ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_678d6ba9e99c1710 = ((u32(((u32(4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9db42156957efba4fc530993() {
  return __cxx_static_address_9db42156957efba4fc530993.reference || (__cxx_static_address_9db42156957efba4fc530993.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_678d6ba9e99c1710; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_35237ed68b559128 = ((u32(((u32(4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7229633546ecf5ce897633a() {
  return __cxx_static_address_d7229633546ecf5ce897633a.reference || (__cxx_static_address_d7229633546ecf5ce897633a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_35237ed68b559128; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_b0d78ebc3181231d = ((u32(((u32(4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26952dbb04f1e5e1cb1c34db() {
  return __cxx_static_address_26952dbb04f1e5e1cb1c34db.reference || (__cxx_static_address_26952dbb04f1e5e1cb1c34db.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_b0d78ebc3181231d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_1f60e82cf0befd54 = ((u32(((u32(4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8da649fed4e175921aab6cf4() {
  return __cxx_static_address_8da649fed4e175921aab6cf4.reference || (__cxx_static_address_8da649fed4e175921aab6cf4.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_1f60e82cf0befd54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_00b7573c66ecf2b4 = ((u32(((u32(4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dda5ed5869f7cde77676739e() {
  return __cxx_static_address_dda5ed5869f7cde77676739e.reference || (__cxx_static_address_dda5ed5869f7cde77676739e.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_00b7573c66ecf2b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_9c7b36bb26033b2a = ((u32(((u32(4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e13497e3d17d788b579d376e() {
  return __cxx_static_address_e13497e3d17d788b579d376e.reference || (__cxx_static_address_e13497e3d17d788b579d376e.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_9c7b36bb26033b2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_9dc9f651a49860b9 = ((u32(((u32(4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_335c36f44d649b8a4f9b8a57() {
  return __cxx_static_address_335c36f44d649b8a4f9b8a57.reference || (__cxx_static_address_335c36f44d649b8a4f9b8a57.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_9dc9f651a49860b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_3a205b1291b2c9dc = ((u32(((u32(4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_254d11de5b03ecb32016ec1e() {
  return __cxx_static_address_254d11de5b03ecb32016ec1e.reference || (__cxx_static_address_254d11de5b03ecb32016ec1e.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_3a205b1291b2c9dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_8975fba4ccf099dd = ((u32(((u32(4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a05436a40d0b74f5e99fd41b() {
  return __cxx_static_address_a05436a40d0b74f5e99fd41b.reference || (__cxx_static_address_a05436a40d0b74f5e99fd41b.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_8975fba4ccf099dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_4c8ccc8a3160e25a = ((u32(((u32(4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8bb83ba37369e74654c6307f() {
  return __cxx_static_address_8bb83ba37369e74654c6307f.reference || (__cxx_static_address_8bb83ba37369e74654c6307f.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_4c8ccc8a3160e25a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_034bb427911ac579 = ((u32(((u32(4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a5e4ca0e156d9f488cac7f2() {
  return __cxx_static_address_4a5e4ca0e156d9f488cac7f2.reference || (__cxx_static_address_4a5e4ca0e156d9f488cac7f2.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_034bb427911ac579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_41ab834afe64cf7e = ((u32(((u32(4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2727744d4628fa455b3501e() {
  return __cxx_static_address_e2727744d4628fa455b3501e.reference || (__cxx_static_address_e2727744d4628fa455b3501e.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_41ab834afe64cf7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_cef155a0207efc0d = ((u32(((u32(4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_188c35cf75745110438af9ca() {
  return __cxx_static_address_188c35cf75745110438af9ca.reference || (__cxx_static_address_188c35cf75745110438af9ca.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_cef155a0207efc0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_d80c6613cea34e23 = ((u32(((u32(4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29196bd94e55fd09d2d722ff() {
  return __cxx_static_address_29196bd94e55fd09d2d722ff.reference || (__cxx_static_address_29196bd94e55fd09d2d722ff.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_d80c6613cea34e23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_2411ac0d7ab1538c = ((u32(((u32(4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f51c44d1fa117f3c0d51e231() {
  return __cxx_static_address_f51c44d1fa117f3c0d51e231.reference || (__cxx_static_address_f51c44d1fa117f3c0d51e231.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_2411ac0d7ab1538c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_e029e0b1ec1aa6e4 = ((u32(((u32(4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60c09f0f4e2fb22a4d50b96b() {
  return __cxx_static_address_60c09f0f4e2fb22a4d50b96b.reference || (__cxx_static_address_60c09f0f4e2fb22a4d50b96b.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_e029e0b1ec1aa6e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_5dc7731ef7d5b0e5 = ((u32(((u32(4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b90cb36c02d748e7a29593ac() {
  return __cxx_static_address_b90cb36c02d748e7a29593ac.reference || (__cxx_static_address_b90cb36c02d748e7a29593ac.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_5dc7731ef7d5b0e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_d6f72952dcdde79c = ((u32(((u32(4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3c398d1c4cf6d182746743f() {
  return __cxx_static_address_b3c398d1c4cf6d182746743f.reference || (__cxx_static_address_b3c398d1c4cf6d182746743f.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_d6f72952dcdde79c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_f7624ac502b25f7b = ((u32(((u32(4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e8aca07f3c22d7337933b06() {
  return __cxx_static_address_4e8aca07f3c22d7337933b06.reference || (__cxx_static_address_4e8aca07f3c22d7337933b06.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_f7624ac502b25f7b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_224a0def2c2bd67a = ((u32(((u32(4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fd4a959bf0fbaa5df53e749() {
  return __cxx_static_address_1fd4a959bf0fbaa5df53e749.reference || (__cxx_static_address_1fd4a959bf0fbaa5df53e749.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_224a0def2c2bd67a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_3bea390c6be40db4 = ((u32(((u32(4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcfee605791c42eeb9479e09() {
  return __cxx_static_address_dcfee605791c42eeb9479e09.reference || (__cxx_static_address_dcfee605791c42eeb9479e09.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_3bea390c6be40db4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_379f8e0603130d66 = ((u32(((u32(4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66934f78700dd68db7b1a892() {
  return __cxx_static_address_66934f78700dd68db7b1a892.reference || (__cxx_static_address_66934f78700dd68db7b1a892.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_379f8e0603130d66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_71cde2f671c3d7bd = ((u32(((u32(4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72b067acf0ada3cd1f699336() {
  return __cxx_static_address_72b067acf0ada3cd1f699336.reference || (__cxx_static_address_72b067acf0ada3cd1f699336.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_71cde2f671c3d7bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_2d9572dbf219777c = ((u32(((u32(4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0967eff253a0c3c4faa6b1fa() {
  return __cxx_static_address_0967eff253a0c3c4faa6b1fa.reference || (__cxx_static_address_0967eff253a0c3c4faa6b1fa.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_2d9572dbf219777c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_3ef4f7bb41e09c41 = ((u32(((u32(4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b14a7ed7070f94e14d52ae20() {
  return __cxx_static_address_b14a7ed7070f94e14d52ae20.reference || (__cxx_static_address_b14a7ed7070f94e14d52ae20.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_3ef4f7bb41e09c41; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_2f629df5dfc1fc6b = ((u32(((u32(4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b347afa22dee09112ab07baa() {
  return __cxx_static_address_b347afa22dee09112ab07baa.reference || (__cxx_static_address_b347afa22dee09112ab07baa.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_2f629df5dfc1fc6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_7fade6ec40594dfa = ((u32(((u32(4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d25160fd351c9a759899ee1a() {
  return __cxx_static_address_d25160fd351c9a759899ee1a.reference || (__cxx_static_address_d25160fd351c9a759899ee1a.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_7fade6ec40594dfa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_d34cf95fa9a02e19 = ((u32(((u32(4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c455543f9f1d3099f7d7e8a() {
  return __cxx_static_address_4c455543f9f1d3099f7d7e8a.reference || (__cxx_static_address_4c455543f9f1d3099f7d7e8a.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_d34cf95fa9a02e19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_4244e35686582909 = ((u32(((u32(4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24e775f1a0d2f925e7d1955b() {
  return __cxx_static_address_24e775f1a0d2f925e7d1955b.reference || (__cxx_static_address_24e775f1a0d2f925e7d1955b.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_4244e35686582909; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_2a26ee984f8f0f97 = ((u32(((u32(4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aedcf9ac69535a75c133456() {
  return __cxx_static_address_3aedcf9ac69535a75c133456.reference || (__cxx_static_address_3aedcf9ac69535a75c133456.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_2a26ee984f8f0f97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_44416148e843d14a = ((u32(((u32(4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69ee4d96a6a769775449e6a3() {
  return __cxx_static_address_69ee4d96a6a769775449e6a3.reference || (__cxx_static_address_69ee4d96a6a769775449e6a3.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_44416148e843d14a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_57c7c3d95ab97def = ((u32(((u32(4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02fad00767ddce76d029b10d() {
  return __cxx_static_address_02fad00767ddce76d029b10d.reference || (__cxx_static_address_02fad00767ddce76d029b10d.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_57c7c3d95ab97def; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_4f3063f14faf5266 = ((u32(((u32(4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9071bcc8d6d8102fae917707() {
  return __cxx_static_address_9071bcc8d6d8102fae917707.reference || (__cxx_static_address_9071bcc8d6d8102fae917707.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_4f3063f14faf5266; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_9b9deb7122733a32 = ((u32(((u32(4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_edfb07464bbb879de6a84f4b() {
  return __cxx_static_address_edfb07464bbb879de6a84f4b.reference || (__cxx_static_address_edfb07464bbb879de6a84f4b.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_9b9deb7122733a32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_bbe96fb93390eaa0 = ((u32(((u32(4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_154f276e904b49e94e5ea35e() {
  return __cxx_static_address_154f276e904b49e94e5ea35e.reference || (__cxx_static_address_154f276e904b49e94e5ea35e.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_bbe96fb93390eaa0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_a2d7a1179081533a = ((u32(((u32(4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cc1e9746987dd600b23d9a16() {
  return __cxx_static_address_cc1e9746987dd600b23d9a16.reference || (__cxx_static_address_cc1e9746987dd600b23d9a16.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_a2d7a1179081533a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_af44a3ad4237ba67 = ((u32(((u32(4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_908cc5ec1da294cb679140c1() {
  return __cxx_static_address_908cc5ec1da294cb679140c1.reference || (__cxx_static_address_908cc5ec1da294cb679140c1.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_af44a3ad4237ba67; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_90b7d7134b1d2225 = ((u32(((u32(4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3adb0005de5df42194aa489e() {
  return __cxx_static_address_3adb0005de5df42194aa489e.reference || (__cxx_static_address_3adb0005de5df42194aa489e.reference = {
    __cReference: true,
    get value() { return MAN____header_global_90b7d7134b1d2225; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_0b48ed63066baef2 = ((u32(((u32(4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ac08c41b513aa31c55e46cf() {
  return __cxx_static_address_2ac08c41b513aa31c55e46cf.reference || (__cxx_static_address_2ac08c41b513aa31c55e46cf.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_0b48ed63066baef2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_e4f2a754924c6b5a = ((u32(((u32(4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0769fc8ac6b89772e1660247() {
  return __cxx_static_address_0769fc8ac6b89772e1660247.reference || (__cxx_static_address_0769fc8ac6b89772e1660247.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_e4f2a754924c6b5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_c9ea63bf5c4ad30d = ((u32(((u32(4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_815248982e9b8764a6cfae41() {
  return __cxx_static_address_815248982e9b8764a6cfae41.reference || (__cxx_static_address_815248982e9b8764a6cfae41.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_c9ea63bf5c4ad30d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_ff04ac176181db20 = ((u32(((u32(4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8ca26d4ce4c2164ca7186c15() {
  return __cxx_static_address_8ca26d4ce4c2164ca7186c15.reference || (__cxx_static_address_8ca26d4ce4c2164ca7186c15.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_ff04ac176181db20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_9d3a82760e27d18f = ((u32(((u32(4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dba44e14e188a8dee8814bde() {
  return __cxx_static_address_dba44e14e188a8dee8814bde.reference || (__cxx_static_address_dba44e14e188a8dee8814bde.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_9d3a82760e27d18f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_d6b697900104a3ab = ((u32(((u32(4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e6c72c8d27f534913c710b8() {
  return __cxx_static_address_6e6c72c8d27f534913c710b8.reference || (__cxx_static_address_6e6c72c8d27f534913c710b8.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_d6b697900104a3ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_b7d4f833124f5339 = ((u32(((u32(4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_060a2285e20324866750b3dd() {
  return __cxx_static_address_060a2285e20324866750b3dd.reference || (__cxx_static_address_060a2285e20324866750b3dd.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_b7d4f833124f5339; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_2f707f51b347e8be = ((u32(((u32(4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c2ff1457d76b61e39b89fb7() {
  return __cxx_static_address_0c2ff1457d76b61e39b89fb7.reference || (__cxx_static_address_0c2ff1457d76b61e39b89fb7.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_2f707f51b347e8be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_2c70436950a65bed = ((u32(((u32(5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c8b8dc8a379ad4f81a1fb9f() {
  return __cxx_static_address_1c8b8dc8a379ad4f81a1fb9f.reference || (__cxx_static_address_1c8b8dc8a379ad4f81a1fb9f.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_2c70436950a65bed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_8b0629abd7de3a32 = ((u32(((u32(5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9107bcdf6d8fd85be9ca350f() {
  return __cxx_static_address_9107bcdf6d8fd85be9ca350f.reference || (__cxx_static_address_9107bcdf6d8fd85be9ca350f.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_8b0629abd7de3a32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_13045fe49d15e5ad = ((u32(((u32(5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ecccce40767477f23b6152ef() {
  return __cxx_static_address_ecccce40767477f23b6152ef.reference || (__cxx_static_address_ecccce40767477f23b6152ef.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_13045fe49d15e5ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_1d33f54371b50fb6 = ((u32(((u32(5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cef49c40f9ab17e88d95198() {
  return __cxx_static_address_6cef49c40f9ab17e88d95198.reference || (__cxx_static_address_6cef49c40f9ab17e88d95198.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_1d33f54371b50fb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_6e9f9ff98f49e1b4 = ((u32(((u32(5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_294f946a8d80cb2a38dccadd() {
  return __cxx_static_address_294f946a8d80cb2a38dccadd.reference || (__cxx_static_address_294f946a8d80cb2a38dccadd.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_6e9f9ff98f49e1b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_1b85143d58d4b936 = ((u32(((u32(5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d2bda9ce6f4d71837038738() {
  return __cxx_static_address_1d2bda9ce6f4d71837038738.reference || (__cxx_static_address_1d2bda9ce6f4d71837038738.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_1b85143d58d4b936; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_6c4432dcb310100b = ((u32(((u32(5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea780166a2398f6bb31db588() {
  return __cxx_static_address_ea780166a2398f6bb31db588.reference || (__cxx_static_address_ea780166a2398f6bb31db588.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_6c4432dcb310100b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_44e704338d1326f6 = ((u32(((u32(5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b602c6b307fe7986605a403() {
  return __cxx_static_address_0b602c6b307fe7986605a403.reference || (__cxx_static_address_0b602c6b307fe7986605a403.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_44e704338d1326f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_2ae35aa38c8173c9 = ((u32(((u32(5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c60170ee656acf5f6965b51() {
  return __cxx_static_address_6c60170ee656acf5f6965b51.reference || (__cxx_static_address_6c60170ee656acf5f6965b51.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_2ae35aa38c8173c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_b806edd400175a00 = ((u32(((u32(5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42ed6b490986e947f0e11e9b() {
  return __cxx_static_address_42ed6b490986e947f0e11e9b.reference || (__cxx_static_address_42ed6b490986e947f0e11e9b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_b806edd400175a00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_0f8c87a5d3b23b85 = ((u32(((u32(5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_22303def2b18ba6ff8453e5d() {
  return __cxx_static_address_22303def2b18ba6ff8453e5d.reference || (__cxx_static_address_22303def2b18ba6ff8453e5d.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_0f8c87a5d3b23b85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_ee2f4ac94f1dc713 = ((u32(((u32(1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cc815f3c89b8f9b794a1ba8() {
  return __cxx_static_address_9cc815f3c89b8f9b794a1ba8.reference || (__cxx_static_address_9cc815f3c89b8f9b794a1ba8.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_ee2f4ac94f1dc713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_42ca447f1fe05a9d = ((u32(((u32(5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_10f8baa06af0f9f6231b6023() {
  return __cxx_static_address_10f8baa06af0f9f6231b6023.reference || (__cxx_static_address_10f8baa06af0f9f6231b6023.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_42ca447f1fe05a9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_02b7fbde5e518fef = ((u32(((u32(5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d886e635f0c33f83a69e1456() {
  return __cxx_static_address_d886e635f0c33f83a69e1456.reference || (__cxx_static_address_d886e635f0c33f83a69e1456.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_02b7fbde5e518fef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_d5114fd55bf427a4 = ((u32(((u32(5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8fad7506afdca2d08230a8f() {
  return __cxx_static_address_c8fad7506afdca2d08230a8f.reference || (__cxx_static_address_c8fad7506afdca2d08230a8f.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_d5114fd55bf427a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_68be8485ed206c09 = ((u32(((u32(5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7ee43b886f6157c75c7c4b13() {
  return __cxx_static_address_7ee43b886f6157c75c7c4b13.reference || (__cxx_static_address_7ee43b886f6157c75c7c4b13.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_68be8485ed206c09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_e5814cd31fdd96bc = ((u32(((u32(5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ea569a3c8c40760d14a6d7f() {
  return __cxx_static_address_3ea569a3c8c40760d14a6d7f.reference || (__cxx_static_address_3ea569a3c8c40760d14a6d7f.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_e5814cd31fdd96bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_1e6de01632c44940 = ((u32(((u32(5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6ef5e7ac76c24fc1b02359c() {
  return __cxx_static_address_a6ef5e7ac76c24fc1b02359c.reference || (__cxx_static_address_a6ef5e7ac76c24fc1b02359c.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_1e6de01632c44940; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_44d2ae0a15ebf4d2 = ((u32(((u32(5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1d3371fc36c4e03fe6edf90() {
  return __cxx_static_address_d1d3371fc36c4e03fe6edf90.reference || (__cxx_static_address_d1d3371fc36c4e03fe6edf90.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_44d2ae0a15ebf4d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_fa15e9eebfcc878d = ((u32(((u32(5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6130f664027cc9c3e25145fd() {
  return __cxx_static_address_6130f664027cc9c3e25145fd.reference || (__cxx_static_address_6130f664027cc9c3e25145fd.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_fa15e9eebfcc878d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_9d4aeb8a45c0b243 = ((u32(((u32(5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e28c0c87d0b0ccdda4b1e0e() {
  return __cxx_static_address_3e28c0c87d0b0ccdda4b1e0e.reference || (__cxx_static_address_3e28c0c87d0b0ccdda4b1e0e.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_9d4aeb8a45c0b243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_7672a761c0b2bcf7 = ((u32(((u32(5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a91de1f2d905745d7e418b7() {
  return __cxx_static_address_1a91de1f2d905745d7e418b7.reference || (__cxx_static_address_1a91de1f2d905745d7e418b7.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_7672a761c0b2bcf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_e771ebae8a71c600 = ((u32(((u32(5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4adb74c723237f60dd25f94() {
  return __cxx_static_address_f4adb74c723237f60dd25f94.reference || (__cxx_static_address_f4adb74c723237f60dd25f94.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_e771ebae8a71c600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_e4b4d88305c288db = ((u32(((u32(5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdc62bdf31020c6ad79d9638() {
  return __cxx_static_address_bdc62bdf31020c6ad79d9638.reference || (__cxx_static_address_bdc62bdf31020c6ad79d9638.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_e4b4d88305c288db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_f9e244a957224934 = ((u32(((u32(5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd2390b14419db33f60c2428() {
  return __cxx_static_address_dd2390b14419db33f60c2428.reference || (__cxx_static_address_dd2390b14419db33f60c2428.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_f9e244a957224934; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_f6d1e5d104da1fd9 = ((u32(((u32(5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adff82ed1c85c9964c6f81e2() {
  return __cxx_static_address_adff82ed1c85c9964c6f81e2.reference || (__cxx_static_address_adff82ed1c85c9964c6f81e2.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_f6d1e5d104da1fd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_d6dea5904e8c0553 = ((u32(((u32(5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4f8b1c4230fab5ca8b651df() {
  return __cxx_static_address_e4f8b1c4230fab5ca8b651df.reference || (__cxx_static_address_e4f8b1c4230fab5ca8b651df.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_d6dea5904e8c0553; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_0d647a56ea0af62f = ((u32(((u32(2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4848b65cac8e96801c710eb() {
  return __cxx_static_address_c4848b65cac8e96801c710eb.reference || (__cxx_static_address_c4848b65cac8e96801c710eb.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_0d647a56ea0af62f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_a898e1f88e1cdfcd = ((u32(((u32(2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5af6bc4132c8ea96a98c42a() {
  return __cxx_static_address_d5af6bc4132c8ea96a98c42a.reference || (__cxx_static_address_d5af6bc4132c8ea96a98c42a.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_a898e1f88e1cdfcd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_aed12b2f31646074 = ((u32(((u32(5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a200cc5eb9b03bba0a1aa4e8() {
  return __cxx_static_address_a200cc5eb9b03bba0a1aa4e8.reference || (__cxx_static_address_a200cc5eb9b03bba0a1aa4e8.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_aed12b2f31646074; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_d29865ae82483141 = ((u32(((u32(5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_941432f4709ad053163f6c37() {
  return __cxx_static_address_941432f4709ad053163f6c37.reference || (__cxx_static_address_941432f4709ad053163f6c37.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_d29865ae82483141; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_9d6f9609ae29ea84 = ((u32(((u32(5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4361a42f15737733618a6ab() {
  return __cxx_static_address_b4361a42f15737733618a6ab.reference || (__cxx_static_address_b4361a42f15737733618a6ab.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_9d6f9609ae29ea84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_e58c638ab73bb02b = u64((BigInt(u64(64)) * BigInt(u64((BigInt(u64((BigInt(u64((BigInt(72) * BigInt(u64(16384))))) + BigInt(u64((BigInt(96) * BigInt(u64(4096)))))))) + BigInt(u64((BigInt(296) * BigInt(u64(16384))))))))));
function __cxx_static_address_a97c516e57d7975f596f36ef() {
  return __cxx_static_address_a97c516e57d7975f596f36ef.reference || (__cxx_static_address_a97c516e57d7975f596f36ef.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_e58c638ab73bb02b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_284b379d267fa5b1 = i32(2147483647);
function __cxx_static_address_6899d5d8b4edc02f6ba69ae4() {
  return __cxx_static_address_6899d5d8b4edc02f6ba69ae4.reference || (__cxx_static_address_6899d5d8b4edc02f6ba69ae4.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_284b379d267fa5b1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_d6c98e7b90e2ccff = i32(2147483648);
function __cxx_static_address_ab4de36d37d197f070dafe5b() {
  return __cxx_static_address_ab4de36d37d197f070dafe5b.reference || (__cxx_static_address_ab4de36d37d197f070dafe5b.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_d6c98e7b90e2ccff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_b1fae9e6f7c9debf = i32(2147483648);
function __cxx_static_address_815b09fcef46524c2ea334a3() {
  return __cxx_static_address_815b09fcef46524c2ea334a3.reference || (__cxx_static_address_815b09fcef46524c2ea334a3.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_b1fae9e6f7c9debf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_217802013aec91cb = i32(65536);
function __cxx_static_address_c069921f15ce0961b5aea2dc() {
  return __cxx_static_address_c069921f15ce0961b5aea2dc.reference || (__cxx_static_address_c069921f15ce0961b5aea2dc.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_217802013aec91cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_24711ee8d9fc79e5 = i32(32768);
function __cxx_static_address_1265b551c777d5ba88396901() {
  return __cxx_static_address_1265b551c777d5ba88396901.reference || (__cxx_static_address_1265b551c777d5ba88396901.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_24711ee8d9fc79e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_e610f6368a443e9b = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_d27cd574ffcf2232d936e36d() {
  return __cxx_static_address_d27cd574ffcf2232d936e36d.reference || (__cxx_static_address_d27cd574ffcf2232d936e36d.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_e610f6368a443e9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:179
export function VM_GetWall(wallNum, labelNum) {
  switch (labelNum) {
    case i32(19): {
      (labelNum = i32((cPointerElementRef(cRecordPointer(__cxx_global_cell_64b1dd24a985c284baf44a16().value, {"align": 1, "arrayAlign": 1, "fields": {"blend": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 1, "union": false}, {}), wallNum).value).blend));
    }
    break;
    case i32(20): {
      (labelNum = i32((i32((getangle(i32(((cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).point2).value).__cxx_anonymous_0.__cxx_anonymous_0.x - (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).__cxx_anonymous_0.__cxx_anonymous_0.x)), i32(((cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).point2).value).__cxx_anonymous_0.__cxx_anonymous_0.y - (cPointerElementRef(cRecordPointer(__cxx_global_cell_4d8aaa64f68587b18e27604c().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "cstat": {"native": "Uint16Array", "offset": 14, "size": 2}, "extra": {"native": "Int16Array", "offset": 30, "size": 2}, "hitag": {"native": "Int16Array", "offset": 28, "size": 2}, "lotag": {"native": "Int16Array", "offset": 26, "size": 2}, "nextsector": {"native": "Int16Array", "offset": 12, "size": 2}, "nextwall": {"native": "Int16Array", "offset": 10, "size": 2}, "overpicnum": {"native": "Int16Array", "offset": 18, "size": 2}, "pal": {"native": "Uint8Array", "offset": 21, "size": 1}, "picnum": {"native": "Int16Array", "offset": 16, "size": 2}, "point2": {"native": "Int16Array", "offset": 8, "size": 2}, "shade": {"native": "Int8Array", "offset": 20, "size": 1}, "xpanning": {"native": "Uint8Array", "offset": 24, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 25, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 32, "union": false}, {}), wallNum).value).__cxx_anonymous_0.__cxx_anonymous_0.y))) + 512)) & 2047)));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:198
export function VM_SetWall(wallNum, labelNum, newValue) {
  switch (labelNum) {
    case i32(19): {
      ((cPointerElementRef(cRecordPointer(__cxx_global_cell_64b1dd24a985c284baf44a16().value, {"align": 1, "arrayAlign": 1, "fields": {"blend": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 1, "union": false}, {}), wallNum).value).blend = (u32((u32(newValue) & 255)) & 255));
    }
    break;
  }
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:324
export function VM_GetSprite(spriteNum, labelNum, lParm2) {
  let a = (cPointerElementRef(cRecordPointer(actor, {"align": 1, "arrayAlign": 4, "fields": {"bpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 44}, "ceilingz": {"native": "Int32Array", "offset": 60, "size": 4}, "cgg": {"native": "Uint8Array", "offset": 94, "size": 1}, "dispicnum": {"native": "Int16Array", "offset": 92, "size": 2}, "filler": {"length": 2, "native": "Uint8Array", "offset": 90, "size": 2}, "flags": {"native": "Uint32Array", "offset": 40, "size": 4}, "floorz": {"native": "Int32Array", "offset": 56, "size": 4}, "floorzoffset": {"native": "Int8Array", "offset": 88, "size": 1}, "htang": {"native": "Int16Array", "offset": 74, "size": 2}, "htextra": {"native": "Int16Array", "offset": 76, "size": 2}, "htowner": {"native": "Int16Array", "offset": 78, "size": 2}, "htpicnum": {"native": "Int16Array", "offset": 72, "size": 2}, "lasttransport": {"native": "Uint8Array", "offset": 95, "size": 1}, "lastv": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 64}, "movflag": {"native": "Int16Array", "offset": 80, "size": 2}, "stayput": {"native": "Int16Array", "offset": 86, "size": 2}, "t_data": {"length": 10, "native": "Int32Array", "offset": 0, "size": 40}, "tempang": {"native": "Int16Array", "offset": 82, "size": 2}, "timetosleep": {"native": "Int16Array", "offset": 84, "size": 2}, "waterzoffset": {"native": "Int8Array", "offset": 89, "size": 1}}, "overlaps": true, "size": 96, "union": false}, {}), spriteNum).value);
  let s = (cPointerElementRef(cRecordPointer(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {}), spriteNum).value);
  let ext = (cPointerElementRef(cRecordPointer(__cxx_global_cell_e6d5c05c99c236717ba2a685().value, {"align": 1, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"tspr": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": true, "size": 8, "union": true}, "offset": 0}, "alpha": {"native": "Float32Array", "offset": 8, "size": 4}, "filler": {"length": 12, "native": "Uint8Array", "offset": 52, "size": 12}, "flags": {"native": "Uint16Array", "offset": 12, "size": 2}, "mdangoff": {"native": "Int16Array", "offset": 20, "size": 2}, "mdanimcur": {"native": "Int16Array", "offset": 14, "size": 2}, "mdanimtims": {"native": "Uint32Array", "offset": 16, "size": 4}, "mdpitch": {"native": "Int16Array", "offset": 24, "size": 2}, "mdpivot_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 28}, "mdposition_offset": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 40}, "mdroll": {"native": "Int16Array", "offset": 26, "size": 2}, "xpanning": {"native": "Uint8Array", "offset": 22, "size": 1}, "ypanning": {"native": "Uint8Array", "offset": 23, "size": 1}}, "overlaps": true, "size": 64, "union": false}, {}), spriteNum).value);
  switch (labelNum) {
    case i32(45): {
      (labelNum = i32((cDeref(cPointerOffset(a.t_data, lParm2, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
    }
    break;
    case i32(59): {
      (labelNum = i32((u32((u32(Math.fround((ext.alpha * Math.fround(255)))) & 255)) & 255)));
    }
    break;
    case i32(60): {
      (labelNum = i32((i32(s.statnum) != 1024)));
    }
    break;
    default: {
      __builtin_unreachable();
    }
  }
  return i32(labelNum);
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1699
export let h_actor = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(61) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_36ecf5b982ca5148a2b52931() {
  return __cxx_global_cell_36ecf5b982ca5148a2b52931.reference || (__cxx_global_cell_36ecf5b982ca5148a2b52931.reference = {
    __cReference: true,
    get value() { return h_actor; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1700
export let h_input = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(8) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_4dfc2df4beaabb17f13a2a11() {
  return __cxx_global_cell_4dfc2df4beaabb17f13a2a11.reference || (__cxx_global_cell_4dfc2df4beaabb17f13a2a11.reference = {
    __cReference: true,
    get value() { return h_input; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1701
export let h_paldata = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(2) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_1b64352a65c97cbeac4d8dc1() {
  return __cxx_global_cell_1b64352a65c97cbeac4d8dc1.reference || (__cxx_global_cell_1b64352a65c97cbeac4d8dc1.reference = {
    __cReference: true,
    get value() { return h_paldata; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1702
export let h_player = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(176) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_1edb9adc2ad33f7dab0cc065() {
  return __cxx_global_cell_1edb9adc2ad33f7dab0cc065.reference || (__cxx_global_cell_1edb9adc2ad33f7dab0cc065.reference = {
    __cReference: true,
    get value() { return h_player; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1703
export let h_projectile = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(30) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_5369c12f5151e4651feb6d69() {
  return __cxx_global_cell_5369c12f5151e4651feb6d69.reference || (__cxx_global_cell_5369c12f5151e4651feb6d69.reference = {
    __cReference: true,
    get value() { return h_projectile; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1704
export let h_sector = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(31) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_1f238d951ac2733554cfa6c9() {
  return __cxx_global_cell_1f238d951ac2733554cfa6c9.reference || (__cxx_global_cell_1f238d951ac2733554cfa6c9.reference = {
    __cReference: true,
    get value() { return h_sector; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1705
export let h_tiledata = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(8) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_12f6357b924ceaa4592192e7() {
  return __cxx_global_cell_12f6357b924ceaa4592192e7.reference || (__cxx_global_cell_12f6357b924ceaa4592192e7.reference = {
    __cReference: true,
    get value() { return h_tiledata; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1706
export let h_tsprite = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(61) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_55925c071ef91c407236ca84() {
  return __cxx_global_cell_55925c071ef91c407236ca84.reference || (__cxx_global_cell_55925c071ef91c407236ca84.reference = {
    __cReference: true,
    get value() { return h_tsprite; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1707
export let h_userdef = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(187) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_6fc9ea499f8ee974932947d6() {
  return __cxx_global_cell_6fc9ea499f8ee974932947d6.reference || (__cxx_global_cell_6fc9ea499f8ee974932947d6.reference = {
    __cReference: true,
    get value() { return h_userdef; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/duke3d/src/gamestructures.cpp:1708
export let h_wall = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "items": {"offset": 16, "pointer": true, "size": 8}}, "overlaps": true, "size": 24, "union": false}, cStaticInitializerValues({"__cxx_anonymous_0": cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"prime": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"magic": {"native": "Uint32Array", "offset": 0, "size": 4}, "more": {"native": "Uint8Array", "offset": 4, "size": 1}}, "overlaps": false, "size": 5, "union": false}, "offset": 4}, "v": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "size": {"native": "Uint32Array", "offset": 0, "size": 4}}, "overlaps": true, "size": 12, "union": true}, cStaticInitializerValues({"size": u32(i32((i32(21) >> 1)))}), null, {}), "items": null}), null, {});
export function __cxx_global_cell_7b44353bd3d207ee6f04360e() {
  return __cxx_global_cell_7b44353bd3d207ee6f04360e.reference || (__cxx_global_cell_7b44353bd3d207ee6f04360e.reference = {
    __cReference: true,
    get value() { return h_wall; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_9b76676a78c3ecbb = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_20d5919aa414d023fb9f1954() {
  return __cxx_static_address_20d5919aa414d023fb9f1954.reference || (__cxx_static_address_20d5919aa414d023fb9f1954.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_9b76676a78c3ecbb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_20d5919aa414d023fb9f1954() { return __cxx_static_address_20d5919aa414d023fb9f1954(); }

// C/C++ source: source/duke3d/src/gamestructures.h:86
export let vmStructHashTablePtrs__header_global_6b3478f82798bb33 = cPointerArray(10, () => [cStaticReference(() => h_actor), cStaticReference(() => h_input), cStaticReference(() => h_paldata), cStaticReference(() => h_player), cStaticReference(() => h_projectile), cStaticReference(() => h_sector), cStaticReference(() => h_tiledata), cStaticReference(() => h_tsprite), cStaticReference(() => h_userdef), cStaticReference(() => h_wall)]);
function __cxx_static_address_8246fdd5ceb602876d771690() {
  return __cxx_static_address_8246fdd5ceb602876d771690.reference || (__cxx_static_address_8246fdd5ceb602876d771690.reference = {
    __cReference: true,
    get value() { return vmStructHashTablePtrs__header_global_6b3478f82798bb33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_d14adc6660e53e74 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_eaedca4726945ebcebbcc60d() {
  return __cxx_static_address_eaedca4726945ebcebbcc60d.reference || (__cxx_static_address_eaedca4726945ebcebbcc60d.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_d14adc6660e53e74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_262884ba1138abdb = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_213e4510f7707a5f188eead3() {
  return __cxx_static_address_213e4510f7707a5f188eead3.reference || (__cxx_static_address_213e4510f7707a5f188eead3.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_262884ba1138abdb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_213e4510f7707a5f188eead3() { return __cxx_static_address_213e4510f7707a5f188eead3(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_e5bdb082398cd1ab = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_16690cebc5520e72bd697104() {
  return __cxx_static_address_16690cebc5520e72bd697104.reference || (__cxx_static_address_16690cebc5520e72bd697104.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_e5bdb082398cd1ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_16690cebc5520e72bd697104() { return __cxx_static_address_16690cebc5520e72bd697104(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_553a015877ab0ff4 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_9f31a45af6b4f0266a317c47() {
  return __cxx_static_address_9f31a45af6b4f0266a317c47.reference || (__cxx_static_address_9f31a45af6b4f0266a317c47.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_553a015877ab0ff4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_9f31a45af6b4f0266a317c47() { return __cxx_static_address_9f31a45af6b4f0266a317c47(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_0b2952fddcc72ac5 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_91ac9da025f28c3f0c533ce5() {
  return __cxx_static_address_91ac9da025f28c3f0c533ce5.reference || (__cxx_static_address_91ac9da025f28c3f0c533ce5.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_0b2952fddcc72ac5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_91ac9da025f28c3f0c533ce5() { return __cxx_static_address_91ac9da025f28c3f0c533ce5(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_acd7588aed451223 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_5bda304b50407c85833d18b3() {
  return __cxx_static_address_5bda304b50407c85833d18b3.reference || (__cxx_static_address_5bda304b50407c85833d18b3.reference = {
    __cReference: true,
    get value() { return pow264__header_global_acd7588aed451223; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_5bda304b50407c85833d18b3() { return __cxx_static_address_5bda304b50407c85833d18b3(); }

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_45dcbdef74f12007 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": (u32(1) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([49, 0]), "sc": (u32(2) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([50, 0]), "sc": (u32(3) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([51, 0]), "sc": (u32(4) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([52, 0]), "sc": (u32(5) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([53, 0]), "sc": (u32(6) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([54, 0]), "sc": (u32(7) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([55, 0]), "sc": (u32(8) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([56, 0]), "sc": (u32(9) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([57, 0]), "sc": (u32(10) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([48, 0]), "sc": (u32(11) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([45, 0]), "sc": (u32(12) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([61, 0]), "sc": (u32(13) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": (u32(14) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 97, 98, 0]), "sc": (u32(15) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([81, 0]), "sc": (u32(16) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([87, 0]), "sc": (u32(17) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 0]), "sc": (u32(18) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 0]), "sc": (u32(19) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 0]), "sc": (u32(20) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([89, 0]), "sc": (u32(21) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 0]), "sc": (u32(22) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 0]), "sc": (u32(23) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([79, 0]), "sc": (u32(24) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 0]), "sc": (u32(25) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([91, 0]), "sc": (u32(26) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([93, 0]), "sc": (u32(27) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": (u32(28) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": (u32(29) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([65, 0]), "sc": (u32(30) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 0]), "sc": (u32(31) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 0]), "sc": (u32(32) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 0]), "sc": (u32(33) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([71, 0]), "sc": (u32(34) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 0]), "sc": (u32(35) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([74, 0]), "sc": (u32(36) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 0]), "sc": (u32(37) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 0]), "sc": (u32(38) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([59, 0]), "sc": (u32(39) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([39, 0]), "sc": (u32(40) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([96, 0]), "sc": (u32(41) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": (u32(42) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": (u32(43) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([90, 0]), "sc": (u32(44) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([88, 0]), "sc": (u32(45) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 0]), "sc": (u32(46) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([86, 0]), "sc": (u32(47) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 0]), "sc": (u32(48) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 0]), "sc": (u32(49) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([77, 0]), "sc": (u32(50) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([44, 0]), "sc": (u32(51) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([46, 0]), "sc": (u32(52) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([47, 0]), "sc": (u32(53) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": (u32(54) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": (u32(55) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": (u32(56) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": (u32(57) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": (u32(58) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 0]), "sc": (u32(59) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 50, 0]), "sc": (u32(60) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 51, 0]), "sc": (u32(61) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 52, 0]), "sc": (u32(62) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 53, 0]), "sc": (u32(63) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 54, 0]), "sc": (u32(64) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 55, 0]), "sc": (u32(65) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 56, 0]), "sc": (u32(66) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 57, 0]), "sc": (u32(67) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 48, 0]), "sc": (u32(68) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": (u32(69) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": (u32(70) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": (u32(71) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": (u32(72) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": (u32(73) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": (u32(74) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": (u32(75) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": (u32(76) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": (u32(77) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": (u32(78) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": (u32(79) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": (u32(80) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": (u32(81) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": (u32(82) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": (u32(83) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": (u32(86) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 49, 0]), "sc": (u32(87) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 50, 0]), "sc": (u32(88) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": (u32(156) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": (u32(157) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": (u32(181) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": (u32(184) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": (u32(183) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": (u32(197) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": (u32(199) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 112, 0]), "sc": (u32(200) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": (u32(201) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": (u32(203) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": (u32(205) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 100, 0]), "sc": (u32(207) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": (u32(208) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": (u32(209) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": (u32(210) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": (u32(211) & 255)}), null, {})]));
function __cxx_static_address_35b7f5d97ae23afb20324c9a() {
  return __cxx_static_address_35b7f5d97ae23afb20324c9a.reference || (__cxx_static_address_35b7f5d97ae23afb20324c9a.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_45dcbdef74f12007; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/gamedef.h:92
export function C_GetFileForOffset__header_3a230d97d314(offset) {
  let ofs = __cxx_global_cell_781692351a9d53402cd867ca().value;
  while ((cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).offset > offset)) {
    (ofs = cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).next);
  }
  return cRecordObject(cRecordPointer(ofs, {"align": 8, "arrayAlign": 1, "fields": {"fn": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 8, "pointer": true, "size": 8}, "offset": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {})).fn;
}

// C/C++ source: source/build/include/fix16.h:42
export function fix16_to_int__header_dca2865dd032(a) {
  return i32(Math.trunc(i32((a + ((a >= 0) ? fix16_half__header_global_24711ee8d9fc79e5 : (-fix16_half__header_global_24711ee8d9fc79e5)))) / fix16_one__header_global_217802013aec91cb));
}

// C/C++ source: source/build/include/fix16.h:46
export function fix16_from_int__header_6f2807549e5a(a) {
  return i32(Math.imul(a, fix16_one__header_global_217802013aec91cb));
}

// C/C++ source: source/duke3d/src/game.h:298
export function Menu_HaveUserMap__header_94b09d1d1fc7() {
  return i32((((i32((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_level_number == 7)) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.m_volume_number == 0)));
}

// C/C++ source: source/duke3d/src/game.h:293
export function G_HaveUserMap__header_36f36d810416() {
  return i32((((i32((cDeref(cPointerOffset(boardfilename, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.level_number == 7)) && (__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.volume_number == 0)));
}

export function clamp__header_0e5be9d2bafd(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function ARRAY_SIZE__header_f4445ac8eef7(arg0) {
  return u64(63n);
}

export function ARRAY_SIZE__header_ab35039d5e21(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_1fb178e7bece(arg0) {
  return u64(1n);
}

export function ARRAY_SIZE__header_a0e12283bf57(arg0) {
  return u64(176n);
}

export function ARRAY_SIZE__header_d9a02da31d0e(arg0) {
  return u64(30n);
}

export function ARRAY_SIZE__header_5795883076c7(arg0) {
  return u64(31n);
}

export function ARRAY_SIZE__header_3308d4d75a33(arg0) {
  return u64(23n);
}

export function ARRAY_SIZE__header_6ddb53c363b4(arg0) {
  return u64(187n);
}

export function ARRAY_SIZE__header_a86ac7a3f372(arg0) {
  return u64(21n);
}
