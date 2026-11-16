// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/game.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { Anim_Create } from "./anim.cpp.mjs";
import { Anim_Find } from "./anim.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { G_DefaultDefFile } from "./common.cpp.mjs";
import { G_DoAutoload } from "./common.cpp.mjs";
import { __cxx_global_cell_8405b1e60e6765b2469532f3 } from "./game.cpp.mjs";
import { MenuGameplayEntry } from "./game.cpp.mjs";
import { Realloc__cxx_static_478d5da25b6b3923 } from "../../build/src/smmalloc_generic.cpp.mjs";
import { S_DefineMusic } from "./sounds.cpp.mjs";
import { S_DefineSound } from "./sounds.cpp.mjs";
import { check_file_exist } from "../../build/src/common.cpp.mjs";
import { current_verbosity_cutoff } from "../../build/src/loguru.cpp.mjs";
import { __cxx_global_cell_286850f0b72c66d5aae173a9 } from "./global.cpp.mjs";
import { g_MenuGameplayEntries } from "./menus.cpp.mjs";
import { __cxx_global_cell_9afcf601d9d7790547fa4ab2 } from "../../build/src/common.cpp.mjs";
import { __cxx_global_cell_f496251f4ec050118ec259dc } from "./cmdline.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "../../build/src/compat.cpp.mjs";
import { gamefunc_symbol_names } from "./config.cpp.mjs";
import { gamefunctions } from "./config.cpp.mjs";
import { getatoken } from "../../build/src/common.cpp.mjs";
import { __cxx_global_cell_3f867168dc2e6af035c1cc31 } from "./config.cpp.mjs";
import { handle_memerr } from "../../build/src/compat.cpp.mjs";
import { hash_delete } from "../../build/src/hash.cpp.mjs";
import { initgroupfile } from "../../build/src/vfs.cpp.mjs";
import { keybind_order_custom } from "./config.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { newGameChoiceTokens } from "./game.cpp.mjs";
import { newGameTokens } from "./game.cpp.mjs";
import { __cxx_global_cell_787e3556986da6109d0447e0 } from "../../build/src/vfs.cpp.mjs";
import { scriptfile_addsymbolvalue } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_clearsymbols } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_close } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_fromfile } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getbraces } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getdouble } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getlinum } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getnumber } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getstring } from "../../build/src/scriptfile.cpp.mjs";
import { scriptfile_getsymbol } from "../../build/src/scriptfile.cpp.mjs";
import { strncpy } from "../../../browser-abi/libc_provider.mjs";
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
// Source-language C++ pointer-span iteration, NOT a duck-typed JS iterable.
// The emitter has verified native begin() == data and end() == data + size
// from the class's original Clang AST. Runtime checks enforce bounds/stride.
const cxxPointerSpan = (owner, dataName, sizeName, stride) => {
  if (!owner || typeof owner !== 'object' ||
      !Object.prototype.hasOwnProperty.call(owner, dataName) ||
      !Object.prototype.hasOwnProperty.call(owner, sizeName))
    throw new TypeError('C++ pointer span requires declared instance storage');
  if (!Number.isSafeInteger(stride) || stride <= 0)
    throw new TypeError('Invalid native pointer element width');
  const count = owner[sizeName];
  if (typeof count !== 'number' && typeof count !== 'bigint')
    throw new TypeError('C++ span length must be an integer');
  const length = Number(count);
  if (!Number.isSafeInteger(length) || length < 0 || BigInt(length) !== BigInt(count))
    throw new RangeError('Invalid C++ span size');
  const storage = owner[dataName];
  if (length === 0 && storage == null) return {length:0, get(){throw new RangeError('Empty C++ span');}};
  let array, start, capacity;
  if (Array.isArray(storage)) {
    array = storage; start = 0; capacity = array.length;
  } else if (ArrayBuffer.isView(storage) && !(storage instanceof DataView) &&
             storage.BYTES_PER_ELEMENT === stride) {
    array = storage; start = 0; capacity = array.length;
  } else if (storage && storage.__cPointer === true && storage.array === true &&
             Array.isArray(storage.buffer)) {
    if (!Number.isSafeInteger(storage.stride) || storage.stride !== stride ||
        !Number.isSafeInteger(storage.lower) || !Number.isSafeInteger(storage.upper) ||
        !Number.isSafeInteger(storage.offset) || storage.offset < storage.lower ||
        storage.upper > storage.buffer.length * stride ||
        storage.offset % stride !== 0 || storage.lower % stride !== 0 ||
        storage.upper % stride !== 0 || storage.offset > storage.upper)
      throw new TypeError('C++ span pointer stride/bounds do not match source type');
    array = storage.buffer;
    start = storage.offset / stride;
    capacity = (storage.upper - storage.offset) / stride;
  } else {
    // A raw ArrayBuffer cannot be interpreted as a C++ pointer-to-pointer:
    // it lacks valid JS pointee identity / relocation information.
    throw new TypeError('C++ span requires proven bounded pointer-slot storage');
  }
  if (length > capacity || start + length > array.length)
    throw new RangeError('C++ span end escapes backing storage');
  return { length, get(index) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= length)
      throw new RangeError('C++ span element out of bounds');
    return array[start + index];
  }};
};

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

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/duke3d/src/game.cpp:5213
export function parsedefinitions_game_include(fileName, arg1, arg2, firstPass) {
  let included = scriptfile_fromfile(fileName);
  if (included) {
    parsedefinitions_game(included, firstPass);
    scriptfile_close(included);
  }
}

