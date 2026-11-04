// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/grpscan.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";

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

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_e7e9085237787950 = i32(3754936);
function __cxx_static_address_7df785baf14adcc170013c32() {
  return __cxx_static_address_7df785baf14adcc170013c32.reference || (__cxx_static_address_7df785baf14adcc170013c32.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_e7e9085237787950; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_36219f0bd474a2b3 = i32(1144);
function __cxx_static_address_ed49523f6ace177eb78b570c() {
  return __cxx_static_address_ed49523f6ace177eb78b570c.reference || (__cxx_static_address_ed49523f6ace177eb78b570c.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_36219f0bd474a2b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:43
export const KICK_HIT____header_global_8fde85228b44482c = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a86053e88209339f63bca13a() {
  return __cxx_static_address_a86053e88209339f63bca13a.reference || (__cxx_static_address_a86053e88209339f63bca13a.reference = {
    __cReference: true,
    get value() { return KICK_HIT____header_global_8fde85228b44482c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:44
export const PISTOL_RICOCHET____header_global_295c26562c2e57a0 = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5f58e505d4bf48d9b47197b() {
  return __cxx_static_address_b5f58e505d4bf48d9b47197b.reference || (__cxx_static_address_b5f58e505d4bf48d9b47197b.reference = {
    __cReference: true,
    get value() { return PISTOL_RICOCHET____header_global_295c26562c2e57a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:45
export const PISTOL_BODYHIT____header_global_3afa289600d10fe8 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c903d587b4f48002d90994eb() {
  return __cxx_static_address_c903d587b4f48002d90994eb.reference || (__cxx_static_address_c903d587b4f48002d90994eb.reference = {
    __cReference: true,
    get value() { return PISTOL_BODYHIT____header_global_3afa289600d10fe8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:46
export const PISTOL_FIRE____header_global_a41d81b3c1936523 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78ae9f41a573ee2f6311f831() {
  return __cxx_static_address_78ae9f41a573ee2f6311f831.reference || (__cxx_static_address_78ae9f41a573ee2f6311f831.reference = {
    __cReference: true,
    get value() { return PISTOL_FIRE____header_global_a41d81b3c1936523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:47
export const EJECT_CLIP____header_global_2605aa03bbc101b4 = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbb1910b51ca9561787c54a4() {
  return __cxx_static_address_cbb1910b51ca9561787c54a4.reference || (__cxx_static_address_cbb1910b51ca9561787c54a4.reference = {
    __cReference: true,
    get value() { return EJECT_CLIP____header_global_2605aa03bbc101b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:48
export const INSERT_CLIP____header_global_c62de7da44c234d5 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_203f592c0d638dc7731c9b4a() {
  return __cxx_static_address_203f592c0d638dc7731c9b4a.reference || (__cxx_static_address_203f592c0d638dc7731c9b4a.reference = {
    __cReference: true,
    get value() { return INSERT_CLIP____header_global_c62de7da44c234d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:49
export const CHAINGUN_FIRE____header_global_59965145d51ebdc2 = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2238848dbdb380a656ed5d4() {
  return __cxx_static_address_c2238848dbdb380a656ed5d4.reference || (__cxx_static_address_c2238848dbdb380a656ed5d4.reference = {
    __cReference: true,
    get value() { return CHAINGUN_FIRE____header_global_59965145d51ebdc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:50
export const RPG_SHOOT____header_global_636a754df1511c98 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f51e3fd4a1391af6f1143d6() {
  return __cxx_static_address_3f51e3fd4a1391af6f1143d6.reference || (__cxx_static_address_3f51e3fd4a1391af6f1143d6.reference = {
    __cReference: true,
    get value() { return RPG_SHOOT____header_global_636a754df1511c98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:51
export const POOLBALLHIT____header_global_a8bfd4c04f826aec = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7e42d3750905c078e418a2a() {
  return __cxx_static_address_c7e42d3750905c078e418a2a.reference || (__cxx_static_address_c7e42d3750905c078e418a2a.reference = {
    __cReference: true,
    get value() { return POOLBALLHIT____header_global_a8bfd4c04f826aec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:52
export const RPG_EXPLODE____header_global_dcd163b104719f1e = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5724a464b893b3c34b144277() {
  return __cxx_static_address_5724a464b893b3c34b144277.reference || (__cxx_static_address_5724a464b893b3c34b144277.reference = {
    __cReference: true,
    get value() { return RPG_EXPLODE____header_global_dcd163b104719f1e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:53
export const CAT_FIRE____header_global_83323bce60002b15 = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33206cde02ccb3ffd41f7d20() {
  return __cxx_static_address_33206cde02ccb3ffd41f7d20.reference || (__cxx_static_address_33206cde02ccb3ffd41f7d20.reference = {
    __cReference: true,
    get value() { return CAT_FIRE____header_global_83323bce60002b15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:54
export const SHRINKER_FIRE____header_global_a8397647ef71faea = ((u32(((u32(11) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a839197c0d6af17d7599d96() {
  return __cxx_static_address_6a839197c0d6af17d7599d96.reference || (__cxx_static_address_6a839197c0d6af17d7599d96.reference = {
    __cReference: true,
    get value() { return SHRINKER_FIRE____header_global_a8397647ef71faea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:55
export const PIPEBOMB_BOUNCE____header_global_a018d83f1ece6f4f = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb3ab9fb30839d5aa2c725f4() {
  return __cxx_static_address_fb3ab9fb30839d5aa2c725f4.reference || (__cxx_static_address_fb3ab9fb30839d5aa2c725f4.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_BOUNCE____header_global_a018d83f1ece6f4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:56
export const PIPEBOMB_EXPLODE____header_global_4b7c8a967ed04e9f = ((u32(((u32(14) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bc81bb6573654b0ea07eaedf() {
  return __cxx_static_address_bc81bb6573654b0ea07eaedf.reference || (__cxx_static_address_bc81bb6573654b0ea07eaedf.reference = {
    __cReference: true,
    get value() { return PIPEBOMB_EXPLODE____header_global_4b7c8a967ed04e9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:57
export const LASERTRIP_ONWALL____header_global_b8556c03a17fba4e = ((u32(((u32(15) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8157713da581dcbe731ab55() {
  return __cxx_static_address_d8157713da581dcbe731ab55.reference || (__cxx_static_address_d8157713da581dcbe731ab55.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ONWALL____header_global_b8556c03a17fba4e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:58
export const LASERTRIP_ARMING____header_global_9fa4df1eb07f7ddb = ((u32(((u32(16) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c8f95ec72f53a5ce95a4a88() {
  return __cxx_static_address_0c8f95ec72f53a5ce95a4a88.reference || (__cxx_static_address_0c8f95ec72f53a5ce95a4a88.reference = {
    __cReference: true,
    get value() { return LASERTRIP_ARMING____header_global_9fa4df1eb07f7ddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:59
export const LASERTRIP_EXPLODE____header_global_6ccc9dcdc5f376ea = ((u32(((u32(17) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9383f8a20678e3e2c883b7f4() {
  return __cxx_static_address_9383f8a20678e3e2c883b7f4.reference || (__cxx_static_address_9383f8a20678e3e2c883b7f4.reference = {
    __cReference: true,
    get value() { return LASERTRIP_EXPLODE____header_global_6ccc9dcdc5f376ea; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:60
export const VENT_BUST____header_global_b32369030043594a = ((u32(((u32(18) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd214746e28885aed914502f() {
  return __cxx_static_address_dd214746e28885aed914502f.reference || (__cxx_static_address_dd214746e28885aed914502f.reference = {
    __cReference: true,
    get value() { return VENT_BUST____header_global_b32369030043594a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:61
export const GLASS_BREAKING____header_global_bdab3a551d0cb97c = ((u32(((u32(19) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6b92f09c04a747090392152f() {
  return __cxx_static_address_6b92f09c04a747090392152f.reference || (__cxx_static_address_6b92f09c04a747090392152f.reference = {
    __cReference: true,
    get value() { return GLASS_BREAKING____header_global_bdab3a551d0cb97c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:62
export const GLASS_HEAVYBREAK____header_global_0ad763c7e09e2f2a = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41cf7f7475d6ee8b6c758e7e() {
  return __cxx_static_address_41cf7f7475d6ee8b6c758e7e.reference || (__cxx_static_address_41cf7f7475d6ee8b6c758e7e.reference = {
    __cReference: true,
    get value() { return GLASS_HEAVYBREAK____header_global_0ad763c7e09e2f2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:63
export const SHORT_CIRCUIT____header_global_868423b265ad1067 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_391879c9a95a5aa0620a08e2() {
  return __cxx_static_address_391879c9a95a5aa0620a08e2.reference || (__cxx_static_address_391879c9a95a5aa0620a08e2.reference = {
    __cReference: true,
    get value() { return SHORT_CIRCUIT____header_global_868423b265ad1067; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:64
export const ITEM_SPLASH____header_global_3f88b2a470d47346 = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5010f5594d5c83179174ee1f() {
  return __cxx_static_address_5010f5594d5c83179174ee1f.reference || (__cxx_static_address_5010f5594d5c83179174ee1f.reference = {
    __cReference: true,
    get value() { return ITEM_SPLASH____header_global_3f88b2a470d47346; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:65
export const DUKE_GASP____header_global_e5e7ec98a0128686 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e43faa022e5c576eb1cbd845() {
  return __cxx_static_address_e43faa022e5c576eb1cbd845.reference || (__cxx_static_address_e43faa022e5c576eb1cbd845.reference = {
    __cReference: true,
    get value() { return DUKE_GASP____header_global_e5e7ec98a0128686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:66
export const SLIM_RECOG____header_global_5bd56e8365da8343 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbe6103b61beb6578ee76cac() {
  return __cxx_static_address_dbe6103b61beb6578ee76cac.reference || (__cxx_static_address_dbe6103b61beb6578ee76cac.reference = {
    __cReference: true,
    get value() { return SLIM_RECOG____header_global_5bd56e8365da8343; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:67
export const DUKE_URINATE____header_global_8b3a8ee0bcda3bc4 = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baaa4f312b092a8894330c7d() {
  return __cxx_static_address_baaa4f312b092a8894330c7d.reference || (__cxx_static_address_baaa4f312b092a8894330c7d.reference = {
    __cReference: true,
    get value() { return DUKE_URINATE____header_global_8b3a8ee0bcda3bc4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:68
export const ENDSEQVOL3SND2____header_global_2aa2f5ba24b24726 = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6bb3a3cd67ba138c12a46dc5() {
  return __cxx_static_address_6bb3a3cd67ba138c12a46dc5.reference || (__cxx_static_address_6bb3a3cd67ba138c12a46dc5.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND2____header_global_2aa2f5ba24b24726; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:69
export const ENDSEQVOL3SND3____header_global_e12e7d9679e65bb8 = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3ca76cde6795821dfab247b() {
  return __cxx_static_address_c3ca76cde6795821dfab247b.reference || (__cxx_static_address_c3ca76cde6795821dfab247b.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND3____header_global_e12e7d9679e65bb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:70
export const DUKE_CRACK____header_global_9f8eef1f7a0881e5 = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a87c69962d22e19fffcc7733() {
  return __cxx_static_address_a87c69962d22e19fffcc7733.reference || (__cxx_static_address_a87c69962d22e19fffcc7733.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK____header_global_9f8eef1f7a0881e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:71
export const SLIM_ATTACK____header_global_ba35abbff4028188 = ((u32(((u32(34) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9b04a15ecf8ad2ebecfb93b() {
  return __cxx_static_address_c9b04a15ecf8ad2ebecfb93b.reference || (__cxx_static_address_c9b04a15ecf8ad2ebecfb93b.reference = {
    __cReference: true,
    get value() { return SLIM_ATTACK____header_global_ba35abbff4028188; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:72
export const SOMETHINGHITFORCE____header_global_ce9c2d927dcd1e8f = ((u32(((u32(35) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6b45c491afc2f814a3705aa() {
  return __cxx_static_address_c6b45c491afc2f814a3705aa.reference || (__cxx_static_address_c6b45c491afc2f814a3705aa.reference = {
    __cReference: true,
    get value() { return SOMETHINGHITFORCE____header_global_ce9c2d927dcd1e8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:73
export const DUKE_DRINKING____header_global_bf2f7cecc3fdf937 = ((u32(((u32(36) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72e650ddad734c01a67240f3() {
  return __cxx_static_address_72e650ddad734c01a67240f3.reference || (__cxx_static_address_72e650ddad734c01a67240f3.reference = {
    __cReference: true,
    get value() { return DUKE_DRINKING____header_global_bf2f7cecc3fdf937; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:74
export const DUKE_GRUNT____header_global_b68b38a35255c71b = ((u32(((u32(38) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3a91a37aed8794be13ab8de() {
  return __cxx_static_address_c3a91a37aed8794be13ab8de.reference || (__cxx_static_address_c3a91a37aed8794be13ab8de.reference = {
    __cReference: true,
    get value() { return DUKE_GRUNT____header_global_b68b38a35255c71b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:75
export const DUKE_HARTBEAT____header_global_3da5c72ba7f09e2d = ((u32(((u32(39) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_49682be8be8788dd0de72838() {
  return __cxx_static_address_49682be8be8788dd0de72838.reference || (__cxx_static_address_49682be8be8788dd0de72838.reference = {
    __cReference: true,
    get value() { return DUKE_HARTBEAT____header_global_3da5c72ba7f09e2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:76
export const DUKE_ONWATER____header_global_e21248c0330affac = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff67f97f1b86d60d43729265() {
  return __cxx_static_address_ff67f97f1b86d60d43729265.reference || (__cxx_static_address_ff67f97f1b86d60d43729265.reference = {
    __cReference: true,
    get value() { return DUKE_ONWATER____header_global_e21248c0330affac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:77
export const DUKE_LAND____header_global_60de1988c4dc44a3 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_99bcd1d354011f68665a0177() {
  return __cxx_static_address_99bcd1d354011f68665a0177.reference || (__cxx_static_address_99bcd1d354011f68665a0177.reference = {
    __cReference: true,
    get value() { return DUKE_LAND____header_global_60de1988c4dc44a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:78
export const DUKE_WALKINDUCTS____header_global_9cacfa09b8d688fb = ((u32(((u32(43) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad1be2c4ac5a2ccc7f3f2e16() {
  return __cxx_static_address_ad1be2c4ac5a2ccc7f3f2e16.reference || (__cxx_static_address_ad1be2c4ac5a2ccc7f3f2e16.reference = {
    __cReference: true,
    get value() { return DUKE_WALKINDUCTS____header_global_9cacfa09b8d688fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:79
export const DUKE_UNDERWATER____header_global_c90eb3eeeea32b7c = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_021619e5a8cf5d84657c964f() {
  return __cxx_static_address_021619e5a8cf5d84657c964f.reference || (__cxx_static_address_021619e5a8cf5d84657c964f.reference = {
    __cReference: true,
    get value() { return DUKE_UNDERWATER____header_global_c90eb3eeeea32b7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:80
export const DUKE_JETPACK_ON____header_global_6b6f1f8aff9e0259 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_499665e17d1ebbe680f7ce59() {
  return __cxx_static_address_499665e17d1ebbe680f7ce59.reference || (__cxx_static_address_499665e17d1ebbe680f7ce59.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_ON____header_global_6b6f1f8aff9e0259; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:81
export const DUKE_JETPACK_IDLE____header_global_35fceca9e3fb1cde = ((u32(((u32(50) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8116ea236d1ba9d3e3c21a0() {
  return __cxx_static_address_b8116ea236d1ba9d3e3c21a0.reference || (__cxx_static_address_b8116ea236d1ba9d3e3c21a0.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_IDLE____header_global_35fceca9e3fb1cde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:82
export const DUKE_JETPACK_OFF____header_global_8bb31071920bb058 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e6b7aa79115e0071cf3621e() {
  return __cxx_static_address_2e6b7aa79115e0071cf3621e.reference || (__cxx_static_address_2e6b7aa79115e0071cf3621e.reference = {
    __cReference: true,
    get value() { return DUKE_JETPACK_OFF____header_global_8bb31071920bb058; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:83
export const DUKETALKTOBOSS____header_global_2bf889fa430f1db2 = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bb4a60aae8666d20cbc41ef() {
  return __cxx_static_address_9bb4a60aae8666d20cbc41ef.reference || (__cxx_static_address_9bb4a60aae8666d20cbc41ef.reference = {
    __cReference: true,
    get value() { return DUKETALKTOBOSS____header_global_2bf889fa430f1db2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:84
export const SQUISHED____header_global_40e0891f8cba9311 = ((u32(((u32(69) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ed0e9343f06f1e309e38acf() {
  return __cxx_static_address_0ed0e9343f06f1e309e38acf.reference || (__cxx_static_address_0ed0e9343f06f1e309e38acf.reference = {
    __cReference: true,
    get value() { return SQUISHED____header_global_40e0891f8cba9311; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:85
export const TELEPORTER____header_global_29e4818f8767df79 = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_89d972faacae3f66c981c77c() {
  return __cxx_static_address_89d972faacae3f66c981c77c.reference || (__cxx_static_address_89d972faacae3f66c981c77c.reference = {
    __cReference: true,
    get value() { return TELEPORTER____header_global_29e4818f8767df79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:86
export const ELEVATOR_ON____header_global_9ec8844d13dc25d5 = ((u32(((u32(71) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cd53bb46328d8192450a3f0() {
  return __cxx_static_address_2cd53bb46328d8192450a3f0.reference || (__cxx_static_address_2cd53bb46328d8192450a3f0.reference = {
    __cReference: true,
    get value() { return ELEVATOR_ON____header_global_9ec8844d13dc25d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:87
export const ELEVATOR_OFF____header_global_9d4ea820ed9449f6 = ((u32(((u32(73) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c681fb973f05cd31170d52cb() {
  return __cxx_static_address_c681fb973f05cd31170d52cb.reference || (__cxx_static_address_c681fb973f05cd31170d52cb.reference = {
    __cReference: true,
    get value() { return ELEVATOR_OFF____header_global_9d4ea820ed9449f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:88
export const SUBWAY____header_global_2a7d4d50e8bb202f = ((u32(((u32(75) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f9085c99c195b4afe7a9359() {
  return __cxx_static_address_7f9085c99c195b4afe7a9359.reference || (__cxx_static_address_7f9085c99c195b4afe7a9359.reference = {
    __cReference: true,
    get value() { return SUBWAY____header_global_2a7d4d50e8bb202f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:89
export const SWITCH_ON____header_global_7b5aa3f0dda31b80 = ((u32(((u32(76) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3306126ea36aea39d54ba33e() {
  return __cxx_static_address_3306126ea36aea39d54ba33e.reference || (__cxx_static_address_3306126ea36aea39d54ba33e.reference = {
    __cReference: true,
    get value() { return SWITCH_ON____header_global_7b5aa3f0dda31b80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:90
export const FLUSH_TOILET____header_global_e765ef74638a6d94 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b4f9f8255138181ddd8e1616() {
  return __cxx_static_address_b4f9f8255138181ddd8e1616.reference || (__cxx_static_address_b4f9f8255138181ddd8e1616.reference = {
    __cReference: true,
    get value() { return FLUSH_TOILET____header_global_e765ef74638a6d94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:91
export const EARTHQUAKE____header_global_044c7328c29a61b2 = ((u32(((u32(81) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c3a031bf34c21ca9c84b357() {
  return __cxx_static_address_7c3a031bf34c21ca9c84b357.reference || (__cxx_static_address_7c3a031bf34c21ca9c84b357.reference = {
    __cReference: true,
    get value() { return EARTHQUAKE____header_global_044c7328c29a61b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:92
export const END_OF_LEVEL_WARN____header_global_2ac857361f8aa421 = ((u32(((u32(83) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58b715eb9f8b02a5508516d9() {
  return __cxx_static_address_58b715eb9f8b02a5508516d9.reference || (__cxx_static_address_58b715eb9f8b02a5508516d9.reference = {
    __cReference: true,
    get value() { return END_OF_LEVEL_WARN____header_global_2ac857361f8aa421; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:93
export const WIND_AMBIENCE____header_global_953f6d495a131105 = ((u32(((u32(91) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5e8e5dbc9bc64df531283082() {
  return __cxx_static_address_5e8e5dbc9bc64df531283082.reference || (__cxx_static_address_5e8e5dbc9bc64df531283082.reference = {
    __cReference: true,
    get value() { return WIND_AMBIENCE____header_global_953f6d495a131105; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:94
export const SOMETHING_DRIPPING____header_global_8c7eb4829c01318f = ((u32(((u32(92) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a900b17cdd541085a926b1db() {
  return __cxx_static_address_a900b17cdd541085a926b1db.reference || (__cxx_static_address_a900b17cdd541085a926b1db.reference = {
    __cReference: true,
    get value() { return SOMETHING_DRIPPING____header_global_8c7eb4829c01318f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:95
export const BOS1_RECOG____header_global_7b661e4063ff7242 = ((u32(((u32(97) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32d01d6919cdbc54f53c911c() {
  return __cxx_static_address_32d01d6919cdbc54f53c911c.reference || (__cxx_static_address_32d01d6919cdbc54f53c911c.reference = {
    __cReference: true,
    get value() { return BOS1_RECOG____header_global_7b661e4063ff7242; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:96
export const BOS2_RECOG____header_global_d088fe38c5d8b22e = ((u32(((u32(102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb252a05bde8668d6154d357() {
  return __cxx_static_address_cb252a05bde8668d6154d357.reference || (__cxx_static_address_cb252a05bde8668d6154d357.reference = {
    __cReference: true,
    get value() { return BOS2_RECOG____header_global_d088fe38c5d8b22e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:97
export const DUKE_GETWEAPON2____header_global_a5a3ab8bad725de5 = ((u32(((u32(107) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbff3d9003f8f5d0b9807e7a() {
  return __cxx_static_address_fbff3d9003f8f5d0b9807e7a.reference || (__cxx_static_address_fbff3d9003f8f5d0b9807e7a.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON2____header_global_a5a3ab8bad725de5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:98
export const SHOTGUN_FIRE____header_global_69ba187fc1031bf0 = ((u32(((u32(109) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06d2089bbe8382d72921b727() {
  return __cxx_static_address_06d2089bbe8382d72921b727.reference || (__cxx_static_address_06d2089bbe8382d72921b727.reference = {
    __cReference: true,
    get value() { return SHOTGUN_FIRE____header_global_69ba187fc1031bf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:99
export const PRED_RECOG____header_global_7e670b4d99a1b389 = ((u32(((u32(111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_82b7fab58957518c25c40d54() {
  return __cxx_static_address_82b7fab58957518c25c40d54.reference || (__cxx_static_address_82b7fab58957518c25c40d54.reference = {
    __cReference: true,
    get value() { return PRED_RECOG____header_global_7e670b4d99a1b389; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:100
export const CAPT_RECOG____header_global_740256d4843562d7 = ((u32(((u32(117) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc4a63fb4a2e6d216f6914f0() {
  return __cxx_static_address_dc4a63fb4a2e6d216f6914f0.reference || (__cxx_static_address_dc4a63fb4a2e6d216f6914f0.reference = {
    __cReference: true,
    get value() { return CAPT_RECOG____header_global_740256d4843562d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:101
export const PIG_RECOG____header_global_a38a360bebcc9724 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba023497638746c91af7384c() {
  return __cxx_static_address_ba023497638746c91af7384c.reference || (__cxx_static_address_ba023497638746c91af7384c.reference = {
    __cReference: true,
    get value() { return PIG_RECOG____header_global_a38a360bebcc9724; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:102
export const RECO_ROAM____header_global_db03de83652ec0a3 = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa0d2bac80676bfdaa9d1180() {
  return __cxx_static_address_fa0d2bac80676bfdaa9d1180.reference || (__cxx_static_address_fa0d2bac80676bfdaa9d1180.reference = {
    __cReference: true,
    get value() { return RECO_ROAM____header_global_db03de83652ec0a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:103
export const RECO_RECOG____header_global_236777b9b726e21a = ((u32(((u32(126) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a265e819561babc521de14fa() {
  return __cxx_static_address_a265e819561babc521de14fa.reference || (__cxx_static_address_a265e819561babc521de14fa.reference = {
    __cReference: true,
    get value() { return RECO_RECOG____header_global_236777b9b726e21a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:104
export const RECO_ATTACK____header_global_529366615265f862 = ((u32(((u32(127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64b157b588020b3546bc139a() {
  return __cxx_static_address_64b157b588020b3546bc139a.reference || (__cxx_static_address_64b157b588020b3546bc139a.reference = {
    __cReference: true,
    get value() { return RECO_ATTACK____header_global_529366615265f862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:105
export const RECO_PAIN____header_global_4786bb68089c9343 = ((u32(((u32(128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f686d0636222054d225089b() {
  return __cxx_static_address_9f686d0636222054d225089b.reference || (__cxx_static_address_9f686d0636222054d225089b.reference = {
    __cReference: true,
    get value() { return RECO_PAIN____header_global_4786bb68089c9343; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:106
export const DRON_RECOG____header_global_b8664df28698eb23 = ((u32(((u32(131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff4b0249ac97fd84a11b1fe0() {
  return __cxx_static_address_ff4b0249ac97fd84a11b1fe0.reference || (__cxx_static_address_ff4b0249ac97fd84a11b1fe0.reference = {
    __cReference: true,
    get value() { return DRON_RECOG____header_global_b8664df28698eb23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:107
export const COMM_RECOG____header_global_7ff3ba3b758bb452 = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_905d88523de78d428df48022() {
  return __cxx_static_address_905d88523de78d428df48022.reference || (__cxx_static_address_905d88523de78d428df48022.reference = {
    __cReference: true,
    get value() { return COMM_RECOG____header_global_7ff3ba3b758bb452; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:108
export const OCTA_RECOG____header_global_790a2029bbc7c984 = ((u32(((u32(141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be35fea89a4437af13237e57() {
  return __cxx_static_address_be35fea89a4437af13237e57.reference || (__cxx_static_address_be35fea89a4437af13237e57.reference = {
    __cReference: true,
    get value() { return OCTA_RECOG____header_global_790a2029bbc7c984; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:109
export const TURR_RECOG____header_global_3b7adb6d2d3906ed = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_957dc856a899428631d98f78() {
  return __cxx_static_address_957dc856a899428631d98f78.reference || (__cxx_static_address_957dc856a899428631d98f78.reference = {
    __cReference: true,
    get value() { return TURR_RECOG____header_global_3b7adb6d2d3906ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:110
export const SLIM_DYING____header_global_706e10ba7057193f = ((u32(((u32(149) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f05a5e57dc6d80bad2a2c01() {
  return __cxx_static_address_7f05a5e57dc6d80bad2a2c01.reference || (__cxx_static_address_7f05a5e57dc6d80bad2a2c01.reference = {
    __cReference: true,
    get value() { return SLIM_DYING____header_global_706e10ba7057193f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:111
export const BOS3_RECOG____header_global_8708f2cf20b053bb = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3abce5c98e5721d415b85fb() {
  return __cxx_static_address_b3abce5c98e5721d415b85fb.reference || (__cxx_static_address_b3abce5c98e5721d415b85fb.reference = {
    __cReference: true,
    get value() { return BOS3_RECOG____header_global_8708f2cf20b053bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:112
export const BOS1_WALK____header_global_ebc456456eab1a05 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a61eff1e71db210d48b7ec42() {
  return __cxx_static_address_a61eff1e71db210d48b7ec42.reference || (__cxx_static_address_a61eff1e71db210d48b7ec42.reference = {
    __cReference: true,
    get value() { return BOS1_WALK____header_global_ebc456456eab1a05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:113
export const THUD____header_global_93634050cde46192 = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbf3e224c5540aa04f0ad9a1() {
  return __cxx_static_address_dbf3e224c5540aa04f0ad9a1.reference || (__cxx_static_address_dbf3e224c5540aa04f0ad9a1.reference = {
    __cReference: true,
    get value() { return THUD____header_global_93634050cde46192; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:114
export const WIERDSHOT_FLY____header_global_6da12ed904603cad = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5b66049f88b9be7a49ee269() {
  return __cxx_static_address_b5b66049f88b9be7a49ee269.reference || (__cxx_static_address_b5b66049f88b9be7a49ee269.reference = {
    __cReference: true,
    get value() { return WIERDSHOT_FLY____header_global_6da12ed904603cad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:115
export const SLIM_ROAM____header_global_184ecf3aef2e85bf = ((u32(((u32(163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ceec05d8ebc2faf83f6738b9() {
  return __cxx_static_address_ceec05d8ebc2faf83f6738b9.reference || (__cxx_static_address_ceec05d8ebc2faf83f6738b9.reference = {
    __cReference: true,
    get value() { return SLIM_ROAM____header_global_184ecf3aef2e85bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:116
export const SHOTGUN_COCK____header_global_a9357057f633f19f = ((u32(((u32(169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f6da01935f86d3a0da9395d() {
  return __cxx_static_address_6f6da01935f86d3a0da9395d.reference || (__cxx_static_address_6f6da01935f86d3a0da9395d.reference = {
    __cReference: true,
    get value() { return SHOTGUN_COCK____header_global_a9357057f633f19f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:117
export const GENERIC_AMBIENCE17____header_global_2e25370838b34a33 = ((u32(((u32(177) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c241b1a8b55fd6f31ec935ff() {
  return __cxx_static_address_c241b1a8b55fd6f31ec935ff.reference || (__cxx_static_address_c241b1a8b55fd6f31ec935ff.reference = {
    __cReference: true,
    get value() { return GENERIC_AMBIENCE17____header_global_2e25370838b34a33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:118
export const BONUS_SPEECH1____header_global_794181c5f40a1e25 = ((u32(((u32(195) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_382b35ff4598c577a7d4d329() {
  return __cxx_static_address_382b35ff4598c577a7d4d329.reference || (__cxx_static_address_382b35ff4598c577a7d4d329.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH1____header_global_794181c5f40a1e25; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:119
export const BONUS_SPEECH2____header_global_1fe172ee948d0153 = ((u32(((u32(196) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c2b1ebd1b5d2a7a3377c11c() {
  return __cxx_static_address_9c2b1ebd1b5d2a7a3377c11c.reference || (__cxx_static_address_9c2b1ebd1b5d2a7a3377c11c.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH2____header_global_1fe172ee948d0153; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:120
export const BONUS_SPEECH3____header_global_11beeb6a2026fa20 = ((u32(((u32(197) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07edb978c1ee0443d7fee9bf() {
  return __cxx_static_address_07edb978c1ee0443d7fee9bf.reference || (__cxx_static_address_07edb978c1ee0443d7fee9bf.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH3____header_global_11beeb6a2026fa20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:121
export const BONUS_SPEECH4____header_global_8bc6b449998f3034 = ((u32(((u32(199) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_688317c0b487f5f07357ce23() {
  return __cxx_static_address_688317c0b487f5f07357ce23.reference || (__cxx_static_address_688317c0b487f5f07357ce23.reference = {
    __cReference: true,
    get value() { return BONUS_SPEECH4____header_global_8bc6b449998f3034; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:122
export const DUKE_LAND_HURT____header_global_a55b1f2366939974 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5802e3f7c4cbca9a988ee0e() {
  return __cxx_static_address_e5802e3f7c4cbca9a988ee0e.reference || (__cxx_static_address_e5802e3f7c4cbca9a988ee0e.reference = {
    __cReference: true,
    get value() { return DUKE_LAND_HURT____header_global_a55b1f2366939974; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:123
export const DUKE_SEARCH2____header_global_dbcb99c91d5e872f = ((u32(((u32(207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1801682a73f3cd6b4b47b348() {
  return __cxx_static_address_1801682a73f3cd6b4b47b348.reference || (__cxx_static_address_1801682a73f3cd6b4b47b348.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH2____header_global_dbcb99c91d5e872f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:124
export const DUKE_CRACK2____header_global_31576d878c928580 = ((u32(((u32(208) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaf3a3c74982a9a683d8ec28() {
  return __cxx_static_address_aaf3a3c74982a9a683d8ec28.reference || (__cxx_static_address_aaf3a3c74982a9a683d8ec28.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK2____header_global_31576d878c928580; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:125
export const DUKE_SEARCH____header_global_bfbd4b5cfcd0d853 = ((u32(((u32(209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fceabd76ced135a6ee54c38() {
  return __cxx_static_address_3fceabd76ced135a6ee54c38.reference || (__cxx_static_address_3fceabd76ced135a6ee54c38.reference = {
    __cReference: true,
    get value() { return DUKE_SEARCH____header_global_bfbd4b5cfcd0d853; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:126
export const DUKE_GET____header_global_cb7d56390892744a = ((u32(((u32(210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_08ca58682ae694ff2717b2ce() {
  return __cxx_static_address_08ca58682ae694ff2717b2ce.reference || (__cxx_static_address_08ca58682ae694ff2717b2ce.reference = {
    __cReference: true,
    get value() { return DUKE_GET____header_global_cb7d56390892744a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:127
export const DUKE_LONGTERM_PAIN____header_global_116fb8964f91f622 = ((u32(((u32(211) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eeffc0af97551dd4a6dd734b() {
  return __cxx_static_address_eeffc0af97551dd4a6dd734b.reference || (__cxx_static_address_eeffc0af97551dd4a6dd734b.reference = {
    __cReference: true,
    get value() { return DUKE_LONGTERM_PAIN____header_global_116fb8964f91f622; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:128
export const MONITOR_ACTIVE____header_global_f032ce4b791c86b7 = ((u32(((u32(212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_564b14820fbdefb34625f372() {
  return __cxx_static_address_564b14820fbdefb34625f372.reference || (__cxx_static_address_564b14820fbdefb34625f372.reference = {
    __cReference: true,
    get value() { return MONITOR_ACTIVE____header_global_f032ce4b791c86b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:129
export const NITEVISION_ONOFF____header_global_ae526d769e6abdad = ((u32(((u32(213) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8961d774fae44c287726dac8() {
  return __cxx_static_address_8961d774fae44c287726dac8.reference || (__cxx_static_address_8961d774fae44c287726dac8.reference = {
    __cReference: true,
    get value() { return NITEVISION_ONOFF____header_global_ae526d769e6abdad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:130
export const DUKE_CRACK_FIRST____header_global_cd678c9c09084bac = ((u32(((u32(215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dab56ea4e74156ffade957a0() {
  return __cxx_static_address_dab56ea4e74156ffade957a0.reference || (__cxx_static_address_dab56ea4e74156ffade957a0.reference = {
    __cReference: true,
    get value() { return DUKE_CRACK_FIRST____header_global_cd678c9c09084bac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:131
export const DUKE_USEMEDKIT____header_global_30cab842a9083580 = ((u32(((u32(216) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ff5e73ee2dba757983a15b6e() {
  return __cxx_static_address_ff5e73ee2dba757983a15b6e.reference || (__cxx_static_address_ff5e73ee2dba757983a15b6e.reference = {
    __cReference: true,
    get value() { return DUKE_USEMEDKIT____header_global_30cab842a9083580; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:132
export const DUKE_TAKEPILLS____header_global_613478ea2778594e = ((u32(((u32(217) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d52acef73f51dc3b3d88541c() {
  return __cxx_static_address_d52acef73f51dc3b3d88541c.reference || (__cxx_static_address_d52acef73f51dc3b3d88541c.reference = {
    __cReference: true,
    get value() { return DUKE_TAKEPILLS____header_global_613478ea2778594e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:133
export const DUKE_PISSRELIEF____header_global_d9bd41ffc1e38834 = ((u32(((u32(218) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a5fb784e86cf7469c85102c() {
  return __cxx_static_address_8a5fb784e86cf7469c85102c.reference || (__cxx_static_address_8a5fb784e86cf7469c85102c.reference = {
    __cReference: true,
    get value() { return DUKE_PISSRELIEF____header_global_d9bd41ffc1e38834; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:134
export const SELECT_WEAPON____header_global_80e96c004d93371c = ((u32(((u32(219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5d9f231fcaedb3db7180ff44() {
  return __cxx_static_address_5d9f231fcaedb3db7180ff44.reference || (__cxx_static_address_5d9f231fcaedb3db7180ff44.reference = {
    __cReference: true,
    get value() { return SELECT_WEAPON____header_global_80e96c004d93371c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:135
export const JIBBED_ACTOR5____header_global_9980b4d9a84f6d49 = ((u32(((u32(226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00790c6bb55bb391695e3648() {
  return __cxx_static_address_00790c6bb55bb391695e3648.reference || (__cxx_static_address_00790c6bb55bb391695e3648.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR5____header_global_9980b4d9a84f6d49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:136
export const JIBBED_ACTOR6____header_global_f70a8568e32ba07a = ((u32(((u32(227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61a53126f6ec594bee4d5c65() {
  return __cxx_static_address_61a53126f6ec594bee4d5c65.reference || (__cxx_static_address_61a53126f6ec594bee4d5c65.reference = {
    __cReference: true,
    get value() { return JIBBED_ACTOR6____header_global_f70a8568e32ba07a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:137
export const DUKE_GOTHEALTHATLOW____header_global_88a31139a4a692e4 = ((u32(((u32(229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21f598ea533d829501fbf259() {
  return __cxx_static_address_21f598ea533d829501fbf259.reference || (__cxx_static_address_21f598ea533d829501fbf259.reference = {
    __cReference: true,
    get value() { return DUKE_GOTHEALTHATLOW____header_global_88a31139a4a692e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:138
export const BOSSTALKTODUKE____header_global_5889178305f7547b = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c10be5aa7ce0967caaf5149() {
  return __cxx_static_address_1c10be5aa7ce0967caaf5149.reference || (__cxx_static_address_1c10be5aa7ce0967caaf5149.reference = {
    __cReference: true,
    get value() { return BOSSTALKTODUKE____header_global_5889178305f7547b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:139
export const WAR_AMBIENCE2____header_global_f46016db9812ffcb = ((u32(((u32(232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc8c920746b4c9d4f2d5d048() {
  return __cxx_static_address_dc8c920746b4c9d4f2d5d048.reference || (__cxx_static_address_dc8c920746b4c9d4f2d5d048.reference = {
    __cReference: true,
    get value() { return WAR_AMBIENCE2____header_global_f46016db9812ffcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:140
export const EXITMENUSOUND____header_global_0cbfca2486ef4e54 = ((u32(((u32(243) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21768b5455fecd5d06cb4be1() {
  return __cxx_static_address_21768b5455fecd5d06cb4be1.reference || (__cxx_static_address_21768b5455fecd5d06cb4be1.reference = {
    __cReference: true,
    get value() { return EXITMENUSOUND____header_global_0cbfca2486ef4e54; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:141
export const FLY_BY____header_global_8013afba7d0a654d = ((u32(((u32(244) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1f08f08d76cbd7c624a523b4() {
  return __cxx_static_address_1f08f08d76cbd7c624a523b4.reference || (__cxx_static_address_1f08f08d76cbd7c624a523b4.reference = {
    __cReference: true,
    get value() { return FLY_BY____header_global_8013afba7d0a654d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:142
export const DUKE_SCREAM____header_global_699d14b223a18ba4 = ((u32(((u32(245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f05b6cabfbb8c6ab5142cbd() {
  return __cxx_static_address_0f05b6cabfbb8c6ab5142cbd.reference || (__cxx_static_address_0f05b6cabfbb8c6ab5142cbd.reference = {
    __cReference: true,
    get value() { return DUKE_SCREAM____header_global_699d14b223a18ba4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:143
export const SHRINKER_HIT____header_global_a60b243030aa52d9 = ((u32(((u32(246) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa9b70a5e3ef099b6ef49439() {
  return __cxx_static_address_fa9b70a5e3ef099b6ef49439.reference || (__cxx_static_address_fa9b70a5e3ef099b6ef49439.reference = {
    __cReference: true,
    get value() { return SHRINKER_HIT____header_global_a60b243030aa52d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:144
export const RATTY____header_global_d695b935bbc789a5 = ((u32(((u32(247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66b935b121cad2252ea7fb57() {
  return __cxx_static_address_66b935b121cad2252ea7fb57.reference || (__cxx_static_address_66b935b121cad2252ea7fb57.reference = {
    __cReference: true,
    get value() { return RATTY____header_global_d695b935bbc789a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:145
export const BONUSMUSIC____header_global_fee1c6cd581c4995 = ((u32(((u32(249) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dec13a5ebe29d4e62c0ceef5() {
  return __cxx_static_address_dec13a5ebe29d4e62c0ceef5.reference || (__cxx_static_address_dec13a5ebe29d4e62c0ceef5.reference = {
    __cReference: true,
    get value() { return BONUSMUSIC____header_global_fee1c6cd581c4995; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:146
export const DUKE_GETWEAPON6____header_global_afdb6fca51345420 = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_389edf326402becf863b4dab() {
  return __cxx_static_address_389edf326402becf863b4dab.reference || (__cxx_static_address_389edf326402becf863b4dab.reference = {
    __cReference: true,
    get value() { return DUKE_GETWEAPON6____header_global_afdb6fca51345420; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:147
export const ALIEN_SWITCH1____header_global_bb9d0c2dc6740001 = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7dc1779d9662509fb650112() {
  return __cxx_static_address_f7dc1779d9662509fb650112.reference || (__cxx_static_address_f7dc1779d9662509fb650112.reference = {
    __cReference: true,
    get value() { return ALIEN_SWITCH1____header_global_bb9d0c2dc6740001; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:148
export const RIPHEADNECK____header_global_2f0b543bc9959a52 = ((u32(((u32(284) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a0fb59132b54020f7aed8c5() {
  return __cxx_static_address_9a0fb59132b54020f7aed8c5.reference || (__cxx_static_address_9a0fb59132b54020f7aed8c5.reference = {
    __cReference: true,
    get value() { return RIPHEADNECK____header_global_2f0b543bc9959a52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:149
export const ENDSEQVOL3SND4____header_global_827495b98e2eb4ff = ((u32(((u32(288) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8003bf78d11523f1f1baffbe() {
  return __cxx_static_address_8003bf78d11523f1f1baffbe.reference || (__cxx_static_address_8003bf78d11523f1f1baffbe.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND4____header_global_827495b98e2eb4ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:150
export const ENDSEQVOL3SND5____header_global_ab62ac1239c57d8b = ((u32(((u32(289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a305238a48a0c53c56ecc886() {
  return __cxx_static_address_a305238a48a0c53c56ecc886.reference || (__cxx_static_address_a305238a48a0c53c56ecc886.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND5____header_global_ab62ac1239c57d8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:151
export const ENDSEQVOL3SND6____header_global_e4f778f5e5ef6b5b = ((u32(((u32(290) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a38bb946419a3c0498d572b2() {
  return __cxx_static_address_a38bb946419a3c0498d572b2.reference || (__cxx_static_address_a38bb946419a3c0498d572b2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND6____header_global_e4f778f5e5ef6b5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:152
export const ENDSEQVOL3SND7____header_global_a2f6284e6cbbb2de = ((u32(((u32(291) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d0018c01c94a4535540afa2() {
  return __cxx_static_address_9d0018c01c94a4535540afa2.reference || (__cxx_static_address_9d0018c01c94a4535540afa2.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND7____header_global_a2f6284e6cbbb2de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:153
export const ENDSEQVOL3SND8____header_global_bc8e93a05cb15a6b = ((u32(((u32(292) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c2efabe6dc21e7a57553c2d() {
  return __cxx_static_address_7c2efabe6dc21e7a57553c2d.reference || (__cxx_static_address_7c2efabe6dc21e7a57553c2d.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND8____header_global_bc8e93a05cb15a6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:154
export const ENDSEQVOL3SND9____header_global_1eb414854e732df3 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1771cc0e3df6247cbc0bcdb0() {
  return __cxx_static_address_1771cc0e3df6247cbc0bcdb0.reference || (__cxx_static_address_1771cc0e3df6247cbc0bcdb0.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL3SND9____header_global_1eb414854e732df3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:155
export const WHIPYOURASS____header_global_32be4876d5af304d = ((u32(((u32(294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71aa3cdd6ed887c572063821() {
  return __cxx_static_address_71aa3cdd6ed887c572063821.reference || (__cxx_static_address_71aa3cdd6ed887c572063821.reference = {
    __cReference: true,
    get value() { return WHIPYOURASS____header_global_32be4876d5af304d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:156
export const ENDSEQVOL2SND1____header_global_0a397a0685c00b73 = ((u32(((u32(295) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bafdcbadcdf4eddf1e99b80e() {
  return __cxx_static_address_bafdcbadcdf4eddf1e99b80e.reference || (__cxx_static_address_bafdcbadcdf4eddf1e99b80e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND1____header_global_0a397a0685c00b73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:157
export const ENDSEQVOL2SND2____header_global_97f750b9dae26a8a = ((u32(((u32(296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c87572afbd359b514725d43() {
  return __cxx_static_address_0c87572afbd359b514725d43.reference || (__cxx_static_address_0c87572afbd359b514725d43.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND2____header_global_97f750b9dae26a8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:158
export const ENDSEQVOL2SND3____header_global_0779c343b0281431 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5324e7d672e83d149799f9e8() {
  return __cxx_static_address_5324e7d672e83d149799f9e8.reference || (__cxx_static_address_5324e7d672e83d149799f9e8.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND3____header_global_0779c343b0281431; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:159
export const ENDSEQVOL2SND4____header_global_20f19181f74c3221 = ((u32(((u32(298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a007958b8dd9cf8ab0f7119() {
  return __cxx_static_address_7a007958b8dd9cf8ab0f7119.reference || (__cxx_static_address_7a007958b8dd9cf8ab0f7119.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND4____header_global_20f19181f74c3221; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:160
export const ENDSEQVOL2SND5____header_global_5853113657647bef = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a1bf8aad80b366c7b985470() {
  return __cxx_static_address_6a1bf8aad80b366c7b985470.reference || (__cxx_static_address_6a1bf8aad80b366c7b985470.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND5____header_global_5853113657647bef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:161
export const ENDSEQVOL2SND6____header_global_da44f451e0b3f6df = ((u32(((u32(300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_06f0ca03a78aa43e4fe739b3() {
  return __cxx_static_address_06f0ca03a78aa43e4fe739b3.reference || (__cxx_static_address_06f0ca03a78aa43e4fe739b3.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND6____header_global_da44f451e0b3f6df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:162
export const ENDSEQVOL2SND7____header_global_958828af654abc91 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a8a9a8defc6342f24d789c3e() {
  return __cxx_static_address_a8a9a8defc6342f24d789c3e.reference || (__cxx_static_address_a8a9a8defc6342f24d789c3e.reference = {
    __cReference: true,
    get value() { return ENDSEQVOL2SND7____header_global_958828af654abc91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:163
export const SOMETHINGFROZE____header_global_bd755e56db2e8b5a = ((u32(((u32(303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6987534b1bba4964bc9e0248() {
  return __cxx_static_address_6987534b1bba4964bc9e0248.reference || (__cxx_static_address_6987534b1bba4964bc9e0248.reference = {
    __cReference: true,
    get value() { return SOMETHINGFROZE____header_global_bd755e56db2e8b5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:164
export const WIND_REPEAT____header_global_4a2e3ad0dcfa20f3 = ((u32(((u32(308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6be82d0f419063385ee8de8e() {
  return __cxx_static_address_6be82d0f419063385ee8de8e.reference || (__cxx_static_address_6be82d0f419063385ee8de8e.reference = {
    __cReference: true,
    get value() { return WIND_REPEAT____header_global_4a2e3ad0dcfa20f3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:165
export const BOS4_RECOG____header_global_e608a200b19ca107 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba76d412e63e25d0ced19c9c() {
  return __cxx_static_address_ba76d412e63e25d0ced19c9c.reference || (__cxx_static_address_ba76d412e63e25d0ced19c9c.reference = {
    __cReference: true,
    get value() { return BOS4_RECOG____header_global_e608a200b19ca107; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:166
export const LIGHTNING_SLAP____header_global_7475340ee2207a17 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb3bf1d007011babcebc91e8() {
  return __cxx_static_address_eb3bf1d007011babcebc91e8.reference || (__cxx_static_address_eb3bf1d007011babcebc91e8.reference = {
    __cReference: true,
    get value() { return LIGHTNING_SLAP____header_global_7475340ee2207a17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:167
export const THUNDER____header_global_447c0246d631f40d = ((u32(((u32(352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b64e623492f3cdf403fbfcf() {
  return __cxx_static_address_8b64e623492f3cdf403fbfcf.reference || (__cxx_static_address_8b64e623492f3cdf403fbfcf.reference = {
    __cReference: true,
    get value() { return THUNDER____header_global_447c0246d631f40d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:168
export const INTRO4_1____header_global_7377f04d1912f293 = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1ce45a895b8cd896b46d039() {
  return __cxx_static_address_a1ce45a895b8cd896b46d039.reference || (__cxx_static_address_a1ce45a895b8cd896b46d039.reference = {
    __cReference: true,
    get value() { return INTRO4_1____header_global_7377f04d1912f293; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:169
export const INTRO4_2____header_global_fa516fa1a25fc401 = ((u32(((u32(364) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b3b9d77d0dc34a9a9b5daf61() {
  return __cxx_static_address_b3b9d77d0dc34a9a9b5daf61.reference || (__cxx_static_address_b3b9d77d0dc34a9a9b5daf61.reference = {
    __cReference: true,
    get value() { return INTRO4_2____header_global_fa516fa1a25fc401; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:170
export const INTRO4_3____header_global_b56d2c296ba608c7 = ((u32(((u32(365) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30c8fbe017e6f7a458b2f4d7() {
  return __cxx_static_address_30c8fbe017e6f7a458b2f4d7.reference || (__cxx_static_address_30c8fbe017e6f7a458b2f4d7.reference = {
    __cReference: true,
    get value() { return INTRO4_3____header_global_b56d2c296ba608c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:171
export const INTRO4_4____header_global_ceb93a3d76ab4863 = ((u32(((u32(366) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5286131ce12cebc82a19d35() {
  return __cxx_static_address_d5286131ce12cebc82a19d35.reference || (__cxx_static_address_d5286131ce12cebc82a19d35.reference = {
    __cReference: true,
    get value() { return INTRO4_4____header_global_ceb93a3d76ab4863; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:172
export const INTRO4_5____header_global_2c1216bc2fee95b3 = ((u32(((u32(367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_904ce4c650fa223a4a4568fb() {
  return __cxx_static_address_904ce4c650fa223a4a4568fb.reference || (__cxx_static_address_904ce4c650fa223a4a4568fb.reference = {
    __cReference: true,
    get value() { return INTRO4_5____header_global_2c1216bc2fee95b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:173
export const INTRO4_6____header_global_bc5c42034d02a40a = ((u32(((u32(368) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b9e41d85135c770d2f8b389() {
  return __cxx_static_address_8b9e41d85135c770d2f8b389.reference || (__cxx_static_address_8b9e41d85135c770d2f8b389.reference = {
    __cReference: true,
    get value() { return INTRO4_6____header_global_bc5c42034d02a40a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:174
export const BOSS4_DEADSPEECH____header_global_cc36911ec9e3bd23 = ((u32(((u32(370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd4a70ba49cf75241c02603c() {
  return __cxx_static_address_cd4a70ba49cf75241c02603c.reference || (__cxx_static_address_cd4a70ba49cf75241c02603c.reference = {
    __cReference: true,
    get value() { return BOSS4_DEADSPEECH____header_global_cc36911ec9e3bd23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:175
export const BOSS4_FIRSTSEE____header_global_8999a6c1e87e2c7c = ((u32(((u32(371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_431a5a6ea43c0e30b335d72f() {
  return __cxx_static_address_431a5a6ea43c0e30b335d72f.reference || (__cxx_static_address_431a5a6ea43c0e30b335d72f.reference = {
    __cReference: true,
    get value() { return BOSS4_FIRSTSEE____header_global_8999a6c1e87e2c7c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:176
export const VOL4ENDSND1____header_global_1f2c05cb268835d8 = ((u32(((u32(384) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbdbed691127fa2df57772a4() {
  return __cxx_static_address_fbdbed691127fa2df57772a4.reference || (__cxx_static_address_fbdbed691127fa2df57772a4.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND1____header_global_1f2c05cb268835d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:177
export const VOL4ENDSND2____header_global_b07146377c184c52 = ((u32(((u32(385) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c6f25f5b1392a8687fc07fbd() {
  return __cxx_static_address_c6f25f5b1392a8687fc07fbd.reference || (__cxx_static_address_c6f25f5b1392a8687fc07fbd.reference = {
    __cReference: true,
    get value() { return VOL4ENDSND2____header_global_b07146377c184c52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:178
export const EXPANDERSHOOT____header_global_388d9dfe4b0ec5c9 = ((u32(((u32(388) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_890310536f5130f1ee21de77() {
  return __cxx_static_address_890310536f5130f1ee21de77.reference || (__cxx_static_address_890310536f5130f1ee21de77.reference = {
    __cReference: true,
    get value() { return EXPANDERSHOOT____header_global_388d9dfe4b0ec5c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:179
export const INTRO4_B____header_global_f1bdecb6005156de = ((u32(((u32(392) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5802ccf97facd91aa8ce34b() {
  return __cxx_static_address_a5802ccf97facd91aa8ce34b.reference || (__cxx_static_address_a5802ccf97facd91aa8ce34b.reference = {
    __cReference: true,
    get value() { return INTRO4_B____header_global_f1bdecb6005156de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:180
export const BIGBANG____header_global_a969704a8a5a0e28 = ((u32(((u32(393) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad91806c93aec1d83197694e() {
  return __cxx_static_address_ad91806c93aec1d83197694e.reference || (__cxx_static_address_ad91806c93aec1d83197694e.reference = {
    __cReference: true,
    get value() { return BIGBANG____header_global_a969704a8a5a0e28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:181
export const FLAMETHROWER_INTRO____header_global_de72db3646cfd871 = ((u32(((u32(398) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec5707ea1ee956e7a62c7f0b() {
  return __cxx_static_address_ec5707ea1ee956e7a62c7f0b.reference || (__cxx_static_address_ec5707ea1ee956e7a62c7f0b.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_INTRO____header_global_de72db3646cfd871; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:182
export const FLAMETHROWER_LOOP____header_global_7c0fa87a515a644b = ((u32(((u32(399) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_39f20468c0b9084741102142() {
  return __cxx_static_address_39f20468c0b9084741102142.reference || (__cxx_static_address_39f20468c0b9084741102142.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_LOOP____header_global_7c0fa87a515a644b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:183
export const FLAMETHROWER_END____header_global_8aef80fe042f90d5 = ((u32(((u32(400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2bddc263ef752d86e77cb59() {
  return __cxx_static_address_d2bddc263ef752d86e77cb59.reference || (__cxx_static_address_d2bddc263ef752d86e77cb59.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER_END____header_global_8aef80fe042f90d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:184
export const E5L7_DUKE_QUIT_YOU____header_global_3e3ccc5ede5ada06 = ((u32(((u32(401) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50f4cda6fa42a1462ab2c385() {
  return __cxx_static_address_50f4cda6fa42a1462ab2c385.reference || (__cxx_static_address_50f4cda6fa42a1462ab2c385.reference = {
    __cReference: true,
    get value() { return E5L7_DUKE_QUIT_YOU____header_global_3e3ccc5ede5ada06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_b14f39f906fcc049 = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3a02b1462238cb769beab6cd() {
  return __cxx_static_address_3a02b1462238cb769beab6cd.reference || (__cxx_static_address_3a02b1462238cb769beab6cd.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_b14f39f906fcc049; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:188
export const ACTIVATOR____header_global_f3cef1fdfaa72b43 = ((u32(((u32(2) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a818f5000a7ba501d25e333() {
  return __cxx_static_address_5a818f5000a7ba501d25e333.reference || (__cxx_static_address_5a818f5000a7ba501d25e333.reference = {
    __cReference: true,
    get value() { return ACTIVATOR____header_global_f3cef1fdfaa72b43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:189
export const TOUCHPLATE____header_global_3ee062c8dc9e6a52 = ((u32(((u32(3) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af189bf21c023b991f4bfe25() {
  return __cxx_static_address_af189bf21c023b991f4bfe25.reference || (__cxx_static_address_af189bf21c023b991f4bfe25.reference = {
    __cReference: true,
    get value() { return TOUCHPLATE____header_global_3ee062c8dc9e6a52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:190
export const ACTIVATORLOCKED____header_global_7dc3cc5777f6c93d = ((u32(((u32(4) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de7480d9b45fce70de5fe183() {
  return __cxx_static_address_de7480d9b45fce70de5fe183.reference || (__cxx_static_address_de7480d9b45fce70de5fe183.reference = {
    __cReference: true,
    get value() { return ACTIVATORLOCKED____header_global_7dc3cc5777f6c93d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:191
export const MUSICANDSFX____header_global_04059d455b409b07 = ((u32(((u32(5) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_850c81b47d0ea57b07e7d261() {
  return __cxx_static_address_850c81b47d0ea57b07e7d261.reference || (__cxx_static_address_850c81b47d0ea57b07e7d261.reference = {
    __cReference: true,
    get value() { return MUSICANDSFX____header_global_04059d455b409b07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:192
export const LOCATORS____header_global_3ea7f48aeb13128a = ((u32(((u32(6) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e5654e5381cbfdd0ca54a03b() {
  return __cxx_static_address_e5654e5381cbfdd0ca54a03b.reference || (__cxx_static_address_e5654e5381cbfdd0ca54a03b.reference = {
    __cReference: true,
    get value() { return LOCATORS____header_global_3ea7f48aeb13128a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:193
export const CYCLER____header_global_76bfcdca90cc3938 = ((u32(((u32(7) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0192f7a99627a7792ae5580a() {
  return __cxx_static_address_0192f7a99627a7792ae5580a.reference || (__cxx_static_address_0192f7a99627a7792ae5580a.reference = {
    __cReference: true,
    get value() { return CYCLER____header_global_76bfcdca90cc3938; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:194
export const MASTERSWITCH____header_global_e36448de172a9ae1 = ((u32(((u32(8) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_004a73a45348c1d93a940be5() {
  return __cxx_static_address_004a73a45348c1d93a940be5.reference || (__cxx_static_address_004a73a45348c1d93a940be5.reference = {
    __cReference: true,
    get value() { return MASTERSWITCH____header_global_e36448de172a9ae1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:195
export const RESPAWN____header_global_8f9f6f6241abf051 = ((u32(((u32(9) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_280f8c5ee24034b13f37100e() {
  return __cxx_static_address_280f8c5ee24034b13f37100e.reference || (__cxx_static_address_280f8c5ee24034b13f37100e.reference = {
    __cReference: true,
    get value() { return RESPAWN____header_global_8f9f6f6241abf051; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:196
export const GPSPEED____header_global_2d89adfdf23fc15f = ((u32(((u32(10) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3829142ab8390e434d3a5cf7() {
  return __cxx_static_address_3829142ab8390e434d3a5cf7.reference || (__cxx_static_address_3829142ab8390e434d3a5cf7.reference = {
    __cReference: true,
    get value() { return GPSPEED____header_global_2d89adfdf23fc15f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:197
export const FOF____header_global_c4a49a7757699b93 = ((u32(((u32(13) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec92bd4580bdb0ea559d3871() {
  return __cxx_static_address_ec92bd4580bdb0ea559d3871.reference || (__cxx_static_address_ec92bd4580bdb0ea559d3871.reference = {
    __cReference: true,
    get value() { return FOF____header_global_c4a49a7757699b93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:198
export const ARROW____header_global_c17418e34ded349d = ((u32(((u32(20) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98412e9ab1da2397d4e8e36d() {
  return __cxx_static_address_98412e9ab1da2397d4e8e36d.reference || (__cxx_static_address_98412e9ab1da2397d4e8e36d.reference = {
    __cReference: true,
    get value() { return ARROW____header_global_c17418e34ded349d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:199
export const FIRSTGUNSPRITE____header_global_b012a1ccd8a917d0 = ((u32(((u32(21) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d2f53301c7ca2413f2f91f0() {
  return __cxx_static_address_1d2f53301c7ca2413f2f91f0.reference || (__cxx_static_address_1d2f53301c7ca2413f2f91f0.reference = {
    __cReference: true,
    get value() { return FIRSTGUNSPRITE____header_global_b012a1ccd8a917d0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:200
export const CHAINGUNSPRITE____header_global_d440fe8b591f60cf = ((u32(((u32(22) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21336b33bc6563a44b6688b7() {
  return __cxx_static_address_21336b33bc6563a44b6688b7.reference || (__cxx_static_address_21336b33bc6563a44b6688b7.reference = {
    __cReference: true,
    get value() { return CHAINGUNSPRITE____header_global_d440fe8b591f60cf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:201
export const RPGSPRITE____header_global_d22867c8694b07a5 = ((u32(((u32(23) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01202e745b703197d1d494d7() {
  return __cxx_static_address_01202e745b703197d1d494d7.reference || (__cxx_static_address_01202e745b703197d1d494d7.reference = {
    __cReference: true,
    get value() { return RPGSPRITE____header_global_d22867c8694b07a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:202
export const FREEZESPRITE____header_global_162b626225436e1c = ((u32(((u32(24) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4dfc3dac8663d65330497ce9() {
  return __cxx_static_address_4dfc3dac8663d65330497ce9.reference || (__cxx_static_address_4dfc3dac8663d65330497ce9.reference = {
    __cReference: true,
    get value() { return FREEZESPRITE____header_global_162b626225436e1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:203
export const SHRINKERSPRITE____header_global_1b5f96d9364fd125 = ((u32(((u32(25) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbb36d5231aa071773065a75() {
  return __cxx_static_address_fbb36d5231aa071773065a75.reference || (__cxx_static_address_fbb36d5231aa071773065a75.reference = {
    __cReference: true,
    get value() { return SHRINKERSPRITE____header_global_1b5f96d9364fd125; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:204
export const HEAVYHBOMB____header_global_40999192afaed5d6 = ((u32(((u32(26) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_539e88731c0d5884c923f321() {
  return __cxx_static_address_539e88731c0d5884c923f321.reference || (__cxx_static_address_539e88731c0d5884c923f321.reference = {
    __cReference: true,
    get value() { return HEAVYHBOMB____header_global_40999192afaed5d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:205
export const TRIPBOMBSPRITE____header_global_18ed542c465a27ff = ((u32(((u32(27) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e6050530c48416ef242cb90() {
  return __cxx_static_address_0e6050530c48416ef242cb90.reference || (__cxx_static_address_0e6050530c48416ef242cb90.reference = {
    __cReference: true,
    get value() { return TRIPBOMBSPRITE____header_global_18ed542c465a27ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:206
export const SHOTGUNSPRITE____header_global_49b00b9bc5acf1dc = ((u32(((u32(28) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53a26fbd5980163b5b721ccc() {
  return __cxx_static_address_53a26fbd5980163b5b721ccc.reference || (__cxx_static_address_53a26fbd5980163b5b721ccc.reference = {
    __cReference: true,
    get value() { return SHOTGUNSPRITE____header_global_49b00b9bc5acf1dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:207
export const DEVISTATORSPRITE____header_global_9d1a54af8569ff6e = ((u32(((u32(29) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07825c08015224c6ded931b9() {
  return __cxx_static_address_07825c08015224c6ded931b9.reference || (__cxx_static_address_07825c08015224c6ded931b9.reference = {
    __cReference: true,
    get value() { return DEVISTATORSPRITE____header_global_9d1a54af8569ff6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:208
export const HEALTHBOX____header_global_c181150ce131ed3b = ((u32(((u32(30) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7265db368963e2b42089bbfa() {
  return __cxx_static_address_7265db368963e2b42089bbfa.reference || (__cxx_static_address_7265db368963e2b42089bbfa.reference = {
    __cReference: true,
    get value() { return HEALTHBOX____header_global_c181150ce131ed3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:209
export const AMMOBOX____header_global_5abb9e4eadecfe9b = ((u32(((u32(31) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_013f8ab627e64f7eb716d390() {
  return __cxx_static_address_013f8ab627e64f7eb716d390.reference || (__cxx_static_address_013f8ab627e64f7eb716d390.reference = {
    __cReference: true,
    get value() { return AMMOBOX____header_global_5abb9e4eadecfe9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:210
export const GROWSPRITEICON____header_global_d80132e9afa70d8a = ((u32(((u32(32) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71ad76bee47ab25f3fac2c87() {
  return __cxx_static_address_71ad76bee47ab25f3fac2c87.reference || (__cxx_static_address_71ad76bee47ab25f3fac2c87.reference = {
    __cReference: true,
    get value() { return GROWSPRITEICON____header_global_d80132e9afa70d8a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:211
export const INVENTORYBOX____header_global_6790dbc467292a7a = ((u32(((u32(33) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ae99b1c78e4c0ea1f03e91e() {
  return __cxx_static_address_3ae99b1c78e4c0ea1f03e91e.reference || (__cxx_static_address_3ae99b1c78e4c0ea1f03e91e.reference = {
    __cReference: true,
    get value() { return INVENTORYBOX____header_global_6790dbc467292a7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:212
export const FREEZEAMMO____header_global_8e94efac6b45f71f = ((u32(((u32(37) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_819b33c443fbd9f07166132f() {
  return __cxx_static_address_819b33c443fbd9f07166132f.reference || (__cxx_static_address_819b33c443fbd9f07166132f.reference = {
    __cReference: true,
    get value() { return FREEZEAMMO____header_global_8e94efac6b45f71f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:213
export const AMMO____header_global_4d462e26daaad740 = ((u32(((u32(40) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5827a768acbe7dbaa6d7d5e9() {
  return __cxx_static_address_5827a768acbe7dbaa6d7d5e9.reference || (__cxx_static_address_5827a768acbe7dbaa6d7d5e9.reference = {
    __cReference: true,
    get value() { return AMMO____header_global_4d462e26daaad740; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:214
export const BATTERYAMMO____header_global_cf31a1ba280c704e = ((u32(((u32(41) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_452e8b64b640f32f036459bb() {
  return __cxx_static_address_452e8b64b640f32f036459bb.reference || (__cxx_static_address_452e8b64b640f32f036459bb.reference = {
    __cReference: true,
    get value() { return BATTERYAMMO____header_global_cf31a1ba280c704e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:215
export const DEVISTATORAMMO____header_global_3df640490ac7d2a0 = ((u32(((u32(42) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_14d6f5e3f85da1c8fbdf6187() {
  return __cxx_static_address_14d6f5e3f85da1c8fbdf6187.reference || (__cxx_static_address_14d6f5e3f85da1c8fbdf6187.reference = {
    __cReference: true,
    get value() { return DEVISTATORAMMO____header_global_3df640490ac7d2a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:216
export const RPGAMMO____header_global_bb65f0061b850300 = ((u32(((u32(44) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c863ca194dd040a4c63964cf() {
  return __cxx_static_address_c863ca194dd040a4c63964cf.reference || (__cxx_static_address_c863ca194dd040a4c63964cf.reference = {
    __cReference: true,
    get value() { return RPGAMMO____header_global_bb65f0061b850300; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:217
export const GROWAMMO____header_global_14fe010d17d81a47 = ((u32(((u32(45) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e280aebdb114e046a2c9b62b() {
  return __cxx_static_address_e280aebdb114e046a2c9b62b.reference || (__cxx_static_address_e280aebdb114e046a2c9b62b.reference = {
    __cReference: true,
    get value() { return GROWAMMO____header_global_14fe010d17d81a47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_cde2c05fab2dee4b = ((u32(((u32(46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbcc7ef7283e3284d26c0858() {
  return __cxx_static_address_dbcc7ef7283e3284d26c0858.reference || (__cxx_static_address_dbcc7ef7283e3284d26c0858.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_cde2c05fab2dee4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:219
export const HBOMBAMMO____header_global_8811f40e036c43ef = ((u32(((u32(47) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f506659f4c0776621f46135c() {
  return __cxx_static_address_f506659f4c0776621f46135c.reference || (__cxx_static_address_f506659f4c0776621f46135c.reference = {
    __cReference: true,
    get value() { return HBOMBAMMO____header_global_8811f40e036c43ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:220
export const AMMOLOTS____header_global_ac86ffdb9549083e = ((u32(((u32(48) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e0b266ed08b58f93d319a68e() {
  return __cxx_static_address_e0b266ed08b58f93d319a68e.reference || (__cxx_static_address_e0b266ed08b58f93d319a68e.reference = {
    __cReference: true,
    get value() { return AMMOLOTS____header_global_ac86ffdb9549083e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:221
export const SHOTGUNAMMO____header_global_4c23b9c21a2940d2 = ((u32(((u32(49) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e1e8ec21e4b5caaeb5f5466() {
  return __cxx_static_address_9e1e8ec21e4b5caaeb5f5466.reference || (__cxx_static_address_9e1e8ec21e4b5caaeb5f5466.reference = {
    __cReference: true,
    get value() { return SHOTGUNAMMO____header_global_4c23b9c21a2940d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:222
export const COLA____header_global_00a6801c9deb1c96 = ((u32(((u32(51) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_87a4b1b7c06a87e3e7b3bc74() {
  return __cxx_static_address_87a4b1b7c06a87e3e7b3bc74.reference || (__cxx_static_address_87a4b1b7c06a87e3e7b3bc74.reference = {
    __cReference: true,
    get value() { return COLA____header_global_00a6801c9deb1c96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:223
export const SIXPAK____header_global_f0a7293e7fe5f710 = ((u32(((u32(52) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55c4fa9076d9266e7aabaef8() {
  return __cxx_static_address_55c4fa9076d9266e7aabaef8.reference || (__cxx_static_address_55c4fa9076d9266e7aabaef8.reference = {
    __cReference: true,
    get value() { return SIXPAK____header_global_f0a7293e7fe5f710; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:224
export const FIRSTAID____header_global_d77468810d0945e6 = ((u32(((u32(53) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d601641aef13ba6ceddf7fda() {
  return __cxx_static_address_d601641aef13ba6ceddf7fda.reference || (__cxx_static_address_d601641aef13ba6ceddf7fda.reference = {
    __cReference: true,
    get value() { return FIRSTAID____header_global_d77468810d0945e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:225
export const SHIELD____header_global_7c51d9f0fab4df4d = ((u32(((u32(54) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_baf9db0d46840cf6d1a2375e() {
  return __cxx_static_address_baf9db0d46840cf6d1a2375e.reference || (__cxx_static_address_baf9db0d46840cf6d1a2375e.reference = {
    __cReference: true,
    get value() { return SHIELD____header_global_7c51d9f0fab4df4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:226
export const STEROIDS____header_global_dfd4281b476ed446 = ((u32(((u32(55) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aeeaffcf4cdde2bf652d080b() {
  return __cxx_static_address_aeeaffcf4cdde2bf652d080b.reference || (__cxx_static_address_aeeaffcf4cdde2bf652d080b.reference = {
    __cReference: true,
    get value() { return STEROIDS____header_global_dfd4281b476ed446; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:227
export const AIRTANK____header_global_07c2c6da3da45d4b = ((u32(((u32(56) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_caf017411cdf2923572b9d40() {
  return __cxx_static_address_caf017411cdf2923572b9d40.reference || (__cxx_static_address_caf017411cdf2923572b9d40.reference = {
    __cReference: true,
    get value() { return AIRTANK____header_global_07c2c6da3da45d4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:228
export const JETPACK____header_global_c774a475cc58d373 = ((u32(((u32(57) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d32aeba4f916d85b34b74e02() {
  return __cxx_static_address_d32aeba4f916d85b34b74e02.reference || (__cxx_static_address_d32aeba4f916d85b34b74e02.reference = {
    __cReference: true,
    get value() { return JETPACK____header_global_c774a475cc58d373; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:229
export const HEATSENSOR____header_global_4fa73860d3bbe4b4 = ((u32(((u32(59) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b52e4573cadc402a0aab1c3() {
  return __cxx_static_address_4b52e4573cadc402a0aab1c3.reference || (__cxx_static_address_4b52e4573cadc402a0aab1c3.reference = {
    __cReference: true,
    get value() { return HEATSENSOR____header_global_4fa73860d3bbe4b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:230
export const ACCESSCARD____header_global_09d014a0138930b8 = ((u32(((u32(60) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbe3985ae42424f13d18598a() {
  return __cxx_static_address_dbe3985ae42424f13d18598a.reference || (__cxx_static_address_dbe3985ae42424f13d18598a.reference = {
    __cReference: true,
    get value() { return ACCESSCARD____header_global_09d014a0138930b8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:231
export const BOOTS____header_global_cb6092adace3b4ff = ((u32(((u32(61) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_433c6ccb60fc6c48ee2367ef() {
  return __cxx_static_address_433c6ccb60fc6c48ee2367ef.reference || (__cxx_static_address_433c6ccb60fc6c48ee2367ef.reference = {
    __cReference: true,
    get value() { return BOOTS____header_global_cb6092adace3b4ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:232
export const MIRRORBROKE____header_global_254afd73bf862d52 = ((u32(((u32(70) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_520d601ce902d84909d7d1f9() {
  return __cxx_static_address_520d601ce902d84909d7d1f9.reference || (__cxx_static_address_520d601ce902d84909d7d1f9.reference = {
    __cReference: true,
    get value() { return MIRRORBROKE____header_global_254afd73bf862d52; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:233
export const CLOUDYOCEAN____header_global_c50326d2bb5acc0e = ((u32(((u32(78) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb34372eefb9a85f219191ac() {
  return __cxx_static_address_cb34372eefb9a85f219191ac.reference || (__cxx_static_address_cb34372eefb9a85f219191ac.reference = {
    __cReference: true,
    get value() { return CLOUDYOCEAN____header_global_c50326d2bb5acc0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:234
export const CLOUDYSKIES____header_global_99c1f9618d595eb9 = ((u32(((u32(79) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_569520bfdc4c4fe8652764df() {
  return __cxx_static_address_569520bfdc4c4fe8652764df.reference || (__cxx_static_address_569520bfdc4c4fe8652764df.reference = {
    __cReference: true,
    get value() { return CLOUDYSKIES____header_global_99c1f9618d595eb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:235
export const MOONSKY1____header_global_691973156f852b9b = ((u32(((u32(80) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6cc5c005a837440ff94aac58() {
  return __cxx_static_address_6cc5c005a837440ff94aac58.reference || (__cxx_static_address_6cc5c005a837440ff94aac58.reference = {
    __cReference: true,
    get value() { return MOONSKY1____header_global_691973156f852b9b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:236
export const BIGORBIT1____header_global_e35cf2cfea365838 = ((u32(((u32(84) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1636f8292d2874ac215f6927() {
  return __cxx_static_address_1636f8292d2874ac215f6927.reference || (__cxx_static_address_1636f8292d2874ac215f6927.reference = {
    __cReference: true,
    get value() { return BIGORBIT1____header_global_e35cf2cfea365838; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:237
export const LA____header_global_a52ba2a3f2c63fde = ((u32(((u32(89) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_068853130d102ba540b5067e() {
  return __cxx_static_address_068853130d102ba540b5067e.reference || (__cxx_static_address_068853130d102ba540b5067e.reference = {
    __cReference: true,
    get value() { return LA____header_global_a52ba2a3f2c63fde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_ed6d0f3b13cba314 = ((u32(((u32(100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b845c878112d7b07e9115c38() {
  return __cxx_static_address_b845c878112d7b07e9115c38.reference || (__cxx_static_address_b845c878112d7b07e9115c38.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_ed6d0f3b13cba314; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:239
export const TECHLIGHT2____header_global_361b8a4312c64ac1 = ((u32(((u32(120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e0109f4f5b191cac6305b55() {
  return __cxx_static_address_2e0109f4f5b191cac6305b55.reference || (__cxx_static_address_2e0109f4f5b191cac6305b55.reference = {
    __cReference: true,
    get value() { return TECHLIGHT2____header_global_361b8a4312c64ac1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:240
export const TECHLIGHTBUST2____header_global_5dc373b8a3474fe9 = ((u32(((u32(121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04c7552799e316880fb78147() {
  return __cxx_static_address_04c7552799e316880fb78147.reference || (__cxx_static_address_04c7552799e316880fb78147.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST2____header_global_5dc373b8a3474fe9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:241
export const TECHLIGHT4____header_global_f0c38375eeaecf58 = ((u32(((u32(122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51a997b9bfaf34262e06adf0() {
  return __cxx_static_address_51a997b9bfaf34262e06adf0.reference || (__cxx_static_address_51a997b9bfaf34262e06adf0.reference = {
    __cReference: true,
    get value() { return TECHLIGHT4____header_global_f0c38375eeaecf58; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:242
export const TECHLIGHTBUST4____header_global_50358fa8f7f59bce = ((u32(((u32(123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_198616e99b7b37b90a5e4513() {
  return __cxx_static_address_198616e99b7b37b90a5e4513.reference || (__cxx_static_address_198616e99b7b37b90a5e4513.reference = {
    __cReference: true,
    get value() { return TECHLIGHTBUST4____header_global_50358fa8f7f59bce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:243
export const WALLLIGHT4____header_global_4c52da54f3f91f29 = ((u32(((u32(124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a73ebef9521bb69d28e19b97() {
  return __cxx_static_address_a73ebef9521bb69d28e19b97.reference || (__cxx_static_address_a73ebef9521bb69d28e19b97.reference = {
    __cReference: true,
    get value() { return WALLLIGHT4____header_global_4c52da54f3f91f29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:244
export const WALLLIGHTBUST4____header_global_d821a65088937f2a = ((u32(((u32(125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b74c0dd9cd5251a70fe22b0() {
  return __cxx_static_address_5b74c0dd9cd5251a70fe22b0.reference || (__cxx_static_address_5b74c0dd9cd5251a70fe22b0.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST4____header_global_d821a65088937f2a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:245
export const ACCESSSWITCH____header_global_a9080e63faa3c6e0 = ((u32(((u32(130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54971229246c522fc5d0bc69() {
  return __cxx_static_address_54971229246c522fc5d0bc69.reference || (__cxx_static_address_54971229246c522fc5d0bc69.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH____header_global_a9080e63faa3c6e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:246
export const SLOTDOOR____header_global_d8875138fbef5327 = ((u32(((u32(132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd143205a066341b6a0956b5() {
  return __cxx_static_address_cd143205a066341b6a0956b5.reference || (__cxx_static_address_cd143205a066341b6a0956b5.reference = {
    __cReference: true,
    get value() { return SLOTDOOR____header_global_d8875138fbef5327; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:247
export const LIGHTSWITCH____header_global_0ea7896325b1d713 = ((u32(((u32(134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c420ef140a4469c29c9640ae() {
  return __cxx_static_address_c420ef140a4469c29c9640ae.reference || (__cxx_static_address_c420ef140a4469c29c9640ae.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH____header_global_0ea7896325b1d713; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:248
export const SPACEDOORSWITCH____header_global_9f2b327445b5e54c = ((u32(((u32(136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8539d5a9429f5795715714ad() {
  return __cxx_static_address_8539d5a9429f5795715714ad.reference || (__cxx_static_address_8539d5a9429f5795715714ad.reference = {
    __cReference: true,
    get value() { return SPACEDOORSWITCH____header_global_9f2b327445b5e54c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:249
export const SPACELIGHTSWITCH____header_global_3cc36e8e0310da45 = ((u32(((u32(138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6642596da30bfcdd5d9f869f() {
  return __cxx_static_address_6642596da30bfcdd5d9f869f.reference || (__cxx_static_address_6642596da30bfcdd5d9f869f.reference = {
    __cReference: true,
    get value() { return SPACELIGHTSWITCH____header_global_3cc36e8e0310da45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:250
export const FRANKENSTINESWITCH____header_global_aa6c29123258a808 = ((u32(((u32(140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b027f1562e358de2fe3088d() {
  return __cxx_static_address_5b027f1562e358de2fe3088d.reference || (__cxx_static_address_5b027f1562e358de2fe3088d.reference = {
    __cReference: true,
    get value() { return FRANKENSTINESWITCH____header_global_aa6c29123258a808; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:251
export const NUKEBUTTON____header_global_adfa46517979ba6d = ((u32(((u32(142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13b0a470aac40df4c639c420() {
  return __cxx_static_address_13b0a470aac40df4c639c420.reference || (__cxx_static_address_13b0a470aac40df4c639c420.reference = {
    __cReference: true,
    get value() { return NUKEBUTTON____header_global_adfa46517979ba6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:252
export const MULTISWITCH____header_global_a00570a920d84191 = ((u32(((u32(146) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ddfd089b8b8c88307f338e8() {
  return __cxx_static_address_9ddfd089b8b8c88307f338e8.reference || (__cxx_static_address_9ddfd089b8b8c88307f338e8.reference = {
    __cReference: true,
    get value() { return MULTISWITCH____header_global_a00570a920d84191; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:253
export const DOORTILE5____header_global_e8e6e41e8a4dc51f = ((u32(((u32(150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64d4e0475998008007309fc6() {
  return __cxx_static_address_64d4e0475998008007309fc6.reference || (__cxx_static_address_64d4e0475998008007309fc6.reference = {
    __cReference: true,
    get value() { return DOORTILE5____header_global_e8e6e41e8a4dc51f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:254
export const DOORTILE6____header_global_e1f2ce649b30ded2 = ((u32(((u32(151) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a79920165c1f32fd5174955a() {
  return __cxx_static_address_a79920165c1f32fd5174955a.reference || (__cxx_static_address_a79920165c1f32fd5174955a.reference = {
    __cReference: true,
    get value() { return DOORTILE6____header_global_e1f2ce649b30ded2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:255
export const DOORTILE1____header_global_8ece49f41eec9d04 = ((u32(((u32(152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d0d3bed5b32b03629f37209() {
  return __cxx_static_address_1d0d3bed5b32b03629f37209.reference || (__cxx_static_address_1d0d3bed5b32b03629f37209.reference = {
    __cReference: true,
    get value() { return DOORTILE1____header_global_8ece49f41eec9d04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:256
export const DOORTILE2____header_global_f2e3cc127bf57fec = ((u32(((u32(153) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca424f3784f9631e5b038b47() {
  return __cxx_static_address_ca424f3784f9631e5b038b47.reference || (__cxx_static_address_ca424f3784f9631e5b038b47.reference = {
    __cReference: true,
    get value() { return DOORTILE2____header_global_f2e3cc127bf57fec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:257
export const DOORTILE3____header_global_dc44ecfe41c59d93 = ((u32(((u32(154) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a5ccae3fd5ee0e402401dd4() {
  return __cxx_static_address_0a5ccae3fd5ee0e402401dd4.reference || (__cxx_static_address_0a5ccae3fd5ee0e402401dd4.reference = {
    __cReference: true,
    get value() { return DOORTILE3____header_global_dc44ecfe41c59d93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:258
export const DOORTILE4____header_global_5e8f1f28158e9d29 = ((u32(((u32(155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a324fcb5ad977e9b767b0a9b() {
  return __cxx_static_address_a324fcb5ad977e9b767b0a9b.reference || (__cxx_static_address_a324fcb5ad977e9b767b0a9b.reference = {
    __cReference: true,
    get value() { return DOORTILE4____header_global_5e8f1f28158e9d29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:259
export const DOORTILE7____header_global_33d56f04e7d8c269 = ((u32(((u32(156) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d0e67164c7d0f023d7041a8() {
  return __cxx_static_address_9d0e67164c7d0f023d7041a8.reference || (__cxx_static_address_9d0e67164c7d0f023d7041a8.reference = {
    __cReference: true,
    get value() { return DOORTILE7____header_global_33d56f04e7d8c269; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:260
export const DOORTILE8____header_global_271591abbb542650 = ((u32(((u32(157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3cf0376732746516ce78b4e9() {
  return __cxx_static_address_3cf0376732746516ce78b4e9.reference || (__cxx_static_address_3cf0376732746516ce78b4e9.reference = {
    __cReference: true,
    get value() { return DOORTILE8____header_global_271591abbb542650; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:261
export const DOORTILE9____header_global_02e63fe9c0e2f47a = ((u32(((u32(158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63838eaec621b9c3fafd5743() {
  return __cxx_static_address_63838eaec621b9c3fafd5743.reference || (__cxx_static_address_63838eaec621b9c3fafd5743.reference = {
    __cReference: true,
    get value() { return DOORTILE9____header_global_02e63fe9c0e2f47a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:262
export const DOORTILE10____header_global_54edf8c17087858e = ((u32(((u32(159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df25f339b96219c6615dd3af() {
  return __cxx_static_address_df25f339b96219c6615dd3af.reference || (__cxx_static_address_df25f339b96219c6615dd3af.reference = {
    __cReference: true,
    get value() { return DOORTILE10____header_global_54edf8c17087858e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:263
export const DOORSHOCK____header_global_8dafab4b9d4475ab = ((u32(((u32(160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c0fc6fd1941ac7b19096f76() {
  return __cxx_static_address_5c0fc6fd1941ac7b19096f76.reference || (__cxx_static_address_5c0fc6fd1941ac7b19096f76.reference = {
    __cReference: true,
    get value() { return DOORSHOCK____header_global_8dafab4b9d4475ab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:264
export const DIPSWITCH____header_global_9600428aff9a25d5 = ((u32(((u32(162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6f2c5c9c2baa1357e68da64() {
  return __cxx_static_address_d6f2c5c9c2baa1357e68da64.reference || (__cxx_static_address_d6f2c5c9c2baa1357e68da64.reference = {
    __cReference: true,
    get value() { return DIPSWITCH____header_global_9600428aff9a25d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:265
export const DIPSWITCH2____header_global_c59a5ff7a4831aa4 = ((u32(((u32(164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36bb9ad7417a9504cfdbe695() {
  return __cxx_static_address_36bb9ad7417a9504cfdbe695.reference || (__cxx_static_address_36bb9ad7417a9504cfdbe695.reference = {
    __cReference: true,
    get value() { return DIPSWITCH2____header_global_c59a5ff7a4831aa4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:266
export const TECHSWITCH____header_global_5803283336a95d33 = ((u32(((u32(166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c8ae497dbadc917730db134() {
  return __cxx_static_address_1c8ae497dbadc917730db134.reference || (__cxx_static_address_1c8ae497dbadc917730db134.reference = {
    __cReference: true,
    get value() { return TECHSWITCH____header_global_5803283336a95d33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:267
export const DIPSWITCH3____header_global_6fd721a3e4cd2f6d = ((u32(((u32(168) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3e3cc83204809fe0a33d888() {
  return __cxx_static_address_e3e3cc83204809fe0a33d888.reference || (__cxx_static_address_e3e3cc83204809fe0a33d888.reference = {
    __cReference: true,
    get value() { return DIPSWITCH3____header_global_6fd721a3e4cd2f6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:268
export const ACCESSSWITCH2____header_global_422ded241b1f80e9 = ((u32(((u32(170) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c5a00728e04948108b2889fb() {
  return __cxx_static_address_c5a00728e04948108b2889fb.reference || (__cxx_static_address_c5a00728e04948108b2889fb.reference = {
    __cReference: true,
    get value() { return ACCESSSWITCH2____header_global_422ded241b1f80e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:269
export const FLOORSLIME____header_global_393f5bec5430dd93 = ((u32(((u32(200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf11ac7c3c4f4a1f6133390d() {
  return __cxx_static_address_bf11ac7c3c4f4a1f6133390d.reference || (__cxx_static_address_bf11ac7c3c4f4a1f6133390d.reference = {
    __cReference: true,
    get value() { return FLOORSLIME____header_global_393f5bec5430dd93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:270
export const BIGFORCE____header_global_be71907e826c0e77 = ((u32(((u32(230) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e2bbb8636bd15d0e49d843f() {
  return __cxx_static_address_2e2bbb8636bd15d0e49d843f.reference || (__cxx_static_address_2e2bbb8636bd15d0e49d843f.reference = {
    __cReference: true,
    get value() { return BIGFORCE____header_global_be71907e826c0e77; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:271
export const MASKWALL9____header_global_a9a232a3e26c06c5 = ((u32(((u32(255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b539032f0c46abfdcfd8512() {
  return __cxx_static_address_0b539032f0c46abfdcfd8512.reference || (__cxx_static_address_0b539032f0c46abfdcfd8512.reference = {
    __cReference: true,
    get value() { return MASKWALL9____header_global_a9a232a3e26c06c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:272
export const SCREENBREAK1____header_global_00d921277a745e9f = ((u32(((u32(263) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df5cd33c22fb6c52c9ed490f() {
  return __cxx_static_address_df5cd33c22fb6c52c9ed490f.reference || (__cxx_static_address_df5cd33c22fb6c52c9ed490f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK1____header_global_00d921277a745e9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:273
export const SCREENBREAK2____header_global_80b0724e2f45bb4a = ((u32(((u32(264) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e0174b71c66d0c0a1b27c99() {
  return __cxx_static_address_3e0174b71c66d0c0a1b27c99.reference || (__cxx_static_address_3e0174b71c66d0c0a1b27c99.reference = {
    __cReference: true,
    get value() { return SCREENBREAK2____header_global_80b0724e2f45bb4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:274
export const SCREENBREAK3____header_global_371bdc9ed9983d2f = ((u32(((u32(265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e2eac5979b0c8c1151c2b69() {
  return __cxx_static_address_7e2eac5979b0c8c1151c2b69.reference || (__cxx_static_address_7e2eac5979b0c8c1151c2b69.reference = {
    __cReference: true,
    get value() { return SCREENBREAK3____header_global_371bdc9ed9983d2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:275
export const SCREENBREAK4____header_global_18d8ce6aec1ff748 = ((u32(((u32(266) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4407a129e4d556328751d2f() {
  return __cxx_static_address_a4407a129e4d556328751d2f.reference || (__cxx_static_address_a4407a129e4d556328751d2f.reference = {
    __cReference: true,
    get value() { return SCREENBREAK4____header_global_18d8ce6aec1ff748; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:276
export const SCREENBREAK5____header_global_1564562f949d9e6f = ((u32(((u32(267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_becb11351d17c02403618ce6() {
  return __cxx_static_address_becb11351d17c02403618ce6.reference || (__cxx_static_address_becb11351d17c02403618ce6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK5____header_global_1564562f949d9e6f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:277
export const SCREENBREAK6____header_global_e45098d52e432b69 = ((u32(((u32(268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8da28965bead9fc53c5b3fee() {
  return __cxx_static_address_8da28965bead9fc53c5b3fee.reference || (__cxx_static_address_8da28965bead9fc53c5b3fee.reference = {
    __cReference: true,
    get value() { return SCREENBREAK6____header_global_e45098d52e432b69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:278
export const SCREENBREAK7____header_global_92bcd870eacb951a = ((u32(((u32(269) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0a929afa830fd0e9831cc51() {
  return __cxx_static_address_a0a929afa830fd0e9831cc51.reference || (__cxx_static_address_a0a929afa830fd0e9831cc51.reference = {
    __cReference: true,
    get value() { return SCREENBREAK7____header_global_92bcd870eacb951a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:279
export const SCREENBREAK8____header_global_4cfac5c44c245f7e = ((u32(((u32(270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e020d3119af3638f8584c34() {
  return __cxx_static_address_6e020d3119af3638f8584c34.reference || (__cxx_static_address_6e020d3119af3638f8584c34.reference = {
    __cReference: true,
    get value() { return SCREENBREAK8____header_global_4cfac5c44c245f7e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:280
export const SCREENBREAK9____header_global_297e914f4e974345 = ((u32(((u32(271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9ecd3f00093e3dc1f6625f95() {
  return __cxx_static_address_9ecd3f00093e3dc1f6625f95.reference || (__cxx_static_address_9ecd3f00093e3dc1f6625f95.reference = {
    __cReference: true,
    get value() { return SCREENBREAK9____header_global_297e914f4e974345; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:281
export const SCREENBREAK10____header_global_e3e0c1c01701907f = ((u32(((u32(272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ba0c75a9e6cf840fc8fef761() {
  return __cxx_static_address_ba0c75a9e6cf840fc8fef761.reference || (__cxx_static_address_ba0c75a9e6cf840fc8fef761.reference = {
    __cReference: true,
    get value() { return SCREENBREAK10____header_global_e3e0c1c01701907f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:282
export const SCREENBREAK11____header_global_3af535297ff58fe7 = ((u32(((u32(273) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_076dd7b4bd896dd934e173a4() {
  return __cxx_static_address_076dd7b4bd896dd934e173a4.reference || (__cxx_static_address_076dd7b4bd896dd934e173a4.reference = {
    __cReference: true,
    get value() { return SCREENBREAK11____header_global_3af535297ff58fe7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:283
export const SCREENBREAK12____header_global_df14ebdcb687649f = ((u32(((u32(274) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5658e8c73829f1361f013fb1() {
  return __cxx_static_address_5658e8c73829f1361f013fb1.reference || (__cxx_static_address_5658e8c73829f1361f013fb1.reference = {
    __cReference: true,
    get value() { return SCREENBREAK12____header_global_df14ebdcb687649f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:284
export const SCREENBREAK13____header_global_dc99077d1f60ff9f = ((u32(((u32(275) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d769dd304705c736db04be29() {
  return __cxx_static_address_d769dd304705c736db04be29.reference || (__cxx_static_address_d769dd304705c736db04be29.reference = {
    __cReference: true,
    get value() { return SCREENBREAK13____header_global_dc99077d1f60ff9f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:285
export const MASKWALL1____header_global_1414382017de55c7 = ((u32(((u32(285) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a786cac79e9adb28c6518434() {
  return __cxx_static_address_a786cac79e9adb28c6518434.reference || (__cxx_static_address_a786cac79e9adb28c6518434.reference = {
    __cReference: true,
    get value() { return MASKWALL1____header_global_1414382017de55c7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:286
export const W_TECHWALL1____header_global_3985322b634e2697 = ((u32(((u32(293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d5eb6cd5cd644b35473a303a() {
  return __cxx_static_address_d5eb6cd5cd644b35473a303a.reference || (__cxx_static_address_d5eb6cd5cd644b35473a303a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL1____header_global_3985322b634e2697; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:287
export const W_TECHWALL2____header_global_c363931279dad4f5 = ((u32(((u32(297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a99fd76e9b6e071f2da57ff5() {
  return __cxx_static_address_a99fd76e9b6e071f2da57ff5.reference || (__cxx_static_address_a99fd76e9b6e071f2da57ff5.reference = {
    __cReference: true,
    get value() { return W_TECHWALL2____header_global_c363931279dad4f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:288
export const W_TECHWALL15____header_global_1e4bb01e2ee3a9cd = ((u32(((u32(299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_28cbd06bfe39c9872bb68750() {
  return __cxx_static_address_28cbd06bfe39c9872bb68750.reference || (__cxx_static_address_28cbd06bfe39c9872bb68750.reference = {
    __cReference: true,
    get value() { return W_TECHWALL15____header_global_1e4bb01e2ee3a9cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:289
export const W_TECHWALL3____header_global_aae0e7edcd926e23 = ((u32(((u32(301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb99060d153d244ce5fa193a() {
  return __cxx_static_address_eb99060d153d244ce5fa193a.reference || (__cxx_static_address_eb99060d153d244ce5fa193a.reference = {
    __cReference: true,
    get value() { return W_TECHWALL3____header_global_aae0e7edcd926e23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:290
export const W_TECHWALL4____header_global_0130cdde24d82979 = ((u32(((u32(305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_543a69241f6b0faecc1741fb() {
  return __cxx_static_address_543a69241f6b0faecc1741fb.reference || (__cxx_static_address_543a69241f6b0faecc1741fb.reference = {
    __cReference: true,
    get value() { return W_TECHWALL4____header_global_0130cdde24d82979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:291
export const W_TECHWALL10____header_global_4ed5099cfd879546 = ((u32(((u32(306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_09e009e6e9c4bd9e5318f417() {
  return __cxx_static_address_09e009e6e9c4bd9e5318f417.reference || (__cxx_static_address_09e009e6e9c4bd9e5318f417.reference = {
    __cReference: true,
    get value() { return W_TECHWALL10____header_global_4ed5099cfd879546; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:292
export const W_TECHWALL16____header_global_6af181f105d6f9aa = ((u32(((u32(307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fc0bc5f919ebee5f00594e1() {
  return __cxx_static_address_0fc0bc5f919ebee5f00594e1.reference || (__cxx_static_address_0fc0bc5f919ebee5f00594e1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL16____header_global_6af181f105d6f9aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:293
export const WATERTILE2____header_global_c9d3bb6c9697b6f8 = ((u32(((u32(336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d616e98660134c02fa8b00a5() {
  return __cxx_static_address_d616e98660134c02fa8b00a5.reference || (__cxx_static_address_d616e98660134c02fa8b00a5.reference = {
    __cReference: true,
    get value() { return WATERTILE2____header_global_c9d3bb6c9697b6f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:294
export const BPANNEL1____header_global_5a0cabf7c774b2d6 = ((u32(((u32(341) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9f22b3b3fa4b957af091642() {
  return __cxx_static_address_d9f22b3b3fa4b957af091642.reference || (__cxx_static_address_d9f22b3b3fa4b957af091642.reference = {
    __cReference: true,
    get value() { return BPANNEL1____header_global_5a0cabf7c774b2d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:295
export const PANNEL1____header_global_6ad84fe7e8da3f19 = ((u32(((u32(342) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90710cf994d7039c4e104738() {
  return __cxx_static_address_90710cf994d7039c4e104738.reference || (__cxx_static_address_90710cf994d7039c4e104738.reference = {
    __cReference: true,
    get value() { return PANNEL1____header_global_6ad84fe7e8da3f19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:296
export const PANNEL2____header_global_278114868deff7b5 = ((u32(((u32(343) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0090bd0aa84a7403b3ae2d75() {
  return __cxx_static_address_0090bd0aa84a7403b3ae2d75.reference || (__cxx_static_address_0090bd0aa84a7403b3ae2d75.reference = {
    __cReference: true,
    get value() { return PANNEL2____header_global_278114868deff7b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:297
export const STATIC____header_global_3b1cf04ed04247a9 = ((u32(((u32(351) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9ee3887bd329bd442865550() {
  return __cxx_static_address_e9ee3887bd329bd442865550.reference || (__cxx_static_address_e9ee3887bd329bd442865550.reference = {
    __cReference: true,
    get value() { return STATIC____header_global_3b1cf04ed04247a9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:298
export const W_SCREENBREAK____header_global_79e1cef44d6f0990 = ((u32(((u32(357) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_262f1ac4dd97f58c6a3e5de9() {
  return __cxx_static_address_262f1ac4dd97f58c6a3e5de9.reference || (__cxx_static_address_262f1ac4dd97f58c6a3e5de9.reference = {
    __cReference: true,
    get value() { return W_SCREENBREAK____header_global_79e1cef44d6f0990; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:299
export const W_HITTECHWALL3____header_global_edc04f9a2cbc5e2f = ((u32(((u32(360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_525ffbfb70732d23e343c26f() {
  return __cxx_static_address_525ffbfb70732d23e343c26f.reference || (__cxx_static_address_525ffbfb70732d23e343c26f.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL3____header_global_edc04f9a2cbc5e2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:300
export const W_HITTECHWALL4____header_global_b537ac23d62650ee = ((u32(((u32(361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2122ce510d9f3a1b3d1db169() {
  return __cxx_static_address_2122ce510d9f3a1b3d1db169.reference || (__cxx_static_address_2122ce510d9f3a1b3d1db169.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL4____header_global_b537ac23d62650ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:301
export const W_HITTECHWALL2____header_global_4e6b5b65e5be6d22 = ((u32(((u32(362) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c49462fbd6a99fa2de3cafd() {
  return __cxx_static_address_6c49462fbd6a99fa2de3cafd.reference || (__cxx_static_address_6c49462fbd6a99fa2de3cafd.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL2____header_global_4e6b5b65e5be6d22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:302
export const W_HITTECHWALL1____header_global_c9167405aab8620b = ((u32(((u32(363) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e73146105a238a707895ab4() {
  return __cxx_static_address_0e73146105a238a707895ab4.reference || (__cxx_static_address_0e73146105a238a707895ab4.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL1____header_global_c9167405aab8620b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:303
export const MASKWALL10____header_global_e3088567fdc4fecb = ((u32(((u32(387) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1ccfc330cd981d65fc16ada() {
  return __cxx_static_address_e1ccfc330cd981d65fc16ada.reference || (__cxx_static_address_e1ccfc330cd981d65fc16ada.reference = {
    __cReference: true,
    get value() { return MASKWALL10____header_global_e3088567fdc4fecb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:304
export const MASKWALL11____header_global_c0fda3aed91229ba = ((u32(((u32(391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2c2a9f1d9dd853db34fea64() {
  return __cxx_static_address_c2c2a9f1d9dd853db34fea64.reference || (__cxx_static_address_c2c2a9f1d9dd853db34fea64.reference = {
    __cReference: true,
    get value() { return MASKWALL11____header_global_c0fda3aed91229ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:305
export const DOORTILE22____header_global_06dc22bc6c2c4f6e = ((u32(((u32(395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_38fa42198c150d87c69ddc07() {
  return __cxx_static_address_38fa42198c150d87c69ddc07.reference || (__cxx_static_address_38fa42198c150d87c69ddc07.reference = {
    __cReference: true,
    get value() { return DOORTILE22____header_global_06dc22bc6c2c4f6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:306
export const FANSPRITE____header_global_27dc48435e88b8e9 = ((u32(((u32(407) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3b9b58dfbe2137011b5d0d19() {
  return __cxx_static_address_3b9b58dfbe2137011b5d0d19.reference || (__cxx_static_address_3b9b58dfbe2137011b5d0d19.reference = {
    __cReference: true,
    get value() { return FANSPRITE____header_global_27dc48435e88b8e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:307
export const FANSPRITEBROKE____header_global_91fc1263f9d7d2ec = ((u32(((u32(411) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5c42211e1c9619d1bbfb061() {
  return __cxx_static_address_a5c42211e1c9619d1bbfb061.reference || (__cxx_static_address_a5c42211e1c9619d1bbfb061.reference = {
    __cReference: true,
    get value() { return FANSPRITEBROKE____header_global_91fc1263f9d7d2ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:308
export const FANSHADOW____header_global_4bf762740379aa71 = ((u32(((u32(412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94a164322e59a9be48da3c29() {
  return __cxx_static_address_94a164322e59a9be48da3c29.reference || (__cxx_static_address_94a164322e59a9be48da3c29.reference = {
    __cReference: true,
    get value() { return FANSHADOW____header_global_4bf762740379aa71; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:309
export const FANSHADOWBROKE____header_global_fa7f8e8a775b6a3e = ((u32(((u32(416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a136e6273b9146096e7df57f() {
  return __cxx_static_address_a136e6273b9146096e7df57f.reference || (__cxx_static_address_a136e6273b9146096e7df57f.reference = {
    __cReference: true,
    get value() { return FANSHADOWBROKE____header_global_fa7f8e8a775b6a3e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:310
export const DOORTILE18____header_global_612e37fe1296adef = ((u32(((u32(447) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a2b787a4a7d1b72602a6e5() {
  return __cxx_static_address_33a2b787a4a7d1b72602a6e5.reference || (__cxx_static_address_33a2b787a4a7d1b72602a6e5.reference = {
    __cReference: true,
    get value() { return DOORTILE18____header_global_612e37fe1296adef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:311
export const DOORTILE19____header_global_d54e61ff9a461d5b = ((u32(((u32(448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c0b205a668c2a9d70b3b4e90() {
  return __cxx_static_address_c0b205a668c2a9d70b3b4e90.reference || (__cxx_static_address_c0b205a668c2a9d70b3b4e90.reference = {
    __cReference: true,
    get value() { return DOORTILE19____header_global_d54e61ff9a461d5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:312
export const DOORTILE20____header_global_344744bcc39739fc = ((u32(((u32(449) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a23771ca3b25bf44837f775() {
  return __cxx_static_address_1a23771ca3b25bf44837f775.reference || (__cxx_static_address_1a23771ca3b25bf44837f775.reference = {
    __cReference: true,
    get value() { return DOORTILE20____header_global_344744bcc39739fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:313
export const VIEWSCREEN2____header_global_3ba7534a26a5d9bf = ((u32(((u32(499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa610f8d4826981fa228ccb4() {
  return __cxx_static_address_fa610f8d4826981fa228ccb4.reference || (__cxx_static_address_fa610f8d4826981fa228ccb4.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN2____header_global_3ba7534a26a5d9bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:314
export const VIEWSCREEN____header_global_fabfeebf13645498 = ((u32(((u32(502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4c28f458a78032480f462248() {
  return __cxx_static_address_4c28f458a78032480f462248.reference || (__cxx_static_address_4c28f458a78032480f462248.reference = {
    __cReference: true,
    get value() { return VIEWSCREEN____header_global_fabfeebf13645498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:315
export const GLASS____header_global_0a533ba04a3b9523 = ((u32(((u32(503) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9a9f830512a3b2b9c68408b() {
  return __cxx_static_address_d9a9f830512a3b2b9c68408b.reference || (__cxx_static_address_d9a9f830512a3b2b9c68408b.reference = {
    __cReference: true,
    get value() { return GLASS____header_global_0a533ba04a3b9523; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:316
export const GLASS2____header_global_08e07f6ad40bfa89 = ((u32(((u32(504) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_55fa4c7ccf45b612f6b9385d() {
  return __cxx_static_address_55fa4c7ccf45b612f6b9385d.reference || (__cxx_static_address_55fa4c7ccf45b612f6b9385d.reference = {
    __cReference: true,
    get value() { return GLASS2____header_global_08e07f6ad40bfa89; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:317
export const STAINGLASS1____header_global_d98d77d5032dadb0 = ((u32(((u32(510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_477e921fdf744d4b7c2e3222() {
  return __cxx_static_address_477e921fdf744d4b7c2e3222.reference || (__cxx_static_address_477e921fdf744d4b7c2e3222.reference = {
    __cReference: true,
    get value() { return STAINGLASS1____header_global_d98d77d5032dadb0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:318
export const MASKWALL5____header_global_c38c91e0070ae4ce = ((u32(((u32(514) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fcb757cd5bcb5cfa3f32832a() {
  return __cxx_static_address_fcb757cd5bcb5cfa3f32832a.reference || (__cxx_static_address_fcb757cd5bcb5cfa3f32832a.reference = {
    __cReference: true,
    get value() { return MASKWALL5____header_global_c38c91e0070ae4ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:319
export const SATELITE____header_global_4003ae9c44b75c6a = ((u32(((u32(516) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a438cd2d303c0addd1f10c7d() {
  return __cxx_static_address_a438cd2d303c0addd1f10c7d.reference || (__cxx_static_address_a438cd2d303c0addd1f10c7d.reference = {
    __cReference: true,
    get value() { return SATELITE____header_global_4003ae9c44b75c6a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:320
export const FUELPOD____header_global_2e6004b3af7065f1 = ((u32(((u32(517) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6be2385076623938b4fa1884() {
  return __cxx_static_address_6be2385076623938b4fa1884.reference || (__cxx_static_address_6be2385076623938b4fa1884.reference = {
    __cReference: true,
    get value() { return FUELPOD____header_global_2e6004b3af7065f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_1aa1d853fa440ae5 = ((u32(((u32(546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2110f344224a4db0768896b() {
  return __cxx_static_address_a2110f344224a4db0768896b.reference || (__cxx_static_address_a2110f344224a4db0768896b.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_1aa1d853fa440ae5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_df6214564fbeaa61 = ((u32(((u32(547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f64e346668f49d18ed32ff63() {
  return __cxx_static_address_f64e346668f49d18ed32ff63.reference || (__cxx_static_address_f64e346668f49d18ed32ff63.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_df6214564fbeaa61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_454fc96b7d021b36 = ((u32(((u32(548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c7bd36970e572e6d1b9183f() {
  return __cxx_static_address_6c7bd36970e572e6d1b9183f.reference || (__cxx_static_address_6c7bd36970e572e6d1b9183f.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_454fc96b7d021b36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_a13002ac3cf4a7f1 = ((u32(((u32(549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b944a9594a9af1595238e67f() {
  return __cxx_static_address_b944a9594a9af1595238e67f.reference || (__cxx_static_address_b944a9594a9af1595238e67f.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_a13002ac3cf4a7f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_b4e0eadd338037a2 = ((u32(((u32(550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6652888f7305ffeebdece001() {
  return __cxx_static_address_6652888f7305ffeebdece001.reference || (__cxx_static_address_6652888f7305ffeebdece001.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_b4e0eadd338037a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:326
export const DOMELITE____header_global_428cdf32eb441214 = ((u32(((u32(551) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47832b199ed5045bacbc6b41() {
  return __cxx_static_address_47832b199ed5045bacbc6b41.reference || (__cxx_static_address_47832b199ed5045bacbc6b41.reference = {
    __cReference: true,
    get value() { return DOMELITE____header_global_428cdf32eb441214; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:327
export const CAMERAPOLE____header_global_127e16e5ce1693b0 = ((u32(((u32(554) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3375afdc1b45199b9655aa7() {
  return __cxx_static_address_e3375afdc1b45199b9655aa7.reference || (__cxx_static_address_e3375afdc1b45199b9655aa7.reference = {
    __cReference: true,
    get value() { return CAMERAPOLE____header_global_127e16e5ce1693b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:328
export const CHAIR1____header_global_560c7db955b921ce = ((u32(((u32(556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c6336484db6f0186098ee49() {
  return __cxx_static_address_9c6336484db6f0186098ee49.reference || (__cxx_static_address_9c6336484db6f0186098ee49.reference = {
    __cReference: true,
    get value() { return CHAIR1____header_global_560c7db955b921ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:329
export const CHAIR2____header_global_252d4b2a74d79835 = ((u32(((u32(557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0857af424b905f92456124e2() {
  return __cxx_static_address_0857af424b905f92456124e2.reference || (__cxx_static_address_0857af424b905f92456124e2.reference = {
    __cReference: true,
    get value() { return CHAIR2____header_global_252d4b2a74d79835; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:330
export const BROKENCHAIR____header_global_2d9d216404565cb9 = ((u32(((u32(559) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c03488a37c58016a2b32e5f() {
  return __cxx_static_address_9c03488a37c58016a2b32e5f.reference || (__cxx_static_address_9c03488a37c58016a2b32e5f.reference = {
    __cReference: true,
    get value() { return BROKENCHAIR____header_global_2d9d216404565cb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:331
export const MIRROR____header_global_60326b229361813b = ((u32(((u32(560) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfd0b3cdb062bd1e91af2a34() {
  return __cxx_static_address_bfd0b3cdb062bd1e91af2a34.reference || (__cxx_static_address_bfd0b3cdb062bd1e91af2a34.reference = {
    __cReference: true,
    get value() { return MIRROR____header_global_60326b229361813b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:332
export const WATERFOUNTAIN____header_global_196a6b6bfdeedaaa = ((u32(((u32(563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58a37d5efff165c11ad0a261() {
  return __cxx_static_address_58a37d5efff165c11ad0a261.reference || (__cxx_static_address_58a37d5efff165c11ad0a261.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAIN____header_global_196a6b6bfdeedaaa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:333
export const WATERFOUNTAINBROKE____header_global_789e07b8a8e19d38 = ((u32(((u32(567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32496cae50535e433fa0a666() {
  return __cxx_static_address_32496cae50535e433fa0a666.reference || (__cxx_static_address_32496cae50535e433fa0a666.reference = {
    __cReference: true,
    get value() { return WATERFOUNTAINBROKE____header_global_789e07b8a8e19d38; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_65bddbfc26cc1669 = ((u32(((u32(568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2d99300d249b6292e8958c0a() {
  return __cxx_static_address_2d99300d249b6292e8958c0a.reference || (__cxx_static_address_2d99300d249b6292e8958c0a.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_65bddbfc26cc1669; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:335
export const TOILET____header_global_6fac172458b1bc57 = ((u32(((u32(569) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58468206f30b77f2fb02dc19() {
  return __cxx_static_address_58468206f30b77f2fb02dc19.reference || (__cxx_static_address_58468206f30b77f2fb02dc19.reference = {
    __cReference: true,
    get value() { return TOILET____header_global_6fac172458b1bc57; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:336
export const STALL____header_global_4e12b11f085f899f = ((u32(((u32(571) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4b22f7c65128c30fbb0153ee() {
  return __cxx_static_address_4b22f7c65128c30fbb0153ee.reference || (__cxx_static_address_4b22f7c65128c30fbb0153ee.reference = {
    __cReference: true,
    get value() { return STALL____header_global_4e12b11f085f899f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:337
export const STALLBROKE____header_global_202717ec69e52060 = ((u32(((u32(573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33a708202ac0d65354a151aa() {
  return __cxx_static_address_33a708202ac0d65354a151aa.reference || (__cxx_static_address_33a708202ac0d65354a151aa.reference = {
    __cReference: true,
    get value() { return STALLBROKE____header_global_202717ec69e52060; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_158b14d3d09d51a4 = ((u32(((u32(577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec4b762f0b083bc95baba8a6() {
  return __cxx_static_address_ec4b762f0b083bc95baba8a6.reference || (__cxx_static_address_ec4b762f0b083bc95baba8a6.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_158b14d3d09d51a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:339
export const REACTOR2____header_global_e05022886203a8b0 = ((u32(((u32(578) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_193eed77c27c8b8b11513345() {
  return __cxx_static_address_193eed77c27c8b8b11513345.reference || (__cxx_static_address_193eed77c27c8b8b11513345.reference = {
    __cReference: true,
    get value() { return REACTOR2____header_global_e05022886203a8b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:340
export const REACTOR2BURNT____header_global_99378a531229c486 = ((u32(((u32(579) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27f23cd73dd54fc40a397849() {
  return __cxx_static_address_27f23cd73dd54fc40a397849.reference || (__cxx_static_address_27f23cd73dd54fc40a397849.reference = {
    __cReference: true,
    get value() { return REACTOR2BURNT____header_global_99378a531229c486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:341
export const REACTOR2SPARK____header_global_f1b6964b76a165de = ((u32(((u32(580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2097df8b5262d3ebda711f36() {
  return __cxx_static_address_2097df8b5262d3ebda711f36.reference || (__cxx_static_address_2097df8b5262d3ebda711f36.reference = {
    __cReference: true,
    get value() { return REACTOR2SPARK____header_global_f1b6964b76a165de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:342
export const GRATE1____header_global_56063bae12942017 = ((u32(((u32(595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_357868ac24dc88bc98130d1f() {
  return __cxx_static_address_357868ac24dc88bc98130d1f.reference || (__cxx_static_address_357868ac24dc88bc98130d1f.reference = {
    __cReference: true,
    get value() { return GRATE1____header_global_56063bae12942017; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:343
export const BGRATE1____header_global_b53682e99b2296c8 = ((u32(((u32(596) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aaf9128c7cbe30f4a99dcb08() {
  return __cxx_static_address_aaf9128c7cbe30f4a99dcb08.reference || (__cxx_static_address_aaf9128c7cbe30f4a99dcb08.reference = {
    __cReference: true,
    get value() { return BGRATE1____header_global_b53682e99b2296c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:344
export const SOLARPANNEL____header_global_c11d6e4fab8eca2d = ((u32(((u32(602) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4220ffd080e57ec13357de79() {
  return __cxx_static_address_4220ffd080e57ec13357de79.reference || (__cxx_static_address_4220ffd080e57ec13357de79.reference = {
    __cReference: true,
    get value() { return SOLARPANNEL____header_global_c11d6e4fab8eca2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_239c1ec4803c2adc = ((u32(((u32(603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cbbb6f46f56b89f4f14ba96b() {
  return __cxx_static_address_cbbb6f46f56b89f4f14ba96b.reference || (__cxx_static_address_cbbb6f46f56b89f4f14ba96b.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_239c1ec4803c2adc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:346
export const ANTENNA____header_global_f9d60c8bf40ee7e6 = ((u32(((u32(607) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f07b90648e20938b24eecd7() {
  return __cxx_static_address_6f07b90648e20938b24eecd7.reference || (__cxx_static_address_6f07b90648e20938b24eecd7.reference = {
    __cReference: true,
    get value() { return ANTENNA____header_global_f9d60c8bf40ee7e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:347
export const MASKWALL12____header_global_8cfa5b0ea5d5610d = ((u32(((u32(609) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_52b0e81435b048059ad052f7() {
  return __cxx_static_address_52b0e81435b048059ad052f7.reference || (__cxx_static_address_52b0e81435b048059ad052f7.reference = {
    __cReference: true,
    get value() { return MASKWALL12____header_global_8cfa5b0ea5d5610d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:348
export const TOILETBROKE____header_global_27d3e955727111d1 = ((u32(((u32(615) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_88aaa39aa7627b38e26299dd() {
  return __cxx_static_address_88aaa39aa7627b38e26299dd.reference || (__cxx_static_address_88aaa39aa7627b38e26299dd.reference = {
    __cReference: true,
    get value() { return TOILETBROKE____header_global_27d3e955727111d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:349
export const PIPE2____header_global_43d3292dfd13c57d = ((u32(((u32(616) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f0325390686047aeeee9704() {
  return __cxx_static_address_3f0325390686047aeeee9704.reference || (__cxx_static_address_3f0325390686047aeeee9704.reference = {
    __cReference: true,
    get value() { return PIPE2____header_global_43d3292dfd13c57d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:350
export const PIPE1B____header_global_d2653bd383ec3dd9 = ((u32(((u32(617) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4176dbfbe65f0e3f1bf1d81b() {
  return __cxx_static_address_4176dbfbe65f0e3f1bf1d81b.reference || (__cxx_static_address_4176dbfbe65f0e3f1bf1d81b.reference = {
    __cReference: true,
    get value() { return PIPE1B____header_global_d2653bd383ec3dd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:351
export const PIPE3____header_global_5619c961296f4bd7 = ((u32(((u32(618) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b4a0e2e6b6453005dfdfb65() {
  return __cxx_static_address_0b4a0e2e6b6453005dfdfb65.reference || (__cxx_static_address_0b4a0e2e6b6453005dfdfb65.reference = {
    __cReference: true,
    get value() { return PIPE3____header_global_5619c961296f4bd7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:352
export const PIPE1____header_global_a227d59400dbea36 = ((u32(((u32(619) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_369fbce12585e5a14f1132b0() {
  return __cxx_static_address_369fbce12585e5a14f1132b0.reference || (__cxx_static_address_369fbce12585e5a14f1132b0.reference = {
    __cReference: true,
    get value() { return PIPE1____header_global_a227d59400dbea36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_c071067fba184636 = ((u32(((u32(621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c782a93efcbeb2569bfbbd74() {
  return __cxx_static_address_c782a93efcbeb2569bfbbd74.reference || (__cxx_static_address_c782a93efcbeb2569bfbbd74.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_c071067fba184636; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:354
export const PIPE2B____header_global_4348b7f09609ae0c = ((u32(((u32(633) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98b2ece711483efa6222b536() {
  return __cxx_static_address_98b2ece711483efa6222b536.reference || (__cxx_static_address_98b2ece711483efa6222b536.reference = {
    __cReference: true,
    get value() { return PIPE2B____header_global_4348b7f09609ae0c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:355
export const BOLT1____header_global_ef21f31417a2351b = ((u32(((u32(634) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6515882cc5d271d7e9a48c76() {
  return __cxx_static_address_6515882cc5d271d7e9a48c76.reference || (__cxx_static_address_6515882cc5d271d7e9a48c76.reference = {
    __cReference: true,
    get value() { return BOLT1____header_global_ef21f31417a2351b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:356
export const W_NUMBERS____header_global_8965a06c417980c8 = ((u32(((u32(640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0553d29ecd6151a911a93f43() {
  return __cxx_static_address_0553d29ecd6151a911a93f43.reference || (__cxx_static_address_0553d29ecd6151a911a93f43.reference = {
    __cReference: true,
    get value() { return W_NUMBERS____header_global_8965a06c417980c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:357
export const WATERDRIP____header_global_644abe0cb7cafb26 = ((u32(((u32(660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8db1b66b147ff2fb667e63a3() {
  return __cxx_static_address_8db1b66b147ff2fb667e63a3.reference || (__cxx_static_address_8db1b66b147ff2fb667e63a3.reference = {
    __cReference: true,
    get value() { return WATERDRIP____header_global_644abe0cb7cafb26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:358
export const WATERBUBBLE____header_global_26954ba93f5f457f = ((u32(((u32(661) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_41acdda04e72dae7dcdc19cc() {
  return __cxx_static_address_41acdda04e72dae7dcdc19cc.reference || (__cxx_static_address_41acdda04e72dae7dcdc19cc.reference = {
    __cReference: true,
    get value() { return WATERBUBBLE____header_global_26954ba93f5f457f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:359
export const WATERBUBBLEMAKER____header_global_fc580c02475eda2f = ((u32(((u32(662) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cdf833fc7bdda3c7ff7f5ec() {
  return __cxx_static_address_2cdf833fc7bdda3c7ff7f5ec.reference || (__cxx_static_address_2cdf833fc7bdda3c7ff7f5ec.reference = {
    __cReference: true,
    get value() { return WATERBUBBLEMAKER____header_global_fc580c02475eda2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:360
export const W_FORCEFIELD____header_global_3e15880133650d99 = ((u32(((u32(663) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79740eebaa1d2006b50bbc2d() {
  return __cxx_static_address_79740eebaa1d2006b50bbc2d.reference || (__cxx_static_address_79740eebaa1d2006b50bbc2d.reference = {
    __cReference: true,
    get value() { return W_FORCEFIELD____header_global_3e15880133650d99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:361
export const VACUUM____header_global_3ba7c3edea39db94 = ((u32(((u32(669) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dfb7faeee236bb34f524d7bf() {
  return __cxx_static_address_dfb7faeee236bb34f524d7bf.reference || (__cxx_static_address_dfb7faeee236bb34f524d7bf.reference = {
    __cReference: true,
    get value() { return VACUUM____header_global_3ba7c3edea39db94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_c8d39ea88d915590 = ((u32(((u32(672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0ac0f7f3f09f4ace189edc45() {
  return __cxx_static_address_0ac0f7f3f09f4ace189edc45.reference || (__cxx_static_address_0ac0f7f3f09f4ace189edc45.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_c8d39ea88d915590; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_66f6cb7860781303 = ((u32(((u32(673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_57910f3ed6e7161e01e260d1() {
  return __cxx_static_address_57910f3ed6e7161e01e260d1.reference || (__cxx_static_address_57910f3ed6e7161e01e260d1.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_66f6cb7860781303; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_40e1fc639dc79813 = ((u32(((u32(674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbc88a530fb9bf4c8d823e5f() {
  return __cxx_static_address_bbc88a530fb9bf4c8d823e5f.reference || (__cxx_static_address_bbc88a530fb9bf4c8d823e5f.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_40e1fc639dc79813; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:365
export const EGG____header_global_7451d89567aad338 = ((u32(((u32(675) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da1fc0340c1765496bc3daac() {
  return __cxx_static_address_da1fc0340c1765496bc3daac.reference || (__cxx_static_address_da1fc0340c1765496bc3daac.reference = {
    __cReference: true,
    get value() { return EGG____header_global_7451d89567aad338; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:366
export const SCALE____header_global_c727049674a8ecf4 = ((u32(((u32(678) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7acbc4954c69ab4070b6f4b0() {
  return __cxx_static_address_7acbc4954c69ab4070b6f4b0.reference || (__cxx_static_address_7acbc4954c69ab4070b6f4b0.reference = {
    __cReference: true,
    get value() { return SCALE____header_global_c727049674a8ecf4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_10b899b879850150 = ((u32(((u32(680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e80cdf7f290db6264eed5f2d() {
  return __cxx_static_address_e80cdf7f290db6264eed5f2d.reference || (__cxx_static_address_e80cdf7f290db6264eed5f2d.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_10b899b879850150; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:368
export const CAMERALIGHT____header_global_9c1a4142223f856c = ((u32(((u32(685) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4de572aeb263b46b9a3d7db5() {
  return __cxx_static_address_4de572aeb263b46b9a3d7db5.reference || (__cxx_static_address_4de572aeb263b46b9a3d7db5.reference = {
    __cReference: true,
    get value() { return CAMERALIGHT____header_global_9c1a4142223f856c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:369
export const MOVIECAMERA____header_global_d0c3b8afb4e6f7aa = ((u32(((u32(686) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4122bf2b769d4d737905c0d1() {
  return __cxx_static_address_4122bf2b769d4d737905c0d1.reference || (__cxx_static_address_4122bf2b769d4d737905c0d1.reference = {
    __cReference: true,
    get value() { return MOVIECAMERA____header_global_d0c3b8afb4e6f7aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:370
export const IVUNIT____header_global_38d855871d1597e3 = ((u32(((u32(689) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_952ee6000d1905928ebe79be() {
  return __cxx_static_address_952ee6000d1905928ebe79be.reference || (__cxx_static_address_952ee6000d1905928ebe79be.reference = {
    __cReference: true,
    get value() { return IVUNIT____header_global_38d855871d1597e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:371
export const POT1____header_global_eba6dfb56b37640f = ((u32(((u32(694) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_562039859e3b227e2625119c() {
  return __cxx_static_address_562039859e3b227e2625119c.reference || (__cxx_static_address_562039859e3b227e2625119c.reference = {
    __cReference: true,
    get value() { return POT1____header_global_eba6dfb56b37640f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:372
export const POT2____header_global_3928b415c6251548 = ((u32(((u32(695) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7eb01350746015224d4ecb61() {
  return __cxx_static_address_7eb01350746015224d4ecb61.reference || (__cxx_static_address_7eb01350746015224d4ecb61.reference = {
    __cReference: true,
    get value() { return POT2____header_global_3928b415c6251548; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:373
export const POT3____header_global_9f3b653b692e78ec = ((u32(((u32(697) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_951cf14a3c67f1b48ad20191() {
  return __cxx_static_address_951cf14a3c67f1b48ad20191.reference || (__cxx_static_address_951cf14a3c67f1b48ad20191.reference = {
    __cReference: true,
    get value() { return POT3____header_global_9f3b653b692e78ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:374
export const PIPE3B____header_global_edff61ebc98a847b = ((u32(((u32(700) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46e6bce3755e8fef7901d19b() {
  return __cxx_static_address_46e6bce3755e8fef7901d19b.reference || (__cxx_static_address_46e6bce3755e8fef7901d19b.reference = {
    __cReference: true,
    get value() { return PIPE3B____header_global_edff61ebc98a847b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:375
export const WALLLIGHT3____header_global_ba27dffea9975327 = ((u32(((u32(701) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2fc035bd8e5f97997d7a0708() {
  return __cxx_static_address_2fc035bd8e5f97997d7a0708.reference || (__cxx_static_address_2fc035bd8e5f97997d7a0708.reference = {
    __cReference: true,
    get value() { return WALLLIGHT3____header_global_ba27dffea9975327; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:376
export const WALLLIGHTBUST3____header_global_77164ac16caaefaf = ((u32(((u32(702) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_878bff0b55a8258bfceeac94() {
  return __cxx_static_address_878bff0b55a8258bfceeac94.reference || (__cxx_static_address_878bff0b55a8258bfceeac94.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST3____header_global_77164ac16caaefaf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:377
export const WALLLIGHT1____header_global_44c2082feae510de = ((u32(((u32(703) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef10c760b15e66923f3464a8() {
  return __cxx_static_address_ef10c760b15e66923f3464a8.reference || (__cxx_static_address_ef10c760b15e66923f3464a8.reference = {
    __cReference: true,
    get value() { return WALLLIGHT1____header_global_44c2082feae510de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:378
export const WALLLIGHTBUST1____header_global_3b00e4bee2425a06 = ((u32(((u32(704) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0358fb91220e95e4c36b4c81() {
  return __cxx_static_address_0358fb91220e95e4c36b4c81.reference || (__cxx_static_address_0358fb91220e95e4c36b4c81.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST1____header_global_3b00e4bee2425a06; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:379
export const WALLLIGHT2____header_global_f0125d394750a902 = ((u32(((u32(705) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aced183e6178000c627dcefa() {
  return __cxx_static_address_aced183e6178000c627dcefa.reference || (__cxx_static_address_aced183e6178000c627dcefa.reference = {
    __cReference: true,
    get value() { return WALLLIGHT2____header_global_f0125d394750a902; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:380
export const WALLLIGHTBUST2____header_global_838f00b6937fdb12 = ((u32(((u32(706) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_469cd29b471fc22051a84dad() {
  return __cxx_static_address_469cd29b471fc22051a84dad.reference || (__cxx_static_address_469cd29b471fc22051a84dad.reference = {
    __cReference: true,
    get value() { return WALLLIGHTBUST2____header_global_838f00b6937fdb12; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:381
export const LIGHTSWITCH2____header_global_1f1358446329b489 = ((u32(((u32(712) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1fdc8ba8ddae2079fc3635c() {
  return __cxx_static_address_f1fdc8ba8ddae2079fc3635c.reference || (__cxx_static_address_f1fdc8ba8ddae2079fc3635c.reference = {
    __cReference: true,
    get value() { return LIGHTSWITCH2____header_global_1f1358446329b489; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:382
export const WAITTOBESEATED____header_global_dae3fa522c51d0a4 = ((u32(((u32(716) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_36a6ee56d957360f16498b1c() {
  return __cxx_static_address_36a6ee56d957360f16498b1c.reference || (__cxx_static_address_36a6ee56d957360f16498b1c.reference = {
    __cReference: true,
    get value() { return WAITTOBESEATED____header_global_dae3fa522c51d0a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:383
export const DOORTILE14____header_global_54194530a8da92dd = ((u32(((u32(717) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65764395a1f4d1ccfe31600f() {
  return __cxx_static_address_65764395a1f4d1ccfe31600f.reference || (__cxx_static_address_65764395a1f4d1ccfe31600f.reference = {
    __cReference: true,
    get value() { return DOORTILE14____header_global_54194530a8da92dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_5136fe71b8091ece = ((u32(((u32(753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77642d375672d832751a9eb7() {
  return __cxx_static_address_77642d375672d832751a9eb7.reference || (__cxx_static_address_77642d375672d832751a9eb7.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_5136fe71b8091ece; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:385
export const MIKE____header_global_5f0bb21081bd706f = ((u32(((u32(762) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_259c4feced5b8d86d9ecbb5c() {
  return __cxx_static_address_259c4feced5b8d86d9ecbb5c.reference || (__cxx_static_address_259c4feced5b8d86d9ecbb5c.reference = {
    __cReference: true,
    get value() { return MIKE____header_global_5f0bb21081bd706f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:386
export const VASE____header_global_d2cb45054255cf7a = ((u32(((u32(765) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0584a3b0e1b455cdf7fe3e32() {
  return __cxx_static_address_0584a3b0e1b455cdf7fe3e32.reference || (__cxx_static_address_0584a3b0e1b455cdf7fe3e32.reference = {
    __cReference: true,
    get value() { return VASE____header_global_d2cb45054255cf7a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_bbdfe39d95d1a7a3 = ((u32(((u32(768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9b400fa056fb4214ca884bb() {
  return __cxx_static_address_d9b400fa056fb4214ca884bb.reference || (__cxx_static_address_d9b400fa056fb4214ca884bb.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_bbdfe39d95d1a7a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_d6956479219ce050 = ((u32(((u32(769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_545139719715653d359b972f() {
  return __cxx_static_address_545139719715653d359b972f.reference || (__cxx_static_address_545139719715653d359b972f.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_d6956479219ce050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_b9835ef73b3d0ba4 = ((u32(((u32(774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c419c0a30f0ca870949e519a() {
  return __cxx_static_address_c419c0a30f0ca870949e519a.reference || (__cxx_static_address_c419c0a30f0ca870949e519a.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_b9835ef73b3d0ba4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_652fb4539ddb5633 = ((u32(((u32(779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a309cf21bec889045ea5d03f() {
  return __cxx_static_address_a309cf21bec889045ea5d03f.reference || (__cxx_static_address_a309cf21bec889045ea5d03f.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_652fb4539ddb5633; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:391
export const DOORTILE16____header_global_c44f459809852f6b = ((u32(((u32(781) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4f5417fc56376de26f9d0ef4() {
  return __cxx_static_address_4f5417fc56376de26f9d0ef4.reference || (__cxx_static_address_4f5417fc56376de26f9d0ef4.reference = {
    __cReference: true,
    get value() { return DOORTILE16____header_global_c44f459809852f6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:392
export const SUSHIPLATE5____header_global_10003ee9e1c864f2 = ((u32(((u32(792) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07992644e57d7235dca56921() {
  return __cxx_static_address_07992644e57d7235dca56921.reference || (__cxx_static_address_07992644e57d7235dca56921.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE5____header_global_10003ee9e1c864f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:393
export const OJ____header_global_b5e3e9e5903f6016 = ((u32(((u32(806) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5a09fb5bc9ecbeaeffe7b5e() {
  return __cxx_static_address_a5a09fb5bc9ecbeaeffe7b5e.reference || (__cxx_static_address_a5a09fb5bc9ecbeaeffe7b5e.reference = {
    __cReference: true,
    get value() { return OJ____header_global_b5e3e9e5903f6016; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:394
export const MASKWALL13____header_global_5cef0196e672bc74 = ((u32(((u32(830) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e8a1f5fb0abf84dcdacd1e3() {
  return __cxx_static_address_9e8a1f5fb0abf84dcdacd1e3.reference || (__cxx_static_address_9e8a1f5fb0abf84dcdacd1e3.reference = {
    __cReference: true,
    get value() { return MASKWALL13____header_global_5cef0196e672bc74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:395
export const HURTRAIL____header_global_98e0350c00241cf2 = ((u32(((u32(859) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_85516cd75297f29c4b54e428() {
  return __cxx_static_address_85516cd75297f29c4b54e428.reference || (__cxx_static_address_85516cd75297f29c4b54e428.reference = {
    __cReference: true,
    get value() { return HURTRAIL____header_global_98e0350c00241cf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:396
export const POWERSWITCH1____header_global_558bed60b05ad682 = ((u32(((u32(860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da9e93d316788666d468dbd3() {
  return __cxx_static_address_da9e93d316788666d468dbd3.reference || (__cxx_static_address_da9e93d316788666d468dbd3.reference = {
    __cReference: true,
    get value() { return POWERSWITCH1____header_global_558bed60b05ad682; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:397
export const LOCKSWITCH1____header_global_dba2fda3d1439e5b = ((u32(((u32(862) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9f8184acf4b9dcb1f3c1cc4d() {
  return __cxx_static_address_9f8184acf4b9dcb1f3c1cc4d.reference || (__cxx_static_address_9f8184acf4b9dcb1f3c1cc4d.reference = {
    __cReference: true,
    get value() { return LOCKSWITCH1____header_global_dba2fda3d1439e5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:398
export const POWERSWITCH2____header_global_8bae0eb049d95fe6 = ((u32(((u32(864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_983b3a057f8da99e47cf93cd() {
  return __cxx_static_address_983b3a057f8da99e47cf93cd.reference || (__cxx_static_address_983b3a057f8da99e47cf93cd.reference = {
    __cReference: true,
    get value() { return POWERSWITCH2____header_global_8bae0eb049d95fe6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:399
export const ATM____header_global_9c1ec26ef7896a42 = ((u32(((u32(867) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_50b0cf466b0fbc01c89018ec() {
  return __cxx_static_address_50b0cf466b0fbc01c89018ec.reference || (__cxx_static_address_50b0cf466b0fbc01c89018ec.reference = {
    __cReference: true,
    get value() { return ATM____header_global_9c1ec26ef7896a42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_1579156e0319c40c = ((u32(((u32(869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b647fa5b6621bfaaf5cfb7aa() {
  return __cxx_static_address_b647fa5b6621bfaaf5cfb7aa.reference || (__cxx_static_address_b647fa5b6621bfaaf5cfb7aa.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_1579156e0319c40c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:401
export const ATMBROKE____header_global_9a68e7c2fe25c550 = ((u32(((u32(888) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c297006011999f347a980b1() {
  return __cxx_static_address_3c297006011999f347a980b1.reference || (__cxx_static_address_3c297006011999f347a980b1.reference = {
    __cReference: true,
    get value() { return ATMBROKE____header_global_9a68e7c2fe25c550; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:402
export const STRIPEBALL____header_global_b8d6868cef563964 = ((u32(((u32(901) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f5860017b10f215da311f174() {
  return __cxx_static_address_f5860017b10f215da311f174.reference || (__cxx_static_address_f5860017b10f215da311f174.reference = {
    __cReference: true,
    get value() { return STRIPEBALL____header_global_b8d6868cef563964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:403
export const QUEBALL____header_global_ff181756f557cdfd = ((u32(((u32(902) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_48c5d7d0318b4a980ec285f1() {
  return __cxx_static_address_48c5d7d0318b4a980ec285f1.reference || (__cxx_static_address_48c5d7d0318b4a980ec285f1.reference = {
    __cReference: true,
    get value() { return QUEBALL____header_global_ff181756f557cdfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:404
export const POCKET____header_global_ff594172ad8531ed = ((u32(((u32(903) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5575e9e0c1eddf7a1925cd5c() {
  return __cxx_static_address_5575e9e0c1eddf7a1925cd5c.reference || (__cxx_static_address_5575e9e0c1eddf7a1925cd5c.reference = {
    __cReference: true,
    get value() { return POCKET____header_global_ff594172ad8531ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:405
export const WOODENHORSE____header_global_2592de84984dc5e0 = ((u32(((u32(904) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f952a8ef21cd8ce43cbf586a() {
  return __cxx_static_address_f952a8ef21cd8ce43cbf586a.reference || (__cxx_static_address_f952a8ef21cd8ce43cbf586a.reference = {
    __cReference: true,
    get value() { return WOODENHORSE____header_global_2592de84984dc5e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:406
export const TREE1____header_global_26a8bbe67487a5a0 = ((u32(((u32(908) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb497d4316c11b036a3f4de2() {
  return __cxx_static_address_fb497d4316c11b036a3f4de2.reference || (__cxx_static_address_fb497d4316c11b036a3f4de2.reference = {
    __cReference: true,
    get value() { return TREE1____header_global_26a8bbe67487a5a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:407
export const TREE2____header_global_0396b0b29f930bf6 = ((u32(((u32(910) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a661ef74352273cd5b6afcb() {
  return __cxx_static_address_5a661ef74352273cd5b6afcb.reference || (__cxx_static_address_5a661ef74352273cd5b6afcb.reference = {
    __cReference: true,
    get value() { return TREE2____header_global_0396b0b29f930bf6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:408
export const CACTUS____header_global_0b54ca83addae74c = ((u32(((u32(911) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b059fc731c7e8a70a1f20d72() {
  return __cxx_static_address_b059fc731c7e8a70a1f20d72.reference || (__cxx_static_address_b059fc731c7e8a70a1f20d72.reference = {
    __cReference: true,
    get value() { return CACTUS____header_global_0b54ca83addae74c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:409
export const MASKWALL2____header_global_3d037a7bc3581e03 = ((u32(((u32(913) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_503a036cc07b37d71294ccab() {
  return __cxx_static_address_503a036cc07b37d71294ccab.reference || (__cxx_static_address_503a036cc07b37d71294ccab.reference = {
    __cReference: true,
    get value() { return MASKWALL2____header_global_3d037a7bc3581e03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:410
export const MASKWALL3____header_global_7aba0932f8ff45ed = ((u32(((u32(914) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9284e0b7c25d9d533b5774d() {
  return __cxx_static_address_d9284e0b7c25d9d533b5774d.reference || (__cxx_static_address_d9284e0b7c25d9d533b5774d.reference = {
    __cReference: true,
    get value() { return MASKWALL3____header_global_7aba0932f8ff45ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:411
export const MASKWALL4____header_global_2cc37553f72c1a4f = ((u32(((u32(915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_944684d323a26367dbbddfe0() {
  return __cxx_static_address_944684d323a26367dbbddfe0.reference || (__cxx_static_address_944684d323a26367dbbddfe0.reference = {
    __cReference: true,
    get value() { return MASKWALL4____header_global_2cc37553f72c1a4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:412
export const FIREEXT____header_global_13ca6268f4119149 = ((u32(((u32(916) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_699be7bf79aedd371ce5d7aa() {
  return __cxx_static_address_699be7bf79aedd371ce5d7aa.reference || (__cxx_static_address_699be7bf79aedd371ce5d7aa.reference = {
    __cReference: true,
    get value() { return FIREEXT____header_global_13ca6268f4119149; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:413
export const TOILETWATER____header_global_363a8c1b47a8ccde = ((u32(((u32(921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce802907c817a3dc3fddfc6c() {
  return __cxx_static_address_ce802907c817a3dc3fddfc6c.reference || (__cxx_static_address_ce802907c817a3dc3fddfc6c.reference = {
    __cReference: true,
    get value() { return TOILETWATER____header_global_363a8c1b47a8ccde; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_9c62cce5710e4f34 = ((u32(((u32(925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c926125246b3691fdd95cf37() {
  return __cxx_static_address_c926125246b3691fdd95cf37.reference || (__cxx_static_address_c926125246b3691fdd95cf37.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_9c62cce5710e4f34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_dc26aca5c2f1654b = ((u32(((u32(926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a0f81fee0268fcdb5c62a16d() {
  return __cxx_static_address_a0f81fee0268fcdb5c62a16d.reference || (__cxx_static_address_a0f81fee0268fcdb5c62a16d.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_dc26aca5c2f1654b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:416
export const CACTUSBROKE____header_global_99a75e246d0ddb48 = ((u32(((u32(939) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b6042656fea863df6b606568() {
  return __cxx_static_address_b6042656fea863df6b606568.reference || (__cxx_static_address_b6042656fea863df6b606568.reference = {
    __cReference: true,
    get value() { return CACTUSBROKE____header_global_99a75e246d0ddb48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:417
export const BOUNCEMINE____header_global_b633f38c887761a1 = ((u32(((u32(940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f32d82f8d6c813a41050bffb() {
  return __cxx_static_address_f32d82f8d6c813a41050bffb.reference || (__cxx_static_address_f32d82f8d6c813a41050bffb.reference = {
    __cReference: true,
    get value() { return BOUNCEMINE____header_global_b633f38c887761a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:418
export const BROKEFIREHYDRENT____header_global_cfc7e9ba1175b3f0 = ((u32(((u32(950) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_96a93bd82127544740a7d465() {
  return __cxx_static_address_96a93bd82127544740a7d465.reference || (__cxx_static_address_96a93bd82127544740a7d465.reference = {
    __cReference: true,
    get value() { return BROKEFIREHYDRENT____header_global_cfc7e9ba1175b3f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:419
export const BOX____header_global_5df831e70dcca2be = ((u32(((u32(951) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_61118cddd929c318dbd0112a() {
  return __cxx_static_address_61118cddd929c318dbd0112a.reference || (__cxx_static_address_61118cddd929c318dbd0112a.reference = {
    __cReference: true,
    get value() { return BOX____header_global_5df831e70dcca2be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_4afeda1cd79f9be6 = ((u32(((u32(952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca2661faaba99548542d5747() {
  return __cxx_static_address_ca2661faaba99548542d5747.reference || (__cxx_static_address_ca2661faaba99548542d5747.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_4afeda1cd79f9be6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:421
export const BOTTLE1____header_global_751e9bd74879fe1f = ((u32(((u32(954) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1cd7dbe9e9451958426a2fa6() {
  return __cxx_static_address_1cd7dbe9e9451958426a2fa6.reference || (__cxx_static_address_1cd7dbe9e9451958426a2fa6.reference = {
    __cReference: true,
    get value() { return BOTTLE1____header_global_751e9bd74879fe1f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:422
export const BOTTLE2____header_global_5520d09e602b2db0 = ((u32(((u32(955) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e206f9be91eff263f7c301cf() {
  return __cxx_static_address_e206f9be91eff263f7c301cf.reference || (__cxx_static_address_e206f9be91eff263f7c301cf.reference = {
    __cReference: true,
    get value() { return BOTTLE2____header_global_5520d09e602b2db0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:423
export const BOTTLE3____header_global_f56e6cdd103c7680 = ((u32(((u32(956) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_513d6ad3ca6559b7565f42ad() {
  return __cxx_static_address_513d6ad3ca6559b7565f42ad.reference || (__cxx_static_address_513d6ad3ca6559b7565f42ad.reference = {
    __cReference: true,
    get value() { return BOTTLE3____header_global_f56e6cdd103c7680; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:424
export const BOTTLE4____header_global_311ae381f98bb2ed = ((u32(((u32(957) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3217bbaf1e97932d2b9b0c90() {
  return __cxx_static_address_3217bbaf1e97932d2b9b0c90.reference || (__cxx_static_address_3217bbaf1e97932d2b9b0c90.reference = {
    __cReference: true,
    get value() { return BOTTLE4____header_global_311ae381f98bb2ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_68c2a3d9a170006b = ((u32(((u32(963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c62195307c9ab702469392() {
  return __cxx_static_address_27c62195307c9ab702469392.reference || (__cxx_static_address_27c62195307c9ab702469392.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_68c2a3d9a170006b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_f143812491bfaa88 = ((u32(((u32(964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_341acef9695fa49599bfac87() {
  return __cxx_static_address_341acef9695fa49599bfac87.reference || (__cxx_static_address_341acef9695fa49599bfac87.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_f143812491bfaa88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_c6adeffbb2c7a5d1 = ((u32(((u32(965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63447732436a08678a0d71fa() {
  return __cxx_static_address_63447732436a08678a0d71fa.reference || (__cxx_static_address_63447732436a08678a0d71fa.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_c6adeffbb2c7a5d1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:428
export const HYDROPLANT____header_global_e545a0a18585bd75 = ((u32(((u32(969) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e8ece0bd6f5cc5f7c5220590() {
  return __cxx_static_address_e8ece0bd6f5cc5f7c5220590.reference || (__cxx_static_address_e8ece0bd6f5cc5f7c5220590.reference = {
    __cReference: true,
    get value() { return HYDROPLANT____header_global_e545a0a18585bd75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:429
export const OCEANSPRITE1____header_global_f9b7fecf20421603 = ((u32(((u32(971) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a9ed300ab153a6b16e4223fb() {
  return __cxx_static_address_a9ed300ab153a6b16e4223fb.reference || (__cxx_static_address_a9ed300ab153a6b16e4223fb.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE1____header_global_f9b7fecf20421603; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:430
export const OCEANSPRITE2____header_global_bf2b8de55b445851 = ((u32(((u32(972) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a59d07228e1745263f0c0630() {
  return __cxx_static_address_a59d07228e1745263f0c0630.reference || (__cxx_static_address_a59d07228e1745263f0c0630.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE2____header_global_bf2b8de55b445851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:431
export const OCEANSPRITE3____header_global_9f749f4d427aae4b = ((u32(((u32(973) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91797c1a8f037ea6e069c435() {
  return __cxx_static_address_91797c1a8f037ea6e069c435.reference || (__cxx_static_address_91797c1a8f037ea6e069c435.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE3____header_global_9f749f4d427aae4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:432
export const OCEANSPRITE4____header_global_ce804b5b10f6bf3d = ((u32(((u32(974) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db50c4124be6675973556878() {
  return __cxx_static_address_db50c4124be6675973556878.reference || (__cxx_static_address_db50c4124be6675973556878.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE4____header_global_ce804b5b10f6bf3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:433
export const OCEANSPRITE5____header_global_991974dc152ed8ac = ((u32(((u32(975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ae55f6d8f08ad08d763767aa() {
  return __cxx_static_address_ae55f6d8f08ad08d763767aa.reference || (__cxx_static_address_ae55f6d8f08ad08d763767aa.reference = {
    __cReference: true,
    get value() { return OCEANSPRITE5____header_global_991974dc152ed8ac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:434
export const GENERICPOLE____header_global_1f794c4878d15877 = ((u32(((u32(977) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d035ca8512fc802cb3b189e9() {
  return __cxx_static_address_d035ca8512fc802cb3b189e9.reference || (__cxx_static_address_d035ca8512fc802cb3b189e9.reference = {
    __cReference: true,
    get value() { return GENERICPOLE____header_global_1f794c4878d15877; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:435
export const CONE____header_global_de545ca22ed4f810 = ((u32(((u32(978) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b8d74ec7b99f96effe4a6e67() {
  return __cxx_static_address_b8d74ec7b99f96effe4a6e67.reference || (__cxx_static_address_b8d74ec7b99f96effe4a6e67.reference = {
    __cReference: true,
    get value() { return CONE____header_global_de545ca22ed4f810; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:436
export const HANGLIGHT____header_global_0284f636cc7ac8e1 = ((u32(((u32(979) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_172d1e56c1d4f71e20e1bdf9() {
  return __cxx_static_address_172d1e56c1d4f71e20e1bdf9.reference || (__cxx_static_address_172d1e56c1d4f71e20e1bdf9.reference = {
    __cReference: true,
    get value() { return HANGLIGHT____header_global_0284f636cc7ac8e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:437
export const HYDRENT____header_global_e6b1e5dc1428f7ee = ((u32(((u32(981) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bca107c482c0169399d6c41() {
  return __cxx_static_address_4bca107c482c0169399d6c41.reference || (__cxx_static_address_4bca107c482c0169399d6c41.reference = {
    __cReference: true,
    get value() { return HYDRENT____header_global_e6b1e5dc1428f7ee; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:438
export const MASKWALL14____header_global_b9212caf3ab04ea5 = ((u32(((u32(988) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb7895916aaac9b0c1770148() {
  return __cxx_static_address_cb7895916aaac9b0c1770148.reference || (__cxx_static_address_cb7895916aaac9b0c1770148.reference = {
    __cReference: true,
    get value() { return MASKWALL14____header_global_b9212caf3ab04ea5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:439
export const TIRE____header_global_9af4b34f9630d5b0 = ((u32(((u32(990) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ee5deeab9c2a5453f236e5a() {
  return __cxx_static_address_5ee5deeab9c2a5453f236e5a.reference || (__cxx_static_address_5ee5deeab9c2a5453f236e5a.reference = {
    __cReference: true,
    get value() { return TIRE____header_global_9af4b34f9630d5b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:440
export const PIPE5____header_global_b796abd1d47d0a88 = ((u32(((u32(994) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ca773b83d03a97ede64c9b4() {
  return __cxx_static_address_2ca773b83d03a97ede64c9b4.reference || (__cxx_static_address_2ca773b83d03a97ede64c9b4.reference = {
    __cReference: true,
    get value() { return PIPE5____header_global_b796abd1d47d0a88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:441
export const PIPE6____header_global_3fd4d953f7ad60c1 = ((u32(((u32(995) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_345418c8d43fa29d376f527b() {
  return __cxx_static_address_345418c8d43fa29d376f527b.reference || (__cxx_static_address_345418c8d43fa29d376f527b.reference = {
    __cReference: true,
    get value() { return PIPE6____header_global_3fd4d953f7ad60c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:442
export const PIPE4____header_global_c1ff0c475e5562e8 = ((u32(((u32(996) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a073b2d8d42de58a24ba9e1() {
  return __cxx_static_address_1a073b2d8d42de58a24ba9e1.reference || (__cxx_static_address_1a073b2d8d42de58a24ba9e1.reference = {
    __cReference: true,
    get value() { return PIPE4____header_global_c1ff0c475e5562e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:443
export const PIPE4B____header_global_b8168e6edbf09c0d = ((u32(((u32(997) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c772fab7800afa27b49c1f2c() {
  return __cxx_static_address_c772fab7800afa27b49c1f2c.reference || (__cxx_static_address_c772fab7800afa27b49c1f2c.reference = {
    __cReference: true,
    get value() { return PIPE4B____header_global_b8168e6edbf09c0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:444
export const BROKEHYDROPLANT____header_global_4671b5d35fd2d6bd = ((u32(((u32(1003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b3bb1de1a996b37b58d8b80() {
  return __cxx_static_address_2b3bb1de1a996b37b58d8b80.reference || (__cxx_static_address_2b3bb1de1a996b37b58d8b80.reference = {
    __cReference: true,
    get value() { return BROKEHYDROPLANT____header_global_4671b5d35fd2d6bd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:445
export const PIPE5B____header_global_59f376987019be73 = ((u32(((u32(1005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bff19b8721396fd30c41af9() {
  return __cxx_static_address_4bff19b8721396fd30c41af9.reference || (__cxx_static_address_4bff19b8721396fd30c41af9.reference = {
    __cReference: true,
    get value() { return PIPE5B____header_global_59f376987019be73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_82e5b7c2aa7cb3ae = ((u32(((u32(1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e703e3dac508154a862c7099() {
  return __cxx_static_address_e703e3dac508154a862c7099.reference || (__cxx_static_address_e703e3dac508154a862c7099.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_82e5b7c2aa7cb3ae; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_627c298a11b79872 = ((u32(((u32(1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd18c41a65d77e18ff99b1fc() {
  return __cxx_static_address_cd18c41a65d77e18ff99b1fc.reference || (__cxx_static_address_cd18c41a65d77e18ff99b1fc.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_627c298a11b79872; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_8afc3bc002f61ecc = ((u32(((u32(1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_584d737eb90c2c58f8ec8a17() {
  return __cxx_static_address_584d737eb90c2c58f8ec8a17.reference || (__cxx_static_address_584d737eb90c2c58f8ec8a17.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_8afc3bc002f61ecc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:449
export const BOTTLE5____header_global_c356c0927da1f7bc = ((u32(((u32(1012) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fe506b6c4118085f20aa7087() {
  return __cxx_static_address_fe506b6c4118085f20aa7087.reference || (__cxx_static_address_fe506b6c4118085f20aa7087.reference = {
    __cReference: true,
    get value() { return BOTTLE5____header_global_c356c0927da1f7bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:450
export const BOTTLE6____header_global_41901625cf7c26e2 = ((u32(((u32(1013) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_362b2a2c74defc5dbfcda2d4() {
  return __cxx_static_address_362b2a2c74defc5dbfcda2d4.reference || (__cxx_static_address_362b2a2c74defc5dbfcda2d4.reference = {
    __cReference: true,
    get value() { return BOTTLE6____header_global_41901625cf7c26e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:451
export const BOTTLE8____header_global_c2c0a9d7619ac33c = ((u32(((u32(1014) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9938253b76ab30f335fde37() {
  return __cxx_static_address_b9938253b76ab30f335fde37.reference || (__cxx_static_address_b9938253b76ab30f335fde37.reference = {
    __cReference: true,
    get value() { return BOTTLE8____header_global_c2c0a9d7619ac33c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:452
export const SPOTLITE____header_global_1d87c498d2ebc597 = ((u32(((u32(1020) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b4a92b4e2193b694660b759() {
  return __cxx_static_address_1b4a92b4e2193b694660b759.reference || (__cxx_static_address_1b4a92b4e2193b694660b759.reference = {
    __cReference: true,
    get value() { return SPOTLITE____header_global_1d87c498d2ebc597; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:453
export const MASKWALL15____header_global_3ef2f1d1bf4aeb27 = ((u32(((u32(1024) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b12bcb99ead39432c75adba1() {
  return __cxx_static_address_b12bcb99ead39432c75adba1.reference || (__cxx_static_address_b12bcb99ead39432c75adba1.reference = {
    __cReference: true,
    get value() { return MASKWALL15____header_global_3ef2f1d1bf4aeb27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:454
export const BOTTLE7____header_global_f1e07cd765fe0bd5 = ((u32(((u32(1025) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1a6577f1e5a7192293e5ee3() {
  return __cxx_static_address_a1a6577f1e5a7192293e5ee3.reference || (__cxx_static_address_a1a6577f1e5a7192293e5ee3.reference = {
    __cReference: true,
    get value() { return BOTTLE7____header_global_f1e07cd765fe0bd5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:455
export const HORSEONSIDE____header_global_962a0411785aeed3 = ((u32(((u32(1026) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c98a595e3ad4a1340a586d64() {
  return __cxx_static_address_c98a595e3ad4a1340a586d64.reference || (__cxx_static_address_c98a595e3ad4a1340a586d64.reference = {
    __cReference: true,
    get value() { return HORSEONSIDE____header_global_962a0411785aeed3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:456
export const GLASSPIECES____header_global_2edf3015c0e94ed8 = ((u32(((u32(1031) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0d00e8d48312e2df970deec8() {
  return __cxx_static_address_0d00e8d48312e2df970deec8.reference || (__cxx_static_address_0d00e8d48312e2df970deec8.reference = {
    __cReference: true,
    get value() { return GLASSPIECES____header_global_2edf3015c0e94ed8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_ca4bcd2807aba4fb = ((u32(((u32(1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3b253aae360b97ed94ee476() {
  return __cxx_static_address_c3b253aae360b97ed94ee476.reference || (__cxx_static_address_c3b253aae360b97ed94ee476.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_ca4bcd2807aba4fb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:458
export const MASKWALL6____header_global_1e39356d8021da05 = ((u32(((u32(1059) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_674a8caa9675ea57d7f96c71() {
  return __cxx_static_address_674a8caa9675ea57d7f96c71.reference || (__cxx_static_address_674a8caa9675ea57d7f96c71.reference = {
    __cReference: true,
    get value() { return MASKWALL6____header_global_1e39356d8021da05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:459
export const RUBBERCAN____header_global_27ccd341fdbc9741 = ((u32(((u32(1062) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d55a060d994cee9107fd66b() {
  return __cxx_static_address_1d55a060d994cee9107fd66b.reference || (__cxx_static_address_1d55a060d994cee9107fd66b.reference = {
    __cReference: true,
    get value() { return RUBBERCAN____header_global_27ccd341fdbc9741; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:460
export const PLUG____header_global_b2cede7cdeab6160 = ((u32(((u32(1069) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_23d6f424f638aae36d78773c() {
  return __cxx_static_address_23d6f424f638aae36d78773c.reference || (__cxx_static_address_23d6f424f638aae36d78773c.reference = {
    __cReference: true,
    get value() { return PLUG____header_global_b2cede7cdeab6160; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:461
export const OOZFILTER____header_global_43068549dadb5693 = ((u32(((u32(1079) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ff353bbcd444076b1390421() {
  return __cxx_static_address_2ff353bbcd444076b1390421.reference || (__cxx_static_address_2ff353bbcd444076b1390421.reference = {
    __cReference: true,
    get value() { return OOZFILTER____header_global_43068549dadb5693; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:462
export const FLOORPLASMA____header_global_dd00e7de5de49789 = ((u32(((u32(1082) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1590eea5431ca1866e55f44() {
  return __cxx_static_address_c1590eea5431ca1866e55f44.reference || (__cxx_static_address_c1590eea5431ca1866e55f44.reference = {
    __cReference: true,
    get value() { return FLOORPLASMA____header_global_dd00e7de5de49789; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:463
export const REACTOR____header_global_7c28f27b9969d054 = ((u32(((u32(1088) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0a160be760fa5ac4ba1c399c() {
  return __cxx_static_address_0a160be760fa5ac4ba1c399c.reference || (__cxx_static_address_0a160be760fa5ac4ba1c399c.reference = {
    __cReference: true,
    get value() { return REACTOR____header_global_7c28f27b9969d054; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:464
export const REACTORSPARK____header_global_a30c22716dff230f = ((u32(((u32(1092) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92c7e4f70000a9c0e979a4f1() {
  return __cxx_static_address_92c7e4f70000a9c0e979a4f1.reference || (__cxx_static_address_92c7e4f70000a9c0e979a4f1.reference = {
    __cReference: true,
    get value() { return REACTORSPARK____header_global_a30c22716dff230f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:465
export const REACTORBURNT____header_global_41744fddf614e06d = ((u32(((u32(1096) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07b2994e179bd1c97973ce5d() {
  return __cxx_static_address_07b2994e179bd1c97973ce5d.reference || (__cxx_static_address_07b2994e179bd1c97973ce5d.reference = {
    __cReference: true,
    get value() { return REACTORBURNT____header_global_41744fddf614e06d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:466
export const DOORTILE15____header_global_c806b7c4314134d6 = ((u32(((u32(1102) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24f78123da0eeef8b33b8682() {
  return __cxx_static_address_24f78123da0eeef8b33b8682.reference || (__cxx_static_address_24f78123da0eeef8b33b8682.reference = {
    __cReference: true,
    get value() { return DOORTILE15____header_global_c806b7c4314134d6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:467
export const HANDSWITCH____header_global_9fda3d8852557559 = ((u32(((u32(1111) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a19bfc3232fefb549435e8f() {
  return __cxx_static_address_4a19bfc3232fefb549435e8f.reference || (__cxx_static_address_4a19bfc3232fefb549435e8f.reference = {
    __cReference: true,
    get value() { return HANDSWITCH____header_global_9fda3d8852557559; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:468
export const CIRCLEPANNEL____header_global_aba9ffe5075c11c0 = ((u32(((u32(1113) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1d1b748faafb42d6d4173e82() {
  return __cxx_static_address_1d1b748faafb42d6d4173e82.reference || (__cxx_static_address_1d1b748faafb42d6d4173e82.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNEL____header_global_aba9ffe5075c11c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:469
export const CIRCLEPANNELBROKE____header_global_3d6e84e5e4b8106d = ((u32(((u32(1114) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3fea0e03fa74bd76bf20bfd3() {
  return __cxx_static_address_3fea0e03fa74bd76bf20bfd3.reference || (__cxx_static_address_3fea0e03fa74bd76bf20bfd3.reference = {
    __cReference: true,
    get value() { return CIRCLEPANNELBROKE____header_global_3d6e84e5e4b8106d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:470
export const PULLSWITCH____header_global_5ada9f9ad34f8267 = ((u32(((u32(1122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_31380f4e661458ccf8d5ec7b() {
  return __cxx_static_address_31380f4e661458ccf8d5ec7b.reference || (__cxx_static_address_31380f4e661458ccf8d5ec7b.reference = {
    __cReference: true,
    get value() { return PULLSWITCH____header_global_5ada9f9ad34f8267; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:471
export const MASKWALL8____header_global_a72d37a1e40b881b = ((u32(((u32(1124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dbba0e29c9feed8ad1cba562() {
  return __cxx_static_address_dbba0e29c9feed8ad1cba562.reference || (__cxx_static_address_dbba0e29c9feed8ad1cba562.reference = {
    __cReference: true,
    get value() { return MASKWALL8____header_global_a72d37a1e40b881b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:472
export const BIGHOLE____header_global_8ba2d00182e4f6a4 = ((u32(((u32(1141) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f04f08a64527aead8b05f350() {
  return __cxx_static_address_f04f08a64527aead8b05f350.reference || (__cxx_static_address_f04f08a64527aead8b05f350.reference = {
    __cReference: true,
    get value() { return BIGHOLE____header_global_8ba2d00182e4f6a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:473
export const ALIENSWITCH____header_global_cc9758af9275d341 = ((u32(((u32(1142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2ca28261e850664637a8f19() {
  return __cxx_static_address_e2ca28261e850664637a8f19.reference || (__cxx_static_address_e2ca28261e850664637a8f19.reference = {
    __cReference: true,
    get value() { return ALIENSWITCH____header_global_cc9758af9275d341; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:474
export const DOORTILE21____header_global_106fd804a4c94a1b = ((u32(((u32(1144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_92f74a6897f3aad9dc2a004c() {
  return __cxx_static_address_92f74a6897f3aad9dc2a004c.reference || (__cxx_static_address_92f74a6897f3aad9dc2a004c.reference = {
    __cReference: true,
    get value() { return DOORTILE21____header_global_106fd804a4c94a1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:475
export const HANDPRINTSWITCH____header_global_87749e04c88e2933 = ((u32(((u32(1155) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d15df9227033f08c75b2f2ec() {
  return __cxx_static_address_d15df9227033f08c75b2f2ec.reference || (__cxx_static_address_d15df9227033f08c75b2f2ec.reference = {
    __cReference: true,
    get value() { return HANDPRINTSWITCH____header_global_87749e04c88e2933; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:476
export const BOTTLE10____header_global_3bd096f5078b9e98 = ((u32(((u32(1157) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1e303994141089e0c027a63() {
  return __cxx_static_address_b1e303994141089e0c027a63.reference || (__cxx_static_address_b1e303994141089e0c027a63.reference = {
    __cReference: true,
    get value() { return BOTTLE10____header_global_3bd096f5078b9e98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:477
export const BOTTLE11____header_global_9c89ec18f9f5f6da = ((u32(((u32(1158) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_69938751b08256b3d74b13c8() {
  return __cxx_static_address_69938751b08256b3d74b13c8.reference || (__cxx_static_address_69938751b08256b3d74b13c8.reference = {
    __cReference: true,
    get value() { return BOTTLE11____header_global_9c89ec18f9f5f6da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:478
export const BOTTLE12____header_global_d482becd6f215bc8 = ((u32(((u32(1159) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e250f5490684986c7495cd6a() {
  return __cxx_static_address_e250f5490684986c7495cd6a.reference || (__cxx_static_address_e250f5490684986c7495cd6a.reference = {
    __cReference: true,
    get value() { return BOTTLE12____header_global_d482becd6f215bc8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:479
export const BOTTLE13____header_global_c5698c2147e6fabb = ((u32(((u32(1160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa0b746090935ebd4f9f9d7f() {
  return __cxx_static_address_fa0b746090935ebd4f9f9d7f.reference || (__cxx_static_address_fa0b746090935ebd4f9f9d7f.reference = {
    __cReference: true,
    get value() { return BOTTLE13____header_global_c5698c2147e6fabb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:480
export const BOTTLE14____header_global_b756eae1ca2211bf = ((u32(((u32(1161) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9939341d73f199efd816f7c8() {
  return __cxx_static_address_9939341d73f199efd816f7c8.reference || (__cxx_static_address_9939341d73f199efd816f7c8.reference = {
    __cReference: true,
    get value() { return BOTTLE14____header_global_b756eae1ca2211bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:481
export const BOTTLE15____header_global_cb7ae47bfd8e4bd1 = ((u32(((u32(1162) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbf61cfcb068377c3e1c1166() {
  return __cxx_static_address_bbf61cfcb068377c3e1c1166.reference || (__cxx_static_address_bbf61cfcb068377c3e1c1166.reference = {
    __cReference: true,
    get value() { return BOTTLE15____header_global_cb7ae47bfd8e4bd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:482
export const BOTTLE16____header_global_e4f49c7e139bd7d8 = ((u32(((u32(1163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_19c1f7cf53e9a1185f494191() {
  return __cxx_static_address_19c1f7cf53e9a1185f494191.reference || (__cxx_static_address_19c1f7cf53e9a1185f494191.reference = {
    __cReference: true,
    get value() { return BOTTLE16____header_global_e4f49c7e139bd7d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:483
export const BOTTLE17____header_global_0cdaa6d3ec9cb515 = ((u32(((u32(1164) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df06dbb3a804c4d2e953b2e1() {
  return __cxx_static_address_df06dbb3a804c4d2e953b2e1.reference || (__cxx_static_address_df06dbb3a804c4d2e953b2e1.reference = {
    __cReference: true,
    get value() { return BOTTLE17____header_global_0cdaa6d3ec9cb515; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:484
export const BOTTLE18____header_global_2980f95d2fce5a5b = ((u32(((u32(1165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_317255f28bcd40f682ec7785() {
  return __cxx_static_address_317255f28bcd40f682ec7785.reference || (__cxx_static_address_317255f28bcd40f682ec7785.reference = {
    __cReference: true,
    get value() { return BOTTLE18____header_global_2980f95d2fce5a5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:485
export const BOTTLE19____header_global_a01524e8b7bc5926 = ((u32(((u32(1166) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6917c290f4494179ac631c0() {
  return __cxx_static_address_d6917c290f4494179ac631c0.reference || (__cxx_static_address_d6917c290f4494179ac631c0.reference = {
    __cReference: true,
    get value() { return BOTTLE19____header_global_a01524e8b7bc5926; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:486
export const DOORTILE17____header_global_99e8fe72e6cb53cc = ((u32(((u32(1169) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_95c8faa96a50312805c0035a() {
  return __cxx_static_address_95c8faa96a50312805c0035a.reference || (__cxx_static_address_95c8faa96a50312805c0035a.reference = {
    __cReference: true,
    get value() { return DOORTILE17____header_global_99e8fe72e6cb53cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:487
export const MASKWALL7____header_global_94a304b5ca755579 = ((u32(((u32(1174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ba7e7037cf07f6542ab3133() {
  return __cxx_static_address_3ba7e7037cf07f6542ab3133.reference || (__cxx_static_address_3ba7e7037cf07f6542ab3133.reference = {
    __cReference: true,
    get value() { return MASKWALL7____header_global_94a304b5ca755579; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:488
export const DOORTILE11____header_global_f5308d230ad198b4 = ((u32(((u32(1178) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15af419e3c96d1d2225c73c3() {
  return __cxx_static_address_15af419e3c96d1d2225c73c3.reference || (__cxx_static_address_15af419e3c96d1d2225c73c3.reference = {
    __cReference: true,
    get value() { return DOORTILE11____header_global_f5308d230ad198b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:489
export const DOORTILE12____header_global_3438d5939254427a = ((u32(((u32(1179) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dd3b422ac5a10ba368e0b72() {
  return __cxx_static_address_5dd3b422ac5a10ba368e0b72.reference || (__cxx_static_address_5dd3b422ac5a10ba368e0b72.reference = {
    __cReference: true,
    get value() { return DOORTILE12____header_global_3438d5939254427a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:490
export const VENDMACHINE____header_global_f8443e3df6c0eadc = ((u32(((u32(1212) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59d51f641521daf1b415d97f() {
  return __cxx_static_address_59d51f641521daf1b415d97f.reference || (__cxx_static_address_59d51f641521daf1b415d97f.reference = {
    __cReference: true,
    get value() { return VENDMACHINE____header_global_f8443e3df6c0eadc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:491
export const COLAMACHINE____header_global_436f13238e1a2b93 = ((u32(((u32(1215) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5f1f88234e08f890c4370c9() {
  return __cxx_static_address_a5f1f88234e08f890c4370c9.reference || (__cxx_static_address_a5f1f88234e08f890c4370c9.reference = {
    __cReference: true,
    get value() { return COLAMACHINE____header_global_436f13238e1a2b93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:492
export const CRANEPOLE____header_global_9a01c658eb0abd8b = ((u32(((u32(1221) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5eafb0f0ea62f014dc37be0d() {
  return __cxx_static_address_5eafb0f0ea62f014dc37be0d.reference || (__cxx_static_address_5eafb0f0ea62f014dc37be0d.reference = {
    __cReference: true,
    get value() { return CRANEPOLE____header_global_9a01c658eb0abd8b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:493
export const CRANE____header_global_eef48221a7958672 = ((u32(((u32(1222) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1119630c21061100902b4d16() {
  return __cxx_static_address_1119630c21061100902b4d16.reference || (__cxx_static_address_1119630c21061100902b4d16.reference = {
    __cReference: true,
    get value() { return CRANE____header_global_eef48221a7958672; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:494
export const BARBROKE____header_global_128a1b73cc9a5d78 = ((u32(((u32(1225) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_932649869def83d46c6bc8a1() {
  return __cxx_static_address_932649869def83d46c6bc8a1.reference || (__cxx_static_address_932649869def83d46c6bc8a1.reference = {
    __cReference: true,
    get value() { return BARBROKE____header_global_128a1b73cc9a5d78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_bd7b92a40eb82a5e = ((u32(((u32(1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_999c0a79ac9fd91b95121c56() {
  return __cxx_static_address_999c0a79ac9fd91b95121c56.reference || (__cxx_static_address_999c0a79ac9fd91b95121c56.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_bd7b92a40eb82a5e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:496
export const NUKEBARREL____header_global_e105ba16adbbf7fc = ((u32(((u32(1227) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dde58722bf30b1a241b7a56c() {
  return __cxx_static_address_dde58722bf30b1a241b7a56c.reference || (__cxx_static_address_dde58722bf30b1a241b7a56c.reference = {
    __cReference: true,
    get value() { return NUKEBARREL____header_global_e105ba16adbbf7fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:497
export const NUKEBARRELDENTED____header_global_747ac6673860c924 = ((u32(((u32(1228) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90ea184c4455b2a553b3d972() {
  return __cxx_static_address_90ea184c4455b2a553b3d972.reference || (__cxx_static_address_90ea184c4455b2a553b3d972.reference = {
    __cReference: true,
    get value() { return NUKEBARRELDENTED____header_global_747ac6673860c924; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:498
export const NUKEBARRELLEAKED____header_global_4cbaa728ad27084f = ((u32(((u32(1229) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_789ab5b8c7d931571346503e() {
  return __cxx_static_address_789ab5b8c7d931571346503e.reference || (__cxx_static_address_789ab5b8c7d931571346503e.reference = {
    __cReference: true,
    get value() { return NUKEBARRELLEAKED____header_global_4cbaa728ad27084f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:499
export const CANWITHSOMETHING____header_global_4c20b7616330ab2e = ((u32(((u32(1232) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_45c26f88355be7cbb721377d() {
  return __cxx_static_address_45c26f88355be7cbb721377d.reference || (__cxx_static_address_45c26f88355be7cbb721377d.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING____header_global_4c20b7616330ab2e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_7e642ab31909c334 = ((u32(((u32(1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53a1d189a35e92dd435cc080() {
  return __cxx_static_address_53a1d189a35e92dd435cc080.reference || (__cxx_static_address_53a1d189a35e92dd435cc080.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_7e642ab31909c334; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:501
export const BANNER____header_global_cba68aa5b319df43 = ((u32(((u32(1236) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e50550e0ee47b1db2f24eba() {
  return __cxx_static_address_9e50550e0ee47b1db2f24eba.reference || (__cxx_static_address_9e50550e0ee47b1db2f24eba.reference = {
    __cReference: true,
    get value() { return BANNER____header_global_cba68aa5b319df43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:502
export const EXPLODINGBARREL____header_global_9423707dd711765e = ((u32(((u32(1238) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_870a7bc9169c2fc7dc47696a() {
  return __cxx_static_address_870a7bc9169c2fc7dc47696a.reference || (__cxx_static_address_870a7bc9169c2fc7dc47696a.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL____header_global_9423707dd711765e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:503
export const EXPLODINGBARREL2____header_global_0d5ba1e33b2d9148 = ((u32(((u32(1239) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4af73a440adc6a2846a143a7() {
  return __cxx_static_address_4af73a440adc6a2846a143a7.reference || (__cxx_static_address_4af73a440adc6a2846a143a7.reference = {
    __cReference: true,
    get value() { return EXPLODINGBARREL2____header_global_0d5ba1e33b2d9148; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:504
export const FIREBARREL____header_global_a846f629bdcb6403 = ((u32(((u32(1240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3aeb4197c1962b55b0e72561() {
  return __cxx_static_address_3aeb4197c1962b55b0e72561.reference || (__cxx_static_address_3aeb4197c1962b55b0e72561.reference = {
    __cReference: true,
    get value() { return FIREBARREL____header_global_a846f629bdcb6403; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:505
export const SEENINE____header_global_bc4374ac3a497d4d = ((u32(((u32(1247) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7bdc8615e506dd814f19f8e3() {
  return __cxx_static_address_7bdc8615e506dd814f19f8e3.reference || (__cxx_static_address_7bdc8615e506dd814f19f8e3.reference = {
    __cReference: true,
    get value() { return SEENINE____header_global_bc4374ac3a497d4d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:506
export const SEENINEDEAD____header_global_2877b6b92d0245b5 = ((u32(((u32(1248) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0879fd263572b03c5d3ac509() {
  return __cxx_static_address_0879fd263572b03c5d3ac509.reference || (__cxx_static_address_0879fd263572b03c5d3ac509.reference = {
    __cReference: true,
    get value() { return SEENINEDEAD____header_global_2877b6b92d0245b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:507
export const STEAM____header_global_1ab92985fa2a0db3 = ((u32(((u32(1250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_26bb2b48c375b44deac805b4() {
  return __cxx_static_address_26bb2b48c375b44deac805b4.reference || (__cxx_static_address_26bb2b48c375b44deac805b4.reference = {
    __cReference: true,
    get value() { return STEAM____header_global_1ab92985fa2a0db3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:508
export const CEILINGSTEAM____header_global_bfc2d14244d75be6 = ((u32(((u32(1255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d88a50736525f46082e5a36c() {
  return __cxx_static_address_d88a50736525f46082e5a36c.reference || (__cxx_static_address_d88a50736525f46082e5a36c.reference = {
    __cReference: true,
    get value() { return CEILINGSTEAM____header_global_bfc2d14244d75be6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:509
export const PIPE6B____header_global_7496cb783df23796 = ((u32(((u32(1260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a6f1c9f833983c8a8e7a61a0() {
  return __cxx_static_address_a6f1c9f833983c8a8e7a61a0.reference || (__cxx_static_address_a6f1c9f833983c8a8e7a61a0.reference = {
    __cReference: true,
    get value() { return PIPE6B____header_global_7496cb783df23796; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:510
export const TRANSPORTERBEAM____header_global_0eabb686360f0638 = ((u32(((u32(1261) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9cf92c5838e754c0b01944fc() {
  return __cxx_static_address_9cf92c5838e754c0b01944fc.reference || (__cxx_static_address_9cf92c5838e754c0b01944fc.reference = {
    __cReference: true,
    get value() { return TRANSPORTERBEAM____header_global_0eabb686360f0638; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_ef5e7bfd68d16cf8 = ((u32(((u32(1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13123b28eaadbda1a09fc765() {
  return __cxx_static_address_13123b28eaadbda1a09fc765.reference || (__cxx_static_address_13123b28eaadbda1a09fc765.reference = {
    __cReference: true,
    get value() { return RAT____header_global_ef5e7bfd68d16cf8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:512
export const TRASH____header_global_fa400f6a6f5ed2fe = ((u32(((u32(1272) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9bf42c79d46fd62542a96743() {
  return __cxx_static_address_9bf42c79d46fd62542a96743.reference || (__cxx_static_address_9bf42c79d46fd62542a96743.reference = {
    __cReference: true,
    get value() { return TRASH____header_global_fa400f6a6f5ed2fe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_170477e9139e1246 = ((u32(((u32(1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_089cf898177411fa7dc1629b() {
  return __cxx_static_address_089cf898177411fa7dc1629b.reference || (__cxx_static_address_089cf898177411fa7dc1629b.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_170477e9139e1246; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_f8d4dd14bc5ee685 = ((u32(((u32(1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bd9e17cb89a7fb3a8146c539() {
  return __cxx_static_address_bd9e17cb89a7fb3a8146c539.reference || (__cxx_static_address_bd9e17cb89a7fb3a8146c539.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_f8d4dd14bc5ee685; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:515
export const BLANKSCREEN____header_global_4110270edf2c32ed = ((u32(((u32(1293) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5dcc80a78d87305f26f5c87e() {
  return __cxx_static_address_5dcc80a78d87305f26f5c87e.reference || (__cxx_static_address_5dcc80a78d87305f26f5c87e.reference = {
    __cReference: true,
    get value() { return BLANKSCREEN____header_global_4110270edf2c32ed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_61b8852fa7eb6071 = ((u32(((u32(1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ef58892142b8957e9df4c763() {
  return __cxx_static_address_ef58892142b8957e9df4c763.reference || (__cxx_static_address_ef58892142b8957e9df4c763.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_61b8852fa7eb6071; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_fbf9ac57df34c8e7 = ((u32(((u32(1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e63597ce6fa57c3a04f301c() {
  return __cxx_static_address_0e63597ce6fa57c3a04f301c.reference || (__cxx_static_address_0e63597ce6fa57c3a04f301c.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_fbf9ac57df34c8e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_476d9fdd6c8d102f = ((u32(((u32(1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f0e6bd713507009daa44450() {
  return __cxx_static_address_5f0e6bd713507009daa44450.reference || (__cxx_static_address_5f0e6bd713507009daa44450.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_476d9fdd6c8d102f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_56e6ac8f8a3a604f = ((u32(((u32(1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f7fec90b5cbd0f1332cd3e00() {
  return __cxx_static_address_f7fec90b5cbd0f1332cd3e00.reference || (__cxx_static_address_f7fec90b5cbd0f1332cd3e00.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_56e6ac8f8a3a604f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_49d12e3cf7f639bc = ((u32(((u32(1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_677e5bcdc93561b80dfaa4ef() {
  return __cxx_static_address_677e5bcdc93561b80dfaa4ef.reference || (__cxx_static_address_677e5bcdc93561b80dfaa4ef.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_49d12e3cf7f639bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_ce00c515a4c5ce81 = ((u32(((u32(1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5f72291ab9c0caaeb4c0338a() {
  return __cxx_static_address_5f72291ab9c0caaeb4c0338a.reference || (__cxx_static_address_5f72291ab9c0caaeb4c0338a.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_ce00c515a4c5ce81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_d783067254b41113 = ((u32(((u32(1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7a30178442f718ff12707782() {
  return __cxx_static_address_7a30178442f718ff12707782.reference || (__cxx_static_address_7a30178442f718ff12707782.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_d783067254b41113; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_e17bbd89040369e0 = ((u32(((u32(1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c76fbe655b74a020302bb0fe() {
  return __cxx_static_address_c76fbe655b74a020302bb0fe.reference || (__cxx_static_address_c76fbe655b74a020302bb0fe.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_e17bbd89040369e0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_53390c26607637d5 = ((u32(((u32(1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_daf2394fa445420db5291e09() {
  return __cxx_static_address_daf2394fa445420db5291e09.reference || (__cxx_static_address_daf2394fa445420db5291e09.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_53390c26607637d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_4b78c6238edf6211 = ((u32(((u32(1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8dda41f3c0ec25a0fb9308e4() {
  return __cxx_static_address_8dda41f3c0ec25a0fb9308e4.reference || (__cxx_static_address_8dda41f3c0ec25a0fb9308e4.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_4b78c6238edf6211; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_54d49eded29e9c46 = ((u32(((u32(1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9d6c99d7761206669c75cce1() {
  return __cxx_static_address_9d6c99d7761206669c75cce1.reference || (__cxx_static_address_9d6c99d7761206669c75cce1.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_54d49eded29e9c46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_f7ae2e5f8db94af1 = ((u32(((u32(1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_33d0ee0531f170e1bb2bc923() {
  return __cxx_static_address_33d0ee0531f170e1bb2bc923.reference || (__cxx_static_address_33d0ee0531f170e1bb2bc923.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_f7ae2e5f8db94af1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:528
export const HELECOPT____header_global_848e3d2eb147c4c5 = ((u32(((u32(1346) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df2143ea706fae26804d7adf() {
  return __cxx_static_address_df2143ea706fae26804d7adf.reference || (__cxx_static_address_df2143ea706fae26804d7adf.reference = {
    __cReference: true,
    get value() { return HELECOPT____header_global_848e3d2eb147c4c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_f744433fb23edbb1 = ((u32(((u32(1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f634de63a480e5c7a8391b4() {
  return __cxx_static_address_6f634de63a480e5c7a8391b4.reference || (__cxx_static_address_6f634de63a480e5c7a8391b4.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_f744433fb23edbb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:530
export const HOLODUKE____header_global_5891baad6122a829 = ((u32(((u32(1348) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_494e2b4c82a323ee4aa23788() {
  return __cxx_static_address_494e2b4c82a323ee4aa23788.reference || (__cxx_static_address_494e2b4c82a323ee4aa23788.reference = {
    __cReference: true,
    get value() { return HOLODUKE____header_global_5891baad6122a829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:531
export const SPACEMARINE____header_global_349694766e519481 = ((u32(((u32(1353) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c7821a041a6e1d6deb5a8bd() {
  return __cxx_static_address_3c7821a041a6e1d6deb5a8bd.reference || (__cxx_static_address_3c7821a041a6e1d6deb5a8bd.reference = {
    __cReference: true,
    get value() { return SPACEMARINE____header_global_349694766e519481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:532
export const INDY____header_global_931c22c6262147b5 = ((u32(((u32(1355) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c3748be796ea7ea972113c9() {
  return __cxx_static_address_0c3748be796ea7ea972113c9.reference || (__cxx_static_address_0c3748be796ea7ea972113c9.reference = {
    __cReference: true,
    get value() { return INDY____header_global_931c22c6262147b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_98e0ccd5433345bf = ((u32(((u32(1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2dfa976a8a4e5d73be20a81a() {
  return __cxx_static_address_2dfa976a8a4e5d73be20a81a.reference || (__cxx_static_address_2dfa976a8a4e5d73be20a81a.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_98e0ccd5433345bf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_91ba086b4c8a932f = ((u32(((u32(1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_79271452f2fec22daca7974a() {
  return __cxx_static_address_79271452f2fec22daca7974a.reference || (__cxx_static_address_79271452f2fec22daca7974a.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_91ba086b4c8a932f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:535
export const MONK____header_global_c5779c3a1b76a28f = ((u32(((u32(1352) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7246aaefe604bd2ad1622f09() {
  return __cxx_static_address_7246aaefe604bd2ad1622f09.reference || (__cxx_static_address_7246aaefe604bd2ad1622f09.reference = {
    __cReference: true,
    get value() { return MONK____header_global_c5779c3a1b76a28f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:536
export const LUKE____header_global_3f9f7c5bf414ffa6 = ((u32(((u32(1354) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6a6d7f97fd31d409f4a2b3bb() {
  return __cxx_static_address_6a6d7f97fd31d409f4a2b3bb.reference || (__cxx_static_address_6a6d7f97fd31d409f4a2b3bb.reference = {
    __cReference: true,
    get value() { return LUKE____header_global_3f9f7c5bf414ffa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_064640f23bb58ff1 = ((u32(((u32(1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_00f019cf511687163e60708a() {
  return __cxx_static_address_00f019cf511687163e60708a.reference || (__cxx_static_address_00f019cf511687163e60708a.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_064640f23bb58ff1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:538
export const WATERSPLASH2____header_global_8f34a6766a01b056 = ((u32(((u32(1380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6ff576ebce7899630b3114ff() {
  return __cxx_static_address_6ff576ebce7899630b3114ff.reference || (__cxx_static_address_6ff576ebce7899630b3114ff.reference = {
    __cReference: true,
    get value() { return WATERSPLASH2____header_global_8f34a6766a01b056; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:539
export const FIREVASE____header_global_06a809fc849b4a84 = ((u32(((u32(1390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b37cb93bb7518ffbb6aea707() {
  return __cxx_static_address_b37cb93bb7518ffbb6aea707.reference || (__cxx_static_address_b37cb93bb7518ffbb6aea707.reference = {
    __cReference: true,
    get value() { return FIREVASE____header_global_06a809fc849b4a84; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_0f0f7649be14afb5 = ((u32(((u32(1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bc34fed986c33e1fb97b082() {
  return __cxx_static_address_4bc34fed986c33e1fb97b082.reference || (__cxx_static_address_4bc34fed986c33e1fb97b082.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_0f0f7649be14afb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:541
export const APLAYERTOP____header_global_6f33633ede2b3b60 = ((u32(((u32(1400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7045f16d812d805ba4e9385() {
  return __cxx_static_address_b7045f16d812d805ba4e9385.reference || (__cxx_static_address_b7045f16d812d805ba4e9385.reference = {
    __cReference: true,
    get value() { return APLAYERTOP____header_global_6f33633ede2b3b60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_9f8a8c530de5e121 = ((u32(((u32(1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2e587075a4bb1f514dc161a3() {
  return __cxx_static_address_2e587075a4bb1f514dc161a3.reference || (__cxx_static_address_2e587075a4bb1f514dc161a3.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_9f8a8c530de5e121; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_824ea6bca1256b75 = ((u32(((u32(1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_18858a43ac7a719995ce8eef() {
  return __cxx_static_address_18858a43ac7a719995ce8eef.reference || (__cxx_static_address_18858a43ac7a719995ce8eef.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_824ea6bca1256b75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_ad46cfd568b645ca = ((u32(((u32(1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46c1714a2dbb07900dd1efb0() {
  return __cxx_static_address_46c1714a2dbb07900dd1efb0.reference || (__cxx_static_address_46c1714a2dbb07900dd1efb0.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_ad46cfd568b645ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_96d2857d1520190f = ((u32(((u32(1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1a484a3f33bb314f8d1ace3() {
  return __cxx_static_address_c1a484a3f33bb314f8d1ace3.reference || (__cxx_static_address_c1a484a3f33bb314f8d1ace3.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_96d2857d1520190f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_9fd9886a9220179b = ((u32(((u32(1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f900021cb2359e3645a0343f() {
  return __cxx_static_address_f900021cb2359e3645a0343f.reference || (__cxx_static_address_f900021cb2359e3645a0343f.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_9fd9886a9220179b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_252713f2bd2019e8 = ((u32(((u32(1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c4f3c9ae777c7039264ce774() {
  return __cxx_static_address_c4f3c9ae777c7039264ce774.reference || (__cxx_static_address_c4f3c9ae777c7039264ce774.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_252713f2bd2019e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:548
export const SHARK____header_global_2e0ac3bfbc4b5c75 = ((u32(((u32(1550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee83367b6233cfbe6c71454d() {
  return __cxx_static_address_ee83367b6233cfbe6c71454d.reference || (__cxx_static_address_ee83367b6233cfbe6c71454d.reference = {
    __cReference: true,
    get value() { return SHARK____header_global_2e0ac3bfbc4b5c75; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:549
export const BLOOD____header_global_e6ee12e0a5453ed8 = ((u32(((u32(1620) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d7fde7bd9b036739f89143ea() {
  return __cxx_static_address_d7fde7bd9b036739f89143ea.reference || (__cxx_static_address_d7fde7bd9b036739f89143ea.reference = {
    __cReference: true,
    get value() { return BLOOD____header_global_e6ee12e0a5453ed8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_9aefbabe37b1a211 = ((u32(((u32(1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_98e649d1d44d8fe0cb236fd9() {
  return __cxx_static_address_98e649d1d44d8fe0cb236fd9.reference || (__cxx_static_address_98e649d1d44d8fe0cb236fd9.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_9aefbabe37b1a211; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:551
export const TRANSPORTERSTAR____header_global_d9f9c9116aeaf875 = ((u32(((u32(1630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3f8d9060d1b21b93a5897cb() {
  return __cxx_static_address_c3f8d9060d1b21b93a5897cb.reference || (__cxx_static_address_c3f8d9060d1b21b93a5897cb.reference = {
    __cReference: true,
    get value() { return TRANSPORTERSTAR____header_global_d9f9c9116aeaf875; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:552
export const SPIT____header_global_9a1449625762408c = ((u32(((u32(1636) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd61419a1357d623dd4abb20() {
  return __cxx_static_address_dd61419a1357d623dd4abb20.reference || (__cxx_static_address_dd61419a1357d623dd4abb20.reference = {
    __cReference: true,
    get value() { return SPIT____header_global_9a1449625762408c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:553
export const LOOGIE____header_global_8243fc10bb4e6a79 = ((u32(((u32(1637) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fa578db674b8f4b143648e5() {
  return __cxx_static_address_8fa578db674b8f4b143648e5.reference || (__cxx_static_address_8fa578db674b8f4b143648e5.reference = {
    __cReference: true,
    get value() { return LOOGIE____header_global_8243fc10bb4e6a79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:554
export const FIST____header_global_30427617b92bc51d = ((u32(((u32(1640) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3dee7297e45157dae74e3f2c() {
  return __cxx_static_address_3dee7297e45157dae74e3f2c.reference || (__cxx_static_address_3dee7297e45157dae74e3f2c.reference = {
    __cReference: true,
    get value() { return FIST____header_global_30427617b92bc51d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_c4081bdf69c02d07 = ((u32(((u32(1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6214b866418b69fe7a8b35dc() {
  return __cxx_static_address_6214b866418b69fe7a8b35dc.reference || (__cxx_static_address_6214b866418b69fe7a8b35dc.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_c4081bdf69c02d07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_3d58860455e835fd = ((u32(((u32(1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_db347b44de2e4c349aa379f9() {
  return __cxx_static_address_db347b44de2e4c349aa379f9.reference || (__cxx_static_address_db347b44de2e4c349aa379f9.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_3d58860455e835fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:557
export const TONGUE____header_global_e24927c48f6e8099 = ((u32(((u32(1647) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf591feb20eb6b4fb0c80ba0() {
  return __cxx_static_address_bf591feb20eb6b4fb0c80ba0.reference || (__cxx_static_address_bf591feb20eb6b4fb0c80ba0.reference = {
    __cReference: true,
    get value() { return TONGUE____header_global_e24927c48f6e8099; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:558
export const MORTER____header_global_53930074d1253a93 = ((u32(((u32(1650) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b242e31e0ea985efcf2dc0e4() {
  return __cxx_static_address_b242e31e0ea985efcf2dc0e4.reference || (__cxx_static_address_b242e31e0ea985efcf2dc0e4.reference = {
    __cReference: true,
    get value() { return MORTER____header_global_53930074d1253a93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_f1fcdfea87d46d5b = ((u32(((u32(1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_21b61408a3f0864ca4dad5ee() {
  return __cxx_static_address_21b61408a3f0864ca4dad5ee.reference || (__cxx_static_address_21b61408a3f0864ca4dad5ee.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_f1fcdfea87d46d5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:560
export const RADIUSEXPLOSION____header_global_7af98db5b0bc7c99 = ((u32(((u32(1670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a46e44f13c337898ed9a219() {
  return __cxx_static_address_9a46e44f13c337898ed9a219.reference || (__cxx_static_address_9a46e44f13c337898ed9a219.reference = {
    __cReference: true,
    get value() { return RADIUSEXPLOSION____header_global_7af98db5b0bc7c99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:561
export const FORCERIPPLE____header_global_665f599c664c4f99 = ((u32(((u32(1671) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77811748067cb3e2f0089ad4() {
  return __cxx_static_address_77811748067cb3e2f0089ad4.reference || (__cxx_static_address_77811748067cb3e2f0089ad4.reference = {
    __cReference: true,
    get value() { return FORCERIPPLE____header_global_665f599c664c4f99; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:562
export const LIZTROOP____header_global_d5afd45ca94010bc = ((u32(((u32(1680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8c1f5b016f67d294afa241d3() {
  return __cxx_static_address_8c1f5b016f67d294afa241d3.reference || (__cxx_static_address_8c1f5b016f67d294afa241d3.reference = {
    __cReference: true,
    get value() { return LIZTROOP____header_global_d5afd45ca94010bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:563
export const LIZTROOPRUNNING____header_global_13e46d5348a23b66 = ((u32(((u32(1681) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b5153cddd910e6cd817ee8c1() {
  return __cxx_static_address_b5153cddd910e6cd817ee8c1.reference || (__cxx_static_address_b5153cddd910e6cd817ee8c1.reference = {
    __cReference: true,
    get value() { return LIZTROOPRUNNING____header_global_13e46d5348a23b66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:564
export const LIZTROOPSTAYPUT____header_global_8988edd7025e25a2 = ((u32(((u32(1682) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_628c3e700d5e740f5b40bf2a() {
  return __cxx_static_address_628c3e700d5e740f5b40bf2a.reference || (__cxx_static_address_628c3e700d5e740f5b40bf2a.reference = {
    __cReference: true,
    get value() { return LIZTROOPSTAYPUT____header_global_8988edd7025e25a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:565
export const LIZTROOPSHOOT____header_global_8735442d01d66f5a = ((u32(((u32(1715) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7c2b7a61ad63b867de12e857() {
  return __cxx_static_address_7c2b7a61ad63b867de12e857.reference || (__cxx_static_address_7c2b7a61ad63b867de12e857.reference = {
    __cReference: true,
    get value() { return LIZTROOPSHOOT____header_global_8735442d01d66f5a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:566
export const LIZTROOPJETPACK____header_global_5a6842b08043e88f = ((u32(((u32(1725) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab4c464b9b72f6b52eb04129() {
  return __cxx_static_address_ab4c464b9b72f6b52eb04129.reference || (__cxx_static_address_ab4c464b9b72f6b52eb04129.reference = {
    __cReference: true,
    get value() { return LIZTROOPJETPACK____header_global_5a6842b08043e88f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:567
export const LIZTROOPONTOILET____header_global_7b97117d0f72749c = ((u32(((u32(1741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e3c0e60830962b94ae5f3075() {
  return __cxx_static_address_e3c0e60830962b94ae5f3075.reference || (__cxx_static_address_e3c0e60830962b94ae5f3075.reference = {
    __cReference: true,
    get value() { return LIZTROOPONTOILET____header_global_7b97117d0f72749c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:568
export const LIZTROOPJUSTSIT____header_global_a6b97dfa7d503c78 = ((u32(((u32(1742) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2bab0a68e9535c9e567010b() {
  return __cxx_static_address_b2bab0a68e9535c9e567010b.reference || (__cxx_static_address_b2bab0a68e9535c9e567010b.reference = {
    __cReference: true,
    get value() { return LIZTROOPJUSTSIT____header_global_a6b97dfa7d503c78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:569
export const LIZTROOPDUCKING____header_global_1492608d80bbdbed = ((u32(((u32(1744) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_467d92e4730b92ed1947c09f() {
  return __cxx_static_address_467d92e4730b92ed1947c09f.reference || (__cxx_static_address_467d92e4730b92ed1947c09f.reference = {
    __cReference: true,
    get value() { return LIZTROOPDUCKING____header_global_1492608d80bbdbed; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_1e9794ca9976fc2d = ((u32(((u32(1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63f660a5732e78ee6297ec93() {
  return __cxx_static_address_63f660a5732e78ee6297ec93.reference || (__cxx_static_address_63f660a5732e78ee6297ec93.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_1e9794ca9976fc2d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_7923f63237de0b0a = ((u32(((u32(1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_04ba03164cbdbcd495a4e606() {
  return __cxx_static_address_04ba03164cbdbcd495a4e606.reference || (__cxx_static_address_04ba03164cbdbcd495a4e606.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_7923f63237de0b0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_2de72a9cb4b09c1b = ((u32(((u32(1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1bc22929f833050e48ba3317() {
  return __cxx_static_address_1bc22929f833050e48ba3317.reference || (__cxx_static_address_1bc22929f833050e48ba3317.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_2de72a9cb4b09c1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:573
export const OCTABRAIN____header_global_3b8b04d1451103af = ((u32(((u32(1820) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9de8652f8e3723099e86724() {
  return __cxx_static_address_e9de8652f8e3723099e86724.reference || (__cxx_static_address_e9de8652f8e3723099e86724.reference = {
    __cReference: true,
    get value() { return OCTABRAIN____header_global_3b8b04d1451103af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:574
export const OCTABRAINSTAYPUT____header_global_c1aa2345aea0927c = ((u32(((u32(1821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f582b0d3752bc60a64a5224() {
  return __cxx_static_address_2f582b0d3752bc60a64a5224.reference || (__cxx_static_address_2f582b0d3752bc60a64a5224.reference = {
    __cReference: true,
    get value() { return OCTABRAINSTAYPUT____header_global_c1aa2345aea0927c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:575
export const INNERJAW____header_global_e2f4b795c1eeeec2 = ((u32(((u32(1860) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4bfb2fd79f1343fa8be36b87() {
  return __cxx_static_address_4bfb2fd79f1343fa8be36b87.reference || (__cxx_static_address_4bfb2fd79f1343fa8be36b87.reference = {
    __cReference: true,
    get value() { return INNERJAW____header_global_e2f4b795c1eeeec2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:576
export const DRONE____header_global_4bf7362bb265cb40 = ((u32(((u32(1880) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9b234057040a84cb92556019() {
  return __cxx_static_address_9b234057040a84cb92556019.reference || (__cxx_static_address_9b234057040a84cb92556019.reference = {
    __cReference: true,
    get value() { return DRONE____header_global_4bf7362bb265cb40; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_0d48f7ffe5c723b5 = ((u32(((u32(1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6245a0267106679ec7b030c5() {
  return __cxx_static_address_6245a0267106679ec7b030c5.reference || (__cxx_static_address_6245a0267106679ec7b030c5.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_0d48f7ffe5c723b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:578
export const COMMANDER____header_global_43667d4b27cee62f = ((u32(((u32(1920) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c689b12d78f57f4f90ba4a58() {
  return __cxx_static_address_c689b12d78f57f4f90ba4a58.reference || (__cxx_static_address_c689b12d78f57f4f90ba4a58.reference = {
    __cReference: true,
    get value() { return COMMANDER____header_global_43667d4b27cee62f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:579
export const COMMANDERSTAYPUT____header_global_20aa79283fc19e0a = ((u32(((u32(1921) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c8723bf55d5fbc6251a28df() {
  return __cxx_static_address_6c8723bf55d5fbc6251a28df.reference || (__cxx_static_address_6c8723bf55d5fbc6251a28df.reference = {
    __cReference: true,
    get value() { return COMMANDERSTAYPUT____header_global_20aa79283fc19e0a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_de09ad02bb10b927 = ((u32(((u32(1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_121ce01f5f2471b4bec4ec35() {
  return __cxx_static_address_121ce01f5f2471b4bec4ec35.reference || (__cxx_static_address_121ce01f5f2471b4bec4ec35.reference = {
    __cReference: true,
    get value() { return RECON____header_global_de09ad02bb10b927; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:581
export const TANK____header_global_4579ccf0a12aff29 = ((u32(((u32(1975) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3e08a0d208c13ef2decb6d6() {
  return __cxx_static_address_a3e08a0d208c13ef2decb6d6.reference || (__cxx_static_address_a3e08a0d208c13ef2decb6d6.reference = {
    __cReference: true,
    get value() { return TANK____header_global_4579ccf0a12aff29; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:582
export const PIGCOP____header_global_6dd89b65b41fbd96 = ((u32(((u32(2000) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_058678dc5b9d8c64831d0e01() {
  return __cxx_static_address_058678dc5b9d8c64831d0e01.reference || (__cxx_static_address_058678dc5b9d8c64831d0e01.reference = {
    __cReference: true,
    get value() { return PIGCOP____header_global_6dd89b65b41fbd96; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:583
export const PIGCOPSTAYPUT____header_global_70064b40ca8683af = ((u32(((u32(2001) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_30b672a36b1eec4dd9adf182() {
  return __cxx_static_address_30b672a36b1eec4dd9adf182.reference || (__cxx_static_address_30b672a36b1eec4dd9adf182.reference = {
    __cReference: true,
    get value() { return PIGCOPSTAYPUT____header_global_70064b40ca8683af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:584
export const PIGCOPDIVE____header_global_ad2bfcfd285a67da = ((u32(((u32(2045) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6690f9eed1d16ccba36cbfb8() {
  return __cxx_static_address_6690f9eed1d16ccba36cbfb8.reference || (__cxx_static_address_6690f9eed1d16ccba36cbfb8.reference = {
    __cReference: true,
    get value() { return PIGCOPDIVE____header_global_ad2bfcfd285a67da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:585
export const LIZMAN____header_global_86df12e318874c26 = ((u32(((u32(2120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_27c63a46a3f77f6d85d9530c() {
  return __cxx_static_address_27c63a46a3f77f6d85d9530c.reference || (__cxx_static_address_27c63a46a3f77f6d85d9530c.reference = {
    __cReference: true,
    get value() { return LIZMAN____header_global_86df12e318874c26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:586
export const LIZMANSTAYPUT____header_global_644bfd0a0c134784 = ((u32(((u32(2121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a2f9b139d3eb0f3bb84f205() {
  return __cxx_static_address_1a2f9b139d3eb0f3bb84f205.reference || (__cxx_static_address_1a2f9b139d3eb0f3bb84f205.reference = {
    __cReference: true,
    get value() { return LIZMANSTAYPUT____header_global_644bfd0a0c134784; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:587
export const LIZMANSPITTING____header_global_ab0efb1e1cdfa2e8 = ((u32(((u32(2150) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fa757e141b2171303aa037cb() {
  return __cxx_static_address_fa757e141b2171303aa037cb.reference || (__cxx_static_address_fa757e141b2171303aa037cb.reference = {
    __cReference: true,
    get value() { return LIZMANSPITTING____header_global_ab0efb1e1cdfa2e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:588
export const LIZMANFEEDING____header_global_9f539150dd0a62ba = ((u32(((u32(2160) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cfbc4a988086f8ee9283e99() {
  return __cxx_static_address_2cfbc4a988086f8ee9283e99.reference || (__cxx_static_address_2cfbc4a988086f8ee9283e99.reference = {
    __cReference: true,
    get value() { return LIZMANFEEDING____header_global_9f539150dd0a62ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:589
export const LIZMANJUMP____header_global_efdadbacc516d598 = ((u32(((u32(2165) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_161b825f4a10acb6e8479015() {
  return __cxx_static_address_161b825f4a10acb6e8479015.reference || (__cxx_static_address_161b825f4a10acb6e8479015.reference = {
    __cReference: true,
    get value() { return LIZMANJUMP____header_global_efdadbacc516d598; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:590
export const FECES____header_global_fb6167ec602ed639 = ((u32(((u32(2200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bbc872cad1bb88ff995b3934() {
  return __cxx_static_address_bbc872cad1bb88ff995b3934.reference || (__cxx_static_address_bbc872cad1bb88ff995b3934.reference = {
    __cReference: true,
    get value() { return FECES____header_global_fb6167ec602ed639; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_66bd24ad4a74839a = ((u32(((u32(2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4d5ebc9742076ded1ec7a1fb() {
  return __cxx_static_address_4d5ebc9742076ded1ec7a1fb.reference || (__cxx_static_address_4d5ebc9742076ded1ec7a1fb.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_66bd24ad4a74839a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_e2128c23e529f983 = ((u32(((u32(2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_346245aa319018a0c6004d7d() {
  return __cxx_static_address_346245aa319018a0c6004d7d.reference || (__cxx_static_address_346245aa319018a0c6004d7d.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_e2128c23e529f983; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_95ffca8ba982848f = ((u32(((u32(2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf2ce6344097e246330ae81b() {
  return __cxx_static_address_bf2ce6344097e246330ae81b.reference || (__cxx_static_address_bf2ce6344097e246330ae81b.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_95ffca8ba982848f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_f9e42adfe82324bb = ((u32(((u32(2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25f998738916c97d3c0ccfbb() {
  return __cxx_static_address_25f998738916c97d3c0ccfbb.reference || (__cxx_static_address_25f998738916c97d3c0ccfbb.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_f9e42adfe82324bb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_4491c899aeba20c1 = ((u32(((u32(2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5b2be018ba7d4ecfcb36c76e() {
  return __cxx_static_address_5b2be018ba7d4ecfcb36c76e.reference || (__cxx_static_address_5b2be018ba7d4ecfcb36c76e.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_4491c899aeba20c1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_c88fa37f4868386e = ((u32(((u32(2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_159032b25db004a6135a2ab0() {
  return __cxx_static_address_159032b25db004a6135a2ab0.reference || (__cxx_static_address_159032b25db004a6135a2ab0.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_c88fa37f4868386e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_8784e6bee14ff596 = ((u32(((u32(2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ce938b17f9affafea10bce4() {
  return __cxx_static_address_2ce938b17f9affafea10bce4.reference || (__cxx_static_address_2ce938b17f9affafea10bce4.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_8784e6bee14ff596; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_76b1df41ff82d4f0 = ((u32(((u32(2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c763236af97682079026d7bc() {
  return __cxx_static_address_c763236af97682079026d7bc.reference || (__cxx_static_address_c763236af97682079026d7bc.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_76b1df41ff82d4f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_27b25aa44c0276d3 = ((u32(((u32(2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab3b5889dcfc6045a39a0296() {
  return __cxx_static_address_ab3b5889dcfc6045a39a0296.reference || (__cxx_static_address_ab3b5889dcfc6045a39a0296.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_27b25aa44c0276d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_ff64c8effe5d16c0 = ((u32(((u32(2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7de80086dd2f9e59415ece03() {
  return __cxx_static_address_7de80086dd2f9e59415ece03.reference || (__cxx_static_address_7de80086dd2f9e59415ece03.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_ff64c8effe5d16c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_188bc0a38250db04 = ((u32(((u32(2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e8369b20ee10dbcdfe45330() {
  return __cxx_static_address_4e8369b20ee10dbcdfe45330.reference || (__cxx_static_address_4e8369b20ee10dbcdfe45330.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_188bc0a38250db04; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_3ab299c00ac9715b = ((u32(((u32(2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_72c4771ce8ffce85b4fb0130() {
  return __cxx_static_address_72c4771ce8ffce85b4fb0130.reference || (__cxx_static_address_72c4771ce8ffce85b4fb0130.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_3ab299c00ac9715b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_34ec5d291508cf93 = ((u32(((u32(2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c32103b10312485b80795de9() {
  return __cxx_static_address_c32103b10312485b80795de9.reference || (__cxx_static_address_c32103b10312485b80795de9.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_34ec5d291508cf93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_0093867da3113cb6 = ((u32(((u32(2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_783be80922b0e61c219925d7() {
  return __cxx_static_address_783be80922b0e61c219925d7.reference || (__cxx_static_address_783be80922b0e61c219925d7.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_0093867da3113cb6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_ced132cbcee2e147 = ((u32(((u32(2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c780a3bab7e2e6dd7c41d5b() {
  return __cxx_static_address_0c780a3bab7e2e6dd7c41d5b.reference || (__cxx_static_address_0c780a3bab7e2e6dd7c41d5b.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_ced132cbcee2e147; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_06bc9ca4cd1785b9 = ((u32(((u32(2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e71e7e9387bb9d09e319c20e() {
  return __cxx_static_address_e71e7e9387bb9d09e319c20e.reference || (__cxx_static_address_e71e7e9387bb9d09e319c20e.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_06bc9ca4cd1785b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_5cdfe8d3964c456f = ((u32(((u32(2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a5910fae626e1a5ea1dd7f5() {
  return __cxx_static_address_1a5910fae626e1a5ea1dd7f5.reference || (__cxx_static_address_1a5910fae626e1a5ea1dd7f5.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_5cdfe8d3964c456f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_543c0be985fced97 = ((u32(((u32(2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c19682687279e2efde4e215f() {
  return __cxx_static_address_c19682687279e2efde4e215f.reference || (__cxx_static_address_c19682687279e2efde4e215f.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_543c0be985fced97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:609
export const WALLBLOOD1____header_global_05f399b263a3c51d = ((u32(((u32(2301) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f0a6c5a500de2c8c1a38d5f8() {
  return __cxx_static_address_f0a6c5a500de2c8c1a38d5f8.reference || (__cxx_static_address_f0a6c5a500de2c8c1a38d5f8.reference = {
    __cReference: true,
    get value() { return WALLBLOOD1____header_global_05f399b263a3c51d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:610
export const WALLBLOOD2____header_global_fec11cf0288c133c = ((u32(((u32(2302) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_080afe1b7dc84e2e4e849f49() {
  return __cxx_static_address_080afe1b7dc84e2e4e849f49.reference || (__cxx_static_address_080afe1b7dc84e2e4e849f49.reference = {
    __cReference: true,
    get value() { return WALLBLOOD2____header_global_fec11cf0288c133c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:611
export const WALLBLOOD3____header_global_bb59d804379dfa05 = ((u32(((u32(2303) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af3291ff3e59f97af9552330() {
  return __cxx_static_address_af3291ff3e59f97af9552330.reference || (__cxx_static_address_af3291ff3e59f97af9552330.reference = {
    __cReference: true,
    get value() { return WALLBLOOD3____header_global_bb59d804379dfa05; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:612
export const WALLBLOOD4____header_global_c4a90c4fb7265285 = ((u32(((u32(2304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fb3bd1754be3cf96538d700() {
  return __cxx_static_address_6fb3bd1754be3cf96538d700.reference || (__cxx_static_address_6fb3bd1754be3cf96538d700.reference = {
    __cReference: true,
    get value() { return WALLBLOOD4____header_global_c4a90c4fb7265285; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:613
export const WALLBLOOD5____header_global_274bc35e4509d612 = ((u32(((u32(2305) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3271a0258d5888157d61d93b() {
  return __cxx_static_address_3271a0258d5888157d61d93b.reference || (__cxx_static_address_3271a0258d5888157d61d93b.reference = {
    __cReference: true,
    get value() { return WALLBLOOD5____header_global_274bc35e4509d612; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:614
export const WALLBLOOD7____header_global_ee8471afb1416040 = ((u32(((u32(2307) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_24e59c874d0b0b85615fe81c() {
  return __cxx_static_address_24e59c874d0b0b85615fe81c.reference || (__cxx_static_address_24e59c874d0b0b85615fe81c.reference = {
    __cReference: true,
    get value() { return WALLBLOOD7____header_global_ee8471afb1416040; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:615
export const WALLBLOOD8____header_global_68460201b52d870f = ((u32(((u32(2308) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5da2c6c4b08e0ae0bdec8678() {
  return __cxx_static_address_5da2c6c4b08e0ae0bdec8678.reference || (__cxx_static_address_5da2c6c4b08e0ae0bdec8678.reference = {
    __cReference: true,
    get value() { return WALLBLOOD8____header_global_68460201b52d870f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_9120c157669a0eef = ((u32(((u32(2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb599d7dc6f40f8d7166fed9() {
  return __cxx_static_address_bb599d7dc6f40f8d7166fed9.reference || (__cxx_static_address_bb599d7dc6f40f8d7166fed9.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_9120c157669a0eef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_9fe7f40724d46960 = ((u32(((u32(2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_46a5e7f733be1770869212e0() {
  return __cxx_static_address_46a5e7f733be1770869212e0.reference || (__cxx_static_address_46a5e7f733be1770869212e0.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_9fe7f40724d46960; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:618
export const CRACKKNUCKLES____header_global_4a7d1d451ceba58b = ((u32(((u32(2324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_91ee268a1710129fb99ed01b() {
  return __cxx_static_address_91ee268a1710129fb99ed01b.reference || (__cxx_static_address_91ee268a1710129fb99ed01b.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLES____header_global_4a7d1d451ceba58b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_b4e8e63b58addb6e = ((u32(((u32(2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_821456622a42155a886a6719() {
  return __cxx_static_address_821456622a42155a886a6719.reference || (__cxx_static_address_821456622a42155a886a6719.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_b4e8e63b58addb6e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_a8579109b1b4dcac = ((u32(((u32(2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_636dc461da4f9ec80969a03d() {
  return __cxx_static_address_636dc461da4f9ec80969a03d.reference || (__cxx_static_address_636dc461da4f9ec80969a03d.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_a8579109b1b4dcac; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:621
export const ROTATEGUN____header_global_3428e5b768ed51f8 = ((u32(((u32(2360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_71040890a98332e20213617b() {
  return __cxx_static_address_71040890a98332e20213617b.reference || (__cxx_static_address_71040890a98332e20213617b.reference = {
    __cReference: true,
    get value() { return ROTATEGUN____header_global_3428e5b768ed51f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:622
export const GREENSLIME____header_global_d635c35f0d2e1829 = ((u32(((u32(2370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7072714bab8b34d4e59319da() {
  return __cxx_static_address_7072714bab8b34d4e59319da.reference || (__cxx_static_address_7072714bab8b34d4e59319da.reference = {
    __cReference: true,
    get value() { return GREENSLIME____header_global_d635c35f0d2e1829; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:623
export const WATERDRIPSPLASH____header_global_678420c5b34d3d4f = ((u32(((u32(2380) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3e7fa0fd49561187b07dd0ae() {
  return __cxx_static_address_3e7fa0fd49561187b07dd0ae.reference || (__cxx_static_address_3e7fa0fd49561187b07dd0ae.reference = {
    __cReference: true,
    get value() { return WATERDRIPSPLASH____header_global_678420c5b34d3d4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:624
export const SCRAP6____header_global_3af4530781be4399 = ((u32(((u32(2390) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93af6f14b5cecb665b0f7239() {
  return __cxx_static_address_93af6f14b5cecb665b0f7239.reference || (__cxx_static_address_93af6f14b5cecb665b0f7239.reference = {
    __cReference: true,
    get value() { return SCRAP6____header_global_3af4530781be4399; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_0127a029adadda34 = ((u32(((u32(2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80210eb29506d6979a9916aa() {
  return __cxx_static_address_80210eb29506d6979a9916aa.reference || (__cxx_static_address_80210eb29506d6979a9916aa.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_0127a029adadda34; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_7761e13b75e98908 = ((u32(((u32(2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b968d74a6bfcb5d0d0d39ce5() {
  return __cxx_static_address_b968d74a6bfcb5d0d0d39ce5.reference || (__cxx_static_address_b968d74a6bfcb5d0d0d39ce5.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_7761e13b75e98908; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_07cd16f288a2ac3b = ((u32(((u32(2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_81a89f9c80195c8a2d457a36() {
  return __cxx_static_address_81a89f9c80195c8a2d457a36.reference || (__cxx_static_address_81a89f9c80195c8a2d457a36.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_07cd16f288a2ac3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_a8df83c77d8d4a98 = ((u32(((u32(2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4833120b1858a4666c7dfbc() {
  return __cxx_static_address_f4833120b1858a4666c7dfbc.reference || (__cxx_static_address_f4833120b1858a4666c7dfbc.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_a8df83c77d8d4a98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_bbecfb050b37ac76 = ((u32(((u32(2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0a421a68c31bcfdd3570668() {
  return __cxx_static_address_b0a421a68c31bcfdd3570668.reference || (__cxx_static_address_b0a421a68c31bcfdd3570668.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_bbecfb050b37ac76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:630
export const ORGANTIC____header_global_0fe1c5d601f5feda = ((u32(((u32(2420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f3c62465fab1c77a5b79cb06() {
  return __cxx_static_address_f3c62465fab1c77a5b79cb06.reference || (__cxx_static_address_f3c62465fab1c77a5b79cb06.reference = {
    __cReference: true,
    get value() { return ORGANTIC____header_global_0fe1c5d601f5feda; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:631
export const BETAVERSION____header_global_0574e8d8f053fed2 = ((u32(((u32(2440) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e2de2a43e34eabeaa0e51452() {
  return __cxx_static_address_e2de2a43e34eabeaa0e51452.reference || (__cxx_static_address_e2de2a43e34eabeaa0e51452.reference = {
    __cReference: true,
    get value() { return BETAVERSION____header_global_0574e8d8f053fed2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:632
export const SELECTDIR____header_global_8ff17ac2a3846fa7 = ((u32(((u32(2444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e2dd45ca2e9738da0371833() {
  return __cxx_static_address_9e2dd45ca2e9738da0371833.reference || (__cxx_static_address_9e2dd45ca2e9738da0371833.reference = {
    __cReference: true,
    get value() { return SELECTDIR____header_global_8ff17ac2a3846fa7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:633
export const F1HELP____header_global_48b89b729273bbc2 = ((u32(((u32(2445) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_662219862826bfdb44ee880b() {
  return __cxx_static_address_662219862826bfdb44ee880b.reference || (__cxx_static_address_662219862826bfdb44ee880b.reference = {
    __cReference: true,
    get value() { return F1HELP____header_global_48b89b729273bbc2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_3ff9101fc12f4995 = ((u32(((u32(2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0e5ec5fd2cedb25ff08a7d4() {
  return __cxx_static_address_b0e5ec5fd2cedb25ff08a7d4.reference || (__cxx_static_address_b0e5ec5fd2cedb25ff08a7d4.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_3ff9101fc12f4995; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:635
export const MENUSCREEN____header_global_f38544eef6bbb596 = ((u32(((u32(2456) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b4d33685ed9650741174230() {
  return __cxx_static_address_8b4d33685ed9650741174230.reference || (__cxx_static_address_8b4d33685ed9650741174230.reference = {
    __cReference: true,
    get value() { return MENUSCREEN____header_global_f38544eef6bbb596; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:636
export const MENUBAR____header_global_a5772cf5f56f4bc7 = ((u32(((u32(2457) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eed3ab463465e9b3e400b4a8() {
  return __cxx_static_address_eed3ab463465e9b3e400b4a8.reference || (__cxx_static_address_eed3ab463465e9b3e400b4a8.reference = {
    __cReference: true,
    get value() { return MENUBAR____header_global_a5772cf5f56f4bc7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:637
export const KILLSICON____header_global_ca5dea0f240adf09 = ((u32(((u32(2458) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bfd06bd465b064782b4486d3() {
  return __cxx_static_address_bfd06bd465b064782b4486d3.reference || (__cxx_static_address_bfd06bd465b064782b4486d3.reference = {
    __cReference: true,
    get value() { return KILLSICON____header_global_ca5dea0f240adf09; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:638
export const FIRSTAID_ICON____header_global_488ad1a74670fc4a = ((u32(((u32(2460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3af5a0c8efef39a99be5ffae() {
  return __cxx_static_address_3af5a0c8efef39a99be5ffae.reference || (__cxx_static_address_3af5a0c8efef39a99be5ffae.reference = {
    __cReference: true,
    get value() { return FIRSTAID_ICON____header_global_488ad1a74670fc4a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:639
export const HEAT_ICON____header_global_e3c63c634fa19239 = ((u32(((u32(2461) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_423d3964e0489803a2b563e7() {
  return __cxx_static_address_423d3964e0489803a2b563e7.reference || (__cxx_static_address_423d3964e0489803a2b563e7.reference = {
    __cReference: true,
    get value() { return HEAT_ICON____header_global_e3c63c634fa19239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:640
export const BOTTOMSTATUSBAR____header_global_7e8892aa53382f93 = ((u32(((u32(2462) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9923e747ad7493f13855f1b5() {
  return __cxx_static_address_9923e747ad7493f13855f1b5.reference || (__cxx_static_address_9923e747ad7493f13855f1b5.reference = {
    __cReference: true,
    get value() { return BOTTOMSTATUSBAR____header_global_7e8892aa53382f93; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:641
export const BOOT_ICON____header_global_d00814f934fd639e = ((u32(((u32(2463) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7459d3ad32cbc0384932ae24() {
  return __cxx_static_address_7459d3ad32cbc0384932ae24.reference || (__cxx_static_address_7459d3ad32cbc0384932ae24.reference = {
    __cReference: true,
    get value() { return BOOT_ICON____header_global_d00814f934fd639e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:642
export const FRAGBAR____header_global_1c9ed0ebb71195b9 = ((u32(((u32(2465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1c62b205dfbe85f8ddb647cf() {
  return __cxx_static_address_1c62b205dfbe85f8ddb647cf.reference || (__cxx_static_address_1c62b205dfbe85f8ddb647cf.reference = {
    __cReference: true,
    get value() { return FRAGBAR____header_global_1c9ed0ebb71195b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:643
export const JETPACK_ICON____header_global_15664e7eaee5764f = ((u32(((u32(2467) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f894e4384e9e1720ec395d69() {
  return __cxx_static_address_f894e4384e9e1720ec395d69.reference || (__cxx_static_address_f894e4384e9e1720ec395d69.reference = {
    __cReference: true,
    get value() { return JETPACK_ICON____header_global_15664e7eaee5764f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:644
export const AIRTANK_ICON____header_global_48b34893f26a3921 = ((u32(((u32(2468) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e4ae54de694e46eae6a9056() {
  return __cxx_static_address_4e4ae54de694e46eae6a9056.reference || (__cxx_static_address_4e4ae54de694e46eae6a9056.reference = {
    __cReference: true,
    get value() { return AIRTANK_ICON____header_global_48b34893f26a3921; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:645
export const STEROIDS_ICON____header_global_3ad375fe943bbb53 = ((u32(((u32(2469) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ffac1ba650097f4178373e6() {
  return __cxx_static_address_3ffac1ba650097f4178373e6.reference || (__cxx_static_address_3ffac1ba650097f4178373e6.reference = {
    __cReference: true,
    get value() { return STEROIDS_ICON____header_global_3ad375fe943bbb53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:646
export const HOLODUKE_ICON____header_global_f021e2c20183cdfe = ((u32(((u32(2470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8e9ca8f97632b85c36af596c() {
  return __cxx_static_address_8e9ca8f97632b85c36af596c.reference || (__cxx_static_address_8e9ca8f97632b85c36af596c.reference = {
    __cReference: true,
    get value() { return HOLODUKE_ICON____header_global_f021e2c20183cdfe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:647
export const ACCESS_ICON____header_global_f7375c95b2a79103 = ((u32(((u32(2471) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_beea2996c2830bf41246c1f2() {
  return __cxx_static_address_beea2996c2830bf41246c1f2.reference || (__cxx_static_address_beea2996c2830bf41246c1f2.reference = {
    __cReference: true,
    get value() { return ACCESS_ICON____header_global_f7375c95b2a79103; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:648
export const DIGITALNUM____header_global_b2a620c2d3ca11aa = ((u32(((u32(2472) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f2338ac1d7ddb108b4167786() {
  return __cxx_static_address_f2338ac1d7ddb108b4167786.reference || (__cxx_static_address_f2338ac1d7ddb108b4167786.reference = {
    __cReference: true,
    get value() { return DIGITALNUM____header_global_b2a620c2d3ca11aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:649
export const DUKECAR____header_global_0a8c56f53cf5fcf3 = ((u32(((u32(2491) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aa8fbee96595c2da9243f2b7() {
  return __cxx_static_address_aa8fbee96595c2da9243f2b7.reference || (__cxx_static_address_aa8fbee96595c2da9243f2b7.reference = {
    __cReference: true,
    get value() { return DUKECAR____header_global_0a8c56f53cf5fcf3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:650
export const CAMCORNER____header_global_4ddc0e449862e717 = ((u32(((u32(2482) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b0892b7e5fc394cbd5abc22f() {
  return __cxx_static_address_b0892b7e5fc394cbd5abc22f.reference || (__cxx_static_address_b0892b7e5fc394cbd5abc22f.reference = {
    __cReference: true,
    get value() { return CAMCORNER____header_global_4ddc0e449862e717; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:651
export const CAMLIGHT____header_global_485c2dd1ec5db880 = ((u32(((u32(2484) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94c23f1759c2e5b3be3f410f() {
  return __cxx_static_address_94c23f1759c2e5b3be3f410f.reference || (__cxx_static_address_94c23f1759c2e5b3be3f410f.reference = {
    __cReference: true,
    get value() { return CAMLIGHT____header_global_485c2dd1ec5db880; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:652
export const SLIDEBAR____header_global_27df8d0f8b48b419 = ((u32(((u32(2489) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf4fa5a88cd7d32e7dc9ec7b() {
  return __cxx_static_address_bf4fa5a88cd7d32e7dc9ec7b.reference || (__cxx_static_address_bf4fa5a88cd7d32e7dc9ec7b.reference = {
    __cReference: true,
    get value() { return SLIDEBAR____header_global_27df8d0f8b48b419; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:653
export const DREALMS____header_global_b9a73ba2532d2242 = ((u32(((u32(2492) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f4b8daa19878c4134397a27c() {
  return __cxx_static_address_f4b8daa19878c4134397a27c.reference || (__cxx_static_address_f4b8daa19878c4134397a27c.reference = {
    __cReference: true,
    get value() { return DREALMS____header_global_b9a73ba2532d2242; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:654
export const BETASCREEN____header_global_4ec3e8aa504815c5 = ((u32(((u32(2493) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ddfefffbacf8bc0bc2709081() {
  return __cxx_static_address_ddfefffbacf8bc0bc2709081.reference || (__cxx_static_address_ddfefffbacf8bc0bc2709081.reference = {
    __cReference: true,
    get value() { return BETASCREEN____header_global_4ec3e8aa504815c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:655
export const WINDOWBORDER1____header_global_71746512b502fdf1 = ((u32(((u32(2494) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0933a500cb205aa6f964594c() {
  return __cxx_static_address_0933a500cb205aa6f964594c.reference || (__cxx_static_address_0933a500cb205aa6f964594c.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER1____header_global_71746512b502fdf1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:656
export const TEXTBOX____header_global_11945c570ab28565 = ((u32(((u32(2495) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3265b66c85c18940259c59a1() {
  return __cxx_static_address_3265b66c85c18940259c59a1.reference || (__cxx_static_address_3265b66c85c18940259c59a1.reference = {
    __cReference: true,
    get value() { return TEXTBOX____header_global_11945c570ab28565; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:657
export const WINDOWBORDER2____header_global_fb9f7e0db879ba94 = ((u32(((u32(2496) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5214e1a7430aadbd6fda0b00() {
  return __cxx_static_address_5214e1a7430aadbd6fda0b00.reference || (__cxx_static_address_5214e1a7430aadbd6fda0b00.reference = {
    __cReference: true,
    get value() { return WINDOWBORDER2____header_global_fb9f7e0db879ba94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:658
export const DUKENUKEM____header_global_50cb903e7c51b21a = ((u32(((u32(2497) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a19bb0cc171e6df3af51ce6c() {
  return __cxx_static_address_a19bb0cc171e6df3af51ce6c.reference || (__cxx_static_address_a19bb0cc171e6df3af51ce6c.reference = {
    __cReference: true,
    get value() { return DUKENUKEM____header_global_50cb903e7c51b21a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:659
export const THREEDEE____header_global_0e0ac3420c72dcd9 = ((u32(((u32(2498) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_756a1c65faa5ac5c4f2dfa85() {
  return __cxx_static_address_756a1c65faa5ac5c4f2dfa85.reference || (__cxx_static_address_756a1c65faa5ac5c4f2dfa85.reference = {
    __cReference: true,
    get value() { return THREEDEE____header_global_0e0ac3420c72dcd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:660
export const INGAMEDUKETHREEDEE____header_global_992f9cc357986f02 = ((u32(((u32(2499) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2cb5384832f30a7b25cfb8c6() {
  return __cxx_static_address_2cb5384832f30a7b25cfb8c6.reference || (__cxx_static_address_2cb5384832f30a7b25cfb8c6.reference = {
    __cReference: true,
    get value() { return INGAMEDUKETHREEDEE____header_global_992f9cc357986f02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:661
export const TENSCREEN____header_global_bc9b9c104fe74e43 = ((u32(((u32(2500) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9e6b0d7ec294de8c571d6b29() {
  return __cxx_static_address_9e6b0d7ec294de8c571d6b29.reference || (__cxx_static_address_9e6b0d7ec294de8c571d6b29.reference = {
    __cReference: true,
    get value() { return TENSCREEN____header_global_bc9b9c104fe74e43; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:662
export const PLUTOPAKSPRITE____header_global_c7780fb9a99b2e36 = ((u32(((u32(2501) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_410cd249e1ee800630d3255b() {
  return __cxx_static_address_410cd249e1ee800630d3255b.reference || (__cxx_static_address_410cd249e1ee800630d3255b.reference = {
    __cReference: true,
    get value() { return PLUTOPAKSPRITE____header_global_c7780fb9a99b2e36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:663
export const DEVISTATOR____header_global_99160ac05ba1a556 = ((u32(((u32(2510) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_555275dff2deb3fc22bd2278() {
  return __cxx_static_address_555275dff2deb3fc22bd2278.reference || (__cxx_static_address_555275dff2deb3fc22bd2278.reference = {
    __cReference: true,
    get value() { return DEVISTATOR____header_global_99160ac05ba1a556; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:664
export const KNEE____header_global_6efe765485ce5dbc = ((u32(((u32(2521) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d8113f55c2b6dab22d6b4b7() {
  return __cxx_static_address_7d8113f55c2b6dab22d6b4b7.reference || (__cxx_static_address_7d8113f55c2b6dab22d6b4b7.reference = {
    __cReference: true,
    get value() { return KNEE____header_global_6efe765485ce5dbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:665
export const CROSSHAIR____header_global_164621126ea28a73 = ((u32(((u32(2523) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eab6bf117469b8cce4fe9b50() {
  return __cxx_static_address_eab6bf117469b8cce4fe9b50.reference || (__cxx_static_address_eab6bf117469b8cce4fe9b50.reference = {
    __cReference: true,
    get value() { return CROSSHAIR____header_global_164621126ea28a73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:666
export const FIRSTGUN____header_global_8d3baa8c0b567f6b = ((u32(((u32(2524) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_552a04d5f0b3956d1d05135d() {
  return __cxx_static_address_552a04d5f0b3956d1d05135d.reference || (__cxx_static_address_552a04d5f0b3956d1d05135d.reference = {
    __cReference: true,
    get value() { return FIRSTGUN____header_global_8d3baa8c0b567f6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:667
export const FIRSTGUNRELOAD____header_global_5af0760e555f0e88 = ((u32(((u32(2528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c95a33c524c1f2ee95af214f() {
  return __cxx_static_address_c95a33c524c1f2ee95af214f.reference || (__cxx_static_address_c95a33c524c1f2ee95af214f.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOAD____header_global_5af0760e555f0e88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_c4a152a85765d9c6 = ((u32(((u32(2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd06761f910df0b76abba436() {
  return __cxx_static_address_dd06761f910df0b76abba436.reference || (__cxx_static_address_dd06761f910df0b76abba436.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_c4a152a85765d9c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_800d185f64bf132a = ((u32(((u32(2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb49beeaeba640e65558fe88() {
  return __cxx_static_address_bb49beeaeba640e65558fe88.reference || (__cxx_static_address_bb49beeaeba640e65558fe88.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_800d185f64bf132a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_8d0abd5b8b538b2f = ((u32(((u32(2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_47c1388980259e737d160d2a() {
  return __cxx_static_address_47c1388980259e737d160d2a.reference || (__cxx_static_address_47c1388980259e737d160d2a.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_8d0abd5b8b538b2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:671
export const RPGGUN____header_global_52bf9918e745ae16 = ((u32(((u32(2544) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c3d9be36049234ecdd08001() {
  return __cxx_static_address_9c3d9be36049234ecdd08001.reference || (__cxx_static_address_9c3d9be36049234ecdd08001.reference = {
    __cReference: true,
    get value() { return RPGGUN____header_global_52bf9918e745ae16; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:672
export const FREEZE____header_global_e5fd55ef33064907 = ((u32(((u32(2548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7eefc9ca8a284b9cc93b459() {
  return __cxx_static_address_b7eefc9ca8a284b9cc93b459.reference || (__cxx_static_address_b7eefc9ca8a284b9cc93b459.reference = {
    __cReference: true,
    get value() { return FREEZE____header_global_e5fd55ef33064907; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:673
export const SHRINKER____header_global_d6d3f49bcf58bee0 = ((u32(((u32(2556) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d234f85e00aae2e61d8ca5a1() {
  return __cxx_static_address_d234f85e00aae2e61d8ca5a1.reference || (__cxx_static_address_d234f85e00aae2e61d8ca5a1.reference = {
    __cReference: true,
    get value() { return SHRINKER____header_global_d6d3f49bcf58bee0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:674
export const HANDHOLDINGLASER____header_global_94c1e5e71dc251fc = ((u32(((u32(2563) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0e1bf9cfecbc92a61ce2df13() {
  return __cxx_static_address_0e1bf9cfecbc92a61ce2df13.reference || (__cxx_static_address_0e1bf9cfecbc92a61ce2df13.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGLASER____header_global_94c1e5e71dc251fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:675
export const TRIPBOMB____header_global_48343c24a4071b61 = ((u32(((u32(2566) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f9c580ec4db8ac283cff10bc() {
  return __cxx_static_address_f9c580ec4db8ac283cff10bc.reference || (__cxx_static_address_f9c580ec4db8ac283cff10bc.reference = {
    __cReference: true,
    get value() { return TRIPBOMB____header_global_48343c24a4071b61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_5e95655f6b006d48 = ((u32(((u32(2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_361b48f2bed450ac45c87a85() {
  return __cxx_static_address_361b48f2bed450ac45c87a85.reference || (__cxx_static_address_361b48f2bed450ac45c87a85.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_5e95655f6b006d48; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:677
export const HANDHOLDINGACCESS____header_global_380eb2a8bdff605c = ((u32(((u32(2568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e4ac6bb4212393078d37bf85() {
  return __cxx_static_address_e4ac6bb4212393078d37bf85.reference || (__cxx_static_address_e4ac6bb4212393078d37bf85.reference = {
    __cReference: true,
    get value() { return HANDHOLDINGACCESS____header_global_380eb2a8bdff605c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:678
export const HANDREMOTE____header_global_e5e0803fd6d37ffb = ((u32(((u32(2570) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_70f8b01276aff6a1a5e41d25() {
  return __cxx_static_address_70f8b01276aff6a1a5e41d25.reference || (__cxx_static_address_70f8b01276aff6a1a5e41d25.reference = {
    __cReference: true,
    get value() { return HANDREMOTE____header_global_e5e0803fd6d37ffb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:679
export const HANDTHROW____header_global_4779a68c20375883 = ((u32(((u32(2573) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67944640a2d739808f0b13bb() {
  return __cxx_static_address_67944640a2d739808f0b13bb.reference || (__cxx_static_address_67944640a2d739808f0b13bb.reference = {
    __cReference: true,
    get value() { return HANDTHROW____header_global_4779a68c20375883; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:680
export const TIP____header_global_6eca876bcc80407d = ((u32(((u32(2576) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_de8beaee4d7d34eae876fb15() {
  return __cxx_static_address_de8beaee4d7d34eae876fb15.reference || (__cxx_static_address_de8beaee4d7d34eae876fb15.reference = {
    __cReference: true,
    get value() { return TIP____header_global_6eca876bcc80407d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:681
export const SCUBAMASK____header_global_ff8d1dd9b7ea74d9 = ((u32(((u32(2581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1dbe5aacd08e8164b11aae5() {
  return __cxx_static_address_b1dbe5aacd08e8164b11aae5.reference || (__cxx_static_address_b1dbe5aacd08e8164b11aae5.reference = {
    __cReference: true,
    get value() { return SCUBAMASK____header_global_ff8d1dd9b7ea74d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_c718a910429ef85f = ((u32(((u32(2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_29a00250e161160fea01b785() {
  return __cxx_static_address_29a00250e161160fea01b785.reference || (__cxx_static_address_29a00250e161160fea01b785.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_c718a910429ef85f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:683
export const SHOTSPARK1____header_global_cee97f82a9ef3b87 = ((u32(((u32(2595) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_25f948022000cd9af7514d49() {
  return __cxx_static_address_25f948022000cd9af7514d49.reference || (__cxx_static_address_25f948022000cd9af7514d49.reference = {
    __cReference: true,
    get value() { return SHOTSPARK1____header_global_cee97f82a9ef3b87; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_d4ec8b8643d1b845 = ((u32(((u32(2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8272e832a68724c51e4d9658() {
  return __cxx_static_address_8272e832a68724c51e4d9658.reference || (__cxx_static_address_8272e832a68724c51e4d9658.reference = {
    __cReference: true,
    get value() { return RPG____header_global_d4ec8b8643d1b845; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:685
export const LASERSITE____header_global_a04edd5d57c0aedc = ((u32(((u32(2612) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6e1168e18513103f885b6fa() {
  return __cxx_static_address_f6e1168e18513103f885b6fa.reference || (__cxx_static_address_f6e1168e18513103f885b6fa.reference = {
    __cReference: true,
    get value() { return LASERSITE____header_global_a04edd5d57c0aedc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:686
export const SHOTGUN____header_global_788ed3c484658c8e = ((u32(((u32(2613) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2871314a8376d8bfb0c898bf() {
  return __cxx_static_address_2871314a8376d8bfb0c898bf.reference || (__cxx_static_address_2871314a8376d8bfb0c898bf.reference = {
    __cReference: true,
    get value() { return SHOTGUN____header_global_788ed3c484658c8e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:687
export const BOSS1____header_global_36f7bfc09b2e5d8d = ((u32(((u32(2630) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c40ebb601368118bdfe5c70b() {
  return __cxx_static_address_c40ebb601368118bdfe5c70b.reference || (__cxx_static_address_c40ebb601368118bdfe5c70b.reference = {
    __cReference: true,
    get value() { return BOSS1____header_global_36f7bfc09b2e5d8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:688
export const BOSS1STAYPUT____header_global_2b7b2e97d0e71962 = ((u32(((u32(2631) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_324cd6c415ebf642bfce2307() {
  return __cxx_static_address_324cd6c415ebf642bfce2307.reference || (__cxx_static_address_324cd6c415ebf642bfce2307.reference = {
    __cReference: true,
    get value() { return BOSS1STAYPUT____header_global_2b7b2e97d0e71962; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:689
export const BOSS1SHOOT____header_global_9f4846de476dc3ad = ((u32(((u32(2660) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ab7bac9fad31aea33f3ffc08() {
  return __cxx_static_address_ab7bac9fad31aea33f3ffc08.reference || (__cxx_static_address_ab7bac9fad31aea33f3ffc08.reference = {
    __cReference: true,
    get value() { return BOSS1SHOOT____header_global_9f4846de476dc3ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:690
export const BOSS1LOB____header_global_cfac957bf5330ee0 = ((u32(((u32(2670) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_44d0d20f16bfc195e5fc4817() {
  return __cxx_static_address_44d0d20f16bfc195e5fc4817.reference || (__cxx_static_address_44d0d20f16bfc195e5fc4817.reference = {
    __cReference: true,
    get value() { return BOSS1LOB____header_global_cfac957bf5330ee0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:691
export const BOSSTOP____header_global_c18261384104cd9a = ((u32(((u32(2696) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_63d629779b2861f18e271133() {
  return __cxx_static_address_63d629779b2861f18e271133.reference || (__cxx_static_address_63d629779b2861f18e271133.reference = {
    __cReference: true,
    get value() { return BOSSTOP____header_global_c18261384104cd9a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:692
export const BOSS2____header_global_62140bf693dab600 = ((u32(((u32(2710) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_635b407a961f0c8de62cb5be() {
  return __cxx_static_address_635b407a961f0c8de62cb5be.reference || (__cxx_static_address_635b407a961f0c8de62cb5be.reference = {
    __cReference: true,
    get value() { return BOSS2____header_global_62140bf693dab600; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:693
export const BOSS3____header_global_8dd22a9bed87b7f6 = ((u32(((u32(2760) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dcf2613b65500b73307cdc5d() {
  return __cxx_static_address_dcf2613b65500b73307cdc5d.reference || (__cxx_static_address_dcf2613b65500b73307cdc5d.reference = {
    __cReference: true,
    get value() { return BOSS3____header_global_8dd22a9bed87b7f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:694
export const SPINNINGNUKEICON____header_global_fa8838facefbf8d5 = ((u32(((u32(2813) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d4c9726f5098936c6bb4c6b7() {
  return __cxx_static_address_d4c9726f5098936c6bb4c6b7.reference || (__cxx_static_address_d4c9726f5098936c6bb4c6b7.reference = {
    __cReference: true,
    get value() { return SPINNINGNUKEICON____header_global_fa8838facefbf8d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:695
export const SMALLFNTCURSOR____header_global_7246dd3ec1079587 = ((u32(((u32(2821) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee5bf5db5c789ee2d60f0136() {
  return __cxx_static_address_ee5bf5db5c789ee2d60f0136.reference || (__cxx_static_address_ee5bf5db5c789ee2d60f0136.reference = {
    __cReference: true,
    get value() { return SMALLFNTCURSOR____header_global_7246dd3ec1079587; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:696
export const STARTALPHANUM____header_global_7e43b13310bf2fe3 = ((u32(((u32(2822) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f45c6e4f83ab6ebe3dc1b50() {
  return __cxx_static_address_2f45c6e4f83ab6ebe3dc1b50.reference || (__cxx_static_address_2f45c6e4f83ab6ebe3dc1b50.reference = {
    __cReference: true,
    get value() { return STARTALPHANUM____header_global_7e43b13310bf2fe3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:697
export const ENDALPHANUM____header_global_ab32f6351c7704d3 = ((u32(((u32(2915) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb81a116595508223b88b17a() {
  return __cxx_static_address_bb81a116595508223b88b17a.reference || (__cxx_static_address_bb81a116595508223b88b17a.reference = {
    __cReference: true,
    get value() { return ENDALPHANUM____header_global_ab32f6351c7704d3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:698
export const BIGALPHANUM____header_global_88a0b093f924563e = ((u32(((u32(2940) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b69a76041dd2abf5208dd28() {
  return __cxx_static_address_2b69a76041dd2abf5208dd28.reference || (__cxx_static_address_2b69a76041dd2abf5208dd28.reference = {
    __cReference: true,
    get value() { return BIGALPHANUM____header_global_88a0b093f924563e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:699
export const BIGPERIOD____header_global_e14bceb811c6760c = ((u32(((u32(3002) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d47257e79fdce4756b503f7f() {
  return __cxx_static_address_d47257e79fdce4756b503f7f.reference || (__cxx_static_address_d47257e79fdce4756b503f7f.reference = {
    __cReference: true,
    get value() { return BIGPERIOD____header_global_e14bceb811c6760c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:700
export const BIGCOMMA____header_global_bcefda81e6ce3818 = ((u32(((u32(3003) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fbc7ac09c6ce141064210744() {
  return __cxx_static_address_fbc7ac09c6ce141064210744.reference || (__cxx_static_address_fbc7ac09c6ce141064210744.reference = {
    __cReference: true,
    get value() { return BIGCOMMA____header_global_bcefda81e6ce3818; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:701
export const BIGX____header_global_51c1a218b7545c42 = ((u32(((u32(3004) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_675070ddd1bd4bb31dc6c438() {
  return __cxx_static_address_675070ddd1bd4bb31dc6c438.reference || (__cxx_static_address_675070ddd1bd4bb31dc6c438.reference = {
    __cReference: true,
    get value() { return BIGX____header_global_51c1a218b7545c42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:702
export const BIGQ____header_global_b08b9eb85d05c0a6 = ((u32(((u32(3005) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e1e5d281436d1e8b9159021a() {
  return __cxx_static_address_e1e5d281436d1e8b9159021a.reference || (__cxx_static_address_e1e5d281436d1e8b9159021a.reference = {
    __cReference: true,
    get value() { return BIGQ____header_global_b08b9eb85d05c0a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:703
export const BIGSEMI____header_global_4461f2596731cf1c = ((u32(((u32(3006) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1da3be456fd054cadfdf7704() {
  return __cxx_static_address_1da3be456fd054cadfdf7704.reference || (__cxx_static_address_1da3be456fd054cadfdf7704.reference = {
    __cReference: true,
    get value() { return BIGSEMI____header_global_4461f2596731cf1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:704
export const BIGCOLIN____header_global_cf064df91edf591b = ((u32(((u32(3007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd07c3de5f24cd9c662fea43() {
  return __cxx_static_address_fd07c3de5f24cd9c662fea43.reference || (__cxx_static_address_fd07c3de5f24cd9c662fea43.reference = {
    __cReference: true,
    get value() { return BIGCOLIN____header_global_cf064df91edf591b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:705
export const THREEBYFIVE____header_global_49f1b7b2446ac2c5 = ((u32(((u32(3010) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_43cce76b9b871f42e9f49b71() {
  return __cxx_static_address_43cce76b9b871f42e9f49b71.reference || (__cxx_static_address_43cce76b9b871f42e9f49b71.reference = {
    __cReference: true,
    get value() { return THREEBYFIVE____header_global_49f1b7b2446ac2c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:706
export const BIGAPPOS____header_global_844d7f887a65f929 = ((u32(((u32(3022) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ca6107c9781f8122dab21832() {
  return __cxx_static_address_ca6107c9781f8122dab21832.reference || (__cxx_static_address_ca6107c9781f8122dab21832.reference = {
    __cReference: true,
    get value() { return BIGAPPOS____header_global_844d7f887a65f929; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:707
export const MINIFONT____header_global_f53b923f4ae6d90d = ((u32(((u32(3072) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3deb91bd65a2215d847a54c() {
  return __cxx_static_address_c3deb91bd65a2215d847a54c.reference || (__cxx_static_address_c3deb91bd65a2215d847a54c.reference = {
    __cReference: true,
    get value() { return MINIFONT____header_global_f53b923f4ae6d90d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_0ba00d4532909a74 = ((u32(((u32(3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_223f8dcf533adba477912c84() {
  return __cxx_static_address_223f8dcf533adba477912c84.reference || (__cxx_static_address_223f8dcf533adba477912c84.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_0ba00d4532909a74; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_5771f99f529a4ebb = ((u32(((u32(3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ac80cbf2ee9096ce00a59f74() {
  return __cxx_static_address_ac80cbf2ee9096ce00a59f74.reference || (__cxx_static_address_ac80cbf2ee9096ce00a59f74.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_5771f99f529a4ebb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_cc9da9e02f8d414a = ((u32(((u32(3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b7b1c317b36c65c8c88dda4() {
  return __cxx_static_address_8b7b1c317b36c65c8c88dda4.reference || (__cxx_static_address_8b7b1c317b36c65c8c88dda4.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_cc9da9e02f8d414a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:711
export const BONUSSCREEN____header_global_3caba28f086571a7 = ((u32(((u32(3240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_be20b4d000bf907b3c60a77c() {
  return __cxx_static_address_be20b4d000bf907b3c60a77c.reference || (__cxx_static_address_be20b4d000bf907b3c60a77c.reference = {
    __cReference: true,
    get value() { return BONUSSCREEN____header_global_3caba28f086571a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:712
export const VIEWBORDER____header_global_e79718b599831996 = ((u32(((u32(3250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6f592e76e0d4c28defdbfd93() {
  return __cxx_static_address_6f592e76e0d4c28defdbfd93.reference || (__cxx_static_address_6f592e76e0d4c28defdbfd93.reference = {
    __cReference: true,
    get value() { return VIEWBORDER____header_global_e79718b599831996; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:713
export const VICTORY1____header_global_f6004d1faef57e30 = ((u32(((u32(3260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb64caa7ea3b2b0777d8cd19() {
  return __cxx_static_address_bb64caa7ea3b2b0777d8cd19.reference || (__cxx_static_address_bb64caa7ea3b2b0777d8cd19.reference = {
    __cReference: true,
    get value() { return VICTORY1____header_global_f6004d1faef57e30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:714
export const ORDERING____header_global_e9efd388362505be = ((u32(((u32(3270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b7f174069abce6f4ed6b4943() {
  return __cxx_static_address_b7f174069abce6f4ed6b4943.reference || (__cxx_static_address_b7f174069abce6f4ed6b4943.reference = {
    __cReference: true,
    get value() { return ORDERING____header_global_e9efd388362505be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:715
export const TEXTSTORY____header_global_4988ce7c6ab293ff = ((u32(((u32(3280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf7abca5fa25550ad382fc03() {
  return __cxx_static_address_bf7abca5fa25550ad382fc03.reference || (__cxx_static_address_bf7abca5fa25550ad382fc03.reference = {
    __cReference: true,
    get value() { return TEXTSTORY____header_global_4988ce7c6ab293ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:716
export const LOADSCREEN____header_global_0ebce38854ffe99d = ((u32(((u32(3281) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b9fe0acd30b3489561f5f4e4() {
  return __cxx_static_address_b9fe0acd30b3489561f5f4e4.reference || (__cxx_static_address_b9fe0acd30b3489561f5f4e4.reference = {
    __cReference: true,
    get value() { return LOADSCREEN____header_global_0ebce38854ffe99d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:717
export const BORNTOBEWILDSCREEN____header_global_cae6d6734e82e7a7 = ((u32(((u32(3370) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fb86b521a9e0e307f680ad73() {
  return __cxx_static_address_fb86b521a9e0e307f680ad73.reference || (__cxx_static_address_fb86b521a9e0e307f680ad73.reference = {
    __cReference: true,
    get value() { return BORNTOBEWILDSCREEN____header_global_cae6d6734e82e7a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:718
export const BLIMP____header_global_2a747857e1b734c9 = ((u32(((u32(3400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a27c42f7f71967f4311de2b1() {
  return __cxx_static_address_a27c42f7f71967f4311de2b1.reference || (__cxx_static_address_a27c42f7f71967f4311de2b1.reference = {
    __cReference: true,
    get value() { return BLIMP____header_global_2a747857e1b734c9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_392177e71c9e3abf = ((u32(((u32(3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_688c9940e9900082e079ac25() {
  return __cxx_static_address_688c9940e9900082e079ac25.reference || (__cxx_static_address_688c9940e9900082e079ac25.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_392177e71c9e3abf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_c904302c88f13f42 = ((u32(((u32(3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3bcc3391813d8631544568ef() {
  return __cxx_static_address_3bcc3391813d8631544568ef.reference || (__cxx_static_address_3bcc3391813d8631544568ef.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_c904302c88f13f42; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_eec7a0c178f0be46 = ((u32(((u32(4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_77dc6c450ae5de52e1514227() {
  return __cxx_static_address_77dc6c450ae5de52e1514227.reference || (__cxx_static_address_77dc6c450ae5de52e1514227.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_eec7a0c178f0be46; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:722
export const PANNEL3____header_global_57c43283069c6fce = ((u32(((u32(4099) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_473fc4d396238afbcff5fc78() {
  return __cxx_static_address_473fc4d396238afbcff5fc78.reference || (__cxx_static_address_473fc4d396238afbcff5fc78.reference = {
    __cReference: true,
    get value() { return PANNEL3____header_global_57c43283069c6fce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:723
export const SCREENBREAK14____header_global_76e830133d7b9fa1 = ((u32(((u32(4120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d9620b6c100b4b21de743f76() {
  return __cxx_static_address_d9620b6c100b4b21de743f76.reference || (__cxx_static_address_d9620b6c100b4b21de743f76.reference = {
    __cReference: true,
    get value() { return SCREENBREAK14____header_global_76e830133d7b9fa1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:724
export const SCREENBREAK15____header_global_f3ee7ca6a3e332f8 = ((u32(((u32(4123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03b1c56d8f33f3fdc169979a() {
  return __cxx_static_address_03b1c56d8f33f3fdc169979a.reference || (__cxx_static_address_03b1c56d8f33f3fdc169979a.reference = {
    __cReference: true,
    get value() { return SCREENBREAK15____header_global_f3ee7ca6a3e332f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:725
export const SCREENBREAK19____header_global_e42f3037812a9ba1 = ((u32(((u32(4125) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd5b13edf46a1e81357afaf6() {
  return __cxx_static_address_cd5b13edf46a1e81357afaf6.reference || (__cxx_static_address_cd5b13edf46a1e81357afaf6.reference = {
    __cReference: true,
    get value() { return SCREENBREAK19____header_global_e42f3037812a9ba1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:726
export const SCREENBREAK16____header_global_b0b419a036065416 = ((u32(((u32(4127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37837ab09423688d579b9c56() {
  return __cxx_static_address_37837ab09423688d579b9c56.reference || (__cxx_static_address_37837ab09423688d579b9c56.reference = {
    __cReference: true,
    get value() { return SCREENBREAK16____header_global_b0b419a036065416; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:727
export const SCREENBREAK17____header_global_dd5134d4d1c7bb3f = ((u32(((u32(4128) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a068aab71642f8091b6350f0() {
  return __cxx_static_address_a068aab71642f8091b6350f0.reference || (__cxx_static_address_a068aab71642f8091b6350f0.reference = {
    __cReference: true,
    get value() { return SCREENBREAK17____header_global_dd5134d4d1c7bb3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:728
export const SCREENBREAK18____header_global_f610bee983dd82e2 = ((u32(((u32(4129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7d02adfb7f412dc99486a11d() {
  return __cxx_static_address_7d02adfb7f412dc99486a11d.reference || (__cxx_static_address_7d02adfb7f412dc99486a11d.reference = {
    __cReference: true,
    get value() { return SCREENBREAK18____header_global_f610bee983dd82e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:729
export const W_TECHWALL11____header_global_ef1893648c189ee0 = ((u32(((u32(4130) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d941d7fd42ceffd92cf94105() {
  return __cxx_static_address_d941d7fd42ceffd92cf94105.reference || (__cxx_static_address_d941d7fd42ceffd92cf94105.reference = {
    __cReference: true,
    get value() { return W_TECHWALL11____header_global_ef1893648c189ee0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:730
export const W_TECHWALL12____header_global_e9461f2c596e1539 = ((u32(((u32(4131) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4cfefa25349b28232a678117() {
  return __cxx_static_address_4cfefa25349b28232a678117.reference || (__cxx_static_address_4cfefa25349b28232a678117.reference = {
    __cReference: true,
    get value() { return W_TECHWALL12____header_global_e9461f2c596e1539; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:731
export const W_TECHWALL13____header_global_23519b8df38ea241 = ((u32(((u32(4132) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60737b30d3dffd21e98d8a5f() {
  return __cxx_static_address_60737b30d3dffd21e98d8a5f.reference || (__cxx_static_address_60737b30d3dffd21e98d8a5f.reference = {
    __cReference: true,
    get value() { return W_TECHWALL13____header_global_23519b8df38ea241; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:732
export const W_TECHWALL14____header_global_61c70d529cceb9e8 = ((u32(((u32(4133) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b725284505bb478edf99870() {
  return __cxx_static_address_0b725284505bb478edf99870.reference || (__cxx_static_address_0b725284505bb478edf99870.reference = {
    __cReference: true,
    get value() { return W_TECHWALL14____header_global_61c70d529cceb9e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:733
export const W_TECHWALL5____header_global_c86022646df9e5b2 = ((u32(((u32(4134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_65c6e63bd0d15054ac7b5f61() {
  return __cxx_static_address_65c6e63bd0d15054ac7b5f61.reference || (__cxx_static_address_65c6e63bd0d15054ac7b5f61.reference = {
    __cReference: true,
    get value() { return W_TECHWALL5____header_global_c86022646df9e5b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:734
export const W_TECHWALL6____header_global_75c84b7ea43ee8cd = ((u32(((u32(4136) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07ed598802d2baa61bc325fd() {
  return __cxx_static_address_07ed598802d2baa61bc325fd.reference || (__cxx_static_address_07ed598802d2baa61bc325fd.reference = {
    __cReference: true,
    get value() { return W_TECHWALL6____header_global_75c84b7ea43ee8cd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:735
export const W_TECHWALL7____header_global_c32cbf281442d4a6 = ((u32(((u32(4138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_58ca851aa85bdd65d6fa37e1() {
  return __cxx_static_address_58ca851aa85bdd65d6fa37e1.reference || (__cxx_static_address_58ca851aa85bdd65d6fa37e1.reference = {
    __cReference: true,
    get value() { return W_TECHWALL7____header_global_c32cbf281442d4a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:736
export const W_TECHWALL8____header_global_dc552b2c8118ee4c = ((u32(((u32(4140) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6e5c64e9bc70b77d8ef944a2() {
  return __cxx_static_address_6e5c64e9bc70b77d8ef944a2.reference || (__cxx_static_address_6e5c64e9bc70b77d8ef944a2.reference = {
    __cReference: true,
    get value() { return W_TECHWALL8____header_global_dc552b2c8118ee4c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:737
export const W_TECHWALL9____header_global_138c82f421b050a8 = ((u32(((u32(4142) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_51426db6cc5c19f8ba0377ef() {
  return __cxx_static_address_51426db6cc5c19f8ba0377ef.reference || (__cxx_static_address_51426db6cc5c19f8ba0377ef.reference = {
    __cReference: true,
    get value() { return W_TECHWALL9____header_global_138c82f421b050a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:738
export const BPANNEL3____header_global_eb81620056ac677f = ((u32(((u32(4100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cae3a106255e7207c6503c57() {
  return __cxx_static_address_cae3a106255e7207c6503c57.reference || (__cxx_static_address_cae3a106255e7207c6503c57.reference = {
    __cReference: true,
    get value() { return BPANNEL3____header_global_eb81620056ac677f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:739
export const W_HITTECHWALL16____header_global_70a074c0df3eda72 = ((u32(((u32(4144) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bb08ad18f36d07d700caa6fb() {
  return __cxx_static_address_bb08ad18f36d07d700caa6fb.reference || (__cxx_static_address_bb08ad18f36d07d700caa6fb.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL16____header_global_70a074c0df3eda72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:740
export const W_HITTECHWALL10____header_global_f6bcdac5df288c31 = ((u32(((u32(4145) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_78e4c942ba2cfd1854b7c504() {
  return __cxx_static_address_78e4c942ba2cfd1854b7c504.reference || (__cxx_static_address_78e4c942ba2cfd1854b7c504.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL10____header_global_f6bcdac5df288c31; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:741
export const W_HITTECHWALL15____header_global_fd5e800056875a37 = ((u32(((u32(4147) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_654e3e004af9aabc86175d34() {
  return __cxx_static_address_654e3e004af9aabc86175d34.reference || (__cxx_static_address_654e3e004af9aabc86175d34.reference = {
    __cReference: true,
    get value() { return W_HITTECHWALL15____header_global_fd5e800056875a37; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:742
export const W_MILKSHELF____header_global_46cb4e2091ae74cb = ((u32(((u32(4181) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cb3074eb85c384ed98a9c560() {
  return __cxx_static_address_cb3074eb85c384ed98a9c560.reference || (__cxx_static_address_cb3074eb85c384ed98a9c560.reference = {
    __cReference: true,
    get value() { return W_MILKSHELF____header_global_46cb4e2091ae74cb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:743
export const W_MILKSHELFBROKE____header_global_244709bf2200093f = ((u32(((u32(4203) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4a7cc5a15ae0f8e80f200dc2() {
  return __cxx_static_address_4a7cc5a15ae0f8e80f200dc2.reference || (__cxx_static_address_4a7cc5a15ae0f8e80f200dc2.reference = {
    __cReference: true,
    get value() { return W_MILKSHELFBROKE____header_global_244709bf2200093f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:744
export const PURPLELAVA____header_global_aa611576e14a7dff = ((u32(((u32(4240) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_761dfe8376be1c8a91cd8e1a() {
  return __cxx_static_address_761dfe8376be1c8a91cd8e1a.reference || (__cxx_static_address_761dfe8376be1c8a91cd8e1a.reference = {
    __cReference: true,
    get value() { return PURPLELAVA____header_global_aa611576e14a7dff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:745
export const TARGET____header_global_bf69ad292084b6f9 = ((u32(((u32(4359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_361504fcc4a5616e5bc6cb13() {
  return __cxx_static_address_361504fcc4a5616e5bc6cb13.reference || (__cxx_static_address_361504fcc4a5616e5bc6cb13.reference = {
    __cReference: true,
    get value() { return TARGET____header_global_bf69ad292084b6f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:746
export const DUCK____header_global_82a38fbc90ccbd45 = ((u32(((u32(4361) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c827ce88819e36c536d7a72() {
  return __cxx_static_address_5c827ce88819e36c536d7a72.reference || (__cxx_static_address_5c827ce88819e36c536d7a72.reference = {
    __cReference: true,
    get value() { return DUCK____header_global_82a38fbc90ccbd45; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_31e490cd0cd6ad03 = ((u32(((u32(4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_42e732e00c48fe5b63cd62fe() {
  return __cxx_static_address_42e732e00c48fe5b63cd62fe.reference || (__cxx_static_address_42e732e00c48fe5b63cd62fe.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_31e490cd0cd6ad03; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:748
export const DOORTILE23____header_global_7cc500ba091053f9 = ((u32(((u32(4391) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd25c39348b12e78345434ab() {
  return __cxx_static_address_cd25c39348b12e78345434ab.reference || (__cxx_static_address_cd25c39348b12e78345434ab.reference = {
    __cReference: true,
    get value() { return DOORTILE23____header_global_7cc500ba091053f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:749
export const SPEAKER____header_global_441006ed3851af30 = ((u32(((u32(4397) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8f97a62f66c8c25108ac25b7() {
  return __cxx_static_address_8f97a62f66c8c25108ac25b7.reference || (__cxx_static_address_8f97a62f66c8c25108ac25b7.reference = {
    __cReference: true,
    get value() { return SPEAKER____header_global_441006ed3851af30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_a104b947cf10217f = ((u32(((u32(4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_377bf959779c1d1440c190ab() {
  return __cxx_static_address_377bf959779c1d1440c190ab.reference || (__cxx_static_address_377bf959779c1d1440c190ab.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_a104b947cf10217f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_69d3df7e1334da15 = ((u32(((u32(4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d82cc1d2e2559cb8ba801cb7() {
  return __cxx_static_address_d82cc1d2e2559cb8ba801cb7.reference || (__cxx_static_address_d82cc1d2e2559cb8ba801cb7.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_69d3df7e1334da15; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:752
export const TRIPODCAMERA____header_global_9a0bb91ef9756abd = ((u32(((u32(4444) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0b50debc2286e8777d366a68() {
  return __cxx_static_address_0b50debc2286e8777d366a68.reference || (__cxx_static_address_0b50debc2286e8777d366a68.reference = {
    __cReference: true,
    get value() { return TRIPODCAMERA____header_global_9a0bb91ef9756abd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_f1d12bdb7f957332 = ((u32(((u32(4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bdac642b5aa48228d99d926d() {
  return __cxx_static_address_bdac642b5aa48228d99d926d.reference || (__cxx_static_address_bdac642b5aa48228d99d926d.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_f1d12bdb7f957332; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:754
export const GENERICPOLE2____header_global_922eea37522e2095 = ((u32(((u32(4465) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9182753e87fafd518d637314() {
  return __cxx_static_address_9182753e87fafd518d637314.reference || (__cxx_static_address_9182753e87fafd518d637314.reference = {
    __cReference: true,
    get value() { return GENERICPOLE2____header_global_922eea37522e2095; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:755
export const XXXSTACY____header_global_41c253e3cf68a2f0 = ((u32(((u32(4470) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3f2836e7d3af7528fe97c08c() {
  return __cxx_static_address_3f2836e7d3af7528fe97c08c.reference || (__cxx_static_address_3f2836e7d3af7528fe97c08c.reference = {
    __cReference: true,
    get value() { return XXXSTACY____header_global_41c253e3cf68a2f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:756
export const LETTER____header_global_a817c1c6a4b239a1 = ((u32(((u32(4502) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a416c0c0c3f2c441e22bab18() {
  return __cxx_static_address_a416c0c0c3f2c441e22bab18.reference || (__cxx_static_address_a416c0c0c3f2c441e22bab18.reference = {
    __cReference: true,
    get value() { return LETTER____header_global_a817c1c6a4b239a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:757
export const SIDEBOLT1____header_global_69fb5ca76aa5041a = ((u32(((u32(4525) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_67f786005795e5b93edb83cd() {
  return __cxx_static_address_67f786005795e5b93edb83cd.reference || (__cxx_static_address_67f786005795e5b93edb83cd.reference = {
    __cReference: true,
    get value() { return SIDEBOLT1____header_global_69fb5ca76aa5041a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_ca54fdc9b8fb1039 = ((u32(((u32(4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80fc406b5915a7286ddb6949() {
  return __cxx_static_address_80fc406b5915a7286ddb6949.reference || (__cxx_static_address_80fc406b5915a7286ddb6949.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_ca54fdc9b8fb1039; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:759
export const TAMPON____header_global_6e2255ef0c2a7aa8 = ((u32(((u32(4557) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c3902c57bdf0bf922a72b697() {
  return __cxx_static_address_c3902c57bdf0bf922a72b697.reference || (__cxx_static_address_c3902c57bdf0bf922a72b697.reference = {
    __cReference: true,
    get value() { return TAMPON____header_global_6e2255ef0c2a7aa8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:760
export const CANWITHSOMETHING2____header_global_55f500f4766bf9be = ((u32(((u32(4580) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_934fdf4c4c547df4eba98a16() {
  return __cxx_static_address_934fdf4c4c547df4eba98a16.reference || (__cxx_static_address_934fdf4c4c547df4eba98a16.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING2____header_global_55f500f4766bf9be; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:761
export const CANWITHSOMETHING3____header_global_c852a93fa7955d94 = ((u32(((u32(4581) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f87b7557356d23bcd9cb0b13() {
  return __cxx_static_address_f87b7557356d23bcd9cb0b13.reference || (__cxx_static_address_f87b7557356d23bcd9cb0b13.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING3____header_global_c852a93fa7955d94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:762
export const CANWITHSOMETHING4____header_global_1ac30b255e68dbb5 = ((u32(((u32(4582) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b2a7c01497525fdd1825bfad() {
  return __cxx_static_address_b2a7c01497525fdd1825bfad.reference || (__cxx_static_address_b2a7c01497525fdd1825bfad.reference = {
    __cReference: true,
    get value() { return CANWITHSOMETHING4____header_global_1ac30b255e68dbb5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_62bef89395a06efb = ((u32(((u32(4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8362b5e34158b3d5ac38a95() {
  return __cxx_static_address_c8362b5e34158b3d5ac38a95.reference || (__cxx_static_address_c8362b5e34158b3d5ac38a95.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_62bef89395a06efb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_60edda9e064b300e = ((u32(((u32(4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1e90145f2ca3f4993a624900() {
  return __cxx_static_address_1e90145f2ca3f4993a624900.reference || (__cxx_static_address_1e90145f2ca3f4993a624900.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_60edda9e064b300e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:765
export const NEWBEAST____header_global_f980f4ad956ca323 = ((u32(((u32(4610) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6f711338e3482f9e29f334e() {
  return __cxx_static_address_f6f711338e3482f9e29f334e.reference || (__cxx_static_address_f6f711338e3482f9e29f334e.reference = {
    __cReference: true,
    get value() { return NEWBEAST____header_global_f980f4ad956ca323; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:766
export const NEWBEASTSTAYPUT____header_global_ee4b520e46c3be61 = ((u32(((u32(4611) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_610bd6e40747bb5a1f375bdc() {
  return __cxx_static_address_610bd6e40747bb5a1f375bdc.reference || (__cxx_static_address_610bd6e40747bb5a1f375bdc.reference = {
    __cReference: true,
    get value() { return NEWBEASTSTAYPUT____header_global_ee4b520e46c3be61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:767
export const BOSS4____header_global_03af6aab2b6c28f2 = ((u32(((u32(4740) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_80924681ab88bd242bfa2b47() {
  return __cxx_static_address_80924681ab88bd242bfa2b47.reference || (__cxx_static_address_80924681ab88bd242bfa2b47.reference = {
    __cReference: true,
    get value() { return BOSS4____header_global_03af6aab2b6c28f2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:768
export const BOSS4STAYPUT____header_global_127585595e852306 = ((u32(((u32(4741) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_64d57f459c2aee7b53452028() {
  return __cxx_static_address_64d57f459c2aee7b53452028.reference || (__cxx_static_address_64d57f459c2aee7b53452028.reference = {
    __cReference: true,
    get value() { return BOSS4STAYPUT____header_global_127585595e852306; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_98aecb1cc167e7b4 = ((u32(((u32(4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ed27c2b07111b8d9121ed2cc() {
  return __cxx_static_address_ed27c2b07111b8d9121ed2cc.reference || (__cxx_static_address_ed27c2b07111b8d9121ed2cc.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_98aecb1cc167e7b4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:770
export const TOUGHGAL____header_global_af0aafaddb9539f0 = ((u32(((u32(4866) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8cc2b1abb43518c228386b90() {
  return __cxx_static_address_8cc2b1abb43518c228386b90.reference || (__cxx_static_address_8cc2b1abb43518c228386b90.reference = {
    __cReference: true,
    get value() { return TOUGHGAL____header_global_af0aafaddb9539f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_30f51a78912db214 = ((u32(((u32(4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_02a0d556141ad9797795f9fa() {
  return __cxx_static_address_02a0d556141ad9797795f9fa.reference || (__cxx_static_address_02a0d556141ad9797795f9fa.reference = {
    __cReference: true,
    get value() { return MAN____header_global_30f51a78912db214; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_8cd0fba0449863e4 = ((u32(((u32(4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c1733cd02e04ceddfe96b20() {
  return __cxx_static_address_3c1733cd02e04ceddfe96b20.reference || (__cxx_static_address_3c1733cd02e04ceddfe96b20.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_8cd0fba0449863e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:773
export const WOMAN____header_global_2bf9adc7bf8a8f6b = ((u32(((u32(4874) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_03a8f807bbc7e7c620c89094() {
  return __cxx_static_address_03a8f807bbc7e7c620c89094.reference || (__cxx_static_address_03a8f807bbc7e7c620c89094.reference = {
    __cReference: true,
    get value() { return WOMAN____header_global_2bf9adc7bf8a8f6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:774
export const NATURALLIGHTNING____header_global_b6ed1d4ac0752f5d = ((u32(((u32(4890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a30caab05d7c77b1c6b6015f() {
  return __cxx_static_address_a30caab05d7c77b1c6b6015f.reference || (__cxx_static_address_a30caab05d7c77b1c6b6015f.reference = {
    __cReference: true,
    get value() { return NATURALLIGHTNING____header_global_b6ed1d4ac0752f5d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:775
export const WEATHERWARN____header_global_6e4fd8aa5f4aab94 = ((u32(((u32(4893) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c5db4c5562eec54711bf4f3() {
  return __cxx_static_address_3c5db4c5562eec54711bf4f3.reference || (__cxx_static_address_3c5db4c5562eec54711bf4f3.reference = {
    __cReference: true,
    get value() { return WEATHERWARN____header_global_6e4fd8aa5f4aab94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:776
export const DUKETAG____header_global_caa5066adf626fb8 = ((u32(((u32(4900) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_62e112f8ea21e67c9f8aa3e5() {
  return __cxx_static_address_62e112f8ea21e67c9f8aa3e5.reference || (__cxx_static_address_62e112f8ea21e67c9f8aa3e5.reference = {
    __cReference: true,
    get value() { return DUKETAG____header_global_caa5066adf626fb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:777
export const SIGN1____header_global_d6e78c7f344347e6 = ((u32(((u32(4909) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d0327b8ef5ba2b035c5d9cad() {
  return __cxx_static_address_d0327b8ef5ba2b035c5d9cad.reference || (__cxx_static_address_d0327b8ef5ba2b035c5d9cad.reference = {
    __cReference: true,
    get value() { return SIGN1____header_global_d6e78c7f344347e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:778
export const SIGN2____header_global_3208b1780dae769d = ((u32(((u32(4912) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1b58f5834247a06e70d04cd6() {
  return __cxx_static_address_1b58f5834247a06e70d04cd6.reference || (__cxx_static_address_1b58f5834247a06e70d04cd6.reference = {
    __cReference: true,
    get value() { return SIGN2____header_global_3208b1780dae769d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:779
export const JURYGUY____header_global_98d3c7661cfa82e3 = ((u32(((u32(4943) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a7c9b2501ad4debc1cf9936f() {
  return __cxx_static_address_a7c9b2501ad4debc1cf9936f.reference || (__cxx_static_address_a7c9b2501ad4debc1cf9936f.reference = {
    __cReference: true,
    get value() { return JURYGUY____header_global_98d3c7661cfa82e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:780
export const WIDESCREENSTATUSBAR____header_global_ca7426a715426009 = ((u32(((u32(5120) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d00fe17754ba1a18e509cca0() {
  return __cxx_static_address_d00fe17754ba1a18e509cca0.reference || (__cxx_static_address_d00fe17754ba1a18e509cca0.reference = {
    __cReference: true,
    get value() { return WIDESCREENSTATUSBAR____header_global_ca7426a715426009; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:781
export const RPGGUNWIDE____header_global_68d7120570d5ad30 = ((u32(((u32(5121) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1767e18bc306586c25179bc0() {
  return __cxx_static_address_1767e18bc306586c25179bc0.reference || (__cxx_static_address_1767e18bc306586c25179bc0.reference = {
    __cReference: true,
    get value() { return RPGGUNWIDE____header_global_68d7120570d5ad30; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:782
export const FIRSTGUNRELOADWIDE____header_global_787df11cb92e9a60 = ((u32(((u32(5122) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_970f9e5b680f915fdc9c9422() {
  return __cxx_static_address_970f9e5b680f915fdc9c9422.reference || (__cxx_static_address_970f9e5b680f915fdc9c9422.reference = {
    __cReference: true,
    get value() { return FIRSTGUNRELOADWIDE____header_global_787df11cb92e9a60; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:783
export const FREEZEWIDE____header_global_5daf2ff70e4ccd70 = ((u32(((u32(5123) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6146bf8885cf095c8768d1c9() {
  return __cxx_static_address_6146bf8885cf095c8768d1c9.reference || (__cxx_static_address_6146bf8885cf095c8768d1c9.reference = {
    __cReference: true,
    get value() { return FREEZEWIDE____header_global_5daf2ff70e4ccd70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:784
export const FREEZEFIREWIDE____header_global_5d4943b099f57ad2 = ((u32(((u32(5124) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2ad09cf76b3217014f7b598e() {
  return __cxx_static_address_2ad09cf76b3217014f7b598e.reference || (__cxx_static_address_2ad09cf76b3217014f7b598e.reference = {
    __cReference: true,
    get value() { return FREEZEFIREWIDE____header_global_5d4943b099f57ad2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:785
export const SHRINKERWIDE____header_global_39b4336453257a2b = ((u32(((u32(5127) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_385e3dacd6f48af6d2464c0b() {
  return __cxx_static_address_385e3dacd6f48af6d2464c0b.reference || (__cxx_static_address_385e3dacd6f48af6d2464c0b.reference = {
    __cReference: true,
    get value() { return SHRINKERWIDE____header_global_39b4336453257a2b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:786
export const CRACKKNUCKLESWIDE____header_global_49369ced525d1108 = ((u32(((u32(5129) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_675a576abc6a5095966eb4d6() {
  return __cxx_static_address_675a576abc6a5095966eb4d6.reference || (__cxx_static_address_675a576abc6a5095966eb4d6.reference = {
    __cReference: true,
    get value() { return CRACKKNUCKLESWIDE____header_global_49369ced525d1108; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:787
export const FLAMETHROWERSPRITE____header_global_3449039d07c07730 = ((u32(((u32(5134) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_963a667b988fd0f2e6e09528() {
  return __cxx_static_address_963a667b988fd0f2e6e09528.reference || (__cxx_static_address_963a667b988fd0f2e6e09528.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERSPRITE____header_global_3449039d07c07730; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:788
export const FLAMETHROWERAMMO____header_global_5f5fd5779ae75c07 = ((u32(((u32(5135) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_536a80e4751d8fa8ea5a52a3() {
  return __cxx_static_address_536a80e4751d8fa8ea5a52a3.reference || (__cxx_static_address_536a80e4751d8fa8ea5a52a3.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERAMMO____header_global_5f5fd5779ae75c07; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:789
export const FLAMETHROWER____header_global_db0ab36e20a4aed8 = ((u32(((u32(5138) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_914261428db39017734c1517() {
  return __cxx_static_address_914261428db39017734c1517.reference || (__cxx_static_address_914261428db39017734c1517.reference = {
    __cReference: true,
    get value() { return FLAMETHROWER____header_global_db0ab36e20a4aed8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:790
export const FLAMETHROWERFIRE____header_global_85d0ba8ec61cbfe4 = ((u32(((u32(5139) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e6a3a9ec37c16bf12a977cee() {
  return __cxx_static_address_e6a3a9ec37c16bf12a977cee.reference || (__cxx_static_address_e6a3a9ec37c16bf12a977cee.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFIRE____header_global_85d0ba8ec61cbfe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:791
export const FLAMETHROWERFLAME____header_global_560519aa6fd8438e = ((u32(((u32(1891) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_400de8de578cb13f12d191f2() {
  return __cxx_static_address_400de8de578cb13f12d191f2.reference || (__cxx_static_address_400de8de578cb13f12d191f2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERFLAME____header_global_560519aa6fd8438e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:792
export const FLAMETHROWERPILOT____header_global_a936b552acb6fe20 = ((u32(((u32(5174) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_86e9e0c2ab2e4162677728e2() {
  return __cxx_static_address_86e9e0c2ab2e4162677728e2.reference || (__cxx_static_address_86e9e0c2ab2e4162677728e2.reference = {
    __cReference: true,
    get value() { return FLAMETHROWERPILOT____header_global_a936b552acb6fe20; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:793
export const FIREBALL____header_global_e5ff647e04b6b34b = ((u32(((u32(5163) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf646eb89a88363c64adb944() {
  return __cxx_static_address_bf646eb89a88363c64adb944.reference || (__cxx_static_address_bf646eb89a88363c64adb944.reference = {
    __cReference: true,
    get value() { return FIREBALL____header_global_e5ff647e04b6b34b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:794
export const ONFIRE____header_global_8b9367c69e5d040a = ((u32(((u32(5152) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a27fe3b6254cc9dd92b78042() {
  return __cxx_static_address_a27fe3b6254cc9dd92b78042.reference || (__cxx_static_address_a27fe3b6254cc9dd92b78042.reference = {
    __cReference: true,
    get value() { return ONFIRE____header_global_8b9367c69e5d040a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:795
export const ONFIRESMOKE____header_global_d22381498cf15fa9 = ((u32(((u32(5143) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8bf1d0d8c97c82f7ec6fd27() {
  return __cxx_static_address_c8bf1d0d8c97c82f7ec6fd27.reference || (__cxx_static_address_c8bf1d0d8c97c82f7ec6fd27.reference = {
    __cReference: true,
    get value() { return ONFIRESMOKE____header_global_d22381498cf15fa9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:796
export const BURNEDCORPSE____header_global_6e340ca4d427d301 = ((u32(((u32(5173) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ec3adbbde00e48de8d3ac436() {
  return __cxx_static_address_ec3adbbde00e48de8d3ac436.reference || (__cxx_static_address_ec3adbbde00e48de8d3ac436.reference = {
    __cReference: true,
    get value() { return BURNEDCORPSE____header_global_6e340ca4d427d301; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:797
export const WHISPYSMOKE____header_global_19f76c7d9b674f02 = ((u32(((u32(5268) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_160c752237be1f77e4984829() {
  return __cxx_static_address_160c752237be1f77e4984829.reference || (__cxx_static_address_160c752237be1f77e4984829.reference = {
    __cReference: true,
    get value() { return WHISPYSMOKE____header_global_19f76c7d9b674f02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:798
export const FIREFLY____header_global_0c7564f76de5b6c5 = ((u32(((u32(5180) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_74305cee1fd4d7e688d2064a() {
  return __cxx_static_address_74305cee1fd4d7e688d2064a.reference || (__cxx_static_address_74305cee1fd4d7e688d2064a.reference = {
    __cReference: true,
    get value() { return FIREFLY____header_global_0c7564f76de5b6c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:799
export const FIREFLYSHRINKEFFECT____header_global_4fa0883f50c01f81 = ((u32(((u32(5360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2113e04b3cf250e7de3f8034() {
  return __cxx_static_address_2113e04b3cf250e7de3f8034.reference || (__cxx_static_address_2113e04b3cf250e7de3f8034.reference = {
    __cReference: true,
    get value() { return FIREFLYSHRINKEFFECT____header_global_4fa0883f50c01f81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:800
export const FIREFLYGROWEFFECT____header_global_7cd41d83a934f81d = ((u32(((u32(5367) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a852c3804f6b727ecbbb142a() {
  return __cxx_static_address_a852c3804f6b727ecbbb142a.reference || (__cxx_static_address_a852c3804f6b727ecbbb142a.reference = {
    __cReference: true,
    get value() { return FIREFLYGROWEFFECT____header_global_7cd41d83a934f81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:801
export const FIREFLYFLYINGEFFECT____header_global_601f8c1c582cd07b = ((u32(((u32(5296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6fca0d6d0a5fefb62a644d95() {
  return __cxx_static_address_6fca0d6d0a5fefb62a644d95.reference || (__cxx_static_address_6fca0d6d0a5fefb62a644d95.reference = {
    __cReference: true,
    get value() { return FIREFLYFLYINGEFFECT____header_global_601f8c1c582cd07b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:802
export const BOSS5____header_global_67f195fe3741b10b = ((u32(((u32(5310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_07cd2713cb337cf29f57be7d() {
  return __cxx_static_address_07cd2713cb337cf29f57be7d.reference || (__cxx_static_address_07cd2713cb337cf29f57be7d.reference = {
    __cReference: true,
    get value() { return BOSS5____header_global_67f195fe3741b10b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:803
export const BOSS5STAYPUT____header_global_f7bcf2252ec1703c = ((u32(((u32(5311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75935c0ed65da885e78c6ac5() {
  return __cxx_static_address_75935c0ed65da885e78c6ac5.reference || (__cxx_static_address_75935c0ed65da885e78c6ac5.reference = {
    __cReference: true,
    get value() { return BOSS5STAYPUT____header_global_f7bcf2252ec1703c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:804
export const LAVAPOOL____header_global_a96b2e59897a3a85 = ((u32(((u32(5304) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_138cca17373764973fe15172() {
  return __cxx_static_address_138cca17373764973fe15172.reference || (__cxx_static_address_138cca17373764973fe15172.reference = {
    __cReference: true,
    get value() { return LAVAPOOL____header_global_a96b2e59897a3a85; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:805
export const LAVASPLASH____header_global_1e6359a72fb54eb8 = ((u32(((u32(5371) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9c5002fd58b63a110eeba493() {
  return __cxx_static_address_9c5002fd58b63a110eeba493.reference || (__cxx_static_address_9c5002fd58b63a110eeba493.reference = {
    __cReference: true,
    get value() { return LAVASPLASH____header_global_1e6359a72fb54eb8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:806
export const LAVAPOOLBUBBLE____header_global_25200d5924fa4c00 = ((u32(((u32(5207) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5546e9fd8335d3c81f829a74() {
  return __cxx_static_address_5546e9fd8335d3c81f829a74.reference || (__cxx_static_address_5546e9fd8335d3c81f829a74.reference = {
    __cReference: true,
    get value() { return LAVAPOOLBUBBLE____header_global_25200d5924fa4c00; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:807
export const BOSS2STAYPUT____header_global_d83b2f2e39fff340 = ((u32(((u32(2711) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_adba8549be283cf91f3d6d07() {
  return __cxx_static_address_adba8549be283cf91f3d6d07.reference || (__cxx_static_address_adba8549be283cf91f3d6d07.reference = {
    __cReference: true,
    get value() { return BOSS2STAYPUT____header_global_d83b2f2e39fff340; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:808
export const BOSS3STAYPUT____header_global_ae4ea2b4c02edab0 = ((u32(((u32(2761) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b74ecc4698489ceca3e273b3() {
  return __cxx_static_address_b74ecc4698489ceca3e273b3.reference || (__cxx_static_address_b74ecc4698489ceca3e273b3.reference = {
    __cReference: true,
    get value() { return BOSS3STAYPUT____header_global_ae4ea2b4c02edab0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:809
export const E32_TILE5736____header_global_30876deb42117cf7 = ((u32(((u32(5736) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_deb09e1757954b5aef4436ae() {
  return __cxx_static_address_deb09e1757954b5aef4436ae.reference || (__cxx_static_address_deb09e1757954b5aef4436ae.reference = {
    __cReference: true,
    get value() { return E32_TILE5736____header_global_30876deb42117cf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:810
export const E32_TILE5737____header_global_0ece6f02644e5b02 = ((u32(((u32(5737) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dc3666f630fe4d1b7568ee62() {
  return __cxx_static_address_dc3666f630fe4d1b7568ee62.reference || (__cxx_static_address_dc3666f630fe4d1b7568ee62.reference = {
    __cReference: true,
    get value() { return E32_TILE5737____header_global_0ece6f02644e5b02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:811
export const E32_TILE5846____header_global_105e08ddd23485e9 = ((u32(((u32(5846) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ce98045e77f874fb70e007e6() {
  return __cxx_static_address_ce98045e77f874fb70e007e6.reference || (__cxx_static_address_ce98045e77f874fb70e007e6.reference = {
    __cReference: true,
    get value() { return E32_TILE5846____header_global_105e08ddd23485e9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/network.h:180
export const cSnapshotMemUsage__header_global_586e728f06ecdc72 = u64((BigInt(u64(64)) * BigInt(u64((BigInt(u64((BigInt(u64((BigInt(72) * BigInt(u64(16384))))) + BigInt(u64((BigInt(96) * BigInt(u64(4096)))))))) + BigInt(u64((BigInt(296) * BigInt(u64(16384))))))))));
function __cxx_static_address_ecb4b40b0b1d17e2d28f1d24() {
  return __cxx_static_address_ecb4b40b0b1d17e2d28f1d24.reference || (__cxx_static_address_ecb4b40b0b1d17e2d28f1d24.reference = {
    __cReference: true,
    get value() { return cSnapshotMemUsage__header_global_586e728f06ecdc72; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_f86acf4cdcaf1a0b = i32(2147483647);
function __cxx_static_address_dd3aa8638de2788adbecc493() {
  return __cxx_static_address_dd3aa8638de2788adbecc493.reference || (__cxx_static_address_dd3aa8638de2788adbecc493.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_f86acf4cdcaf1a0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_5f47182e5e86401a = i32(2147483648);
function __cxx_static_address_102b743744ffc3b3cb5c65b9() {
  return __cxx_static_address_102b743744ffc3b3cb5c65b9.reference || (__cxx_static_address_102b743744ffc3b3cb5c65b9.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_5f47182e5e86401a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_bb7af6016b1e7ac8 = i32(2147483648);
function __cxx_static_address_3b94ccbb5e7e4e04661efaf6() {
  return __cxx_static_address_3b94ccbb5e7e4e04661efaf6.reference || (__cxx_static_address_3b94ccbb5e7e4e04661efaf6.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_bb7af6016b1e7ac8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_6a458150fbe031ba = i32(65536);
function __cxx_static_address_d43f3de139dedc2cb0dc4b8a() {
  return __cxx_static_address_d43f3de139dedc2cb0dc4b8a.reference || (__cxx_static_address_d43f3de139dedc2cb0dc4b8a.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_6a458150fbe031ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_d3d2c60c5277ee3c = i32(32768);
function __cxx_static_address_3967f211c3033ee0e5bf61cb() {
  return __cxx_static_address_3967f211c3033ee0e5bf61cb.reference || (__cxx_static_address_3967f211c3033ee0e5bf61cb.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_d3d2c60c5277ee3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_041d7d8340f0a702 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_489b3b52d8d609d44dc09fe4() {
  return __cxx_static_address_489b3b52d8d609d44dc09fe4.reference || (__cxx_static_address_489b3b52d8d609d44dc09fe4.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_041d7d8340f0a702; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/grpscan.cpp:79
export let foundgrps = null;
export function __cxx_global_cell_57be1c803b4f67589d421f5a() {
  return __cxx_global_cell_57be1c803b4f67589d421f5a.reference || (__cxx_global_cell_57be1c803b4f67589d421f5a.reference = {
    __cReference: true,
    get value() { return foundgrps; },
    set value(__cxx_lvalue_0) { foundgrps = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/grpscan.cpp:80
export let listgrps = null;
export function __cxx_global_cell_3cc3e74cc237b178311ec8e2() {
  return __cxx_global_cell_3cc3e74cc237b178311ec8e2.reference || (__cxx_global_cell_3cc3e74cc237b178311ec8e2.reference = {
    __cReference: true,
    get value() { return listgrps; },
    set value(__cxx_lvalue_0) { listgrps = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/duke3d/src/grpscan.cpp:255
export function FreeGameList() {
  while (listgrps) {
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(listgrps, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).name);
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(listgrps, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).scriptname);
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(listgrps, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).defname);
    xfree__header_14dfd5b92158(cRecordObject(cRecordPointer(listgrps, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).rtsname);
    let fg = cRecordObject(cRecordPointer(listgrps, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).next;
    xfree__header_14dfd5b92158(listgrps);
    (listgrps = fg);
  }
}

export let usedgrpcache = null;
function __cxx_static_address_9ebf8c3d8dd35ce201f9e893() {
  return __cxx_static_address_9ebf8c3d8dd35ce201f9e893.reference || (__cxx_static_address_9ebf8c3d8dd35ce201f9e893.reference = {
    __cReference: true,
    get value() { return usedgrpcache; },
    set value(__cxx_lvalue_0) { usedgrpcache = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_9ebf8c3d8dd35ce201f9e893() { return __cxx_static_address_9ebf8c3d8dd35ce201f9e893(); }

// C/C++ source: source/duke3d/src/grpscan.cpp:325
export function RemoveGroup(igrp) {
  for (let prev = null, grp = foundgrps; grp; (grp = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next)) {
    if (cPointerCompare(grp, igrp, "==")) {
      if (cPointerCompare(grp, foundgrps, "==")) {
        (foundgrps = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next);
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
  for ((grp = foundgrps); grp; (grp = cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next)) {
    if ((cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(grp, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).type, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).crcval == crcval)) {
      return grp;
    }
  }
  return null;
}

// C/C++ source: source/duke3d/src/grpscan.cpp:360
export function FindGrpInfo(crcval, size) {
  let grpinfo;
  for ((grpinfo = listgrps); grpinfo; (grpinfo = cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).next)) {
    if (((cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).crcval == crcval) && (cRecordObject(cRecordPointer(grpinfo, {"align": 8, "arrayAlign": 1, "fields": {"crcval": {"native": "Int32Array", "offset": 8, "size": 4}, "defname": {"offset": 32, "pointer": true, "size": 8}, "dependency": {"native": "Int32Array", "offset": 20, "size": 4}, "game": {"native": "Int32Array", "offset": 16, "size": 4}, "name": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 56, "pointer": true, "size": 8}, "postprocessing": {"offset": 48, "pointer": true, "size": 8}, "rtsname": {"offset": 40, "pointer": true, "size": 8}, "scriptname": {"offset": 24, "pointer": true, "size": 8}, "size": {"native": "Int32Array", "offset": 12, "size": 4}}, "overlaps": false, "size": 64, "union": false}, {})).size == size))) {
      return grpinfo;
    }
  }
  return null;
}

// C/C++ source: source/duke3d/src/grpscan.cpp:545
export function FreeGroups() {
  while (foundgrps) {
    xfree__header_14dfd5b92158(cTypedPointer(cRecordObject(cRecordPointer(foundgrps, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).filename, Uint8Array));
    let fg = cRecordObject(cRecordPointer(foundgrps, {"align": 8, "arrayAlign": 1, "fields": {"filename": {"offset": 0, "pointer": true, "size": 8}, "next": {"offset": 16, "pointer": true, "size": 8}, "type": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 24, "union": false}, {})).next;
    xfree__header_14dfd5b92158(foundgrps);
    (foundgrps = fg);
  }
  FreeGameList();
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_a6fdf0950f25d5f6 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_dded3b69ef8153ec869cc075() {
  return __cxx_static_address_dded3b69ef8153ec869cc075.reference || (__cxx_static_address_dded3b69ef8153ec869cc075.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_a6fdf0950f25d5f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_dded3b69ef8153ec869cc075() { return __cxx_static_address_dded3b69ef8153ec869cc075(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_35243dce1220aa79 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, [25], {}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {})]));
function __cxx_static_address_427cc2555545d9fbfa58e840() {
  return __cxx_static_address_427cc2555545d9fbfa58e840.reference || (__cxx_static_address_427cc2555545d9fbfa58e840.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_35243dce1220aa79; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_87fcf60daa0eda6b = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_eca496c59bbc4006e35e6304() {
  return __cxx_static_address_eca496c59bbc4006e35e6304.reference || (__cxx_static_address_eca496c59bbc4006e35e6304.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_87fcf60daa0eda6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_eca496c59bbc4006e35e6304() { return __cxx_static_address_eca496c59bbc4006e35e6304(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_f6fdecc15ea95637 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_af921836fc23b0cdc7b02266() {
  return __cxx_static_address_af921836fc23b0cdc7b02266.reference || (__cxx_static_address_af921836fc23b0cdc7b02266.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_f6fdecc15ea95637; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_af921836fc23b0cdc7b02266() { return __cxx_static_address_af921836fc23b0cdc7b02266(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_b99ba08e126ef036 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_68e30640e65896ccdfd818a9() {
  return __cxx_static_address_68e30640e65896ccdfd818a9.reference || (__cxx_static_address_68e30640e65896ccdfd818a9.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_b99ba08e126ef036; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_68e30640e65896ccdfd818a9() { return __cxx_static_address_68e30640e65896ccdfd818a9(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_30d0dd72c6a32574 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_e53b229c31fe089780ff668b() {
  return __cxx_static_address_e53b229c31fe089780ff668b.reference || (__cxx_static_address_e53b229c31fe089780ff668b.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_30d0dd72c6a32574; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e53b229c31fe089780ff668b() { return __cxx_static_address_e53b229c31fe089780ff668b(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_f4909d6544000b13 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_875e310f977a706384ca6830() {
  return __cxx_static_address_875e310f977a706384ca6830.reference || (__cxx_static_address_875e310f977a706384ca6830.reference = {
    __cReference: true,
    get value() { return pow264__header_global_f4909d6544000b13; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_875e310f977a706384ca6830() { return __cxx_static_address_875e310f977a706384ca6830(); }

// C/C++ source: source/mact/include/keyboard.h:47
export const sctokeylut__header_global_d6206e5a79c47a36 = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, [102], {}, cStaticInitializerValues([cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 115, 99, 97, 112, 101, 0]), "sc": (u32(1) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([49, 0]), "sc": (u32(2) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([50, 0]), "sc": (u32(3) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([51, 0]), "sc": (u32(4) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([52, 0]), "sc": (u32(5) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([53, 0]), "sc": (u32(6) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([54, 0]), "sc": (u32(7) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([55, 0]), "sc": (u32(8) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([56, 0]), "sc": (u32(9) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([57, 0]), "sc": (u32(10) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([48, 0]), "sc": (u32(11) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([45, 0]), "sc": (u32(12) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([61, 0]), "sc": (u32(13) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 107, 83, 112, 99, 0]), "sc": (u32(14) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 97, 98, 0]), "sc": (u32(15) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([81, 0]), "sc": (u32(16) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([87, 0]), "sc": (u32(17) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 0]), "sc": (u32(18) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 0]), "sc": (u32(19) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([84, 0]), "sc": (u32(20) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([89, 0]), "sc": (u32(21) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 0]), "sc": (u32(22) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 0]), "sc": (u32(23) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([79, 0]), "sc": (u32(24) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 0]), "sc": (u32(25) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([91, 0]), "sc": (u32(26) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([93, 0]), "sc": (u32(27) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 116, 101, 114, 0]), "sc": (u32(28) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 67, 116, 114, 108, 0]), "sc": (u32(29) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([65, 0]), "sc": (u32(30) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 0]), "sc": (u32(31) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 0]), "sc": (u32(32) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 0]), "sc": (u32(33) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([71, 0]), "sc": (u32(34) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 0]), "sc": (u32(35) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([74, 0]), "sc": (u32(36) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 0]), "sc": (u32(37) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 0]), "sc": (u32(38) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([59, 0]), "sc": (u32(39) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([39, 0]), "sc": (u32(40) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([96, 0]), "sc": (u32(41) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 83, 104, 105, 102, 116, 0]), "sc": (u32(42) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 97, 99, 107, 115, 108, 97, 115, 104, 0]), "sc": (u32(43) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([90, 0]), "sc": (u32(44) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([88, 0]), "sc": (u32(45) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 0]), "sc": (u32(46) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([86, 0]), "sc": (u32(47) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([66, 0]), "sc": (u32(48) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 0]), "sc": (u32(49) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([77, 0]), "sc": (u32(50) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([44, 0]), "sc": (u32(51) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([46, 0]), "sc": (u32(52) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([47, 0]), "sc": (u32(53) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 83, 104, 105, 102, 116, 0]), "sc": (u32(54) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 42, 0]), "sc": (u32(55) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 65, 108, 116, 0]), "sc": (u32(56) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 112, 97, 99, 101, 0]), "sc": (u32(57) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([67, 97, 112, 76, 99, 107, 0]), "sc": (u32(58) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 0]), "sc": (u32(59) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 50, 0]), "sc": (u32(60) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 51, 0]), "sc": (u32(61) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 52, 0]), "sc": (u32(62) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 53, 0]), "sc": (u32(63) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 54, 0]), "sc": (u32(64) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 55, 0]), "sc": (u32(65) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 56, 0]), "sc": (u32(66) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 57, 0]), "sc": (u32(67) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 48, 0]), "sc": (u32(68) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([78, 117, 109, 76, 99, 107, 0]), "sc": (u32(69) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([83, 99, 114, 76, 99, 107, 0]), "sc": (u32(70) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 55, 0]), "sc": (u32(71) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 56, 0]), "sc": (u32(72) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 57, 0]), "sc": (u32(73) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 45, 0]), "sc": (u32(74) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 52, 0]), "sc": (u32(75) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 53, 0]), "sc": (u32(76) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 54, 0]), "sc": (u32(77) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 43, 0]), "sc": (u32(78) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 49, 0]), "sc": (u32(79) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 50, 0]), "sc": (u32(80) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 51, 0]), "sc": (u32(81) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 48, 0]), "sc": (u32(82) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 46, 0]), "sc": (u32(83) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 115, 115, 84, 104, 97, 110, 0]), "sc": (u32(86) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 49, 0]), "sc": (u32(87) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([70, 49, 50, 0]), "sc": (u32(88) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 100, 69, 110, 116, 0]), "sc": (u32(156) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 67, 116, 114, 108, 0]), "sc": (u32(157) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([75, 112, 97, 100, 47, 0]), "sc": (u32(181) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 65, 108, 116, 0]), "sc": (u32(184) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 114, 116, 83, 99, 110, 0]), "sc": (u32(183) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 97, 117, 115, 101, 0]), "sc": (u32(197) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([72, 111, 109, 101, 0]), "sc": (u32(199) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([85, 112, 0]), "sc": (u32(200) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 85, 112, 0]), "sc": (u32(201) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([76, 101, 102, 116, 0]), "sc": (u32(203) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([82, 105, 103, 104, 116, 0]), "sc": (u32(205) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([69, 110, 100, 0]), "sc": (u32(207) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 111, 119, 110, 0]), "sc": (u32(208) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([80, 103, 68, 110, 0]), "sc": (u32(209) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([73, 110, 115, 101, 114, 116, 0]), "sc": (u32(210) & 255)}), null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"key": {"offset": 0, "pointer": true, "size": 8}, "sc": {"native": "Uint8Array", "offset": 8, "size": 1}}, "overlaps": false, "size": 16, "union": false}, cStaticInitializerValues({"key": Uint8Array.from([68, 101, 108, 101, 116, 101, 0]), "sc": (u32(211) & 255)}), null, {})]));
function __cxx_static_address_ffb6e6ab66cac5d9952485a8() {
  return __cxx_static_address_ffb6e6ab66cac5d9952485a8.reference || (__cxx_static_address_ffb6e6ab66cac5d9952485a8.reference = {
    __cReference: true,
    get value() { return sctokeylut__header_global_d6206e5a79c47a36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function ARRAY_SIZE__header_c13a16ef3227(arg0) {
  return u64(1n);
}

export function ARRAY_SIZE__header_75c07013efc9(arg0) {
  return u64(8n);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:1400
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

// C/C++ source: source/duke3d/src/grpscan.cpp:1378
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

// C/C++ source: source/duke3d/src/grpscan.cpp:76
export function dup_filename__header_c6f914529149(fn) {
  let buf = cTypedPointer(xmalloc__header_7ea3db72425d(u64(256)), Uint8Array);
  return Bstrncpyz__header_784ccb518823(buf, fn, u64(256));
}

export function ARRAY_SIZE__header_20ca03f8871f(arg0) {
  return u64(33n);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:1449
export function xfree__header_14dfd5b92158(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/duke3d/src/grpscan.cpp:1235
export function Bstrncpyz__header_784ccb518823(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

// C/C++ source: source/duke3d/src/grpscan.cpp:1392
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
