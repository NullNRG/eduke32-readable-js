// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_private_cell_8ca7d7a7ca60e7cb410b8814 } from "./sdlayer.cpp.mjs";
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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }

// C/C++ source: source/build/src/sdlkeytrans.cpp:144
export function buildkeytranslationtable() {
  memset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 0, 512);
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 42, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(14) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 43, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(15) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 40, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(28) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 72, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(89) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 41, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(1) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 44, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(57) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 54, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(51) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 100, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(86) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 45, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(12) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 55, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(52) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 56, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(53) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 39, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(11) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 30, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(2) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 31, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(3) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 32, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(4) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 33, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(5) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 34, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(6) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 35, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(7) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 36, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(8) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 37, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(9) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 38, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(10) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 51, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(39) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 52, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(40) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 46, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(13) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 47, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(26) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 49, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(43) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 48, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(27) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 4, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(30) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(48) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 6, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(46) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(32) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 8, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(18) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 9, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(33) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 10, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(34) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 11, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(35) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 12, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(23) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 13, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(36) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 14, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(37) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 15, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(38) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(50) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(49) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 18, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(24) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 19, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(25) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 20, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(16) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 21, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(19) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 22, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(31) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 23, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(20) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 24, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(22) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 25, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(47) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 26, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(17) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 27, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(45) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 28, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(21) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 29, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(44) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 76, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(211) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 98, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(82) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 89, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(79) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 90, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(80) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 91, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(81) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 92, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(75) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 93, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(76) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 216, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(76) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 156, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(76) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 94, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(77) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 95, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(71) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 96, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(72) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 97, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(73) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 99, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(83) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 84, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(181) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 85, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(55) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 86, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(74) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 87, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(78) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 88, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(156) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 82, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(200) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 81, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(208) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 79, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(205) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 80, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(203) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 73, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(210) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 74, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(199) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 77, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(207) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 75, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(201) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 78, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(209) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 58, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(59) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 59, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(60) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 60, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(61) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 61, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(62) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 62, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(63) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 63, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(64) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 64, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(65) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 65, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(66) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 66, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(67) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 67, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(68) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 68, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(87) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 69, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(88) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 83, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(69) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 57, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(58) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 71, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(70) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 229, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(54) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 225, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(42) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 228, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(157) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 224, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(29) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 230, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(184) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 226, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(56) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 227, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(219) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 231, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(220) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 154, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(84) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 118, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(221) & 255)) & 255));
  ((cDeref(cPointerOffset(__cxx_private_cell_8ca7d7a7ca60e7cb410b8814().value, 53, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(41) & 255)) & 255));
  return i32(0);
}