// C/C++ source: source/duke3d/src/game.cpp:5224
const __cxx_literal_808eeb85de530f903482 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_7b1250a7cde680c9a73e = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 102, 114, 97, 109, 101, 32, 110, 117, 109, 98, 101, 114, 32, 109, 117, 115, 116, 32, 98, 101, 32, 103, 114, 101, 97, 116, 101, 114, 32, 116, 104, 97, 110, 32, 122, 101, 114, 111, 0]);
const __cxx_literal_254658ed9e4475331612 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_0e38db3eaec027b676ef = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 102, 114, 97, 109, 101, 32, 110, 117, 109, 98, 101, 114, 115, 32, 109, 117, 115, 116, 32, 98, 101, 32, 105, 110, 32, 40, 110, 111, 116, 32, 110, 101, 99, 101, 115, 115, 97, 114, 105, 108, 121, 32, 115, 116, 114, 105, 99, 116, 108, 121, 41, 32, 97, 115, 99, 101, 110, 100, 105, 110, 103, 32, 111, 114, 100, 101, 114, 0]);
const __cxx_literal_a6a618b607ae5ee6726a = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_2c137fc00b2b29c54022 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 115, 111, 117, 110, 100, 32, 110, 117, 109, 98, 101, 114, 32, 35, 37, 100, 32, 105, 110, 118, 97, 108, 105, 100, 0]);
const __cxx_literal_aa6bebbde9874d77782e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_66a56d5dcdeb736207e8 = Uint8Array.from([70, 97, 105, 108, 101, 100, 32, 100, 101, 102, 105, 110, 105, 110, 103, 32, 115, 111, 117, 110, 100, 32, 115, 101, 113, 117, 101, 110, 99, 101, 32, 102, 111, 114, 32, 97, 110, 105, 109, 32, 39, 37, 115, 39, 46, 0]);
export function parsedefinitions_game_animsounds(pScript, blockEnd, fileName, animPtr) {
  xfree__header_25587e65bc1e(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds);
  let numPairs = u64(0);
  let allocSize = u64(4);
  (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds = cRecordPointer(xmalloc__header_b8c4af936cfc(u64((BigInt(allocSize) * BigInt(4)))), {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}));
  (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).numsounds = (u32((u32(0) & 65535)) & 65535));
  let defError = i32(1);
  let lastFrameNum = (u32((u32(1) & 65535)) & 65535);
  while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, blockEnd, "<")) {
    let frameNum;
    const __cxx_lvalue_0 = cRef(() => frameNum, __cxx_lvalue_2 => { frameNum = i32(__cxx_lvalue_2); });
    let soundNum;
    const __cxx_lvalue_1 = cRef(() => soundNum, __cxx_lvalue_3 => { soundNum = i32(__cxx_lvalue_3); });
    if ((cPointerDiff(blockEnd, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, Uint8Array.BYTES_PER_ELEMENT) == i64(1))) {
      break;
    }
    if (Boolean(scriptfile_getnumber(pScript, __cxx_lvalue_0))) {
      break;
    }
    (defError = i32(1));
    if (Boolean(scriptfile_getsymbol(pScript, __cxx_lvalue_1))) {
      break;
    }
    if ((frameNum <= 0)) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_808eeb85de530f903482, u32(5261), __cxx_literal_7b1250a7cde680c9a73e, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr)));
      break;
    }
    if ((frameNum < i32(lastFrameNum))) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_254658ed9e4475331612, u32(5268), __cxx_literal_0e38db3eaec027b676ef, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr)));
      break;
    }
    (lastFrameNum = (u32((u32(frameNum) & 65535)) & 65535));
    if (((u32(soundNum) >= u32(16384)) && (soundNum != (-1)))) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_a6a618b607ae5ee6726a, u32(5278), __cxx_literal_2c137fc00b2b29c54022, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr), soundNum));
      break;
    }
    if ((numPairs >= allocSize)) {
      (allocSize = u64((BigInt(allocSize) * BigInt(u64(2)))));
      (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds = cRecordPointer(xrealloc__header_d80e72c0e866(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds, u64((BigInt(allocSize) * BigInt(4)))), {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}));
    }
    (defError = i32(0));
    let sound = (cPointerElementRef(cRecordPointer(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds, {"align": 2, "arrayAlign": 1, "fields": {"frame": {"native": "Uint16Array", "offset": 0, "size": 2}, "sound": {"native": "Int16Array", "offset": 2, "size": 2}}, "overlaps": false, "size": 4, "union": false}, {}), numPairs).value);
    (sound.frame = (u32((u32(frameNum) & 65535)) & 65535));
    (sound.sound = ((u32(((u32(soundNum) << 16) >> 16)) << 16) >> 16));
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous + 1n)); __cxx_lvalue_4.value = next; return next; })(cRef(() => numPairs, __cxx_lvalue_5 => { numPairs = __cxx_lvalue_5; }));
  }
  if ((!Boolean(defError))) {
    (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).numsounds = (u32((u32(numPairs) & 65535)) & 65535));
  } else {
    do {
      xfree__header_25587e65bc1e(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds);
      (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).sounds = null);
    } while (Boolean(0));
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_aa6bebbde9874d77782e, u32(5306), __cxx_literal_66a56d5dcdeb736207e8, fileName));
  }
}

// C/C++ source: source/duke3d/src/game.cpp:5323
const __cxx_literal_6722048c2d8a24697865 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_2367b7f18a75f4bb65b4 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 109, 97, 120, 105, 109, 117, 109, 32, 115, 117, 98, 99, 104, 111, 105, 99, 101, 115, 32, 101, 120, 99, 101, 101, 100, 101, 100, 0]);
export function newgamesubchoice_recursive(pScript, entry) {
  let subChoicePtr = cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr;
  let subChoiceEnd;
  const __cxx_lvalue_0 = cRef(() => subChoiceEnd, __cxx_lvalue_3 => { subChoiceEnd = __cxx_lvalue_3; });
  let subChoiceID;
  const __cxx_lvalue_1 = cRef(() => subChoiceID, __cxx_lvalue_4 => { subChoiceID = i32(__cxx_lvalue_4); });
  if (Boolean(scriptfile_getsymbol(pScript, __cxx_lvalue_1))) {
    return i32((-1));
  }
  if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_0))) {
    return i32((-1));
  }
  if ((u32(subChoiceID) >= u32(7))) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_6722048c2d8a24697865, u32(5337), __cxx_literal_2367b7f18a75f4bb65b4, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, subChoicePtr)));
    (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(subChoiceEnd, 1, Uint8Array.BYTES_PER_ELEMENT));
    return i32((-1));
  }
  let subentry = (cPointerElementRef(entry.subentries, subChoiceID).value);
  cAssignAggregate(subentry, cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {}, null, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype}), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "MenuGameplayEntry &(MenuGameplayEntry &&) noexcept", "clang_method_id": "0x2546b074f90", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "20136509e6b77aba04c08184d3d0dac6135132bca2768eca7036e32a7f2004f1"}, "record_name": "MenuGameplayEntry", "source_record": "MenuGameplayEntry"});
  (subentry.subentries = cRecordPointer(xcalloc__header_ccb5f0fe89eb(u64(7), 80), {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype}));
  while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, subChoiceEnd, "<")) {
    switch (getatoken(pScript, newGameChoiceTokens, i32(ARRAY_SIZE__header_629f6c994b6a(newGameChoiceTokens)))) {
      case i32(26): {
        newgamesubchoice_recursive(pScript, cCopyAggregate(subentry, {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}}));
        break;
      }
      case i32(27): {
        let name = null;
        const __cxx_lvalue_2 = cRef(() => name, __cxx_lvalue_5 => { name = __cxx_lvalue_5; });
        if (Boolean(scriptfile_getstring(pScript, __cxx_lvalue_2))) {
          break;
        }
        memset(subentry.name, 0, ARRAY_SIZE__header_45c5cc752339(subentry.name));
        strncpy(subentry.name, name, u64((BigInt(ARRAY_SIZE__header_45c5cc752339(subentry.name)) - BigInt(u64(1)))));
        break;
      }
      case i32(28): {
        ((__cxx_lvalue_6) => (__cxx_lvalue_6.value = (u32((__cxx_lvalue_6.value | i32(1))) & 255)))(cObjectFieldRef(subentry, "flags"));
        break;
      }
      case i32(29): {
        ((__cxx_lvalue_7) => (__cxx_lvalue_7.value = (u32((__cxx_lvalue_7.value | i32(2))) & 255)))(cObjectFieldRef(subentry, "flags"));
        break;
      }
      case i32(30): {
        ((__cxx_lvalue_8) => (__cxx_lvalue_8.value = (u32((__cxx_lvalue_8.value | i32(4))) & 255)))(cObjectFieldRef(subentry, "flags"));
        break;
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/duke3d/src/game.cpp:5386
export function newgamechoices_recursive_free(parent) {
  let entries = cRecordObject(cRecordPointer(parent, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype})).subentries;
  for (let i = i32(0); (i < 7); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((cPointerElementRef(entries, i).value).subentries) {
      newgamechoices_recursive_free(cPointerOffset(entries, i, 80));
    }
  }
  do {
    xfree__header_25587e65bc1e(cRecordObject(cRecordPointer(parent, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype})).subentries);
    (cRecordObject(cRecordPointer(parent, {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype})).subentries = null);
  } while (Boolean(0));
}

