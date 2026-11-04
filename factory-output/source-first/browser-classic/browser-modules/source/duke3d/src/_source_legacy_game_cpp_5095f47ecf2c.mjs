// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/game.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { ClockTicks } from "../../build/src/osd.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { g_player } from "./global.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { __cxx_global_cell_04adffdeab684b9c52206917 } from "../../build/src/mmulti.cpp.mjs";
import { __cxx_global_cell_4a046e33ecf7aced9bfd0007 } from "../../build/src/engine.cpp.mjs";
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
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/duke3d/src/dnames.h:542
export const APLAYER____header_global_3748b247b5ac338b = ((u32(((u32(1405) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_960f606861d9805820c26f3a() {
  return __cxx_static_address_960f606861d9805820c26f3a.reference || (__cxx_static_address_960f606861d9805820c26f3a.reference = {
    __cReference: true,
    get value() { return APLAYER____header_global_3748b247b5ac338b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:571
export const ARMJIB1____header_global_04afd1ca057f07dc = ((u32(((u32(1772) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6110225b2f4030d97736d5ea() {
  return __cxx_static_address_6110225b2f4030d97736d5ea.reference || (__cxx_static_address_6110225b2f4030d97736d5ea.reference = {
    __cReference: true,
    get value() { return ARMJIB1____header_global_04afd1ca057f07dc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:238
export const ATOMICHEALTH____header_global_2d46e0334e9c626b = ((u32(((u32(100) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_482e1471feb946dc974fee32() {
  return __cxx_static_address_482e1471feb946dc974fee32.reference || (__cxx_static_address_482e1471feb946dc974fee32.reference = {
    __cReference: true,
    get value() { return ATOMICHEALTH____header_global_2d46e0334e9c626b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:495
export const BLOODPOOL____header_global_df7e497207a1289b = ((u32(((u32(1226) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_097321216113fd98cacfbd46() {
  return __cxx_static_address_097321216113fd98cacfbd46.reference || (__cxx_static_address_097321216113fd98cacfbd46.reference = {
    __cReference: true,
    get value() { return BLOODPOOL____header_global_df7e497207a1289b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:603
export const BLOODSPLAT1____header_global_11ba5276306c38df = ((u32(((u32(2296) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ad116195d204f675ef5e76c7() {
  return __cxx_static_address_ad116195d204f675ef5e76c7.reference || (__cxx_static_address_ad116195d204f675ef5e76c7.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT1____header_global_11ba5276306c38df; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:605
export const BLOODSPLAT2____header_global_5753e691050e33a2 = ((u32(((u32(2298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_524dc2f99a892fd85d6e1200() {
  return __cxx_static_address_524dc2f99a892fd85d6e1200.reference || (__cxx_static_address_524dc2f99a892fd85d6e1200.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT2____header_global_5753e691050e33a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:604
export const BLOODSPLAT3____header_global_96f920d40bc378f8 = ((u32(((u32(2297) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d1e711b1fcd6e8c46674ec23() {
  return __cxx_static_address_d1e711b1fcd6e8c46674ec23.reference || (__cxx_static_address_d1e711b1fcd6e8c46674ec23.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT3____header_global_96f920d40bc378f8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:606
export const BLOODSPLAT4____header_global_60cf6e2dbdd2b84a = ((u32(((u32(2299) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59ffa1f5dad4b1cf54f9d4ee() {
  return __cxx_static_address_59ffa1f5dad4b1cf54f9d4ee.reference || (__cxx_static_address_59ffa1f5dad4b1cf54f9d4ee.reference = {
    __cReference: true,
    get value() { return BLOODSPLAT4____header_global_60cf6e2dbdd2b84a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:420
export const BULLETHOLE____header_global_eb98ec4981f8f310 = ((u32(((u32(952) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_782ed6167ab93ac3d47aff05() {
  return __cxx_static_address_782ed6167ab93ac3d47aff05.reference || (__cxx_static_address_782ed6167ab93ac3d47aff05.reference = {
    __cReference: true,
    get value() { return BULLETHOLE____header_global_eb98ec4981f8f310; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:616
export const BURNING2____header_global_9fde62481968f048 = ((u32(((u32(2310) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4b232f9993f56f4b4803f64() {
  return __cxx_static_address_a4b232f9993f56f4b4803f64.reference || (__cxx_static_address_a4b232f9993f56f4b4803f64.reference = {
    __cReference: true,
    get value() { return BURNING2____header_global_9fde62481968f048; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:600
export const BURNING____header_global_a2e957227fb915b7 = ((u32(((u32(2270) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a2b0691c4e888d9aa0bb6373() {
  return __cxx_static_address_a2b0691c4e888d9aa0bb6373.reference || (__cxx_static_address_a2b0691c4e888d9aa0bb6373.reference = {
    __cReference: true,
    get value() { return BURNING____header_global_a2e957227fb915b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:353
export const CAMERA1____header_global_fa4c61d0c746ad97 = ((u32(((u32(621) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_90b156ea8760f7316a082289() {
  return __cxx_static_address_90b156ea8760f7316a082289.reference || (__cxx_static_address_90b156ea8760f7316a082289.reference = {
    __cReference: true,
    get value() { return CAMERA1____header_global_fa4c61d0c746ad97; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:670
export const CHAINGUN____header_global_9fa91598761cb757 = ((u32(((u32(2536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f16c18174976274a56435f9f() {
  return __cxx_static_address_f16c18174976274a56435f9f.reference || (__cxx_static_address_f16c18174976274a56435f9f.reference = {
    __cReference: true,
    get value() { return CHAINGUN____header_global_9fa91598761cb757; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:367
export const CHAIR3____header_global_741ae03e5b5efa62 = ((u32(((u32(680) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6182eaa48d1de5680fcd97be() {
  return __cxx_static_address_6182eaa48d1de5680fcd97be.reference || (__cxx_static_address_6182eaa48d1de5680fcd97be.reference = {
    __cReference: true,
    get value() { return CHAIR3____header_global_741ae03e5b5efa62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:537
export const COOLEXPLOSION1____header_global_b3db2038f7796530 = ((u32(((u32(1360) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0f782fa72575d97d6a98d5ac() {
  return __cxx_static_address_0f782fa72575d97d6a98d5ac.reference || (__cxx_static_address_0f782fa72575d97d6a98d5ac.reference = {
    __cReference: true,
    get value() { return COOLEXPLOSION1____header_global_b3db2038f7796530; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:321
export const CRACK1____header_global_038c2f85669bd08c = ((u32(((u32(546) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5a0ba977b6ca51841a2115e8() {
  return __cxx_static_address_5a0ba977b6ca51841a2115e8.reference || (__cxx_static_address_5a0ba977b6ca51841a2115e8.reference = {
    __cReference: true,
    get value() { return CRACK1____header_global_038c2f85669bd08c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:322
export const CRACK2____header_global_6e964f72586e312c = ((u32(((u32(547) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_430aec2b7b8532d959d78b89() {
  return __cxx_static_address_430aec2b7b8532d959d78b89.reference || (__cxx_static_address_430aec2b7b8532d959d78b89.reference = {
    __cReference: true,
    get value() { return CRACK2____header_global_6e964f72586e312c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:323
export const CRACK3____header_global_c313537f1c0dd443 = ((u32(((u32(548) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_134e24be44835c7e72bac104() {
  return __cxx_static_address_134e24be44835c7e72bac104.reference || (__cxx_static_address_134e24be44835c7e72bac104.reference = {
    __cReference: true,
    get value() { return CRACK3____header_global_c313537f1c0dd443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:324
export const CRACK4____header_global_291c729f58d97894 = ((u32(((u32(549) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_848bc6130c5e2f4029ccd1d4() {
  return __cxx_static_address_848bc6130c5e2f4029ccd1d4.reference || (__cxx_static_address_848bc6130c5e2f4029ccd1d4.reference = {
    __cReference: true,
    get value() { return CRACK4____header_global_291c729f58d97894; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:218
export const CRYSTALAMMO____header_global_95d8cbfc7980390e = ((u32(((u32(46) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e935ddb321bba816b9a4792() {
  return __cxx_static_address_7e935ddb321bba816b9a4792.reference || (__cxx_static_address_7e935ddb321bba816b9a4792.reference = {
    __cReference: true,
    get value() { return CRYSTALAMMO____header_global_95d8cbfc7980390e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:546
export const DUKEGUN____header_global_ad2a5359a401cfb1 = ((u32(((u32(1528) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_971d5275e7ce80877d39940b() {
  return __cxx_static_address_971d5275e7ce80877d39940b.reference || (__cxx_static_address_971d5275e7ce80877d39940b.reference = {
    __cReference: true,
    get value() { return DUKEGUN____header_global_ad2a5359a401cfb1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:547
export const DUKELEG____header_global_05b7b45f2964af66 = ((u32(((u32(1536) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_4e57da084ee9c13eae8293c0() {
  return __cxx_static_address_4e57da084ee9c13eae8293c0.reference || (__cxx_static_address_4e57da084ee9c13eae8293c0.reference = {
    __cReference: true,
    get value() { return DUKELEG____header_global_05b7b45f2964af66; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:544
export const DUKELYINGDEAD____header_global_8e3b8899a7b2d4d9 = ((u32(((u32(1518) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6d3db0cd0ceb3d74fc868386() {
  return __cxx_static_address_6d3db0cd0ceb3d74fc868386.reference || (__cxx_static_address_6d3db0cd0ceb3d74fc868386.reference = {
    __cReference: true,
    get value() { return DUKELYINGDEAD____header_global_8e3b8899a7b2d4d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:545
export const DUKETORSO____header_global_182134f187daf3e6 = ((u32(((u32(1520) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_59bc31232a7a68d55e9b08fd() {
  return __cxx_static_address_59bc31232a7a68d55e9b08fd.reference || (__cxx_static_address_59bc31232a7a68d55e9b08fd.reference = {
    __cReference: true,
    get value() { return DUKETORSO____header_global_182134f187daf3e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:594
export const EXPLOSION2BOT____header_global_41a51142b2b35bb9 = ((u32(((u32(2219) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2255e42b0a53d9fda3ac9a28() {
  return __cxx_static_address_2255e42b0a53d9fda3ac9a28.reference || (__cxx_static_address_2255e42b0a53d9fda3ac9a28.reference = {
    __cReference: true,
    get value() { return EXPLOSION2BOT____header_global_41a51142b2b35bb9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:577
export const EXPLOSION2____header_global_d4b55b09a6f7e9a2 = ((u32(((u32(1890) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_68a86d088ffb406d0b2e8ae7() {
  return __cxx_static_address_68a86d088ffb406d0b2e8ae7.reference || (__cxx_static_address_68a86d088ffb406d0b2e8ae7.reference = {
    __cReference: true,
    get value() { return EXPLOSION2____header_global_d4b55b09a6f7e9a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:617
export const FIRE2____header_global_2d81afecfe645845 = ((u32(((u32(2311) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3c0541374ad458d314221775() {
  return __cxx_static_address_3c0541374ad458d314221775.reference || (__cxx_static_address_3c0541374ad458d314221775.reference = {
    __cReference: true,
    get value() { return FIRE2____header_global_2d81afecfe645845; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:550
export const FIRELASER____header_global_69c51a34100e8e47 = ((u32(((u32(1625) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c02148eb7b7f55872e2e8e02() {
  return __cxx_static_address_c02148eb7b7f55872e2e8e02.reference || (__cxx_static_address_c02148eb7b7f55872e2e8e02.reference = {
    __cReference: true,
    get value() { return FIRELASER____header_global_69c51a34100e8e47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:601
export const FIRE____header_global_cd342a3e11f926d9 = ((u32(((u32(2271) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_73fcc8b780bf15985df46e68() {
  return __cxx_static_address_73fcc8b780bf15985df46e68.reference || (__cxx_static_address_73fcc8b780bf15985df46e68.reference = {
    __cReference: true,
    get value() { return FIRE____header_global_cd342a3e11f926d9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:620
export const FLOORFLAME____header_global_1ca273751508aaf0 = ((u32(((u32(2333) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_dd75fdb17ca4f7960f6915d5() {
  return __cxx_static_address_dd75fdb17ca4f7960f6915d5.reference || (__cxx_static_address_dd75fdb17ca4f7960f6915d5.reference = {
    __cReference: true,
    get value() { return FLOORFLAME____header_global_1ca273751508aaf0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:362
export const FOOTPRINTS2____header_global_32f9ab10629910ad = ((u32(((u32(672) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a5160911396f726a0948065d() {
  return __cxx_static_address_a5160911396f726a0948065d.reference || (__cxx_static_address_a5160911396f726a0948065d.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS2____header_global_32f9ab10629910ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:363
export const FOOTPRINTS3____header_global_2a34707ec66ac5a8 = ((u32(((u32(673) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5c3a90db817e496947e145ca() {
  return __cxx_static_address_5c3a90db817e496947e145ca.reference || (__cxx_static_address_5c3a90db817e496947e145ca.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS3____header_global_2a34707ec66ac5a8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:364
export const FOOTPRINTS4____header_global_8ee264b22e59a2c5 = ((u32(((u32(674) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c2af46dd124eb9870ace4de0() {
  return __cxx_static_address_c2af46dd124eb9870ace4de0.reference || (__cxx_static_address_c2af46dd124eb9870ace4de0.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS4____header_global_8ee264b22e59a2c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:325
export const FOOTPRINTS____header_global_3a3df8f5908d45a4 = ((u32(((u32(550) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a107441c5340ee3783402b7() {
  return __cxx_static_address_8a107441c5340ee3783402b7.reference || (__cxx_static_address_8a107441c5340ee3783402b7.reference = {
    __cReference: true,
    get value() { return FOOTPRINTS____header_global_3a3df8f5908d45a4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:682
export const FORCESPHERE____header_global_47ffbbe80ecb4851 = ((u32(((u32(2590) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e9114cbb3c8a5ade0f006aa1() {
  return __cxx_static_address_e9114cbb3c8a5ade0f006aa1.reference || (__cxx_static_address_e9114cbb3c8a5ade0f006aa1.reference = {
    __cReference: true,
    get value() { return FORCESPHERE____header_global_47ffbbe80ecb4851; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:720
export const FRAMEEFFECT1_13____header_global_6d4c08eb99ccb845 = ((u32(((u32(3999) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_53a64512fd1512d9dc88821f() {
  return __cxx_static_address_53a64512fd1512d9dc88821f.reference || (__cxx_static_address_53a64512fd1512d9dc88821f.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1_13____header_global_6d4c08eb99ccb845; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:721
export const FRAMEEFFECT1____header_global_18c264e1499aca98 = ((u32(((u32(4095) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_05dfd6b6e79847c83dfe67fc() {
  return __cxx_static_address_05dfd6b6e79847c83dfe67fc.reference || (__cxx_static_address_05dfd6b6e79847c83dfe67fc.reference = {
    __cReference: true,
    get value() { return FRAMEEFFECT1____header_global_18c264e1499aca98; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:555
export const FREEZEBLAST____header_global_ebcd8418336ca537 = ((u32(((u32(1641) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9138807215e24c1f6161f582() {
  return __cxx_static_address_9138807215e24c1f6161f582.reference || (__cxx_static_address_9138807215e24c1f6161f582.reference = {
    __cReference: true,
    get value() { return FREEZEBLAST____header_global_ebcd8418336ca537; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:634
export const GROWSPARK____header_global_38cc686efe99f70c = ((u32(((u32(2448) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_01e2ebb78ca8a089890bfa40() {
  return __cxx_static_address_01e2ebb78ca8a089890bfa40.reference || (__cxx_static_address_01e2ebb78ca8a089890bfa40.reference = {
    __cReference: true,
    get value() { return GROWSPARK____header_global_38cc686efe99f70c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:523
export const BLOODYPOLE____header_global_b964b8f9100b455f = ((u32(((u32(1324) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c7e20671ad933cb0eb7fa891() {
  return __cxx_static_address_c7e20671ad933cb0eb7fa891.reference || (__cxx_static_address_c7e20671ad933cb0eb7fa891.reference = {
    __cReference: true,
    get value() { return BLOODYPOLE____header_global_b964b8f9100b455f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:763
export const DOLPHIN1____header_global_7ad32523df8df580 = ((u32(((u32(4591) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_37d9fe069a8b55febb605140() {
  return __cxx_static_address_37d9fe069a8b55febb605140.reference || (__cxx_static_address_37d9fe069a8b55febb605140.reference = {
    __cReference: true,
    get value() { return DOLPHIN1____header_global_7ad32523df8df580; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:764
export const DOLPHIN2____header_global_2bb93381647a9fa3 = ((u32(((u32(4592) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_917a6acad6425c2e5e4dca9c() {
  return __cxx_static_address_917a6acad6425c2e5e4dca9c.reference || (__cxx_static_address_917a6acad6425c2e5e4dca9c.reference = {
    __cReference: true,
    get value() { return DOLPHIN2____header_global_2bb93381647a9fa3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:769
export const FEM10____header_global_e92de30930810443 = ((u32(((u32(4864) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e001c5bc61df827867f6685b() {
  return __cxx_static_address_e001c5bc61df827867f6685b.reference || (__cxx_static_address_e001c5bc61df827867f6685b.reference = {
    __cReference: true,
    get value() { return FEM10____header_global_e92de30930810443; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:519
export const FEM1____header_global_6c3bc763a4679cf7 = ((u32(((u32(1312) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c8ed78d6873d424a850fd267() {
  return __cxx_static_address_c8ed78d6873d424a850fd267.reference || (__cxx_static_address_c8ed78d6873d424a850fd267.reference = {
    __cReference: true,
    get value() { return FEM1____header_global_6c3bc763a4679cf7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:520
export const FEM2____header_global_ae5b44893de611e7 = ((u32(((u32(1317) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_32cc6058a6ec3abc2e92b88a() {
  return __cxx_static_address_32cc6058a6ec3abc2e92b88a.reference || (__cxx_static_address_32cc6058a6ec3abc2e92b88a.reference = {
    __cReference: true,
    get value() { return FEM2____header_global_ae5b44893de611e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:521
export const FEM3____header_global_7e6d9b03142394e3 = ((u32(((u32(1321) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d06a690d717a5b5d206d02d6() {
  return __cxx_static_address_d06a690d717a5b5d206d02d6.reference || (__cxx_static_address_d06a690d717a5b5d206d02d6.reference = {
    __cReference: true,
    get value() { return FEM3____header_global_7e6d9b03142394e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:524
export const FEM4____header_global_eaf38733028fc1a5 = ((u32(((u32(1325) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c73e81f9a217ded801afc230() {
  return __cxx_static_address_c73e81f9a217ded801afc230.reference || (__cxx_static_address_c73e81f9a217ded801afc230.reference = {
    __cReference: true,
    get value() { return FEM4____header_global_eaf38733028fc1a5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:522
export const FEM5____header_global_e32b47543e14be44 = ((u32(((u32(1323) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_aefacd98ff4e01fe5d760da1() {
  return __cxx_static_address_aefacd98ff4e01fe5d760da1.reference || (__cxx_static_address_aefacd98ff4e01fe5d760da1.reference = {
    __cReference: true,
    get value() { return FEM5____header_global_e32b47543e14be44; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:526
export const FEM6PAD____header_global_dc109a1f8ffa544e = ((u32(((u32(1335) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8b9399bb6a073da25a821d95() {
  return __cxx_static_address_8b9399bb6a073da25a821d95.reference || (__cxx_static_address_8b9399bb6a073da25a821d95.reference = {
    __cReference: true,
    get value() { return FEM6PAD____header_global_dc109a1f8ffa544e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:525
export const FEM6____header_global_9281c402db288bc3 = ((u32(((u32(1334) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e18f4f23baaf907664f21dc1() {
  return __cxx_static_address_e18f4f23baaf907664f21dc1.reference || (__cxx_static_address_e18f4f23baaf907664f21dc1.reference = {
    __cReference: true,
    get value() { return FEM6____header_global_9281c402db288bc3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:540
export const FEM7____header_global_4a24bed2a474cbd9 = ((u32(((u32(1395) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c9d268a0ff035f20dd7bfb34() {
  return __cxx_static_address_c9d268a0ff035f20dd7bfb34.reference || (__cxx_static_address_c9d268a0ff035f20dd7bfb34.reference = {
    __cReference: true,
    get value() { return FEM7____header_global_4a24bed2a474cbd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:527
export const FEM8____header_global_825a520321d1db82 = ((u32(((u32(1336) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_fd25f2166a2c108a5f182c24() {
  return __cxx_static_address_fd25f2166a2c108a5f182c24.reference || (__cxx_static_address_fd25f2166a2c108a5f182c24.reference = {
    __cReference: true,
    get value() { return FEM8____header_global_825a520321d1db82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:719
export const FEM9____header_global_7f5bf24344a06d81 = ((u32(((u32(3450) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d6640703b7131bea8af6fc4c() {
  return __cxx_static_address_d6640703b7131bea8af6fc4c.reference || (__cxx_static_address_d6640703b7131bea8af6fc4c.reference = {
    __cReference: true,
    get value() { return FEM9____header_global_7f5bf24344a06d81; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:334
export const FEMMAG1____header_global_75336c4c3f0706c3 = ((u32(((u32(568) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_444ff0e66bce37b1978493d9() {
  return __cxx_static_address_444ff0e66bce37b1978493d9.reference || (__cxx_static_address_444ff0e66bce37b1978493d9.reference = {
    __cReference: true,
    get value() { return FEMMAG1____header_global_75336c4c3f0706c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:338
export const FEMMAG2____header_global_e3f4bc57305c96ad = ((u32(((u32(577) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d8a8c53226a5dd49f3b1b8fa() {
  return __cxx_static_address_d8a8c53226a5dd49f3b1b8fa.reference || (__cxx_static_address_d8a8c53226a5dd49f3b1b8fa.reference = {
    __cReference: true,
    get value() { return FEMMAG2____header_global_e3f4bc57305c96ad; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:513
export const FEMPIC1____header_global_a4533ec869e1a3ef = ((u32(((u32(1280) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2c3be0d2d3be7dec3af1716c() {
  return __cxx_static_address_2c3be0d2d3be7dec3af1716c.reference || (__cxx_static_address_2c3be0d2d3be7dec3af1716c.reference = {
    __cReference: true,
    get value() { return FEMPIC1____header_global_a4533ec869e1a3ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:514
export const FEMPIC2____header_global_c2d8f42bec6a5474 = ((u32(((u32(1289) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ea06ee92df125a060946c093() {
  return __cxx_static_address_ea06ee92df125a060946c093.reference || (__cxx_static_address_ea06ee92df125a060946c093.reference = {
    __cReference: true,
    get value() { return FEMPIC2____header_global_c2d8f42bec6a5474; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:517
export const FEMPIC3____header_global_dc9da92f4881cddb = ((u32(((u32(1298) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b1cf5bdd5bcad61ba029cc95() {
  return __cxx_static_address_b1cf5bdd5bcad61ba029cc95.reference || (__cxx_static_address_b1cf5bdd5bcad61ba029cc95.reference = {
    __cReference: true,
    get value() { return FEMPIC3____header_global_dc9da92f4881cddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:518
export const FEMPIC4____header_global_a2e22e1e820d41ca = ((u32(((u32(1306) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c1d30f7604554fbb35f92049() {
  return __cxx_static_address_c1d30f7604554fbb35f92049.reference || (__cxx_static_address_c1d30f7604554fbb35f92049.reference = {
    __cReference: true,
    get value() { return FEMPIC4____header_global_a2e22e1e820d41ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:425
export const FEMPIC5____header_global_4b9b81180494dc18 = ((u32(((u32(963) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_427953c606c69cb957688792() {
  return __cxx_static_address_427953c606c69cb957688792.reference || (__cxx_static_address_427953c606c69cb957688792.reference = {
    __cReference: true,
    get value() { return FEMPIC5____header_global_4b9b81180494dc18; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:426
export const FEMPIC6____header_global_56bbc29002714e92 = ((u32(((u32(964) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f1d23470e15b71f4240f067a() {
  return __cxx_static_address_f1d23470e15b71f4240f067a.reference || (__cxx_static_address_f1d23470e15b71f4240f067a.reference = {
    __cReference: true,
    get value() { return FEMPIC6____header_global_56bbc29002714e92; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:427
export const FEMPIC7____header_global_703b730890361b83 = ((u32(((u32(965) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9793fb1ae8654d35d16c5e1d() {
  return __cxx_static_address_9793fb1ae8654d35d16c5e1d.reference || (__cxx_static_address_9793fb1ae8654d35d16c5e1d.reference = {
    __cReference: true,
    get value() { return FEMPIC7____header_global_703b730890361b83; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:534
export const FETUSBROKE____header_global_ee76e864e3ff4f53 = ((u32(((u32(1359) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_6c23fc767947052933740f5b() {
  return __cxx_static_address_6c23fc767947052933740f5b.reference || (__cxx_static_address_6c23fc767947052933740f5b.reference = {
    __cReference: true,
    get value() { return FETUSBROKE____header_global_ee76e864e3ff4f53; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:529
export const FETUSJIB____header_global_7259937db3ed30e2 = ((u32(((u32(1347) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8a6c954168c213921ac946ba() {
  return __cxx_static_address_8a6c954168c213921ac946ba.reference || (__cxx_static_address_8a6c954168c213921ac946ba.reference = {
    __cReference: true,
    get value() { return FETUSJIB____header_global_7259937db3ed30e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:533
export const FETUS____header_global_9e8d6d6ae00e3abf = ((u32(((u32(1358) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_93fa649e7ddaa72b4082f525() {
  return __cxx_static_address_93fa649e7ddaa72b4082f525.reference || (__cxx_static_address_93fa649e7ddaa72b4082f525.reference = {
    __cReference: true,
    get value() { return FETUS____header_global_9e8d6d6ae00e3abf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:758
export const FOODOBJECT16____header_global_15fdc1142339fb3d = ((u32(((u32(4545) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_286173b7bbe48e5d9255b6e1() {
  return __cxx_static_address_286173b7bbe48e5d9255b6e1.reference || (__cxx_static_address_286173b7bbe48e5d9255b6e1.reference = {
    __cReference: true,
    get value() { return FOODOBJECT16____header_global_15fdc1142339fb3d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:570
export const HEADJIB1____header_global_347b50f9a9bb85f7 = ((u32(((u32(1768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a83ba72a77d37fac12f919c5() {
  return __cxx_static_address_a83ba72a77d37fac12f919c5.reference || (__cxx_static_address_a83ba72a77d37fac12f919c5.reference = {
    __cReference: true,
    get value() { return HEADJIB1____header_global_347b50f9a9bb85f7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:751
export const HOTMEAT____header_global_ce822bbd1a72c1cc = ((u32(((u32(4427) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7b2ae6022a4e8dd92c923eb6() {
  return __cxx_static_address_7b2ae6022a4e8dd92c923eb6.reference || (__cxx_static_address_7b2ae6022a4e8dd92c923eb6.reference = {
    __cReference: true,
    get value() { return HOTMEAT____header_global_ce822bbd1a72c1cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:595
export const JIBS1____header_global_767259025415f397 = ((u32(((u32(2245) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e02f2984c18f2b6d12f5f500() {
  return __cxx_static_address_e02f2984c18f2b6d12f5f500.reference || (__cxx_static_address_e02f2984c18f2b6d12f5f500.reference = {
    __cReference: true,
    get value() { return JIBS1____header_global_767259025415f397; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:596
export const JIBS2____header_global_8fee01309ff3e481 = ((u32(((u32(2250) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7f775542f0d44a92659ef63c() {
  return __cxx_static_address_7f775542f0d44a92659ef63c.reference || (__cxx_static_address_7f775542f0d44a92659ef63c.reference = {
    __cReference: true,
    get value() { return JIBS2____header_global_8fee01309ff3e481; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:597
export const JIBS3____header_global_8d231c633513bcbc = ((u32(((u32(2255) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_f6092d02fbdba60c2652e267() {
  return __cxx_static_address_f6092d02fbdba60c2652e267.reference || (__cxx_static_address_f6092d02fbdba60c2652e267.reference = {
    __cReference: true,
    get value() { return JIBS3____header_global_8d231c633513bcbc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:598
export const JIBS4____header_global_a50795f073941beb = ((u32(((u32(2260) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a4177b91174305a7ed975231() {
  return __cxx_static_address_a4177b91174305a7ed975231.reference || (__cxx_static_address_a4177b91174305a7ed975231.reference = {
    __cReference: true,
    get value() { return JIBS4____header_global_a50795f073941beb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:599
export const JIBS5____header_global_c7eda1090a13ce88 = ((u32(((u32(2265) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_bf58d973b9b0d41411cec8bb() {
  return __cxx_static_address_bf58d973b9b0d41411cec8bb.reference || (__cxx_static_address_bf58d973b9b0d41411cec8bb.reference = {
    __cReference: true,
    get value() { return JIBS5____header_global_c7eda1090a13ce88; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:602
export const JIBS6____header_global_12aa88e2ca65f14b = ((u32(((u32(2286) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_66329a4d1caf3b2ef310f251() {
  return __cxx_static_address_66329a4d1caf3b2ef310f251.reference || (__cxx_static_address_66329a4d1caf3b2ef310f251.reference = {
    __cReference: true,
    get value() { return JIBS6____header_global_12aa88e2ca65f14b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:676
export const LASERLINE____header_global_e88c1b6726fe41b2 = ((u32(((u32(2567) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_419f4f111aeec5f3e5b7aafe() {
  return __cxx_static_address_419f4f111aeec5f3e5b7aafe.reference || (__cxx_static_address_419f4f111aeec5f3e5b7aafe.reference = {
    __cReference: true,
    get value() { return LASERLINE____header_global_e88c1b6726fe41b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:572
export const LEGJIB1____header_global_44cc96015a6a9128 = ((u32(((u32(1776) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_c267a0832f75d2d0d8c60f6b() {
  return __cxx_static_address_c267a0832f75d2d0d8c60f6b.reference || (__cxx_static_address_c267a0832f75d2d0d8c60f6b.reference = {
    __cReference: true,
    get value() { return LEGJIB1____header_global_44cc96015a6a9128; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:592
export const LIZMANARM1____header_global_fcd348bef9135a9d = ((u32(((u32(2205) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_13d394c82e78a3bb0beb0344() {
  return __cxx_static_address_13d394c82e78a3bb0beb0344.reference || (__cxx_static_address_13d394c82e78a3bb0beb0344.reference = {
    __cReference: true,
    get value() { return LIZMANARM1____header_global_fcd348bef9135a9d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:591
export const LIZMANHEAD1____header_global_618cd08269e6adbe = ((u32(((u32(2201) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3543eb77b58bb8a616869cbb() {
  return __cxx_static_address_3543eb77b58bb8a616869cbb.reference || (__cxx_static_address_3543eb77b58bb8a616869cbb.reference = {
    __cReference: true,
    get value() { return LIZMANHEAD1____header_global_618cd08269e6adbe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:593
export const LIZMANLEG1____header_global_085fa088a4d32860 = ((u32(((u32(2209) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_76848c68b5b92ebc0252b6e0() {
  return __cxx_static_address_76848c68b5b92ebc0252b6e0.reference || (__cxx_static_address_76848c68b5b92ebc0252b6e0.reference = {
    __cReference: true,
    get value() { return LIZMANLEG1____header_global_085fa088a4d32860; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:750
export const MAIL____header_global_8979be5fd3b1a7e5 = ((u32(((u32(4410) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a3f91d9d98d113a8d30ea1e8() {
  return __cxx_static_address_a3f91d9d98d113a8d30ea1e8.reference || (__cxx_static_address_a3f91d9d98d113a8d30ea1e8.reference = {
    __cReference: true,
    get value() { return MAIL____header_global_8979be5fd3b1a7e5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:772
export const MAN2____header_global_23cf71ab2b089498 = ((u32(((u32(4872) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_35b8e446991222370e704a56() {
  return __cxx_static_address_35b8e446991222370e704a56.reference || (__cxx_static_address_35b8e446991222370e704a56.reference = {
    __cReference: true,
    get value() { return MAN2____header_global_23cf71ab2b089498; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:771
export const MAN____header_global_da1bf674cdcd85bc = ((u32(((u32(4871) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_df296527d3adf39a153c953c() {
  return __cxx_static_address_df296527d3adf39a153c953c.reference || (__cxx_static_address_df296527d3adf39a153c953c.reference = {
    __cReference: true,
    get value() { return MAN____header_global_da1bf674cdcd85bc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:500
export const MONEY____header_global_69ff0bf9face252d = ((u32(((u32(1233) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0c590b007ac285dd7af17bf8() {
  return __cxx_static_address_0c590b007ac285dd7af17bf8.reference || (__cxx_static_address_0c590b007ac285dd7af17bf8.reference = {
    __cReference: true,
    get value() { return MONEY____header_global_69ff0bf9face252d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:345
export const NAKED1____header_global_3661ff61ff0ae6d7 = ((u32(((u32(603) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_5ef1cac52497121f486ed154() {
  return __cxx_static_address_5ef1cac52497121f486ed154.reference || (__cxx_static_address_5ef1cac52497121f486ed154.reference = {
    __cReference: true,
    get value() { return NAKED1____header_global_3661ff61ff0ae6d7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:414
export const NEON1____header_global_97e870e44ce156c5 = ((u32(((u32(925) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ee15ba7a2c7baf0b1812d406() {
  return __cxx_static_address_ee15ba7a2c7baf0b1812d406.reference || (__cxx_static_address_ee15ba7a2c7baf0b1812d406.reference = {
    __cReference: true,
    get value() { return NEON1____header_global_97e870e44ce156c5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:415
export const NEON2____header_global_43d83506f655e417 = ((u32(((u32(926) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_120ee8b4dd71f86af4cd51fd() {
  return __cxx_static_address_120ee8b4dd71f86af4cd51fd.reference || (__cxx_static_address_120ee8b4dd71f86af4cd51fd.reference = {
    __cReference: true,
    get value() { return NEON2____header_global_43d83506f655e417; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:446
export const NEON3____header_global_ed7d3a8c32c1c348 = ((u32(((u32(1007) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_ffd47e08f60202ef899c9094() {
  return __cxx_static_address_ffd47e08f60202ef899c9094.reference || (__cxx_static_address_ffd47e08f60202ef899c9094.reference = {
    __cReference: true,
    get value() { return NEON3____header_global_ed7d3a8c32c1c348; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:447
export const NEON4____header_global_b24b0f4383e38e19 = ((u32(((u32(1008) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_cd5b5ffecf5f3870b919fc43() {
  return __cxx_static_address_cd5b5ffecf5f3870b919fc43.reference || (__cxx_static_address_cd5b5ffecf5f3870b919fc43.reference = {
    __cReference: true,
    get value() { return NEON4____header_global_b24b0f4383e38e19; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:448
export const NEON5____header_global_3c7716b4efa25634 = ((u32(((u32(1009) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_54e3e6f610d240d48213040e() {
  return __cxx_static_address_54e3e6f610d240d48213040e.reference || (__cxx_static_address_54e3e6f610d240d48213040e.reference = {
    __cReference: true,
    get value() { return NEON5____header_global_3c7716b4efa25634; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:457
export const NEON6____header_global_ddddc973bac44d1b = ((u32(((u32(1046) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_af8d76d91736860810807cd0() {
  return __cxx_static_address_af8d76d91736860810807cd0.reference || (__cxx_static_address_af8d76d91736860810807cd0.reference = {
    __cReference: true,
    get value() { return NEON6____header_global_ddddc973bac44d1b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:608
export const OOZ2____header_global_6a1003811cb69a4f = ((u32(((u32(2309) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9363464ffcc1929a8cd8071c() {
  return __cxx_static_address_9363464ffcc1929a8cd8071c.reference || (__cxx_static_address_9363464ffcc1929a8cd8071c.reference = {
    __cReference: true,
    get value() { return OOZ2____header_global_6a1003811cb69a4f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:607
export const OOZ____header_global_07ccc0068f41803e = ((u32(((u32(2300) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_198640140a413a18b2cb6d76() {
  return __cxx_static_address_198640140a413a18b2cb6d76.reference || (__cxx_static_address_198640140a413a18b2cb6d76.reference = {
    __cReference: true,
    get value() { return OOZ____header_global_07ccc0068f41803e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:753
export const PAPER____header_global_c99ca4de2651a5a0 = ((u32(((u32(4460) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1a6c432c235d8956ecba5e21() {
  return __cxx_static_address_1a6c432c235d8956ecba5e21.reference || (__cxx_static_address_1a6c432c235d8956ecba5e21.reference = {
    __cReference: true,
    get value() { return PAPER____header_global_c99ca4de2651a5a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:543
export const PLAYERONWATER____header_global_5cb14ef739e0cc76 = ((u32(((u32(1420) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_755daa45c292496f1f5b272a() {
  return __cxx_static_address_755daa45c292496f1f5b272a.reference || (__cxx_static_address_755daa45c292496f1f5b272a.reference = {
    __cReference: true,
    get value() { return PLAYERONWATER____header_global_5cb14ef739e0cc76; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:516
export const PODFEM1____header_global_b80f05ac6849519f = ((u32(((u32(1294) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_201ab8a96497263987e5b66a() {
  return __cxx_static_address_201ab8a96497263987e5b66a.reference || (__cxx_static_address_201ab8a96497263987e5b66a.reference = {
    __cReference: true,
    get value() { return PODFEM1____header_global_b80f05ac6849519f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:747
export const PUKE____header_global_c139e41ae5a2f60d = ((u32(((u32(4389) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_3ed162ed8c5dd719049f5c3a() {
  return __cxx_static_address_3ed162ed8c5dd719049f5c3a.reference || (__cxx_static_address_3ed162ed8c5dd719049f5c3a.reference = {
    __cReference: true,
    get value() { return PUKE____header_global_c139e41ae5a2f60d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:511
export const RAT____header_global_8fe072f4fae143cc = ((u32(((u32(1267) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2cdc1f5d039c7ac92a06b9d() {
  return __cxx_static_address_d2cdc1f5d039c7ac92a06b9d.reference || (__cxx_static_address_d2cdc1f5d039c7ac92a06b9d.reference = {
    __cReference: true,
    get value() { return RAT____header_global_8fe072f4fae143cc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:580
export const RECON____header_global_d67dab6247ad4479 = ((u32(((u32(1960) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a52e8a4561fb7f1ae3a74a3a() {
  return __cxx_static_address_a52e8a4561fb7f1ae3a74a3a.reference || (__cxx_static_address_a52e8a4561fb7f1ae3a74a3a.reference = {
    __cReference: true,
    get value() { return RECON____header_global_d67dab6247ad4479; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:710
export const RESPAWNMARKERGREEN____header_global_0bb6a597fc029d28 = ((u32(((u32(3210) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_60f3e6de5a34868903e7283e() {
  return __cxx_static_address_60f3e6de5a34868903e7283e.reference || (__cxx_static_address_60f3e6de5a34868903e7283e.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERGREEN____header_global_0bb6a597fc029d28; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:708
export const RESPAWNMARKERRED____header_global_72f7f260513d61db = ((u32(((u32(3190) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_eb9170dd0f8ee4f6a353f802() {
  return __cxx_static_address_eb9170dd0f8ee4f6a353f802.reference || (__cxx_static_address_eb9170dd0f8ee4f6a353f802.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERRED____header_global_72f7f260513d61db; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:709
export const RESPAWNMARKERYELLOW____header_global_720d7250a8e99593 = ((u32(((u32(3200) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_15bd406f4935e2c6e02854bd() {
  return __cxx_static_address_15bd406f4935e2c6e02854bd.reference || (__cxx_static_address_15bd406f4935e2c6e02854bd.reference = {
    __cReference: true,
    get value() { return RESPAWNMARKERYELLOW____header_global_720d7250a8e99593; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:684
export const RPG____header_global_97bd35ece47076dd = ((u32(((u32(2605) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_94163378ab3f49126addd1ba() {
  return __cxx_static_address_94163378ab3f49126addd1ba.reference || (__cxx_static_address_94163378ab3f49126addd1ba.reference = {
    __cReference: true,
    get value() { return RPG____header_global_97bd35ece47076dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:625
export const SCRAP1____header_global_e796ffbeed7430a3 = ((u32(((u32(2400) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e47879de9fec9a2c72baa840() {
  return __cxx_static_address_e47879de9fec9a2c72baa840.reference || (__cxx_static_address_e47879de9fec9a2c72baa840.reference = {
    __cReference: true,
    get value() { return SCRAP1____header_global_e796ffbeed7430a3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:626
export const SCRAP2____header_global_3d510cf89dfb751c = ((u32(((u32(2404) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_8fcddddff8178db6fa39212b() {
  return __cxx_static_address_8fcddddff8178db6fa39212b.reference || (__cxx_static_address_8fcddddff8178db6fa39212b.reference = {
    __cReference: true,
    get value() { return SCRAP2____header_global_3d510cf89dfb751c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:627
export const SCRAP3____header_global_e7996df56b41d897 = ((u32(((u32(2408) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e7e27264de611cc192179807() {
  return __cxx_static_address_e7e27264de611cc192179807.reference || (__cxx_static_address_e7e27264de611cc192179807.reference = {
    __cReference: true,
    get value() { return SCRAP3____header_global_e7996df56b41d897; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:628
export const SCRAP4____header_global_4859950052210cce = ((u32(((u32(2412) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_e354667d67ba529ba82e937e() {
  return __cxx_static_address_e354667d67ba529ba82e937e.reference || (__cxx_static_address_e354667d67ba529ba82e937e.reference = {
    __cReference: true,
    get value() { return SCRAP4____header_global_4859950052210cce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:629
export const SCRAP5____header_global_943ea1fd3df5ad0b = ((u32(((u32(2416) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_d2d2765de8c4fe62d8b0f116() {
  return __cxx_static_address_d2d2765de8c4fe62d8b0f116.reference || (__cxx_static_address_d2d2765de8c4fe62d8b0f116.reference = {
    __cReference: true,
    get value() { return SCRAP5____header_global_943ea1fd3df5ad0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:187
export const SECTOREFFECTOR____header_global_0c85da597d3bd0fa = ((u32(((u32(1) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_9a8d8ad9d451b17a56335bf2() {
  return __cxx_static_address_9a8d8ad9d451b17a56335bf2.reference || (__cxx_static_address_9a8d8ad9d451b17a56335bf2.reference = {
    __cReference: true,
    get value() { return SECTOREFFECTOR____header_global_0c85da597d3bd0fa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:668
export const SHELL____header_global_2a6cd972197b3243 = ((u32(((u32(2533) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_da469efff0b97c9ca0a13770() {
  return __cxx_static_address_da469efff0b97c9ca0a13770.reference || (__cxx_static_address_da469efff0b97c9ca0a13770.reference = {
    __cReference: true,
    get value() { return SHELL____header_global_2a6cd972197b3243; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:669
export const SHOTGUNSHELL____header_global_a2f5d6a4cf85e52d = ((u32(((u32(2535) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_7e286a72641e86fc9b78ba22() {
  return __cxx_static_address_7e286a72641e86fc9b78ba22.reference || (__cxx_static_address_7e286a72641e86fc9b78ba22.reference = {
    __cReference: true,
    get value() { return SHOTGUNSHELL____header_global_a2f5d6a4cf85e52d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:559
export const SHRINKEREXPLOSION____header_global_3aa4e8422bb7981e = ((u32(((u32(1656) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1ed1e19625f5473ef641106b() {
  return __cxx_static_address_1ed1e19625f5473ef641106b.reference || (__cxx_static_address_1ed1e19625f5473ef641106b.reference = {
    __cReference: true,
    get value() { return SHRINKEREXPLOSION____header_global_3aa4e8422bb7981e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:556
export const SHRINKSPARK____header_global_d054f810659c8dd9 = ((u32(((u32(1646) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_0fca7f69409dc20093c25d98() {
  return __cxx_static_address_0fca7f69409dc20093c25d98.reference || (__cxx_static_address_0fca7f69409dc20093c25d98.reference = {
    __cReference: true,
    get value() { return SHRINKSPARK____header_global_d054f810659c8dd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:619
export const SMALLSMOKE____header_global_b5af41ceab5cda32 = ((u32(((u32(2329) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2b41fcafaaa32f6555fb51a0() {
  return __cxx_static_address_2b41fcafaaa32f6555fb51a0.reference || (__cxx_static_address_2b41fcafaaa32f6555fb51a0.reference = {
    __cReference: true,
    get value() { return SMALLSMOKE____header_global_b5af41ceab5cda32; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:400
export const STATUEFLASH____header_global_50aadf0d7bdf4b1c = ((u32(((u32(869) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_1fc831abc3b75fe6eb466ff1() {
  return __cxx_static_address_1fc831abc3b75fe6eb466ff1.reference || (__cxx_static_address_1fc831abc3b75fe6eb466ff1.reference = {
    __cReference: true,
    get value() { return STATUEFLASH____header_global_50aadf0d7bdf4b1c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:384
export const STATUE____header_global_921a665274513c3b = ((u32(((u32(753) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_a1989c1cab24e2427cce5b30() {
  return __cxx_static_address_a1989c1cab24e2427cce5b30.reference || (__cxx_static_address_a1989c1cab24e2427cce5b30.reference = {
    __cReference: true,
    get value() { return STATUE____header_global_921a665274513c3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:387
export const SUSHIPLATE1____header_global_5989a406925be94d = ((u32(((u32(768) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_75afb4a290e116ec5340f766() {
  return __cxx_static_address_75afb4a290e116ec5340f766.reference || (__cxx_static_address_75afb4a290e116ec5340f766.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE1____header_global_5989a406925be94d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:388
export const SUSHIPLATE2____header_global_55fa13e8f4537e24 = ((u32(((u32(769) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b66a37db337357ecbb96992f() {
  return __cxx_static_address_b66a37db337357ecbb96992f.reference || (__cxx_static_address_b66a37db337357ecbb96992f.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE2____header_global_55fa13e8f4537e24; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:389
export const SUSHIPLATE3____header_global_8ed387bd6d5117ca = ((u32(((u32(774) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_b19419786d581b2c4a2b45ae() {
  return __cxx_static_address_b19419786d581b2c4a2b45ae.reference || (__cxx_static_address_b19419786d581b2c4a2b45ae.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE3____header_global_8ed387bd6d5117ca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/dnames.h:390
export const SUSHIPLATE4____header_global_3287006f85034463 = ((u32(((u32(779) << 16) >> 16)) << 16) >> 16);
function __cxx_static_address_2f24e6c281356a58c7deedba() {
  return __cxx_static_address_2f24e6c281356a58c7deedba.reference || (__cxx_static_address_2f24e6c281356a58c7deedba.reference = {
    __cReference: true,
    get value() { return SUSHIPLATE4____header_global_3287006f85034463; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:105
export let MAXCACHE1DSIZE = i32(Math.imul(i32(Math.imul(96, 1024)), 1024));
export function __cxx_global_cell_8405b1e60e6765b2469532f3() {
  return __cxx_global_cell_8405b1e60e6765b2469532f3.reference || (__cxx_global_cell_8405b1e60e6765b2469532f3.reference = {
    __cReference: true,
    get value() { return MAXCACHE1DSIZE; },
    set value(__cxx_lvalue_0) { MAXCACHE1DSIZE = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/game.cpp:487
export let SE40backupStat = new Int16Array(4096);
function __cxx_static_address_95c970b1f4df65aeafd4e06f() {
  return __cxx_static_address_95c970b1f4df65aeafd4e06f.reference || (__cxx_static_address_95c970b1f4df65aeafd4e06f.reference = {
    __cReference: true,
    get value() { return SE40backupStat; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_95c970b1f4df65aeafd4e06f() { return __cxx_static_address_95c970b1f4df65aeafd4e06f(); }

// C/C++ source: source/duke3d/src/game.cpp:488
export let SE40backupZ = new Int32Array(4096);
function __cxx_static_address_e7451d4a9e35969cde9c6e1a() {
  return __cxx_static_address_e7451d4a9e35969cde9c6e1a.reference || (__cxx_static_address_e7451d4a9e35969cde9c6e1a.reference = {
    __cReference: true,
    get value() { return SE40backupZ; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_e7451d4a9e35969cde9c6e1a() { return __cxx_static_address_e7451d4a9e35969cde9c6e1a(); }

// C/C++ source: source/duke3d/src/game.cpp:5952
export function G_FreeHashAnim(arg0, key) {
  xfree__header_25587e65bc1e(cSourceAddresses.decode(key));
}

// C/C++ source: source/duke3d/src/game.cpp:1449
export function xfree__header_25587e65bc1e(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/duke3d/src/game.h:638
export function P_SetupMiscInputSettings__header_950f2544e596() {
  let ps = (cPointerElementRef(cRecordPointer(g_player, {"align": 1, "arrayAlign": 1, "fields": {"frags": {"length": 16, "native": "Uint8Array", "offset": 62, "size": 16}, "gotvote": {"native": "Uint8Array", "offset": 93, "size": 1}, "horizAngleAdjust": {"native": "Int32Array", "offset": 32, "size": 4}, "horizRecenter": {"native": "Int32Array", "offset": 28, "size": 4}, "horizSkew": {"native": "Int32Array", "offset": 36, "size": 4}, "input": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"bits": {"native": "Uint32Array", "offset": 0, "size": 4}, "extbits": {"native": "Uint32Array", "offset": 16, "size": 4}, "fvel": {"native": "Int16Array", "offset": 4, "size": 2}, "q16avel": {"native": "Int32Array", "offset": 8, "size": 4}, "q16horz": {"native": "Int32Array", "offset": 12, "size": 4}, "svel": {"native": "Int16Array", "offset": 6, "size": 2}}, "overlaps": false, "size": 20, "union": false}, "offset": 8}, "lastViewUpdate": {"native": "BigUint64Array", "offset": 40, "size": 8}, "netsynctime": {"native": "Int32Array", "offset": 48, "size": 4}, "pcolor": {"native": "Int32Array", "offset": 52, "size": 4}, "ping": {"native": "Int16Array", "offset": 60, "size": 2}, "pingcnt": {"native": "Uint8Array", "offset": 94, "size": 1}, "playerquitflag": {"native": "Uint8Array", "offset": 95, "size": 1}, "ps": {"offset": 0, "pointer": true, "size": 8}, "pteam": {"native": "Int32Array", "offset": 56, "size": 4}, "ready": {"native": "Uint8Array", "offset": 96, "size": 1}, "revision": {"native": "Uint32Array", "offset": 129, "size": 4}, "smoothcamera": {"native": "Uint8Array", "offset": 91, "size": 1}, "user_name": {"length": 32, "native": "Uint8Array", "offset": 97, "size": 32}, "vote": {"native": "Uint8Array", "offset": 92, "size": 1}, "wchoice": {"length": 13, "native": "Uint8Array", "offset": 78, "size": 13}}, "overlaps": false, "size": 133, "union": false}, {}), __cxx_global_cell_04adffdeab684b9c52206917().value).value).ps;
  (cRecordObject(cRecordPointer(ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).aim_mode = (u32((u32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.mouseaiming) & 255)) & 255));
  (cRecordObject(cRecordPointer(ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).auto_aim = (u32((u32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.config.AutoAim) & 255)) & 255));
  (cRecordObject(cRecordPointer(ps, {"align": 1, "arrayAlign": 2, "fields": {"access_incs": {"native": "Uint8Array", "offset": 623, "size": 1}, "access_spritenum": {"native": "Int16Array", "offset": 504, "size": 2}, "access_wallnum": {"native": "Int16Array", "offset": 502, "size": 2}, "actors_killed": {"native": "Uint16Array", "offset": 134, "size": 2}, "actorsqu": {"native": "Int16Array", "offset": 528, "size": 2}, "aim_mode": {"native": "Uint8Array", "offset": 589, "size": 1}, "airleft": {"native": "Int16Array", "offset": 496, "size": 2}, "ammo_amount": {"length": 13, "native": "Int16Array", "offset": 438, "size": 26}, "auto_aim": {"native": "Uint8Array", "offset": 590, "size": 1}, "autostep": {"native": "Int32Array", "offset": 116, "size": 4}, "autostep_sbw": {"native": "Int32Array", "offset": 120, "size": 4}, "bobcounter": {"native": "Int16Array", "offset": 566, "size": 2}, "bobpos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 48}, "buttonpalette": {"native": "Uint8Array", "offset": 607, "size": 1}, "cheat_phase": {"native": "Int8Array", "offset": 632, "size": 1}, "clipdist": {"native": "Int16Array", "offset": 580, "size": 2}, "crack_time": {"native": "Int16Array", "offset": 564, "size": 2}, "crouch_toggle": {"native": "Int8Array", "offset": 638, "size": 1}, "crouchspeedmodifier": {"native": "Int16Array", "offset": 386, "size": 2}, "crouchzincrement": {"native": "Int16Array", "offset": 384, "size": 2}, "curr_weapon": {"native": "Int8Array", "offset": 635, "size": 1}, "cursectnum": {"native": "Int16Array", "offset": 404, "size": 2}, "customexitsound": {"native": "Int16Array", "offset": 532, "size": 2}, "dead_flag": {"native": "Int16Array", "offset": 572, "size": 2}, "dummyplayersprite": {"native": "Int16Array", "offset": 524, "size": 2}, "extra_extra8": {"native": "Int16Array", "offset": 526, "size": 2}, "falling_counter": {"native": "Uint8Array", "offset": 617, "size": 1}, "filler": {"length": 100, "native": "Int16Array", "offset": 168, "size": 200}, "fist_incs": {"native": "Uint8Array", "offset": 627, "size": 1}, "floorzcutoff": {"native": "Int16Array", "offset": 370, "size": 2}, "floorzoffset": {"native": "Int16Array", "offset": 374, "size": 2}, "floorzrebound": {"native": "Int16Array", "offset": 368, "size": 2}, "footprintcount": {"native": "Uint8Array", "offset": 600, "size": 1}, "footprintpal": {"native": "Uint8Array", "offset": 613, "size": 1}, "footprintshade": {"native": "Uint8Array", "offset": 618, "size": 1}, "frag": {"native": "Uint16Array", "offset": 140, "size": 2}, "frag_ps": {"native": "Uint8Array", "offset": 596, "size": 1}, "fraggedself": {"native": "Uint16Array", "offset": 142, "size": 2}, "fric": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 56}, "fta": {"native": "Int16Array", "offset": 498, "size": 2}, "ftq": {"native": "Int16Array", "offset": 500, "size": 2}, "gm": {"native": "Uint8Array", "offset": 598, "size": 1}, "got_access": {"native": "Int16Array", "offset": 506, "size": 2}, "gotweapon": {"native": "Uint16Array", "offset": 136, "size": 2}, "gravity": {"native": "Int16Array", "offset": 398, "size": 2}, "hard_landing": {"native": "Uint8Array", "offset": 626, "size": 1}, "hbomb_hold_delay": {"native": "Uint8Array", "offset": 595, "size": 1}, "hbomb_on": {"native": "Uint8Array", "offset": 602, "size": 1}, "heat_on": {"native": "Uint8Array", "offset": 614, "size": 1}, "holoduke_on": {"native": "Int16Array", "offset": 574, "size": 2}, "holster_weapon": {"native": "Uint8Array", "offset": 616, "size": 1}, "hurt_delay": {"native": "Uint8Array", "offset": 601, "size": 1}, "i": {"native": "Int16Array", "offset": 516, "size": 2}, "interface_toggle": {"native": "Uint32Array", "offset": 124, "size": 4}, "inv_amount": {"length": 11, "native": "Int16Array", "offset": 464, "size": 22}, "invdisptime": {"native": "Uint8Array", "offset": 615, "size": 1}, "inven_icon": {"native": "Uint8Array", "offset": 606, "size": 1}, "jetpack_on": {"native": "Uint8Array", "offset": 610, "size": 1}, "jetpackzincrement": {"native": "Int16Array", "offset": 396, "size": 2}, "jumping_counter": {"native": "Int16Array", "offset": 494, "size": 2}, "jumping_toggle": {"native": "Uint8Array", "offset": 603, "size": 1}, "kickback_pic": {"native": "Uint8Array", "offset": 597, "size": 1}, "knee_incs": {"native": "Uint8Array", "offset": 622, "size": 1}, "knuckle_incs": {"native": "Uint8Array", "offset": 621, "size": 1}, "last_extra": {"native": "Int16Array", "offset": 408, "size": 2}, "last_full_weapon": {"native": "Uint8Array", "offset": 619, "size": 1}, "last_pissed_time": {"native": "Int16Array", "offset": 534, "size": 2}, "last_quick_kick": {"native": "Uint8Array", "offset": 585, "size": 1}, "last_used_weapon": {"native": "Int8Array", "offset": 637, "size": 1}, "last_weapon": {"native": "Int8Array", "offset": 631, "size": 1}, "loogcnt": {"native": "Int8Array", "offset": 629, "size": 1}, "loogie": {"dims": [6], "offset": 144, "recordArray": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "size": 24}, "look_ang": {"native": "Int16Array", "offset": 406, "size": 2}, "max_actors_killed": {"native": "Uint16Array", "offset": 132, "size": 2}, "max_ammo_amount": {"length": 13, "native": "Int16Array", "offset": 412, "size": 26}, "max_player_health": {"native": "Int32Array", "offset": 108, "size": 4}, "max_secret_rooms": {"native": "Uint8Array", "offset": 582, "size": 1}, "max_shield_amount": {"native": "Int32Array", "offset": 112, "size": 4}, "maxswimzvel": {"native": "Int16Array", "offset": 394, "size": 2}, "minswimzvel": {"native": "Int16Array", "offset": 392, "size": 2}, "minwaterzdist": {"native": "Int16Array", "offset": 378, "size": 2}, "movement_lock": {"native": "Uint8Array", "offset": 592, "size": 1}, "newowner": {"native": "Int16Array", "offset": 492, "size": 2}, "npos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 36}, "numloogs": {"native": "Int8Array", "offset": 628, "size": 1}, "olook_ang": {"native": "Int16Array", "offset": 372, "size": 2}, "on_crane": {"native": "Int16Array", "offset": 514, "size": 2}, "on_ground": {"native": "Uint8Array", "offset": 605, "size": 1}, "on_warping_sector": {"native": "Uint8Array", "offset": 599, "size": 1}, "one_eighty_count": {"native": "Int16Array", "offset": 522, "size": 2}, "opos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 12}, "opyoff": {"native": "Int16Array", "offset": 490, "size": 2}, "oq16ang": {"native": "Int32Array", "offset": 84, "size": 4}, "oq16horiz": {"native": "Int32Array", "offset": 72, "size": 4}, "oq16horizoff": {"native": "Int32Array", "offset": 76, "size": 4}, "orotscrnang": {"native": "Int16Array", "offset": 568, "size": 2}, "over_shoulder_on": {"native": "Uint8Array", "offset": 608, "size": 1}, "padding_": {"length": 1, "native": "Int8Array", "offset": 639, "size": 1}, "palette": {"native": "Uint8Array", "offset": 636, "size": 1}, "palookup": {"native": "Uint8Array", "offset": 625, "size": 1}, "pals": {"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"b": {"native": "Uint8Array", "offset": 2, "size": 1}, "f": {"native": "Uint8Array", "offset": 3, "size": 1}, "g": {"native": "Uint8Array", "offset": 1, "size": 1}, "r": {"native": "Uint8Array", "offset": 0, "size": 1}}, "overlaps": false, "size": 4, "union": false}, "offset": 128}, "parallax_sectnum": {"native": "Int16Array", "offset": 518, "size": 2}, "player_par": {"native": "Int32Array", "offset": 100, "size": 4}, "pos": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}, "pycount": {"native": "Int16Array", "offset": 576, "size": 2}, "pyoff": {"native": "Int16Array", "offset": 488, "size": 2}, "q16ang": {"native": "Int32Array", "offset": 80, "size": 4}, "q16angvel": {"native": "Int32Array", "offset": 88, "size": 4}, "q16horiz": {"native": "Int32Array", "offset": 64, "size": 4}, "q16horizoff": {"native": "Int32Array", "offset": 68, "size": 4}, "quick_kick": {"native": "Uint8Array", "offset": 584, "size": 1}, "random_club_frame": {"native": "Int16Array", "offset": 520, "size": 2}, "rapid_fire_hold": {"native": "Uint8Array", "offset": 604, "size": 1}, "reloading": {"native": "Uint8Array", "offset": 587, "size": 1}, "return_to_center": {"native": "Uint8Array", "offset": 586, "size": 1}, "rotscrnang": {"native": "Int16Array", "offset": 570, "size": 2}, "runspeed": {"native": "Int32Array", "offset": 104, "size": 4}, "sbs": {"native": "Int16Array", "offset": 400, "size": 2}, "scream_voice": {"native": "Int8Array", "offset": 630, "size": 1}, "scuba_on": {"native": "Uint8Array", "offset": 612, "size": 1}, "secret_rooms": {"native": "Uint8Array", "offset": 583, "size": 1}, "show_empty_weapon": {"native": "Uint8Array", "offset": 609, "size": 1}, "shrunkzoffset": {"native": "Int16Array", "offset": 382, "size": 2}, "somethingonplayer": {"native": "Int16Array", "offset": 512, "size": 2}, "sound_pitch": {"native": "Int16Array", "offset": 402, "size": 2}, "spritebridge": {"native": "Uint8Array", "offset": 611, "size": 1}, "spritezoffset": {"native": "Int16Array", "offset": 376, "size": 2}, "subweapon": {"native": "Int16Array", "offset": 410, "size": 2}, "swimspeedmodifier": {"native": "Int16Array", "offset": 388, "size": 2}, "swimzincrement": {"native": "Int16Array", "offset": 390, "size": 2}, "team": {"native": "Uint8Array", "offset": 593, "size": 1}, "timebeforeexit": {"native": "Int16Array", "offset": 530, "size": 2}, "tipincs": {"native": "Uint8Array", "offset": 594, "size": 1}, "toggle_key_flag": {"native": "Uint8Array", "offset": 620, "size": 1}, "transporter_hold": {"native": "Int16Array", "offset": 578, "size": 2}, "truecz": {"native": "Int32Array", "offset": 96, "size": 4}, "truefz": {"native": "Int32Array", "offset": 92, "size": 4}, "vel": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 24}, "visibility": {"native": "Int16Array", "offset": 510, "size": 2}, "wackedbyactor": {"native": "Int16Array", "offset": 486, "size": 2}, "walking_snd_toggle": {"native": "Uint8Array", "offset": 624, "size": 1}, "wantweaponfire": {"native": "Int8Array", "offset": 634, "size": 1}, "waterzoffset": {"native": "Int16Array", "offset": 380, "size": 2}, "weapon_ang": {"native": "Int16Array", "offset": 508, "size": 2}, "weapon_pos": {"native": "Int8Array", "offset": 633, "size": 1}, "weapon_sway": {"native": "Int16Array", "offset": 562, "size": 2}, "weaponswitch": {"native": "Uint8Array", "offset": 591, "size": 1}, "weapreccnt": {"native": "Uint8Array", "offset": 588, "size": 1}, "weaprecs": {"length": 13, "native": "Int16Array", "offset": 536, "size": 26}, "zoom": {"native": "Uint16Array", "offset": 138, "size": 2}}, "overlaps": true, "size": 640, "union": false}, {})).weaponswitch = (u32((u32(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.weaponswitch) & 255)) & 255));
}

// C/C++ source: source/duke3d/src/game.h:431
let __static_G_GetTeamPalette__header_a2181cbc67c1_pal = new Int8Array([((u32(3) << 24) >> 24), ((u32(10) << 24) >> 24), ((u32(11) << 24) >> 24), ((u32(12) << 24) >> 24)]);
export function G_GetTeamPalette__header_a2181cbc67c1(team) {

  if ((u64(u32(team)) >= ARRAY_SIZE__header_bfe944817cc0(__static_G_GetTeamPalette__header_a2181cbc67c1_pal))) {
    return i32(0);
  }
  return i32((cDeref(cPointerOffset(__static_G_GetTeamPalette__header_a2181cbc67c1_pal, team, Int8Array.BYTES_PER_ELEMENT), Int8Array).value));
}

export function __cxx_operator_11a696315e969ab4(lhs, rhs) {
  return Boolean((lhs.wholeTicks < rhs.wholeTicks));
}

// C/C++ source: source/duke3d/src/common_game.h:157
export function Duke_ApplySpritePropertiesToTSprite__header_f55df38813a8(tspr, spr) {



  let cstat = (u32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).cstat) & 65535);
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value | i32((i32((i32((i32(cstat) & i32(1024))) >> 9)) | i32((i32((i32(cstat) & i32((i32(8192) | i32(16384))))) >> 11)))))) & 255)))(cObjectFieldRef(cRecordObject(cRecordPointer(tspr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})), "clipdist"));
}

// C/C++ source: source/duke3d/src/player.h:422
export function P_GetP__header_5ca4a2fe56be(pSprite) {
  (i32(cRecordObject(cRecordPointer(cRecordPointer(pSprite, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {}), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).__cxx_anonymous_15.__cxx_anonymous_0.yvel) == 0);
  return i32(0);
}

// C/C++ source: source/duke3d/src/player.h:443
export function P_Get__header_3382e5673ae1(spriteNum) {
  return i32(P_GetP__header_5ca4a2fe56be(cRecordPointer(cPointerOffset(__cxx_global_cell_4a046e33ecf7aced9bfd0007().value, spriteNum, 44), {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})));
}

// C/C++ source: source/duke3d/src/game.cpp:611
let __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask = i32((i32((1 << 2)) - 1));
export function G_GetViewscreenSizeShift__header_72c9a4444924(spr) {

  let rem = i32((i32((i32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).xrepeat) & __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask)) | i32((i32(cRecordObject(cRecordPointer(spr, {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}, "xyz": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}, "z": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"d": {"native": "Int32Array", "offset": 0, "size": 4}, "u": {"native": "Int32Array", "offset": 4, "size": 4}, "v": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 12, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 8, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}}, "overlaps": true, "size": 12, "union": false}, "offset": 0}}, "overlaps": true, "size": 12, "union": true}, "offset": 0}, "__cxx_anonymous_15": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"xvel": {"native": "Int16Array", "offset": 0, "size": 2}, "yvel": {"native": "Int16Array", "offset": 2, "size": 2}, "zvel": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "vel": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"__cxx_anonymous_0": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}, "z": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "__cxx_anonymous_1": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"d": {"native": "Int16Array", "offset": 0, "size": 2}, "u": {"native": "Int16Array", "offset": 2, "size": 2}, "v": {"native": "Int16Array", "offset": 4, "size": 2}}, "overlaps": false, "size": 6, "union": false}, "offset": 0}, "xy": {"byteRecord": {"align": 2, "arrayAlign": 1, "fields": {"x": {"native": "Int16Array", "offset": 0, "size": 2}, "y": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 0}}, "overlaps": true, "size": 6, "union": false}, "offset": 0}}, "overlaps": true, "size": 6, "union": true}, "offset": 32}, "ang": {"native": "Int16Array", "offset": 28, "size": 2}, "blend": {"native": "Uint8Array", "offset": 19, "size": 1}, "clipdist": {"native": "Uint8Array", "offset": 18, "size": 1}, "cstat": {"native": "Uint16Array", "offset": 12, "size": 2}, "extra": {"native": "Int16Array", "offset": 42, "size": 2}, "hitag": {"native": "Int16Array", "offset": 40, "size": 2}, "lotag": {"native": "Int16Array", "offset": 38, "size": 2}, "owner": {"native": "Int16Array", "offset": 30, "size": 2}, "pal": {"native": "Uint8Array", "offset": 17, "size": 1}, "picnum": {"native": "Int16Array", "offset": 14, "size": 2}, "sectnum": {"native": "Int16Array", "offset": 24, "size": 2}, "shade": {"native": "Int8Array", "offset": 16, "size": 1}, "statnum": {"native": "Int16Array", "offset": 26, "size": 2}, "xoffset": {"native": "Int8Array", "offset": 22, "size": 1}, "xrepeat": {"native": "Uint8Array", "offset": 20, "size": 1}, "yoffset": {"native": "Int8Array", "offset": 23, "size": 1}, "yrepeat": {"native": "Uint8Array", "offset": 21, "size": 1}}, "overlaps": true, "size": 44, "union": false}, {})).yrepeat) & __static_G_GetViewscreenSizeShift__header_72c9a4444924_mask))));
  for (let i = i32(0); (i < 2); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (Boolean(i32((rem & i32((1 << i)))))) {
      return i32(i);
    }
  }
  return i32(2);
}

export function ARRAY_SIZE__header_c646a883023a(arg0) {
  return u64(29n);
}

export function ARRAY_SIZE__header_a4bf8e69dabb(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_248a2b6a206c(arg0) {
  return u64(3n);
}

export function ARRAY_SIZE__header_40c5d203784c(arg0) {
  return u64(4n);
}

export function ARRAY_SIZE__header_bfe944817cc0(arg0) {
  return u64(4n);
}

export function __cxx_operator_761c63d1e16e183f(lhs, rhs) {
  return cCopyTrivialClass(lhs.__cxx_operator_86b05ee676890126(rhs), ClockTicks(), ["wholeTicks", "ticksS32"]);
}

export function __cxx_operator_6d2a22ee5048dd1a(lhs, rhs) {
  return Boolean((!__cxx_operator_11a696315e969ab4(lhs, rhs)));
}
