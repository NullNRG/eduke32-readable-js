// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/colmatch.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { memcmp } from "../../../browser-abi/libc_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";

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
function cObjectFieldRef(owner, field) { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); }
function cRef(read, write) { return ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } }); }
function cArrayRef(array, index) { return cRef(() => array[index], v => { array[index] = v; }); }
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_7a783a0809b0f9da = i32(3754936);
function __cxx_static_address_819f0e7a878ee2dd8983e959() {
  return __cxx_static_address_819f0e7a878ee2dd8983e959.reference || (__cxx_static_address_819f0e7a878ee2dd8983e959.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_7a783a0809b0f9da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_a0e046b65c1e77fc = i32(1144);
function __cxx_static_address_1dade1594972f67a5806a038() {
  return __cxx_static_address_1dade1594972f67a5806a038.reference || (__cxx_static_address_1dade1594972f67a5806a038.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_a0e046b65c1e77fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/colmatch.cpp:7
export let rdist = new Int32Array(513);
function __cxx_static_address_071855e9da18d155bfcdc5c5() {
  return __cxx_static_address_071855e9da18d155bfcdc5c5.reference || (__cxx_static_address_071855e9da18d155bfcdc5c5.reference = {
    __cReference: true,
    get value() { return rdist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_071855e9da18d155bfcdc5c5() { return __cxx_static_address_071855e9da18d155bfcdc5c5(); }

export let gdist = new Int32Array(513);
function __cxx_static_address_c510b9028cc8f8761a0f34e2() {
  return __cxx_static_address_c510b9028cc8f8761a0f34e2.reference || (__cxx_static_address_c510b9028cc8f8761a0f34e2.reference = {
    __cReference: true,
    get value() { return gdist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_c510b9028cc8f8761a0f34e2() { return __cxx_static_address_c510b9028cc8f8761a0f34e2(); }

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_62b3785c46a64c6c = i32(2147483647);
function __cxx_static_address_b90ab707a4143df4fe08ceec() {
  return __cxx_static_address_b90ab707a4143df4fe08ceec.reference || (__cxx_static_address_b90ab707a4143df4fe08ceec.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_62b3785c46a64c6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_cd74aa03a0162e21 = i32(2147483648);
function __cxx_static_address_d7b8d6d5ab9efe35a3a5fa44() {
  return __cxx_static_address_d7b8d6d5ab9efe35a3a5fa44.reference || (__cxx_static_address_d7b8d6d5ab9efe35a3a5fa44.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_cd74aa03a0162e21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_0eb973bf865d665e = i32(2147483648);
function __cxx_static_address_d2b43af69000937e010e14e6() {
  return __cxx_static_address_d2b43af69000937e010e14e6.reference || (__cxx_static_address_d2b43af69000937e010e14e6.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_0eb973bf865d665e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_26ed24b3f5257fe4 = i32(65536);
function __cxx_static_address_b1300ac51e22a80486d43e43() {
  return __cxx_static_address_b1300ac51e22a80486d43e43.reference || (__cxx_static_address_b1300ac51e22a80486d43e43.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_26ed24b3f5257fe4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_97c9065c0ff946da = i32(32768);
function __cxx_static_address_38f25fd0dd14922ac7407ad3() {
  return __cxx_static_address_38f25fd0dd14922ac7407ad3.reference || (__cxx_static_address_38f25fd0dd14922ac7407ad3.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_97c9065c0ff946da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_9ed27f0e0b262dd1 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_9b38e5b4bcc0db3bf4fbfee3() {
  return __cxx_static_address_9b38e5b4bcc0db3bf4fbfee3.reference || (__cxx_static_address_9b38e5b4bcc0db3bf4fbfee3.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_9ed27f0e0b262dd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export let bdist = new Int32Array(513);
function __cxx_static_address_f732f569a746ca06b9b98314() {
  return __cxx_static_address_f732f569a746ca06b9b98314.reference || (__cxx_static_address_f732f569a746ca06b9b98314.reference = {
    __cReference: true,
    get value() { return bdist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_f732f569a746ca06b9b98314() { return __cxx_static_address_f732f569a746ca06b9b98314(); }

// C/C++ source: source/build/src/colmatch.cpp:9
export let colhere = new Uint8Array(4913);
function __cxx_static_address_07ea1e9cc7e5611c87196265() {
  return __cxx_static_address_07ea1e9cc7e5611c87196265.reference || (__cxx_static_address_07ea1e9cc7e5611c87196265.reference = {
    __cReference: true,
    get value() { return colhere; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_07ea1e9cc7e5611c87196265() { return __cxx_static_address_07ea1e9cc7e5611c87196265(); }

// C/C++ source: source/build/src/colmatch.cpp:10
export let colhead = new Uint8Array(39304);
function __cxx_static_address_710a1f86069bf7283de24abd() {
  return __cxx_static_address_710a1f86069bf7283de24abd.reference || (__cxx_static_address_710a1f86069bf7283de24abd.reference = {
    __cReference: true,
    get value() { return colhead; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_710a1f86069bf7283de24abd() { return __cxx_static_address_710a1f86069bf7283de24abd(); }

// C/C++ source: source/build/src/colmatch.cpp:11
export let colnext = new Int32Array(256);
function __cxx_static_address_143607e791aad71204fb7622() {
  return __cxx_static_address_143607e791aad71204fb7622.reference || (__cxx_static_address_143607e791aad71204fb7622.reference = {
    __cReference: true,
    get value() { return colnext; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_143607e791aad71204fb7622() { return __cxx_static_address_143607e791aad71204fb7622(); }

// C/C++ source: source/build/src/colmatch.cpp:14
export let coldist = new Uint8Array(8);
function __cxx_static_address_bd7fb1aa7eab05e95153a6b7() {
  return __cxx_static_address_bd7fb1aa7eab05e95153a6b7.reference || (__cxx_static_address_bd7fb1aa7eab05e95153a6b7.reference = {
    __cReference: true,
    get value() { return coldist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_bd7fb1aa7eab05e95153a6b7() { return __cxx_static_address_bd7fb1aa7eab05e95153a6b7(); }

// C/C++ source: source/build/src/colmatch.cpp:15
export let colscan = new Int32Array(27);
function __cxx_static_address_1f4db5a8ef87758b3811f64f() {
  return __cxx_static_address_1f4db5a8ef87758b3811f64f.reference || (__cxx_static_address_1f4db5a8ef87758b3811f64f.reference = {
    __cReference: true,
    get value() { return colscan; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_1f4db5a8ef87758b3811f64f() { return __cxx_static_address_1f4db5a8ef87758b3811f64f(); }

// C/C++ source: source/build/src/colmatch.cpp:17
export let colmatch_palette = new Uint8Array(768);
function __cxx_static_address_8b1c077f982aa767fcb2b792() {
  return __cxx_static_address_8b1c077f982aa767fcb2b792.reference || (__cxx_static_address_8b1c077f982aa767fcb2b792.reference = {
    __cReference: true,
    get value() { return colmatch_palette; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_8b1c077f982aa767fcb2b792() { return __cxx_static_address_8b1c077f982aa767fcb2b792(); }

// C/C++ source: source/build/src/colmatch.cpp:22
export function paletteInitClosestColorScale(rscale, gscale, bscale) {
  let j = i32(0);
  for (let i = i64(256); (i >= i64(0)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset(rdist, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(rdist, i64((BigInt(i64(i32(Math.imul(256, 2)))) - BigInt(i))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, rscale)))));
    ((cDeref(cPointerOffset(gdist, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(gdist, i64((BigInt(i64(i32(Math.imul(256, 2)))) - BigInt(i))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, gscale)))));
    ((cDeref(cPointerOffset(bdist, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(((cDeref(cPointerOffset(bdist, i64((BigInt(i64(i32(Math.imul(256, 2)))) - BigInt(i))), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(Math.imul(j, bscale)))));
    (j = i32((Number(j) + Number(i64((BigInt(i64(i32((i32(Math.imul(256, 2)) + 1)))) - BigInt(i64((BigInt(i) << BigInt(1))))))))));
  }
}

// C/C++ source: source/build/src/colmatch.cpp:34
export function paletteInitClosestColorMap(pal) {
  memset(colhere, 0, 4913);
  memset(colhead, 0, 39304);
  memcpy(colmatch_palette, pal, 768);
  let pal1 = cTypedPointer(cPointerOffset(pal, i32((768 - 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array);
  for (let i = i64(255); (i >= i64(0)); (((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; })), ((i >= i64(0)) ? (pal1 = cPointerOffset(pal1, -(3), Uint8Array.BYTES_PER_ELEMENT)) : void 0))) {
    let j = i32((i32((i32((i32((i32((i32(Math.imul(i32(Math.imul(i32((i32((cDeref(cPointerOffset(pal1, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 3)), i32((256 >> 3)))), i32((256 >> 3)))) + i32(Math.imul(i32((i32((cDeref(cPointerOffset(pal1, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 3)), i32((256 >> 3)))))) + i32((i32((cDeref(cPointerOffset(pal1, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) >> 3)))) + i32(Math.imul(i32((256 >> 3)), i32((256 >> 3)))))) + i32((256 >> 3)))) + 1));
    if (bitmap_test__header_f46fe3db9374(colhere, j)) {
      ((cDeref(cPointerOffset(colnext, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(colhead, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
    } else {
      ((cDeref(cPointerOffset(colnext, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((-1)));
    }
    ((cDeref(cPointerOffset(colhead, j, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i) & 255)) & 255));
    bitmap_set__header_7dc47d48e048(colhere, j);
  }
  paletteFlushClosestColor();
}

// C/C++ source: source/build/src/colmatch.cpp:54
export function paletteInitClosestColorGrid() {
  let i = i32(0);
  let x;
  let y;
  let z;
  for ((x = i32(Math.imul((-i32((256 >> 3))), i32((256 >> 3))))); (x <= i32(Math.imul(i32((256 >> 3)), i32((256 >> 3))))); (x = i32((Number(x) + Number(i32(Math.imul(i32((256 >> 3)), i32((256 >> 3))))))))) {
    for ((y = i32((-i32((256 >> 3))))); (y <= i32((256 >> 3))); (y = i32((Number(y) + Number(i32((256 >> 3))))))) {
      for ((z = i32((-1))); (z <= 1); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => z, __cxx_lvalue_1 => { z = __cxx_lvalue_1; }))) {
        ((cDeref(cPointerOffset(colscan, ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; })), Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((i32((x + y)) + z)));
      }
    }
  }
  (i = i32((cDeref(cPointerOffset(colscan, 13, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  ((cDeref(cPointerOffset(colscan, 13, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(colscan, 26, Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
  ((cDeref(cPointerOffset(colscan, 26, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(i));
  for ((i = i32(0)); (i < Math.trunc(i32((1 << 3)) / 2)); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    ((cDeref(cPointerOffset(coldist, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i) & 255)) & 255));
  }
  for (; (i < i32((1 << 3))); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    ((cDeref(cPointerOffset(coldist, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(i32((i32((1 << 3)) - i))) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/colmatch.cpp:72
export let colmatchresults = new Uint32Array(4096);
function __cxx_static_address_2128ce1542872e13161a837b() {
  return __cxx_static_address_2128ce1542872e13161a837b.reference || (__cxx_static_address_2128ce1542872e13161a837b.reference = {
    __cReference: true,
    get value() { return colmatchresults; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_2128ce1542872e13161a837b() { return __cxx_static_address_2128ce1542872e13161a837b(); }

// C/C++ source: source/build/src/colmatch.cpp:73
export let numcolmatchresults = 0;
function __cxx_static_address_1ccdc8ce92aa56ebbfd64dcc() {
  return __cxx_static_address_1ccdc8ce92aa56ebbfd64dcc.reference || (__cxx_static_address_1ccdc8ce92aa56ebbfd64dcc.reference = {
    __cReference: true,
    get value() { return numcolmatchresults; },
    set value(__cxx_lvalue_0) { numcolmatchresults = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_1ccdc8ce92aa56ebbfd64dcc() { return __cxx_static_address_1ccdc8ce92aa56ebbfd64dcc(); }

// C/C++ source: source/build/src/colmatch.cpp:74
export let cache_lastokcol = i32(255);
function __cxx_static_address_63c93688ebb847d0c2320856() {
  return __cxx_static_address_63c93688ebb847d0c2320856.reference || (__cxx_static_address_63c93688ebb847d0c2320856.reference = {
    __cReference: true,
    get value() { return cache_lastokcol; },
    set value(__cxx_lvalue_0) { cache_lastokcol = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_63c93688ebb847d0c2320856() { return __cxx_static_address_63c93688ebb847d0c2320856(); }

// C/C++ source: source/build/src/colmatch.cpp:75
export let cache_blacklist = new Uint32Array(8);
function __cxx_static_address_3f08c479f482d923cb3ece46() {
  return __cxx_static_address_3f08c479f482d923cb3ece46.reference || (__cxx_static_address_3f08c479f482d923cb3ece46.reference = {
    __cReference: true,
    get value() { return cache_blacklist; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_3f08c479f482d923cb3ece46() { return __cxx_static_address_3f08c479f482d923cb3ece46(); }

// C/C++ source: source/build/src/colmatch.cpp:77
export function paletteFlushClosestColor() {
  memset(colmatchresults, 0, u64((BigInt(u64(4096)) * BigInt(4))));
  (numcolmatchresults = i32(0));
}

// C/C++ source: source/build/src/colmatch.cpp:85
export function paletteGetClosestColorWithBlacklist(r, g, b, lastokcol, blacklist) {
  let flushcache, i, col, mindist, k, __cxx_scope_5_i, idx;
  flushcache = Boolean(false);
  if ((lastokcol != cache_lastokcol)) {
    (flushcache = Boolean(true));
  } else {
    if (blacklist) {
      if ((memcmp(cache_blacklist, blacklist, 32) != 0)) {
        (flushcache = Boolean(true));
      }
    } else {
      __source_control_0: for (i = u64(0); (i < ARRAY_SIZE__header_75a4ce266c6f(cache_blacklist)); ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = u64((previous + 1n)); __cxx_lvalue_1.value = next; return previous; })(cRef(() => i, __cxx_lvalue_2 => { i = __cxx_lvalue_2; }))) {
        if (Boolean((cDeref(cPointerOffset(cache_blacklist, i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))) {
          (flushcache = Boolean(true));
          break __source_control_0;
        }
      }
    }
  }
  if (flushcache) {
    paletteFlushClosestColor();
    (cache_lastokcol = i32(lastokcol));
    if (blacklist) {
      memcpy(cache_blacklist, blacklist, 32);
    } else {
      memset(cache_blacklist, 0, 32);
    }
  }
  col = u32(i32((i32((r | i32((g << 8)))) | i32((b << 16)))));
  mindist = i32((-1));
  k = i32(((numcolmatchresults > 4096) ? 4096 : numcolmatchresults));
  __source_exit_skip: {
    if ((!Boolean(numcolmatchresults))) {
      break __source_exit_skip;
    }
    if ((col == u32(((cDeref(cPointerOffset(colmatchresults, i32((i32((numcolmatchresults - 1)) & i32((4096 - 1)))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) & u32(16777215))))) {
      return i32(((cDeref(cPointerOffset(colmatchresults, i32((i32((numcolmatchresults - 1)) & i32((4096 - 1)))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> 24));
    }
    __source_control_1: for ((__cxx_scope_5_i = i32(0)); (__cxx_scope_5_i <= i32((k - 4))); (__cxx_scope_5_i = i32((Number(__cxx_scope_5_i) + Number(4))))) {
      if ((col == u32(((cDeref(cPointerOffset(colmatchresults, __cxx_scope_5_i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) & u32(16777215))))) {
        (mindist = i32(__cxx_scope_5_i));
        break __source_control_1;
      }
      if ((col == u32(((cDeref(cPointerOffset(colmatchresults, i32((__cxx_scope_5_i + 1)), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) & u32(16777215))))) {
        (mindist = i32((__cxx_scope_5_i + 1)));
        break __source_control_1;
      }
      if ((col == u32(((cDeref(cPointerOffset(colmatchresults, i32((__cxx_scope_5_i + 2)), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) & u32(16777215))))) {
        (mindist = i32((__cxx_scope_5_i + 2)));
        break __source_control_1;
      }
      if ((col == u32(((cDeref(cPointerOffset(colmatchresults, i32((__cxx_scope_5_i + 3)), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) & u32(16777215))))) {
        (mindist = i32((__cxx_scope_5_i + 3)));
        break __source_control_1;
      }
    }
    if ((mindist == (-1))) {
      __source_control_2: for (; (__cxx_scope_5_i < k); ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(cRef(() => __cxx_scope_5_i, __cxx_lvalue_4 => { __cxx_scope_5_i = __cxx_lvalue_4; }))) {
        if ((col == u32(((cDeref(cPointerOffset(colmatchresults, __cxx_scope_5_i, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) & u32(16777215))))) {
          (mindist = i32(__cxx_scope_5_i));
          break __source_control_2;
        }
      }
    }
    if ((mindist != (-1))) {
      idx = u32(((cDeref(cPointerOffset(colmatchresults, mindist, Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) >>> 24));
      if (((idx <= u32(lastokcol)) && (cPointerCompare(blacklist, null, "==") || (!bitmap_test__header_6cbf0ce866bf(blacklist, i32(idx)))))) {
        return i32(idx);
      }
    }
  }
  (__cxx_scope_5_i = i32(paletteGetClosestColorWithBlacklistNoCache(r, g, b, lastokcol, blacklist)));
  ((cDeref(cPointerOffset(colmatchresults, i32((((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous + 1)); __cxx_lvalue_5.value = next; return previous; })(__cxx_static_address_1ccdc8ce92aa56ebbfd64dcc()) & i32((4096 - 1)))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value) = u32((col | u32(i32((__cxx_scope_5_i << 24))))));
  return i32(__cxx_scope_5_i);
}

// C/C++ source: source/build/src/colmatch.cpp:163
export function paletteGetClosestColorWithBlacklistNoCache(r, g, b, lastokcol, blacklist) {
  let j = i32((i32((i32((i32((i32((i32(Math.imul(i32(Math.imul(i32((r >> 3)), i32((256 >> 3)))), i32((256 >> 3)))) + i32(Math.imul(i32((g >> 3)), i32((256 >> 3)))))) + i32((b >> 3)))) + i32(Math.imul(i32((256 >> 3)), i32((256 >> 3)))))) + i32((256 >> 3)))) + 1));
  let minrdist = i32((cDeref(cPointerOffset(rdist, i32((i32((cDeref(cPointerOffset(coldist, i32((r & i32((i32((1 << 3)) - 1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 256)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  const __cxx_lvalue_0 = cRef(() => minrdist, __cxx_lvalue_4 => { minrdist = i32(__cxx_lvalue_4); });
  let mingdist = i32((cDeref(cPointerOffset(gdist, i32((i32((cDeref(cPointerOffset(coldist, i32((g & i32((i32((1 << 3)) - 1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 256)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  const __cxx_lvalue_1 = cRef(() => mingdist, __cxx_lvalue_5 => { mingdist = i32(__cxx_lvalue_5); });
  let minbdist = i32((cDeref(cPointerOffset(bdist, i32((i32((cDeref(cPointerOffset(coldist, i32((b & i32((i32((1 << 3)) - 1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + 256)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
  const __cxx_lvalue_2 = cRef(() => minbdist, __cxx_lvalue_6 => { minbdist = i32(__cxx_lvalue_6); });
  let mindist = i32((min__template_774131ccff66371d(__cxx_lvalue_0, __cxx_lvalue_1)).value);
  const __cxx_lvalue_3 = cRef(() => mindist, __cxx_lvalue_7 => { mindist = i32(__cxx_lvalue_7); });
  (mindist = i32(((min__template_774131ccff66371d(__cxx_lvalue_3, __cxx_lvalue_2)).value + 1)));
  (((r = i32((256 - r))), (g = i32((256 - g)))), (b = i32((256 - b))));
  let retcol = i32((-1));
  for (let k = i64(26); (k >= i64(0)); ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i64((previous - 1n)); __cxx_lvalue_8.value = next; return previous; })(cRef(() => k, __cxx_lvalue_9 => { k = __cxx_lvalue_9; }))) {
    let i = i32(((cDeref(cPointerOffset(colscan, k, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) + j));
    if ((!bitmap_test__header_f46fe3db9374(colhere, i))) {
      continue;
    }
    (i = i32((cDeref(cPointerOffset(colhead, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
    do {
      let pal1 = cTypedPointer(cPointerOffset(colmatch_palette, i32(Math.imul(i, 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array);
      let dist = i32((cDeref(cPointerOffset(gdist, i32((i32((cDeref(cPointerOffset(pal1, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + g)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
      if ((((dist >= mindist) || (i > lastokcol)) || (cPointerCompare(blacklist, null, "!=") && bitmap_test__header_6cbf0ce866bf(blacklist, i)))) {
        continue;
      }
      if (((dist = i32((Number(dist) + Number((cDeref(cPointerOffset(rdist, i32((i32((cDeref(cPointerOffset(pal1, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + r)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) >= mindist)) {
        continue;
      }
      if (((dist = i32((Number(dist) + Number((cDeref(cPointerOffset(bdist, i32((i32((cDeref(cPointerOffset(pal1, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + b)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) >= mindist)) {
        continue;
      }
      (mindist = i32(dist));
      (retcol = i32(i));
    } while (((i = i32((cDeref(cPointerOffset(colnext, i, Int32Array.BYTES_PER_ELEMENT), Int32Array).value))) >= 0));
  }
  if ((retcol >= 0)) {
    return i32(retcol);
  }
  (mindist = i32(2147483647));
  for (let i = i64(0); (i <= i64(lastokcol)); ((__cxx_lvalue_10) => { const previous = __cxx_lvalue_10.value; const next = i64((previous + 1n)); __cxx_lvalue_10.value = next; return next; })(cRef(() => i, __cxx_lvalue_11 => { i = __cxx_lvalue_11; }))) {
    if ((cPointerCompare(blacklist, null, "!=") && bitmap_test__header_6cbf0ce866bf(blacklist, i32(i)))) {
      continue;
    }
    let pal1 = cTypedPointer(cPointerOffset(colmatch_palette, i64((BigInt(i) * BigInt(i64(3)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array);
    let dist = i32((cDeref(cPointerOffset(gdist, i32((i32((cDeref(cPointerOffset(pal1, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + g)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value));
    if ((dist >= mindist)) {
      continue;
    }
    if (((dist = i32((Number(dist) + Number((cDeref(cPointerOffset(rdist, i32((i32((cDeref(cPointerOffset(pal1, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + r)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) >= mindist)) {
      continue;
    }
    if (((dist = i32((Number(dist) + Number((cDeref(cPointerOffset(bdist, i32((i32((cDeref(cPointerOffset(pal1, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) + b)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value))))) >= mindist)) {
      continue;
    }
    (mindist = i32(dist));
    (retcol = i32(i));
  }
  return i32(retcol);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_2f656115ffd7122a = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_d84aa0889349dfa958702cfd() {
  return __cxx_static_address_d84aa0889349dfa958702cfd.reference || (__cxx_static_address_d84aa0889349dfa958702cfd.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_2f656115ffd7122a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_d84aa0889349dfa958702cfd() { return __cxx_static_address_d84aa0889349dfa958702cfd(); }

export function bitmap_test__header_f46fe3db9374(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

export function bitmap_set__header_7dc47d48e048(ptr, n) {

  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (u32((__cxx_lvalue_0.value | i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & 255)))(cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array));
}

export function ARRAY_SIZE__header_75a4ce266c6f(arg0) {
  return u64(8n);
}

export function bitmap_test__header_6cbf0ce866bf(ptr, n) {

  return Boolean((i32((i32((cDeref(cPointerOffset(ptr, i32((n >> 3)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) == i32((cDeref(cPointerOffset(pow2char__header_global_2f656115ffd7122a, i32((n & 7)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value))));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}