// C/C++ source: source/duke3d/src/game.cpp:5395
const __cxx_literal_517975c52c712e88f28e = Uint8Array.from([105, 110, 99, 108, 117, 100, 101, 0]);
const __cxx_literal_6474b6ccf26530e5406e = Uint8Array.from([35, 105, 110, 99, 108, 117, 100, 101, 0]);
const __cxx_literal_e8bbd587c0b7132fa73b = Uint8Array.from([105, 110, 99, 108, 117, 100, 101, 100, 101, 102, 97, 117, 108, 116, 0]);
const __cxx_literal_96d49a32b5e237e1c0db = Uint8Array.from([35, 105, 110, 99, 108, 117, 100, 101, 100, 101, 102, 97, 117, 108, 116, 0]);
const __cxx_literal_c1cc2c61df964022aedd = Uint8Array.from([100, 101, 102, 105, 110, 101, 0]);
const __cxx_literal_ab7e855da162525674a2 = Uint8Array.from([35, 100, 101, 102, 105, 110, 101, 0]);
const __cxx_literal_06187f1e84c98ee51fe1 = Uint8Array.from([108, 111, 97, 100, 103, 114, 112, 0]);
const __cxx_literal_e2d37b35f67bfd523f63 = Uint8Array.from([99, 97, 99, 104, 101, 115, 105, 122, 101, 0]);
const __cxx_literal_57e51d2f703ad4faadbc = Uint8Array.from([110, 111, 97, 117, 116, 111, 108, 111, 97, 100, 0]);
const __cxx_literal_ac3cd3583333898ee868 = Uint8Array.from([109, 117, 115, 105, 99, 0]);
const __cxx_literal_034154b8515d91877ae8 = Uint8Array.from([115, 111, 117, 110, 100, 0]);
const __cxx_literal_76de594e9e6ff9ae6889 = Uint8Array.from([99, 117, 116, 115, 99, 101, 110, 101, 0]);
const __cxx_literal_8a503b5dd609fcc84ecd = Uint8Array.from([97, 110, 105, 109, 115, 111, 117, 110, 100, 115, 0]);
const __cxx_literal_d082458c780089b4d4fd = Uint8Array.from([103, 108, 111, 98, 97, 108, 103, 97, 109, 101, 102, 108, 97, 103, 115, 0]);
const __cxx_literal_1c6f9a236994e4ded972 = Uint8Array.from([110, 101, 119, 103, 97, 109, 101, 99, 104, 111, 105, 99, 101, 115, 0]);
const __cxx_literal_73557372d6ec610c3db1 = Uint8Array.from([108, 111, 99, 97, 108, 105, 122, 97, 116, 105, 111, 110, 0]);
const __cxx_literal_75dd2701de353ac27940 = Uint8Array.from([107, 101, 121, 99, 111, 110, 102, 105, 103, 0]);
let __static_parsedefinitions_game_tokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [17], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_517975c52c712e88f28e, "tokenid": i32(0)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_6474b6ccf26530e5406e, "tokenid": i32(0)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_e8bbd587c0b7132fa73b, "tokenid": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_96d49a32b5e237e1c0db, "tokenid": i32(5)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_c1cc2c61df964022aedd, "tokenid": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_ab7e855da162525674a2, "tokenid": i32(3)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_06187f1e84c98ee51fe1, "tokenid": i32(1)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_e2d37b35f67bfd523f63, "tokenid": i32(2)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_57e51d2f703ad4faadbc, "tokenid": i32(4)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_ac3cd3583333898ee868, "tokenid": i32(6)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_034154b8515d91877ae8, "tokenid": i32(7)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_76de594e9e6ff9ae6889, "tokenid": i32(9)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_8a503b5dd609fcc84ecd, "tokenid": i32(10)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_d082458c780089b4d4fd, "tokenid": i32(20)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_1c6f9a236994e4ded972, "tokenid": i32(25)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_73557372d6ec610c3db1, "tokenid": i32(31)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_75dd2701de353ac27940, "tokenid": i32(32)}, null, {})]);
const __cxx_literal_2cbb089cac5477986d1f = Uint8Array.from([105, 100, 0]);
const __cxx_literal_3e21450435c19bc9cd26 = Uint8Array.from([102, 105, 108, 101, 0]);
const __cxx_literal_ce91447766aa55a88675 = Uint8Array.from([109, 105, 110, 112, 105, 116, 99, 104, 0]);
const __cxx_literal_3a6b57df4dae89044a35 = Uint8Array.from([109, 97, 120, 112, 105, 116, 99, 104, 0]);
const __cxx_literal_ee0646972353c3e53db8 = Uint8Array.from([112, 114, 105, 111, 114, 105, 116, 121, 0]);
const __cxx_literal_97c2dd9ff097daeddca1 = Uint8Array.from([116, 121, 112, 101, 0]);
const __cxx_literal_7c3bd83a50462a91a030 = Uint8Array.from([100, 105, 115, 116, 97, 110, 99, 101, 0]);
const __cxx_literal_4b79a912d74892d2d71a = Uint8Array.from([118, 111, 108, 117, 109, 101, 0]);
let __static_parsedefinitions_game_soundTokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [8], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_2cbb089cac5477986d1f, "tokenid": i32(12)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_3e21450435c19bc9cd26, "tokenid": i32(8)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_ce91447766aa55a88675, "tokenid": i32(13)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_3a6b57df4dae89044a35, "tokenid": i32(14)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_ee0646972353c3e53db8, "tokenid": i32(15)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_97c2dd9ff097daeddca1, "tokenid": i32(16)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_7c3bd83a50462a91a030, "tokenid": i32(17)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_4b79a912d74892d2d71a, "tokenid": i32(18)}, null, {})]);
const __cxx_literal_08dc161d484e59c3c41a = Uint8Array.from([100, 101, 108, 97, 121, 0]);
const __cxx_literal_ef10ac1d7414547f380d = Uint8Array.from([97, 115, 112, 101, 99, 116, 0]);
const __cxx_literal_62cc15cf53edcd2f735e = Uint8Array.from([115, 111, 117, 110, 100, 115, 0]);
const __cxx_literal_dbc11eb35986f797d77d = Uint8Array.from([102, 111, 114, 99, 101, 102, 105, 108, 116, 101, 114, 0]);
const __cxx_literal_69bff912e00f970b71cf = Uint8Array.from([102, 111, 114, 99, 101, 110, 111, 102, 105, 108, 116, 101, 114, 0]);
const __cxx_literal_9fe6f343bc2a657472ba = Uint8Array.from([116, 101, 120, 116, 117, 114, 101, 102, 105, 108, 116, 101, 114, 0]);
let __static_parsedefinitions_game_animTokens = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, [6], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_08dc161d484e59c3c41a, "tokenid": i32(19)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_ef10ac1d7414547f380d, "tokenid": i32(21)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_62cc15cf53edcd2f735e, "tokenid": i32(7)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_dbc11eb35986f797d77d, "tokenid": i32(22)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_69bff912e00f970b71cf, "tokenid": i32(23)}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"text": {"offset": 0, "pointer": true, "size": 8}, "tokenid": {"native": "Int32Array", "offset": 8, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {"text": __cxx_literal_9fe6f343bc2a657472ba, "tokenid": i32(24)}, null, {})]);
const __cxx_literal_94aa16e4476fb8b560d0 = Uint8Array.from([103, 97, 109, 101, 102, 117, 110, 99, 95, 72, 111, 108, 111, 95, 68, 117, 107, 101, 0]);
const __cxx_literal_8896e08160df548a228c = Uint8Array.from([103, 97, 109, 101, 102, 117, 110, 99, 95, 74, 101, 116, 112, 97, 99, 107, 0]);
const __cxx_literal_cce5d9ac032105584350 = Uint8Array.from([103, 97, 109, 101, 102, 117, 110, 99, 95, 78, 105, 103, 104, 116, 86, 105, 115, 105, 111, 110, 0]);
const __cxx_literal_9261515a0da0b908bfb8 = Uint8Array.from([103, 97, 109, 101, 102, 117, 110, 99, 95, 77, 101, 100, 75, 105, 116, 0]);
const __cxx_literal_6b77c07bf4f76b8aafa3 = Uint8Array.from([103, 97, 109, 101, 102, 117, 110, 99, 95, 83, 116, 101, 114, 111, 105, 100, 115, 0]);
const __cxx_literal_7c15411ef0f8af66e1fd = Uint8Array.from([103, 97, 109, 101, 102, 117, 110, 99, 95, 81, 117, 105, 99, 107, 95, 75, 105, 99, 107, 0]);
const __cxx_literal_8ba0354ba2fb03a249f7 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_fc369985dc71e025e73b = Uint8Array.from([67, 111, 117, 108, 100, 32, 110, 111, 116, 32, 102, 105, 110, 100, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 46, 0]);
const __cxx_literal_4a7d2d20568bb2193a91 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_5cc2a29669bb9e26e26a = Uint8Array.from([85, 115, 105, 110, 103, 32, 102, 105, 108, 101, 32, 39, 37, 115, 39, 32, 97, 115, 32, 103, 97, 109, 101, 32, 100, 97, 116, 97, 46, 0]);
const __cxx_literal_1f8152d937640184e433 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_e2ebabd3b2ee0fbbc9dc = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 119, 97, 114, 110, 105, 110, 103, 58, 32, 115, 121, 109, 98, 111, 108, 32, 37, 115, 32, 117, 110, 97, 98, 108, 101, 32, 116, 111, 32, 98, 101, 32, 114, 101, 100, 101, 102, 105, 110, 101, 100, 32, 116, 111, 32, 37, 100, 0]);
const __cxx_literal_f2fbcf6ae3b52f1caea1 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_24964033b1b412680aab = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 109, 105, 115, 115, 105, 110, 103, 32, 73, 68, 32, 102, 111, 114, 32, 109, 117, 115, 105, 99, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 0]);
const __cxx_literal_145328ecf6bb2dbcf4aa = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_353a7cd36eb4a148dd43 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 109, 117, 115, 105, 99, 32, 73, 68, 0]);
const __cxx_literal_b7caa7d17d9080ef441e = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_ebdcea1e4620f33d96f4 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 101, 120, 112, 101, 99, 116, 101, 100, 32, 97, 110, 105, 109, 97, 116, 105, 111, 110, 32, 102, 105, 108, 101, 110, 97, 109, 101, 0]);
const __cxx_literal_28ecee58764ddc7ce555 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_a3850d9c6867568788c8 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 109, 105, 115, 115, 105, 110, 103, 32, 73, 68, 32, 102, 111, 114, 32, 115, 111, 117, 110, 100, 32, 100, 101, 102, 105, 110, 105, 116, 105, 111, 110, 0]);
const __cxx_literal_80e6667e16c911990c63 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_4eacb6837d165c259d97 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 115, 111, 117, 110, 100, 32, 73, 68, 0]);
const __cxx_literal_0b85c88e01572283a0a1 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_5b925e42124ccb769746 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 109, 97, 120, 105, 109, 117, 109, 32, 99, 104, 111, 105, 99, 101, 115, 32, 101, 120, 99, 101, 101, 100, 101, 100, 0]);
const __cxx_literal_879e6921e713010bee85 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_6f868170c2ca5fe36b21 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 107, 101, 121, 32, 114, 101, 109, 97, 112, 32, 101, 120, 99, 101, 101, 100, 115, 32, 110, 117, 109, 98, 101, 114, 32, 111, 102, 32, 118, 97, 108, 105, 100, 32, 103, 97, 109, 101, 102, 117, 110, 99, 116, 105, 111, 110, 115, 32, 37, 100, 0]);
const __cxx_literal_f371fbb5604d2d5e84e7 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_b6ce9c925536864b12ad = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 101, 114, 114, 111, 114, 58, 32, 105, 110, 118, 97, 108, 105, 100, 32, 107, 101, 121, 32, 105, 110, 100, 101, 120, 32, 37, 100, 0]);
const __cxx_literal_9242e610454285141fc5 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 100, 117, 107, 101, 51, 100, 47, 115, 114, 99, 47, 103, 97, 109, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_941377e45d9fad276e42 = Uint8Array.from([37, 115, 58, 37, 100, 58, 32, 119, 97, 114, 110, 105, 110, 103, 58, 32, 100, 117, 112, 108, 105, 99, 97, 116, 101, 32, 108, 105, 115, 116, 105, 110, 103, 32, 111, 102, 32, 107, 101, 121, 32, 39, 37, 115, 39, 0]);
export function parsedefinitions_game(pScript, firstPass) {
  let token;
  let pToken;



  for (let f = i32(0); (f < i32(63)); ((__cxx_lvalue_33) => { const previous = __cxx_lvalue_33.value; const next = i32((previous + 1)); __cxx_lvalue_33.value = next; return previous; })(cRef(() => f, __cxx_lvalue_34 => { f = __cxx_lvalue_34; }))) {
    scriptfile_addsymbolvalue((cPointerElementRef(gamefunc_symbol_names, f).value), f);
  }
  scriptfile_addsymbolvalue(__cxx_literal_94aa16e4476fb8b560d0, i32(32));
  scriptfile_addsymbolvalue(__cxx_literal_8896e08160df548a228c, i32(33));
  scriptfile_addsymbolvalue(__cxx_literal_cce5d9ac032105584350, i32(34));
  scriptfile_addsymbolvalue(__cxx_literal_9261515a0da0b908bfb8, i32(35));
  scriptfile_addsymbolvalue(__cxx_literal_6b77c07bf4f76b8aafa3, i32(48));
  scriptfile_addsymbolvalue(__cxx_literal_7c15411ef0f8af66e1fd, i32(49));
  do {
    (token = i32(getatoken(pScript, __static_parsedefinitions_game_tokens, i32(ARRAY_SIZE__header_f8557a61fa7e(__static_parsedefinitions_game_tokens)))));
    (pToken = cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr);
    switch (token) {
      case i32(1): {
        let fileName;
        const __cxx_lvalue_0 = cRef(() => fileName, __cxx_lvalue_35 => { fileName = __cxx_lvalue_35; });
        let bakpathsearchmode = i32(__cxx_global_cell_787e3556986da6109d0447e0().value);
        (__cxx_global_cell_787e3556986da6109d0447e0().value = i32(1));
        if (((!Boolean(scriptfile_getstring(pScript, __cxx_lvalue_0))) && Boolean(firstPass))) {
          if ((initgroupfile(fileName) == (-1))) {
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_8ba0354ba2fb03a249f7, u32(5472), __cxx_literal_fc369985dc71e025e73b, fileName));
          } else {
            ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_4a7d2d20568bb2193a91, u32(5475), __cxx_literal_5cc2a29669bb9e26e26a, fileName));
            if (((!Boolean(__cxx_global_cell_f496251f4ec050118ec259dc().value)) && (!Boolean(__cxx_global_cell_f0a85e81a4cdc5b0ffa6b6ba().value.setup.noautoload)))) {
              G_DoAutoload(fileName);
            }
          }
        }
        (__cxx_global_cell_787e3556986da6109d0447e0().value = i32(bakpathsearchmode));
      }
      break;
      case i32(2): {
        let cacheSize;
        const __cxx_lvalue_1 = cRef(() => cacheSize, __cxx_lvalue_36 => { cacheSize = i32(__cxx_lvalue_36); });
        if ((Boolean(scriptfile_getnumber(pScript, __cxx_lvalue_1)) || (!Boolean(firstPass)))) {
          break;
        }
        if ((cacheSize > 0)) {
          (__cxx_global_cell_8405b1e60e6765b2469532f3().value = i32((cacheSize << 10)));
        }
      }
      break;
      case i32(0): {
        let fileName;
        const __cxx_lvalue_2 = cRef(() => fileName, __cxx_lvalue_37 => { fileName = __cxx_lvalue_37; });
        if ((!Boolean(scriptfile_getstring(pScript, __cxx_lvalue_2)))) {
          parsedefinitions_game_include(fileName, pScript, pToken, firstPass);
        }
        break;
      }
      case i32(5): {
        parsedefinitions_game_include(G_DefaultDefFile(), pScript, pToken, firstPass);
        break;
      }
      case i32(3): {
        let name;
        const __cxx_lvalue_3 = cRef(() => name, __cxx_lvalue_38 => { name = __cxx_lvalue_38; });
        let number;
        const __cxx_lvalue_4 = cRef(() => number, __cxx_lvalue_39 => { number = i32(__cxx_lvalue_39); });
        if (Boolean(scriptfile_getstring(pScript, __cxx_lvalue_3))) {
          break;
        }
        if (Boolean(scriptfile_getsymbol(pScript, __cxx_lvalue_4))) {
          break;
        }
        if ((scriptfile_addsymbolvalue(name, number) < 0)) {
          ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_1f8152d937640184e433, u32(5520), __cxx_literal_e2ebabd3b2ee0fbbc9dc, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, pToken), name, number));
        }
        break;
      }
      case i32(4): {
        if (Boolean(firstPass)) {
          (__cxx_global_cell_f496251f4ec050118ec259dc().value = i32(1));
        }
      }
      break;
      case i32(6): {
        let tokenPtr = cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr;
        let musicID = null;
        const __cxx_lvalue_5 = cRef(() => musicID, __cxx_lvalue_40 => { musicID = __cxx_lvalue_40; });
        let fileName = null;
        const __cxx_lvalue_6 = cRef(() => fileName, __cxx_lvalue_41 => { fileName = __cxx_lvalue_41; });
        let musicEnd;
        const __cxx_lvalue_7 = cRef(() => musicEnd, __cxx_lvalue_42 => { musicEnd = __cxx_lvalue_42; });
        if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_7))) {
          break;
        }
        while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, musicEnd, "<")) {
          switch (getatoken(pScript, __static_parsedefinitions_game_soundTokens, i32(ARRAY_SIZE__header_251e3654dd1b(__static_parsedefinitions_game_soundTokens)))) {
            case i32(12): {
              scriptfile_getstring(pScript, __cxx_lvalue_5);
            }
            break;
            case i32(8): {
              scriptfile_getstring(pScript, __cxx_lvalue_6);
            }
            break;
          }
        }
        if ((!Boolean(firstPass))) {
          if (cPointerCompare(musicID, null, "==")) {
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_f2fbcf6ae3b52f1caea1, u32(5551), __cxx_literal_24964033b1b412680aab, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, tokenPtr)));
            break;
          }
          if ((cPointerCompare(fileName, null, "==") || Boolean(check_file_exist(fileName)))) {
            break;
          }
          if ((S_DefineMusic(musicID, fileName) == (-1))) {
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_145328ecf6bb2dbcf4aa, u32(5560), __cxx_literal_353a7cd36eb4a148dd43, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, tokenPtr)));
          }
        }
      }
      break;
      case i32(9): {
        let fileName = null;
        const __cxx_lvalue_8 = cRef(() => fileName, __cxx_lvalue_43 => { fileName = __cxx_lvalue_43; });
        scriptfile_getstring(pScript, __cxx_lvalue_8);
        let animEnd;
        const __cxx_lvalue_9 = cRef(() => animEnd, __cxx_lvalue_44 => { animEnd = __cxx_lvalue_44; });
        if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_9))) {
          break;
        }
        if ((!Boolean(firstPass))) {
          let animPtr = Anim_Find(fileName);
          if ((!animPtr)) {
            (animPtr = Anim_Create(fileName));
            (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).framedelay = (u32((u32(10) & 255)) & 255));
            (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).frameflags = (u32((u32(0) & 255)) & 255));
          }
          let temp;
          const __cxx_lvalue_10 = cRef(() => temp, __cxx_lvalue_45 => { temp = i32(__cxx_lvalue_45); });
          while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, animEnd, "<")) {
            switch (getatoken(pScript, __static_parsedefinitions_game_animTokens, i32(ARRAY_SIZE__header_30888aa7cde6(__static_parsedefinitions_game_animTokens)))) {
              case i32(19): {
                scriptfile_getnumber(pScript, __cxx_lvalue_10);
              }
              (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).framedelay = (u32((u32(temp) & 255)) & 255));
              break;
              case i32(21): {
                let dtemp;
                const __cxx_lvalue_11 = cRef(() => dtemp, __cxx_lvalue_46 => { dtemp = __cxx_lvalue_46; });
                let dtemp2;
                const __cxx_lvalue_12 = cRef(() => dtemp2, __cxx_lvalue_47 => { dtemp2 = __cxx_lvalue_47; });
                scriptfile_getdouble(pScript, __cxx_lvalue_11);
                scriptfile_getdouble(pScript, __cxx_lvalue_12);
                (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).frameaspect1 = dtemp);
                (cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})).frameaspect2 = dtemp2);
                break;
              }
              case i32(7): {
                let animSoundsEnd = null;
                const __cxx_lvalue_13 = cRef(() => animSoundsEnd, __cxx_lvalue_48 => { animSoundsEnd = __cxx_lvalue_48; });
                if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_13))) {
                  break;
                }
                parsedefinitions_game_animsounds(pScript, animSoundsEnd, fileName, animPtr);
                break;
              }
              case i32(22): {
                ((__cxx_lvalue_49) => (__cxx_lvalue_49.value = (u32((__cxx_lvalue_49.value | i32(1))) & 255)))(cObjectFieldRef(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})), "frameflags"));
              }
              break;
              case i32(23): {
                ((__cxx_lvalue_50) => (__cxx_lvalue_50.value = (u32((__cxx_lvalue_50.value | i32(2))) & 255)))(cObjectFieldRef(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})), "frameflags"));
              }
              break;
              case i32(24): {
                ((__cxx_lvalue_51) => (__cxx_lvalue_51.value = (u32((__cxx_lvalue_51.value | i32(4))) & 255)))(cObjectFieldRef(cRecordObject(cRecordPointer(animPtr, {"align": 8, "arrayAlign": 1, "fields": {"animbuf": {"offset": 16, "pointer": true, "size": 8}, "animlock": {"native": "Uint8Array", "offset": 36, "size": 1}, "frameaspect1": {"native": "Float64Array", "offset": 0, "size": 8}, "frameaspect2": {"native": "Float64Array", "offset": 8, "size": 8}, "framedelay": {"native": "Uint8Array", "offset": 34, "size": 1}, "frameflags": {"native": "Uint8Array", "offset": 35, "size": 1}, "numsounds": {"native": "Uint16Array", "offset": 32, "size": 2}, "sounds": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 40, "union": false}, {})), "frameflags"));
              }
              break;
            }
          }
        } else {
          (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(animEnd, 1, Uint8Array.BYTES_PER_ELEMENT));
        }
      }
      break;
      case i32(10): {
        let tokenPtr = cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr;
        let fileName = null;
        const __cxx_lvalue_14 = cRef(() => fileName, __cxx_lvalue_52 => { fileName = __cxx_lvalue_52; });
        scriptfile_getstring(pScript, __cxx_lvalue_14);
        if ((!fileName)) {
          break;
        }
        let animSoundsEnd = null;
        const __cxx_lvalue_15 = cRef(() => animSoundsEnd, __cxx_lvalue_53 => { animSoundsEnd = __cxx_lvalue_53; });
        if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_15))) {
          break;
        }
        if (Boolean(firstPass)) {
          (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(animSoundsEnd, 1, Uint8Array.BYTES_PER_ELEMENT));
          break;
        }
        let animPtr = Anim_Find(fileName);
        if ((!animPtr)) {
          ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_b7caa7d17d9080ef441e, u32(5655), __cxx_literal_ebdcea1e4620f33d96f4, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, tokenPtr)));
          break;
        }
        parsedefinitions_game_animsounds(pScript, animSoundsEnd, fileName, animPtr);
      }
      break;
      case i32(7): {
        let tokenPtr = cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr;
        let fileName = null;
        const __cxx_lvalue_16 = cRef(() => fileName, __cxx_lvalue_54 => { fileName = __cxx_lvalue_54; });
        let soundEnd;
        const __cxx_lvalue_17 = cRef(() => soundEnd, __cxx_lvalue_55 => { soundEnd = __cxx_lvalue_55; });
        let volume = 1;
        const __cxx_lvalue_18 = cRef(() => volume, __cxx_lvalue_56 => { volume = __cxx_lvalue_56; });
        let soundNum = i32((-1));
        const __cxx_lvalue_19 = cRef(() => soundNum, __cxx_lvalue_57 => { soundNum = i32(__cxx_lvalue_57); });
        let maxpitch = i32(0);
        const __cxx_lvalue_20 = cRef(() => maxpitch, __cxx_lvalue_58 => { maxpitch = i32(__cxx_lvalue_58); });
        let minpitch = i32(0);
        const __cxx_lvalue_21 = cRef(() => minpitch, __cxx_lvalue_59 => { minpitch = i32(__cxx_lvalue_59); });
        let priority = i32(0);
        const __cxx_lvalue_22 = cRef(() => priority, __cxx_lvalue_60 => { priority = i32(__cxx_lvalue_60); });
        let type = i32(0);
        const __cxx_lvalue_23 = cRef(() => type, __cxx_lvalue_61 => { type = i32(__cxx_lvalue_61); });
        let distance = i32(0);
        const __cxx_lvalue_24 = cRef(() => distance, __cxx_lvalue_62 => { distance = i32(__cxx_lvalue_62); });
        if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_17))) {
          break;
        }
        while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, soundEnd, "<")) {
          switch (getatoken(pScript, __static_parsedefinitions_game_soundTokens, i32(ARRAY_SIZE__header_251e3654dd1b(__static_parsedefinitions_game_soundTokens)))) {
            case i32(12): {
              scriptfile_getsymbol(pScript, __cxx_lvalue_19);
            }
            break;
            case i32(8): {
              scriptfile_getstring(pScript, __cxx_lvalue_16);
            }
            break;
            case i32(13): {
              scriptfile_getsymbol(pScript, __cxx_lvalue_21);
            }
            break;
            case i32(14): {
              scriptfile_getsymbol(pScript, __cxx_lvalue_20);
            }
            break;
            case i32(15): {
              scriptfile_getsymbol(pScript, __cxx_lvalue_22);
            }
            break;
            case i32(16): {
              scriptfile_getsymbol(pScript, __cxx_lvalue_23);
            }
            break;
            case i32(17): {
              scriptfile_getsymbol(pScript, __cxx_lvalue_24);
            }
            break;
            case i32(18): {
              scriptfile_getdouble(pScript, __cxx_lvalue_18);
            }
            break;
          }
        }
        if ((!Boolean(firstPass))) {
          if ((soundNum == (-1))) {
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_28ecee58764ddc7ce555, u32(5701), __cxx_literal_a3850d9c6867568788c8, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, tokenPtr)));
            break;
          }
          if ((cPointerCompare(fileName, null, "==") || Boolean(check_file_exist(fileName)))) {
            break;
          }
          if ((S_DefineSound(soundNum, fileName, minpitch, maxpitch, priority, type, distance, volume) == (-1))) {
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_80e6667e16c911990c63, u32(5711), __cxx_literal_4eacb6837d165c259d97, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, tokenPtr)));
          }
        }
      }
      break;
      case i32(20): {
        scriptfile_getnumber(pScript, cScalarLValueIO(__cxx_global_cell_286850f0b72c66d5aae173a9(), Int32Array));
      }
      break;
      case i32(25): {
        let newGameChoicesEnd;
        const __cxx_lvalue_25 = cRef(() => newGameChoicesEnd, __cxx_lvalue_63 => { newGameChoicesEnd = __cxx_lvalue_63; });
        if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_25))) {
          break;
        }
        if (Boolean(firstPass)) {
          (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(newGameChoicesEnd, 1, Uint8Array.BYTES_PER_ELEMENT));
          break;
        }
        while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, newGameChoicesEnd, "<")) {
          switch (getatoken(pScript, newGameTokens, i32(ARRAY_SIZE__header_8e1e61e90c11(newGameTokens)))) {
            case i32(26): {
              let choicePtr = cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr;
              let choiceEnd;
              const __cxx_lvalue_26 = cRef(() => choiceEnd, __cxx_lvalue_64 => { choiceEnd = __cxx_lvalue_64; });
              let choiceID;
              const __cxx_lvalue_27 = cRef(() => choiceID, __cxx_lvalue_65 => { choiceID = i32(__cxx_lvalue_65); });
              if (Boolean(scriptfile_getsymbol(pScript, __cxx_lvalue_27))) {
                break;
              }
              if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_26))) {
                break;
              }
              if ((u32(choiceID) >= u32(7))) {
                ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_0b85c88e01572283a0a1, u32(5744), __cxx_literal_5b925e42124ccb769746, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, choicePtr)));
                (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(choiceEnd, 1, Uint8Array.BYTES_PER_ELEMENT));
                break;
              }
              let entry = (cPointerElementRef(g_MenuGameplayEntries, choiceID).value);
              if (entry.subentries) {
                newgamechoices_recursive_free(entry);
              }
              cAssignAggregate(entry, cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {}, null, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype}), {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}}, {"abi": "source-clang-trivial-record-assignment/1", "assignment_mode": "moveAssign", "clang_assignment_signature": "MenuGameplayEntry &(MenuGameplayEntry &&) noexcept", "clang_method_id": "0x23dc7833bc0", "native_layout": {"abi": "source-record-field-storage/1", "sha256": "20136509e6b77aba04c08184d3d0dac6135132bca2768eca7036e32a7f2004f1"}, "record_name": "MenuGameplayEntry", "source_record": "MenuGameplayEntry"});
              (entry.subentries = cRecordPointer(xcalloc__header_ccb5f0fe89eb(u64(7), 80), {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}, {"MenuGameplayEntry": () => MenuGameplayEntry().prototype}));
              while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, choiceEnd, "<")) {
                switch (getatoken(pScript, newGameChoiceTokens, i32(ARRAY_SIZE__header_629f6c994b6a(newGameChoiceTokens)))) {
                  case i32(26): {
                    newgamesubchoice_recursive(pScript, cCopyAggregate(entry, {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"flags": {"native": "Uint8Array", "offset": 64, "size": 1}, "name": {"length": 64, "native": "Uint8Array", "offset": 0, "size": 64}, "subentries": {"offset": 72, "pointer": true, "size": 8}}, "overlaps": false, "prototype": "MenuGameplayEntry", "size": 80, "union": false}}));
                    break;
                  }
                  case i32(27): {
                    let name = null;
                    const __cxx_lvalue_28 = cRef(() => name, __cxx_lvalue_66 => { name = __cxx_lvalue_66; });
                    if (Boolean(scriptfile_getstring(pScript, __cxx_lvalue_28))) {
                      break;
                    }
                    memset(entry.name, 0, ARRAY_SIZE__header_45c5cc752339(entry.name));
                    strncpy(entry.name, name, u64((BigInt(ARRAY_SIZE__header_45c5cc752339(entry.name)) - BigInt(u64(1)))));
                    break;
                  }
                  case i32(28): {
                    ((__cxx_lvalue_67) => (__cxx_lvalue_67.value = (u32((__cxx_lvalue_67.value | i32(1))) & 255)))(cObjectFieldRef(entry, "flags"));
                    break;
                  }
                  case i32(29): {
                    ((__cxx_lvalue_68) => (__cxx_lvalue_68.value = (u32((__cxx_lvalue_68.value | i32(2))) & 255)))(cObjectFieldRef(entry, "flags"));
                    break;
                  }
                  case i32(30): {
                    ((__cxx_lvalue_69) => (__cxx_lvalue_69.value = (u32((__cxx_lvalue_69.value | i32(4))) & 255)))(cObjectFieldRef(entry, "flags"));
                    break;
                  }
                }
              }
              break;
            }
          }
        }
        break;
      }
      case i32(31): {
        let localeName;
        const __cxx_lvalue_29 = cRef(() => localeName, __cxx_lvalue_70 => { localeName = __cxx_lvalue_70; });
        if (Boolean(scriptfile_getstring(pScript, __cxx_lvalue_29))) {
          break;
        }
        let blockend;
        const __cxx_lvalue_30 = cRef(() => blockend, __cxx_lvalue_71 => { blockend = __cxx_lvalue_71; });
        if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_30))) {
          break;
        }
        (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(blockend, 1, Uint8Array.BYTES_PER_ELEMENT));
        break;
      }
      case i32(32): {
        let keyRemapEnd;
        const __cxx_lvalue_31 = cRef(() => keyRemapEnd, __cxx_lvalue_72 => { keyRemapEnd = __cxx_lvalue_72; });
        let currSlot = i32(0);
        let keyIndex;
        const __cxx_lvalue_32 = cRef(() => keyIndex, __cxx_lvalue_73 => { keyIndex = i32(__cxx_lvalue_73); });
        let gamefunc_bitmap = u64(0n);
        (i32(63) <= 64);
        if (Boolean(scriptfile_getbraces(pScript, __cxx_lvalue_31))) {
          break;
        }
        if (Boolean(firstPass)) {
          (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(keyRemapEnd, 1, Uint8Array.BYTES_PER_ELEMENT));
          break;
        }
        while (cPointerCompare(cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr, cPointerOffset(keyRemapEnd, -(1), Uint8Array.BYTES_PER_ELEMENT, true), "<")) {
          let mapPtr = cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).ltextptr;
          if ((currSlot >= i32(63))) {
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_879e6921e713010bee85, u32(5841), __cxx_literal_6f868170c2ca5fe36b21, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, mapPtr), i32(63)));
            (cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).textptr = cPointerOffset(keyRemapEnd, 1, Uint8Array.BYTES_PER_ELEMENT));
            break;
          }
          if (Boolean(scriptfile_getsymbol(pScript, __cxx_lvalue_32))) {
            continue;
          }
          if (((keyIndex < 0) || (keyIndex >= i32(63)))) {
            ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_f371fbb5604d2d5e84e7, u32(5853), __cxx_literal_b6ce9c925536864b12ad, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, mapPtr), keyIndex));
            continue;
          } else {
            if (Boolean(u64((BigInt(u64(gamefunc_bitmap)) & BigInt(u64((BigInt(1n) << BigInt(keyIndex)))))))) {
              ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_9242e610454285141fc5, u32(5860), __cxx_literal_941377e45d9fad276e42, cRecordObject(cRecordPointer(pScript, {"align": 8, "arrayAlign": 1, "fields": {"eof": {"offset": 32, "pointer": true, "size": 8}, "filename": {"offset": 40, "pointer": true, "size": 8}, "linenum": {"native": "Int32Array", "offset": 48, "size": 4}, "lineoffs": {"offset": 56, "pointer": true, "size": 8}, "ltextptr": {"offset": 16, "pointer": true, "size": 8}, "textbuf": {"offset": 0, "pointer": true, "size": 8}, "textlength": {"native": "Uint32Array", "offset": 8, "size": 4}, "textptr": {"offset": 24, "pointer": true, "size": 8}}, "overlaps": false, "size": 64, "union": false}, {})).filename, scriptfile_getlinum(pScript, mapPtr), (cPointerElementRef(gamefunc_symbol_names, keyIndex).value)));
              continue;
            }
          }
          ((cDeref(cPointerOffset(keybind_order_custom, currSlot, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(keyIndex));
          (gamefunc_bitmap = u64((BigInt(gamefunc_bitmap) | BigInt(u64((BigInt(1n) << BigInt(keyIndex)))))));
          ((__cxx_lvalue_74) => { const previous = __cxx_lvalue_74.value; const next = i32((previous + 1)); __cxx_lvalue_74.value = next; return previous; })(cRef(() => currSlot, __cxx_lvalue_75 => { currSlot = __cxx_lvalue_75; }));
        }
        while ((currSlot < i32(63))) {
          ((cDeref(cPointerOffset(keybind_order_custom, currSlot, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((-1)));
          ((__cxx_lvalue_76) => { const previous = __cxx_lvalue_76.value; const next = i32((previous + 1)); __cxx_lvalue_76.value = next; return previous; })(cRef(() => currSlot, __cxx_lvalue_77 => { currSlot = __cxx_lvalue_77; }));
        }
        for ((keyIndex = i32(0)); (keyIndex < i32(63)); ((__cxx_lvalue_78) => { const previous = __cxx_lvalue_78.value; const next = i32((previous + 1)); __cxx_lvalue_78.value = next; return previous; })(__cxx_lvalue_32)) {
          if ((!Boolean(u64((BigInt(u64(gamefunc_bitmap)) & BigInt(u64((BigInt(1n) << BigInt(keyIndex))))))))) {
            hash_delete(__cxx_global_cell_3f867168dc2e6af035c1cc31().value, (cPointerElementRef(gamefunctions, keyIndex).value));
            ((cDeref(cPointerOffset((cPointerElementRef(gamefunctions, keyIndex).value), 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
          }
        }
        break;
      }
      case i32(-2): {
        return i32(0);
      }
      default: {
        break;
      }
    }
  } while (Boolean(1));
  return i32(0);
}

// C/C++ source: source/duke3d/src/game.cpp:5898
const __cxx_literal_64d2844ca4f206ae5251 = Uint8Array.from([110, 117, 108, 108, 0]);
export function loaddefinitions_game(fileName, firstPass) {
  let pScript = scriptfile_fromfile(fileName);
  if (pScript) {
    parsedefinitions_game(pScript, firstPass);
  }
  {
    const __cxx_span_0 = cxxPointerSpan(__cxx_global_cell_9afcf601d9d7790547fa4ab2().value, "data_", "size_", 8);
    for (let __cxx_span_i_0 = 0; __cxx_span_i_0 < __cxx_span_0.length; ++__cxx_span_i_0) {
      parsedefinitions_game_include(__cxx_span_0.get(__cxx_span_i_0), null, __cxx_literal_64d2844ca4f206ae5251, firstPass);
    }
  }
  if (pScript) {
    scriptfile_close(pScript);
  }
  scriptfile_clearsymbols();
  return i32(0);
}

export function ARRAY_SIZE__header_f8557a61fa7e(arg0) {
  return u64(17n);
}

export function ARRAY_SIZE__header_251e3654dd1b(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_30888aa7cde6(arg0) {
  return u64(6n);
}

export function ARRAY_SIZE__header_8e1e61e90c11(arg0) {
  return u64(1n);
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc__header_ccb5f0fe89eb(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function ARRAY_SIZE__header_629f6c994b6a(arg0) {
  return u64(5n);
}

export function ARRAY_SIZE__header_45c5cc752339(arg0) {
  return u64(64n);
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_25587e65bc1e(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1392
export function xmalloc__header_b8c4af936cfc(size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1413
export function xrealloc__header_d80e72c0e866(ptr, size) {
  let newptr = Realloc__cxx_static_478d5da25b6b3923(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr, size, u64(16));
  if ((cPointerCompare(newptr, null, "!=") || (size == u64(0)))) {
    return newptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}
