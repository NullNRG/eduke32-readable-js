// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Alloc__cxx_static_e0036cfb06bcfe42 } from "./smmalloc_generic.cpp.mjs";
import { Bstrtoken } from "./compat.cpp.mjs";
import { Destroy__cxx_static_777d0ae31c789182 } from "./smmalloc_generic.cpp.mjs";
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { SDL_CreateRGBSurfaceFrom } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_CreateWindow } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_DestroyWindow } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_FlushEvent } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_FreeSurface } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerAddMappingsFromRW } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerClose } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerGetSerial } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerGetStringForAxis } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerGetStringForButton } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerHasAxis } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerHasButton } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerHasRumble } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerName } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerNameForIndex } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerOpen } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GameControllerRumble } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetClosestDisplayMode } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetCurrentVideoDriver } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetDesktopDisplayMode } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetDisplayMode } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetDisplayName } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetError } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetKeyName } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetNumDisplayModes } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetNumVideoDisplays } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetRevision } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetVersion } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetWindowDisplayIndex } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetWindowGammaRamp } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetWindowSurface } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_InitSubSystem } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_IsGameController } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickClose } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickEventState } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickHasRumble } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickNameForIndex } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickNumAxes } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickNumBalls } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickNumButtons } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickNumHats } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickOpen } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_JoystickRumble } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_LockSurface } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_NumJoysticks } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_PeepEvents } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_PumpEvents } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_Quit } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_RWFromConstMem } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetHint } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetRelativeMouseMode } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetThreadPriority } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowBordered } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowDisplayMode } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowFullscreen } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowGammaRamp } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowGrab } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowIcon } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowPosition } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowSize } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowTitle } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_ShowCursor } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_ShowMessageBox } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_ShowSimpleMessageBox } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_StartTextInput } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_StopTextInput } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_UnlockSurface } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_UpdateWindowSurface } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_WasInit } from "../../../browser-abi/sdl_provider.mjs";
import { __cxx_record_vec2_2150e186aab2ebda } from "./clip.cpp.mjs";
import { abs } from "./engine.cpp.mjs";
import { apptitle } from "./engine.cpp.mjs";
import { calc_ylookup } from "./baselayer.cpp.mjs";
import { curpalettefaded } from "./palette.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { __cxx_global_cell_98c8686ca508db9a2275a6f8 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_d0cb64ef22766dce0c3d933d } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_1593acb7552d6b6c91fb2a4b } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_ee6f4502eccd328f27b46fb8 } from "./baselayer.cpp.mjs";
import { g_keyAsciiFIFO } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_a6fc8c10b0aec7fd31285ec6 } from "./baselayer.cpp.mjs";
import { g_keyNameTable } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_c9714796681e8c5a7f827938 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_1e0923736d676262c5e9d588 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_1cf0029028a3e73171a1adee } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_e05bfe76ea6b9140ad7ed9e7 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_489f4a2f5e930aaf72c81254 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_98758ea3e7ef83f477f7ff1f } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_f2b488870f755876d24f149d } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_52921ad2f7df0862590c48b4 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_9fad9f5c6a95d4e89a1de80a } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { __cxx_global_cell_eb7ec64efb5dec6e758a65c7 } from "./engine.cpp.mjs";
import { __cxx_global_cell_92f6ec0c3a993b574f308abb } from "./engine.cpp.mjs";
import { __cxx_global_cell_b9268bcd54dec167c4a7cf60 } from "./engine.cpp.mjs";
import { __cxx_global_cell_e262794d9997adc8dcfb5b2d } from "./engine.cpp.mjs";
import { __cxx_global_cell_a8e62b4a4ba82cd2a9215fe2 } from "./palette.cpp.mjs";
import { handle_memerr } from "./compat.cpp.mjs";
import { initprintf } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_9541123d8c6d2c52896ac26a } from "./engine.cpp.mjs";
import { __cxx_global_cell_816e78cbc24a2eb6f3b7a4ee } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_39a39d1bfab5e142a4f76536 } from "./baselayer.cpp.mjs";
import { kclose } from "./vfs.cpp.mjs";
import { keyFlushChars } from "./baselayer.cpp.mjs";
import { keyFlushScans } from "./baselayer.cpp.mjs";
import { kfilelength } from "./vfs.cpp.mjs";
import { kopen4load } from "./vfs.cpp.mjs";
import { kread } from "./vfs.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { memcmp } from "../../../browser-abi/libc_provider.mjs";
import { memcpy } from "../../../browser-abi/libc_provider.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_96cc27380f17556df4ccc300 } from "./engine.cpp.mjs";
import { mutex_init } from "./mutex.cpp.mjs";
import { __cxx_global_cell_e7587e075f0e1bcf83dd9001 } from "./engine.cpp.mjs";
import { __cxx_global_cell_5a97be12fac9e104b96ea90d } from "./osd.cpp.mjs";
import { __cxx_global_cell_fba044f5949b228db52cb0a4 } from "./palette.cpp.mjs";
import { __cxx_global_cell_226fe25bac1ac7d5f7db4e7a } from "./palette.cpp.mjs";
import { qsort } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_67da6fc124c3ab1d5da4a606 } from "./engine.cpp.mjs";
import { __cxx_global_cell_a69b3d47547d48eac82bcf95 } from "./engine.cpp.mjs";
import { snprintf } from "../../../browser-abi/libc_provider.mjs";
import { softsurface_blitBuffer } from "./softsurface.cpp.mjs";
import { softsurface_destroy } from "./softsurface.cpp.mjs";
import { softsurface_getBuffer } from "./softsurface.cpp.mjs";
import { softsurface_setPalette } from "./softsurface.cpp.mjs";
import { sprintf } from "../../../browser-abi/libc_provider.mjs";
import { strcpy } from "../../../browser-abi/libc_provider.mjs";
import { strlen } from "../../../browser-abi/libc_provider.mjs";
import { sysReadCPUID } from "../../../browser-abi/libc_provider.mjs";
import { timerInit } from "../../../browser-abi/libc_provider.mjs";
import { validmode } from "./engine.cpp.mjs";
import { __cxx_global_cell_959ecb0f89b58217d69a30a7 } from "./engine.cpp.mjs";
import { videoFadePalette } from "./palette.cpp.mjs";
import { vsnprintf } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_global_cell_22f848239c12c0d9f2b6f9e3 } from "./engine.cpp.mjs";
import { __cxx_global_cell_ce636929c03d679219ea2982 } from "./engine.cpp.mjs";

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

// Clang x86-64 SysV va_list ABI: represented as an owned native JS cursor.
// No native stack/register emulation. The C caller has already passed the
// promoted arguments as JavaScript values. This is a function-call adapter.
const cVariadic = Object.freeze({
  empty() { return {__cVaList: true, values: null, index: 0, ended: false}; },
  check(list) {
    if (!list || list.__cVaList !== true || list.ended)
      throw new TypeError('invalid or ended C va_list');
  },
  start(list, arguments_) {
    cVariadic.check(list);
    if (list.values !== null || !Array.isArray(arguments_))
      throw new TypeError('va_start requires uninitialized cursor and original arguments');
    list.values = arguments_;
    list.index = 0;
  },
  next(list) {
    cVariadic.check(list);
    if (!Array.isArray(list.values) || list.index >= list.values.length)
      throw new RangeError('va_arg exhausted original C variadic arguments');
    return list.values[list.index++];
  },
  copy(destination, source) {
    cVariadic.check(destination);
    cVariadic.check(source);
    if (!Array.isArray(source.values)) throw new TypeError('va_copy source has no va_start');
    destination.values = source.values;
    destination.index = source.index;
  },
  end(list) {
    cVariadic.check(list);
    if (!Array.isArray(list.values))throw new TypeError('va_end without va_start');
    list.values = null;
    list.ended = true;
  }
});

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }
function i64(value) { return BigInt.asIntN(64, BigInt(value)); }
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }
const powf = (a,b) => Math.fround(Math.pow(Math.fround(a), Math.fround(b)));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_unreachable = () => { throw new Error("C++ undefined behavior: reached __builtin_unreachable"); };
// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_ee3d6a8a30e73686 = i32(3754936);
function __cxx_static_address_cb34a7085bc0cd6548dfe089() {
  return __cxx_static_address_cb34a7085bc0cd6548dfe089.reference || (__cxx_static_address_cb34a7085bc0cd6548dfe089.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_ee3d6a8a30e73686; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c96b47cd1f0672f5 = i32(1144);
function __cxx_static_address_c0a7914c7528a7d4c702056a() {
  return __cxx_static_address_c0a7914c7528a7d4c702056a.reference || (__cxx_static_address_c0a7914c7528a7d4c702056a.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c96b47cd1f0672f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: platform/Windows/include/SDL2/SDL_events.h:618
export function SDL_Event() {
  return SDL_Event.type || (SDL_Event.type = class SDL_Event__implementation {
  constructor() {
    this.type = undefined;
    this.common = undefined;
    this.display = undefined;
    this.window = undefined;
    this.key = undefined;
    this.edit = undefined;
    this.editExt = undefined;
    this.text = undefined;
    this.motion = undefined;
    this.button = undefined;
    this.wheel = undefined;
    this.jaxis = undefined;
    this.jball = undefined;
    this.jhat = undefined;
    this.jbutton = undefined;
    this.jdevice = undefined;
    this.jbattery = undefined;
    this.caxis = undefined;
    this.cbutton = undefined;
    this.cdevice = undefined;
    this.ctouchpad = undefined;
    this.csensor = undefined;
    this.adevice = undefined;
    this.sensor = undefined;
    this.quit = undefined;
    this.user = undefined;
    this.syswm = undefined;
    this.tfinger = undefined;
    this.mgesture = undefined;
    this.dgesture = undefined;
    this.drop = undefined;
    this.padding = undefined;
  }
});
}

// C/C++ source: platform/Windows/include/SDL2/SDL_version.h:51
export function SDL_version() {
  return SDL_version.type || (SDL_version.type = class SDL_version__implementation {
  constructor() {
    return Object.setPrototypeOf(cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"major": {"native": "Uint8Array", "offset": 0, "size": 1}, "minor": {"native": "Uint8Array", "offset": 1, "size": 1}, "patch": {"native": "Uint8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 3, "union": false}}, {}), new.target.prototype);
  }
});
}

// C/C++ source: source/build/src/sdlayer.cpp:57
export let linked = cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"major": {"native": "Uint8Array", "offset": 0, "size": 1}, "minor": {"native": "Uint8Array", "offset": 1, "size": 1}, "patch": {"native": "Uint8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 3, "union": false}}, {});
function __cxx_static_address_b3a946a86164333a07ed9373() {
  return __cxx_static_address_b3a946a86164333a07ed9373.reference || (__cxx_static_address_b3a946a86164333a07ed9373.reference = {
    __cReference: true,
    get value() { return linked; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_b3a946a86164333a07ed9373() { return __cxx_static_address_b3a946a86164333a07ed9373(); }

// C/C++ source: source/build/src/sdlayer.cpp:63
export function startwin_open() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:64
export function startwin_close() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:65
export function startwin_puts(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:66
export function startwin_idle(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:67
export function startwin_settitle(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:68
export function startwin_run() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:69
export function startwin_isopen() {
  return Boolean(false);
}

// C/C++ source: source/build/src/sdlayer.cpp:80
export let inputchecked = i32(0);
export function __cxx_global_cell_442ee18d0bd3b7af452b37d9() {
  return __cxx_global_cell_442ee18d0bd3b7af452b37d9.reference || (__cxx_global_cell_442ee18d0bd3b7af452b37d9.reference = {
    __cReference: true,
    get value() { return inputchecked; },
    set value(__cxx_lvalue_0) { inputchecked = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:82
export let quitevent = (u32((u32(0) & 255)) & 255);
export function __cxx_global_cell_2eb868e64aeb8bef352d4729() {
  return __cxx_global_cell_2eb868e64aeb8bef352d4729.reference || (__cxx_global_cell_2eb868e64aeb8bef352d4729.reference = {
    __cReference: true,
    get value() { return quitevent; },
    set value(__cxx_lvalue_0) { quitevent = (u32(__cxx_lvalue_0) & 255); }
  });
}

export let appactive = (u32((u32(1) & 255)) & 255);
export function __cxx_global_cell_026e4893be4e21af32359651() {
  return __cxx_global_cell_026e4893be4e21af32359651.reference || (__cxx_global_cell_026e4893be4e21af32359651.reference = {
    __cReference: true,
    get value() { return appactive; },
    set value(__cxx_lvalue_0) { appactive = (u32(__cxx_lvalue_0) & 255); }
  });
}

export let novideo = (u32((u32(0) & 255)) & 255);
export function __cxx_global_cell_468c46341ac515257fedfe76() {
  return __cxx_global_cell_468c46341ac515257fedfe76.reference || (__cxx_global_cell_468c46341ac515257fedfe76.reference = {
    __cReference: true,
    get value() { return novideo; },
    set value(__cxx_lvalue_0) { novideo = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:85
export let sdl_surface = null;
function __cxx_static_address_36c1ac07e31aed8d3265cb02() {
  return __cxx_static_address_36c1ac07e31aed8d3265cb02.reference || (__cxx_static_address_36c1ac07e31aed8d3265cb02.reference = {
    __cReference: true,
    get value() { return sdl_surface; },
    set value(__cxx_lvalue_0) { sdl_surface = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_36c1ac07e31aed8d3265cb02() { return __cxx_static_address_36c1ac07e31aed8d3265cb02(); }

// C/C++ source: source/build/src/sdlayer.cpp:87
export let sdl_resize = cZeroAggregate({"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}}, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype});
function __cxx_static_address_6767ac62baba5bd380c8777b() {
  return __cxx_static_address_6767ac62baba5bd380c8777b.reference || (__cxx_static_address_6767ac62baba5bd380c8777b.reference = {
    __cReference: true,
    get value() { return sdl_resize; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:88
export let sdl_minimized = 0;
function __cxx_static_address_113e1d18026c11b638a523cd() {
  return __cxx_static_address_113e1d18026c11b638a523cd.reference || (__cxx_static_address_113e1d18026c11b638a523cd.reference = {
    __cReference: true,
    get value() { return sdl_minimized; },
    set value(__cxx_lvalue_0) { sdl_minimized = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_113e1d18026c11b638a523cd() { return __cxx_static_address_113e1d18026c11b638a523cd(); }

// C/C++ source: source/build/src/sdlayer.cpp:91
export let sdl_window = null;
function __cxx_static_address_1807b37dcb1d3a7c8be4b656() {
  return __cxx_static_address_1807b37dcb1d3a7c8be4b656.reference || (__cxx_static_address_1807b37dcb1d3a7c8be4b656.reference = {
    __cReference: true,
    get value() { return sdl_window; },
    set value(__cxx_lvalue_0) { sdl_window = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_1807b37dcb1d3a7c8be4b656() { return __cxx_static_address_1807b37dcb1d3a7c8be4b656(); }

// C/C++ source: source/build/src/sdlayer.cpp:92
export let sdl_context = null;
function __cxx_static_address_b25927d643c9a78f2c95356f() {
  return __cxx_static_address_b25927d643c9a78f2c95356f.reference || (__cxx_static_address_b25927d643c9a78f2c95356f.reference = {
    __cReference: true,
    get value() { return sdl_context; },
    set value(__cxx_lvalue_0) { sdl_context = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_b25927d643c9a78f2c95356f() { return __cxx_static_address_b25927d643c9a78f2c95356f(); }

// C/C++ source: source/build/src/sdlayer.cpp:93
export let vsync_unsupported = 0;
function __cxx_static_address_0cb7862380d719c241f6375a() {
  return __cxx_static_address_0cb7862380d719c241f6375a.reference || (__cxx_static_address_0cb7862380d719c241f6375a.reference = {
    __cReference: true,
    get value() { return vsync_unsupported; },
    set value(__cxx_lvalue_0) { vsync_unsupported = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_0cb7862380d719c241f6375a() { return __cxx_static_address_0cb7862380d719c241f6375a(); }

// C/C++ source: source/build/src/sdlayer.cpp:96
export let vsync_renderlayer = 0;
function __cxx_static_address_4aa781b00af78a297342921a() {
  return __cxx_static_address_4aa781b00af78a297342921a.reference || (__cxx_static_address_4aa781b00af78a297342921a.reference = {
    __cReference: true,
    get value() { return vsync_renderlayer; },
    set value(__cxx_lvalue_0) { vsync_renderlayer = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_4aa781b00af78a297342921a() { return __cxx_static_address_4aa781b00af78a297342921a(); }

// C/C++ source: source/build/src/sdlayer.cpp:97
export let maxrefreshfreq = i32(0);
export function __cxx_global_cell_bbb4a9ec7fb6f0c4ded01621() {
  return __cxx_global_cell_bbb4a9ec7fb6f0c4ded01621.reference || (__cxx_global_cell_bbb4a9ec7fb6f0c4ded01621.reference = {
    __cReference: true,
    get value() { return maxrefreshfreq; },
    set value(__cxx_lvalue_0) { maxrefreshfreq = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:98
export let xres = i32((-1));
export function __cxx_global_cell_56bd65d018548900199db93f() {
  return __cxx_global_cell_56bd65d018548900199db93f.reference || (__cxx_global_cell_56bd65d018548900199db93f.reference = {
    __cReference: true,
    get value() { return xres; },
    set value(__cxx_lvalue_0) { xres = i32(__cxx_lvalue_0); }
  });
}

export let yres = i32((-1));
export function __cxx_global_cell_18fd7bea782d2fdc86805764() {
  return __cxx_global_cell_18fd7bea782d2fdc86805764.reference || (__cxx_global_cell_18fd7bea782d2fdc86805764.reference = {
    __cReference: true,
    get value() { return yres; },
    set value(__cxx_lvalue_0) { yres = i32(__cxx_lvalue_0); }
  });
}

export let bpp = i32(0);
export function __cxx_global_cell_b3926346e92cac557f00175c() {
  return __cxx_global_cell_b3926346e92cac557f00175c.reference || (__cxx_global_cell_b3926346e92cac557f00175c.reference = {
    __cReference: true,
    get value() { return bpp; },
    set value(__cxx_lvalue_0) { bpp = i32(__cxx_lvalue_0); }
  });
}

export let fullscreen = i32(0);
export function __cxx_global_cell_b58ae57ccd52d0f91d0874d6() {
  return __cxx_global_cell_b58ae57ccd52d0f91d0874d6.reference || (__cxx_global_cell_b58ae57ccd52d0f91d0874d6.reference = {
    __cReference: true,
    get value() { return fullscreen; },
    set value(__cxx_lvalue_0) { fullscreen = i32(__cxx_lvalue_0); }
  });
}

export let bytesperline = 0;
export function __cxx_global_cell_56606cfee73eb8d6c7d57541() {
  return __cxx_global_cell_56606cfee73eb8d6c7d57541.reference || (__cxx_global_cell_56606cfee73eb8d6c7d57541.reference = {
    __cReference: true,
    get value() { return bytesperline; },
    set value(__cxx_lvalue_0) { bytesperline = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:99
export let refreshfreq = 59;
export function __cxx_global_cell_84c518e352f66f31d8eaf74c() {
  return __cxx_global_cell_84c518e352f66f31d8eaf74c.reference || (__cxx_global_cell_84c518e352f66f31d8eaf74c.reference = {
    __cReference: true,
    get value() { return refreshfreq; },
    set value(__cxx_lvalue_0) { refreshfreq = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:100
export let frameplace = i64(0);
export function __cxx_global_cell_f0c9c3446e396d6353338d7e() {
  return __cxx_global_cell_f0c9c3446e396d6353338d7e.reference || (__cxx_global_cell_f0c9c3446e396d6353338d7e.reference = {
    __cReference: true,
    get value() { return frameplace; },
    set value(__cxx_lvalue_0) { frameplace = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_093baef6a1feb6b6 = i32(2147483647);
function __cxx_static_address_8e7f645703434fab23407abc() {
  return __cxx_static_address_8e7f645703434fab23407abc.reference || (__cxx_static_address_8e7f645703434fab23407abc.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_093baef6a1feb6b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_ac5cc53a58df79e7 = i32(2147483648);
function __cxx_static_address_d4f3851ccbd957b09ca355ea() {
  return __cxx_static_address_d4f3851ccbd957b09ca355ea.reference || (__cxx_static_address_d4f3851ccbd957b09ca355ea.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_ac5cc53a58df79e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_5377101bf3f82cd9 = i32(2147483648);
function __cxx_static_address_66c7591c516e33c2aa8b6a62() {
  return __cxx_static_address_66c7591c516e33c2aa8b6a62.reference || (__cxx_static_address_66c7591c516e33c2aa8b6a62.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_5377101bf3f82cd9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_920416620894b39b = i32(65536);
function __cxx_static_address_9a782fecd34cda2cb0cb7e0f() {
  return __cxx_static_address_9a782fecd34cda2cb0cb7e0f.reference || (__cxx_static_address_9a782fecd34cda2cb0cb7e0f.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_920416620894b39b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_62cc3068420b56ba = i32(32768);
function __cxx_static_address_e68422c3096b8da6b24d73ef() {
  return __cxx_static_address_e68422c3096b8da6b24d73ef.reference || (__cxx_static_address_e68422c3096b8da6b24d73ef.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_62cc3068420b56ba; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_7e8639f9b3f99b36 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_de5fb47eeff4d3fb05948117() {
  return __cxx_static_address_de5fb47eeff4d3fb05948117.reference || (__cxx_static_address_de5fb47eeff4d3fb05948117.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_7e8639f9b3f99b36; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:101
export let lockcount = i32(0);
export function __cxx_global_cell_82b1d07c07b2d44b437f8e68() {
  return __cxx_global_cell_82b1d07c07b2d44b437f8e68.reference || (__cxx_global_cell_82b1d07c07b2d44b437f8e68.reference = {
    __cReference: true,
    get value() { return lockcount; },
    set value(__cxx_lvalue_0) { lockcount = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:102
export let modechange = (u32((u32(1) & 255)) & 255);
export function __cxx_global_cell_1fc8813e2419d4023365727f() {
  return __cxx_global_cell_1fc8813e2419d4023365727f.reference || (__cxx_global_cell_1fc8813e2419d4023365727f.reference = {
    __cReference: true,
    get value() { return modechange; },
    set value(__cxx_lvalue_0) { modechange = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:103
export let offscreenrendering = (u32((u32(0) & 255)) & 255);
export function __cxx_global_cell_93d7c17084d3a8832fd9f6c6() {
  return __cxx_global_cell_93d7c17084d3a8832fd9f6c6.reference || (__cxx_global_cell_93d7c17084d3a8832fd9f6c6.reference = {
    __cReference: true,
    get value() { return offscreenrendering; },
    set value(__cxx_lvalue_0) { offscreenrendering = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:104
export let videomodereset = (u32((u32(0) & 255)) & 255);
export function __cxx_global_cell_be076cccfa4a217ba3cad38e() {
  return __cxx_global_cell_be076cccfa4a217ba3cad38e.reference || (__cxx_global_cell_be076cccfa4a217ba3cad38e.reference = {
    __cReference: true,
    get value() { return videomodereset; },
    set value(__cxx_lvalue_0) { videomodereset = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:105
export let nofog = i32(0);
export function __cxx_global_cell_312bd94d4e503ddb77232cb4() {
  return __cxx_global_cell_312bd94d4e503ddb77232cb4.reference || (__cxx_global_cell_312bd94d4e503ddb77232cb4.reference = {
    __cReference: true,
    get value() { return nofog; },
    set value(__cxx_lvalue_0) { nofog = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:107
export let sysgamma = cNativeArray("Uint16Array", [3, 256], Array.from({ length: 3 }, () => new Uint16Array(256)));
function __cxx_static_address_23e29cf0928ef78b6f37ee25() {
  return __cxx_static_address_23e29cf0928ef78b6f37ee25.reference || (__cxx_static_address_23e29cf0928ef78b6f37ee25.reference = {
    __cReference: true,
    get value() { return sysgamma; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_23e29cf0928ef78b6f37ee25() { return __cxx_static_address_23e29cf0928ef78b6f37ee25(); }

// C/C++ source: source/build/src/sdlayer.cpp:114
export let lastvidgcb = new Float32Array(2);
function __cxx_static_address_b7667aed095ebace4c73b0ae() {
  return __cxx_static_address_b7667aed095ebace4c73b0ae.reference || (__cxx_static_address_b7667aed095ebace4c73b0ae.reference = {
    __cReference: true,
    get value() { return lastvidgcb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_b7667aed095ebace4c73b0ae() { return __cxx_static_address_b7667aed095ebace4c73b0ae(); }

// C/C++ source: source/build/src/sdlayer.cpp:120
export let appicon = null;
function __cxx_static_address_feff729a4afb22c72f286a77() {
  return __cxx_static_address_feff729a4afb22c72f286a77.reference || (__cxx_static_address_feff729a4afb22c72f286a77.reference = {
    __cReference: true,
    get value() { return appicon; },
    set value(__cxx_lvalue_0) { appicon = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_feff729a4afb22c72f286a77() { return __cxx_static_address_feff729a4afb22c72f286a77(); }

// C/C++ source: source/build/src/sdlayer.cpp:125
export let m_initprintf = 0;
function __cxx_static_address_9d6af81b93470456d23952cd() {
  return __cxx_static_address_9d6af81b93470456d23952cd.reference || (__cxx_static_address_9d6af81b93470456d23952cd.reference = {
    __cReference: true,
    get value() { return m_initprintf; },
    set value(__cxx_lvalue_0) { m_initprintf = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_9d6af81b93470456d23952cd() { return __cxx_static_address_9d6af81b93470456d23952cd(); }

// C/C++ source: source/build/src/sdlayer.cpp:127
export let g_ImGui_IO = null;
function __cxx_static_address_3df1a205758f5dda30781d01() {
  return __cxx_static_address_3df1a205758f5dda30781d01.reference || (__cxx_static_address_3df1a205758f5dda30781d01.reference = {
    __cReference: true,
    get value() { return g_ImGui_IO; },
    set value(__cxx_lvalue_0) { g_ImGui_IO = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_3df1a205758f5dda30781d01() { return __cxx_static_address_3df1a205758f5dda30781d01(); }

// C/C++ source: source/build/src/sdlayer.cpp:128
export let g_ImGuiCaptureInput = Boolean(true);
export function __cxx_global_cell_0350f6cc5858cd66e50c3714() {
  return __cxx_global_cell_0350f6cc5858cd66e50c3714.reference || (__cxx_global_cell_0350f6cc5858cd66e50c3714.reference = {
    __cReference: true,
    get value() { return g_ImGuiCaptureInput; },
    set value(__cxx_lvalue_0) { g_ImGuiCaptureInput = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:130
export let g_ImGuiCapturedDevices = 0;
export function __cxx_global_cell_a784f64073c8e6317721f5a6() {
  return __cxx_global_cell_a784f64073c8e6317721f5a6.reference || (__cxx_global_cell_a784f64073c8e6317721f5a6.reference = {
    __cReference: true,
    get value() { return g_ImGuiCapturedDevices; },
    set value(__cxx_lvalue_0) { g_ImGuiCapturedDevices = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:162
export function wm_msgbox(name, fmt, ...__cxx_varargs) {
  let buf = cTypedPointer(cStackAlloc(u64(1536)), Uint8Array);
  let va = cVariadic.empty();
  (name = name);
  cVariadic.start(va, __cxx_varargs);
  vsnprintf(buf, u64(1536), fmt, va);
  cVariadic.end(va);
  ((cDeref(cPointerOffset(buf, i32((1536 - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  for (let i = u64(0); (i < u64(1536)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((i32((cDeref(cPointerOffset(buf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(9))) {
      ((cDeref(cPointerOffset(buf, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(32) & 255));
    }
  }
  let result = i32(SDL_ShowSimpleMessageBox(u32(64), name, buf, null));
  return i32(result);
}

// C/C++ source: source/build/src/sdlayer.cpp:209
const __cxx_literal_996c4ac2a7e381e6daa9 = Uint8Array.from([78, 111, 0]);
const __cxx_literal_83212cf440c06b87df70 = Uint8Array.from([89, 101, 115, 0]);
export function wm_ynbox(name, fmt, ...__cxx_varargs) {
  let buf = cTypedPointer(cStackAlloc(u64(1536)), Uint8Array);
  let va = cVariadic.empty();
  (name = name);
  cVariadic.start(va, __cxx_varargs);
  vsnprintf(buf, u64(1536), fmt, va);
  cVariadic.end(va);
  ((cDeref(cPointerOffset(buf, i32((1536 - 1)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  let r = i32((-1));
  const __cxx_lvalue_0 = cRef(() => r, __cxx_lvalue_1 => { r = i32(__cxx_lvalue_1); });
  let buttons = cByteRecordNDArray({"align": 8, "arrayAlign": 1, "fields": {"buttonid": {"native": "Int32Array", "offset": 4, "size": 4}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, [2], {}, [cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"buttonid": {"native": "Int32Array", "offset": 4, "size": 4}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"flags": u32(2), "buttonid": 0, "text": __cxx_literal_996c4ac2a7e381e6daa9}, null, {}), cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"buttonid": {"native": "Int32Array", "offset": 4, "size": 4}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "text": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 16, "union": false}, {"flags": u32(1), "buttonid": 1, "text": __cxx_literal_83212cf440c06b87df70}, null, {})]);
  let data = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"buttons": {"offset": 40, "pointer": true, "size": 8}, "colorScheme": {"offset": 48, "pointer": true, "size": 8}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "message": {"offset": 24, "pointer": true, "size": 8}, "numbuttons": {"native": "Int32Array", "offset": 32, "size": 4}, "title": {"offset": 16, "pointer": true, "size": 8}, "window": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "size": 56, "union": false}, {"flags": u32(64), "window": null, "title": name, "message": buf, "numbuttons": 2, "buttons": buttons, "colorScheme": null}, null, {});
  SDL_ShowMessageBox(data, __cxx_lvalue_0);
  return i32(r);
}

// C/C++ source: source/build/src/sdlayer.cpp:278
export function wm_setapptitle(name) {
  if (cPointerCompare(name, apptitle, "!=")) {
    Bstrncpyz__header_bcf6245401e3(apptitle, name, 256);
  }
  if ((!appicon)) {
    (appicon = loadappicon());
  }
  if (sdl_window) {
    SDL_SetWindowTitle(sdl_window, apptitle);
    if (appicon) {
      SDL_SetWindowIcon(sdl_window, appicon);
    }
  }
  startwin_settitle(apptitle);
}

// C/C++ source: source/build/src/sdlayer.cpp:334
export function attach_debugger_here() {

}

// C/C++ source: source/build/src/sdlayer.cpp:423
const __cxx_literal_96d887872e44edeaf347 = Uint8Array.from([83, 68, 76, 95, 78, 79, 95, 83, 73, 71, 78, 65, 76, 95, 72, 65, 78, 68, 76, 69, 82, 83, 0]);
const __cxx_literal_062a5ad372a352e79b83 = Uint8Array.from([49, 0]);
const __cxx_literal_70488226542d9532bf5f = Uint8Array.from([83, 68, 76, 95, 86, 73, 68, 69, 79, 95, 72, 73, 71, 72, 68, 80, 73, 95, 68, 73, 83, 65, 66, 76, 69, 68, 0]);
const __cxx_literal_5f4d92fc80c8c9853b24 = Uint8Array.from([49, 0]);
const __cxx_literal_1096a58d453878bad484 = Uint8Array.from([83, 68, 76, 95, 77, 79, 85, 83, 69, 95, 70, 79, 67, 85, 83, 95, 67, 76, 73, 67, 75, 84, 72, 82, 79, 85, 71, 72, 0]);
const __cxx_literal_8a2ad0f0104bb8d03cdd = Uint8Array.from([48, 0]);
const __cxx_literal_313e251c6c4afd5f5199 = Uint8Array.from([83, 68, 76, 95, 65, 85, 68, 73, 79, 95, 82, 69, 83, 65, 77, 80, 76, 73, 78, 71, 95, 77, 79, 68, 69, 0]);
const __cxx_literal_09f37d7870bc61a91d19 = Uint8Array.from([51, 0]);
const __cxx_literal_4b173635ec547ffbfd13 = Uint8Array.from([83, 68, 76, 95, 77, 79, 85, 83, 69, 95, 82, 69, 76, 65, 84, 73, 86, 69, 95, 83, 67, 65, 76, 73, 78, 71, 0]);
const __cxx_literal_af63f7ce724e4433990a = Uint8Array.from([48, 0]);
export function sdlayer_sethints() {
  SDL_SetHint(__cxx_literal_96d887872e44edeaf347, __cxx_literal_062a5ad372a352e79b83);
  SDL_SetHint(__cxx_literal_70488226542d9532bf5f, __cxx_literal_5f4d92fc80c8c9853b24);
  SDL_SetHint(__cxx_literal_1096a58d453878bad484, __cxx_literal_8a2ad0f0104bb8d03cdd);
  SDL_SetHint(__cxx_literal_313e251c6c4afd5f5199, __cxx_literal_09f37d7870bc61a91d19);
  SDL_SetHint(__cxx_literal_4b173635ec547ffbfd13, __cxx_literal_af63f7ce724e4433990a);
}

// C/C++ source: source/build/src/sdlayer.cpp:653
const __cxx_literal_114d3a264cf78ba5f815 = Uint8Array.from([73, 110, 105, 116, 105, 97, 108, 105, 122, 105, 110, 103, 32, 83, 68, 76, 32, 37, 100, 46, 37, 100, 46, 37, 100, 32, 40, 37, 115, 41, 0]);
const __cxx_literal_34c1bbec4c53953c466e = Uint8Array.from([73, 110, 105, 116, 105, 97, 108, 105, 122, 105, 110, 103, 32, 83, 68, 76, 32, 37, 100, 46, 37, 100, 46, 37, 100, 0]);
const __cxx_literal_3738f1cb0853b65bbf7c = Uint8Array.from([73, 110, 105, 116, 105, 97, 108, 105, 122, 105, 110, 103, 32, 83, 68, 76, 32, 37, 100, 46, 37, 100, 46, 37, 100, 32, 40, 98, 117, 105, 108, 116, 32, 97, 103, 97, 105, 110, 115, 116, 32, 118, 101, 114, 115, 105, 111, 110, 32, 37, 100, 46, 37, 100, 46, 37, 100, 41, 0]);
const __cxx_literal_2cd7e46b23cedb446372 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_171f2e64f1eab418584f = Uint8Array.from([37, 115, 0]);
const __cxx_literal_9906ef70a8ce21452d60 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_785da6c11a0dd0b6211b = Uint8Array.from([89, 111, 117, 32, 110, 101, 101, 100, 32, 83, 68, 76, 32, 37, 100, 46, 37, 100, 46, 37, 100, 32, 111, 114, 32, 110, 101, 119, 101, 114, 32, 116, 111, 32, 114, 117, 110, 32, 37, 115, 46, 0]);
export function sdlayer_checkversion() {
  let compiled = cZeroAggregate({"byteRecord": {"align": 1, "arrayAlign": 1, "fields": {"major": {"native": "Uint8Array", "offset": 0, "size": 1}, "minor": {"native": "Uint8Array", "offset": 1, "size": 1}, "patch": {"native": "Uint8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 3, "union": false}}, {});
  let str = cTypedPointer(cStackAlloc(u64(256)), Uint8Array);
  ((cDeref(cPointerOffset(str, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(0) & 255)) & 255));
  SDL_GetVersion(linked);
  let rev;
  if (((rev = SDL_GetRevision()) && (strlen(rev) > u64(0)))) {
    snprintf(str, u64(256), __cxx_literal_114d3a264cf78ba5f815, i32(linked.major), i32(linked.minor), i32(linked.patch), rev);
  } else {
    {
      (cRecordObject(cRecordPointer(compiled, {"align": 1, "arrayAlign": 1, "fields": {"major": {"native": "Uint8Array", "offset": 0, "size": 1}, "minor": {"native": "Uint8Array", "offset": 1, "size": 1}, "patch": {"native": "Uint8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 3, "union": false}, {})).major = (u32((u32(2) & 255)) & 255));
      (cRecordObject(cRecordPointer(compiled, {"align": 1, "arrayAlign": 1, "fields": {"major": {"native": "Uint8Array", "offset": 0, "size": 1}, "minor": {"native": "Uint8Array", "offset": 1, "size": 1}, "patch": {"native": "Uint8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 3, "union": false}, {})).minor = (u32((u32(30) & 255)) & 255));
      (cRecordObject(cRecordPointer(compiled, {"align": 1, "arrayAlign": 1, "fields": {"major": {"native": "Uint8Array", "offset": 0, "size": 1}, "minor": {"native": "Uint8Array", "offset": 1, "size": 1}, "patch": {"native": "Uint8Array", "offset": 2, "size": 1}}, "overlaps": false, "size": 3, "union": false}, {})).patch = (u32((u32(10) & 255)) & 255));
    }
    ;
    if ((!Boolean(memcmp(compiled, linked, 3)))) {
      snprintf(str, u64(256), __cxx_literal_34c1bbec4c53953c466e, i32(compiled.major), i32(compiled.minor), i32(compiled.patch));
    } else {
      snprintf(str, u64(256), __cxx_literal_3738f1cb0853b65bbf7c, i32(linked.major), i32(linked.minor), i32(linked.patch), i32(compiled.major), i32(compiled.minor), i32(compiled.patch));
    }
  }
  ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_2cd7e46b23cedb446372, u32(679), __cxx_literal_171f2e64f1eab418584f, str));
  if ((i32((i32((i32(Math.imul(i32(linked.major), 1000)) + i32(Math.imul(i32(linked.minor), 100)))) + i32(linked.patch))) < i32((i32((i32(Math.imul(2, 1000)) + i32(Math.imul(0, 100)))) + 5)))) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_9906ef70a8ce21452d60, u32(684), __cxx_literal_785da6c11a0dd0b6211b, 2, 0, 5, apptitle));
    return i32((-1));
  }
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:694
const __cxx_literal_632dafd788caf4185177 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_02c18a225ffac4a80aff = Uint8Array.from([83, 68, 76, 32, 105, 110, 105, 116, 105, 97, 108, 105, 122, 97, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_3818d36f6df38f0980c5 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_046c449e491c3af04c1b = Uint8Array.from([78, 111, 110, 45, 105, 110, 116, 101, 114, 97, 99, 116, 105, 118, 101, 32, 109, 111, 100, 101, 32, 101, 110, 97, 98, 108, 101, 100, 59, 32, 116, 104, 105, 115, 32, 105, 115, 32, 112, 114, 111, 98, 97, 98, 108, 121, 32, 110, 111, 116, 32, 119, 104, 97, 116, 32, 121, 111, 117, 32, 119, 97, 110, 116, 46, 0]);
const __cxx_literal_03117a9719037a4646e3 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_a45c3c8b37270ad6dd83 = Uint8Array.from([86, 105, 100, 101, 111, 32, 111, 117, 116, 112, 117, 116, 32, 100, 105, 115, 97, 98, 108, 101, 100, 46, 0]);
const __cxx_literal_035501aa0509de7b0e47 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_3d9f6ef70aeb753cf32e = Uint8Array.from([85, 115, 105, 110, 103, 32, 39, 37, 115, 39, 32, 118, 105, 100, 101, 111, 32, 100, 114, 105, 118, 101, 114, 46, 0]);
export function initsystem() {
  mutex_init(cScalarLValueIO(__cxx_static_address_9d6af81b93470456d23952cd(), Int32Array));
  sysReadCPUID();
  if (Boolean(sdlayer_checkversion())) {
    return i32((-1));
  }
  let err = i32(0);
  if ((SDL_WasInit(32) != 32)) {
    (err = i32(SDL_InitSubSystem(32)));
  }
  if (Boolean(err)) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_632dafd788caf4185177, u32(713), __cxx_literal_02c18a225ffac4a80aff, SDL_GetError()));
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_3818d36f6df38f0980c5, u32(714), __cxx_literal_046c449e491c3af04c1b));
    ((i32(2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(2), __cxx_literal_03117a9719037a4646e3, u32(715), __cxx_literal_a45c3c8b37270ad6dd83));
    (novideo = (u32((u32(1) & 255)) & 255));
  }
  SDL_StopTextInput();
  SDL_SetThreadPriority(2);
  timerInit(120);
  (frameplace = i64(0));
  (lockcount = i32(0));
  if ((!Boolean(novideo))) {
    let drvname = SDL_GetCurrentVideoDriver();
    if (drvname) {
      ((i32(0) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(0), __cxx_literal_035501aa0509de7b0e47, u32(747), __cxx_literal_3d9f6ef70aeb753cf32e, drvname));
    }
    wm_setapptitle(apptitle);
    (__cxx_global_cell_9fad9f5c6a95d4e89a1de80a().value = i32(SDL_GetNumVideoDisplays()));
  }
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:761
export function uninitsystem() {
  uninitinput();
  ;
  if (appicon) {
    SDL_FreeSurface(appicon);
    (appicon = null);
  }
  SDL_Quit();
}

// C/C++ source: source/build/src/sdlayer.cpp:800
export function debugprintf(f, ...__cxx_varargs) {
  (f = f);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:827
export let joydev = null;
function __cxx_static_address_9bcc038ce6382964e70f2374() {
  return __cxx_static_address_9bcc038ce6382964e70f2374.reference || (__cxx_static_address_9bcc038ce6382964e70f2374.reference = {
    __cReference: true,
    get value() { return joydev; },
    set value(__cxx_lvalue_0) { joydev = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_9bcc038ce6382964e70f2374() { return __cxx_static_address_9bcc038ce6382964e70f2374(); }

// C/C++ source: source/build/src/sdlayer.cpp:829
export let controller = null;
function __cxx_static_address_e515be6fd81f17336a26bdc9() {
  return __cxx_static_address_e515be6fd81f17336a26bdc9.reference || (__cxx_static_address_e515be6fd81f17336a26bdc9.reference = {
    __cReference: true,
    get value() { return controller; },
    set value(__cxx_lvalue_0) { controller = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_e515be6fd81f17336a26bdc9() { return __cxx_static_address_e515be6fd81f17336a26bdc9(); }

// C/C++ source: source/build/src/sdlayer.cpp:830
export let gameControllerDBLoaded = false;
function __cxx_static_address_458e8b34185fcfefb7603898() {
  return __cxx_static_address_458e8b34185fcfefb7603898.reference || (__cxx_static_address_458e8b34185fcfefb7603898.reference = {
    __cReference: true,
    get value() { return gameControllerDBLoaded; },
    set value(__cxx_lvalue_0) { gameControllerDBLoaded = Boolean(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_458e8b34185fcfefb7603898() { return __cxx_static_address_458e8b34185fcfefb7603898(); }

// C/C++ source: source/build/src/sdlayer.cpp:832
const __cxx_literal_8efd5fe96928f7ae9451 = Uint8Array.from([103, 97, 109, 101, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 100, 98, 46, 116, 120, 116, 0]);
const __cxx_literal_df93b93c73351acc592a = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_ab0114a502d2298babe5 = Uint8Array.from([70, 97, 105, 108, 101, 100, 32, 108, 111, 97, 100, 105, 110, 103, 32, 103, 97, 109, 101, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 32, 100, 97, 116, 97, 98, 97, 115, 101, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_9fb0c5cef656a819b4c2 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_628e0d8cfa7bc27a0fb4 = Uint8Array.from([76, 111, 97, 100, 101, 100, 32, 103, 97, 109, 101, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 32, 100, 97, 116, 97, 98, 97, 115, 101, 46, 0]);
export function LoadSDLControllerDB() {
  let fh, flen, dbuf, rwops, i;
  if (gameControllerDBLoaded) {
    return;
  }
  fh = i32(kopen4load(__cxx_literal_8efd5fe96928f7ae9451, (u32(0) & 255)));
  if ((fh == (-1))) {
    return;
  }
  flen = i32(kfilelength(fh));
  if ((flen <= 0)) {
    kclose(fh);
    return;
  }
  dbuf = cTypedPointer(xaligned_alloc__header_a6ee02102c42(u64(16), u64(i32((flen + 1)))), Uint8Array);
  if ((!dbuf)) {
    kclose(fh);
    return;
  }
  if ((kread(fh, dbuf, flen) != i32(flen))) {
    xaligned_free__header_8fde0869932d(dbuf);
    kclose(fh);
    return;
  }
  ((cDeref(cPointerOffset(dbuf, flen, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  kclose(fh);
  rwops = SDL_RWFromConstMem(dbuf, flen);
  if ((!rwops)) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_df93b93c73351acc592a, u32(869), __cxx_literal_ab0114a502d2298babe5, SDL_GetError()));
    xaligned_free__header_8fde0869932d(dbuf);
    return;
  }
  i = i32(SDL_GameControllerAddMappingsFromRW(rwops, 1));
  if ((i == (-1))) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_df93b93c73351acc592a, u32(869), __cxx_literal_ab0114a502d2298babe5, SDL_GetError()));
    xaligned_free__header_8fde0869932d(dbuf);
    return;
  } else {
    ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_9fb0c5cef656a819b4c2, u32(879), __cxx_literal_628e0d8cfa7bc27a0fb4));
  }
  xaligned_free__header_8fde0869932d(dbuf);
  (gameControllerDBLoaded = Boolean(true));
}

// C/C++ source: source/build/src/sdlayer.cpp:887
export let numjoysticks = 0;
function __cxx_static_address_358ef267a617a1927024295f() {
  return __cxx_static_address_358ef267a617a1927024295f.reference || (__cxx_static_address_358ef267a617a1927024295f.reference = {
    __cReference: true,
    get value() { return numjoysticks; },
    set value(__cxx_lvalue_0) { numjoysticks = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_358ef267a617a1927024295f() { return __cxx_static_address_358ef267a617a1927024295f(); }

// C/C++ source: source/build/src/sdlayer.cpp:889
const __cxx_literal_df9bccbda9802ad90883 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_02669e78ae9d9d7c126c = Uint8Array.from([78, 111, 32, 103, 97, 109, 101, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 115, 32, 102, 111, 117, 110, 100, 46, 0]);
const __cxx_literal_6d8eb4e00930ddcdf879 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_47aaeee44e235ca897cb = Uint8Array.from([71, 97, 109, 101, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 115, 58, 0]);
const __cxx_literal_9dd5356554941850f4bc = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_7c6c87c4a365cfaa9152 = Uint8Array.from([32, 32, 37, 100, 46, 32, 37, 115, 0]);
const __cxx_literal_2d8c0e3fe916e9b17cd0 = Uint8Array.from([37, 115, 32, 91, 37, 115, 93, 0]);
const __cxx_literal_0108e21a1dc075d4fb67 = Uint8Array.from([37, 115, 0]);
const __cxx_literal_2aa2471e5cc4bb10874c = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_37b4836c7208a7887529 = Uint8Array.from([85, 115, 105, 110, 103, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_b7c123de31554a73a356 = Uint8Array.from([67, 111, 117, 108, 100, 110, 39, 116, 32, 105, 110, 105, 116, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 32, 114, 117, 109, 98, 108, 101, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_04408b8231a8a4afdf16 = Uint8Array.from([67, 111, 117, 108, 100, 110, 39, 116, 32, 105, 110, 105, 116, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 32, 114, 117, 109, 98, 108, 101, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_2b5588d8b3ab4e2a36fc = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_090dec87c606a5737033 = Uint8Array.from([85, 115, 105, 110, 103, 32, 106, 111, 121, 115, 116, 105, 99, 107, 58, 32, 37, 115, 0]);
const __cxx_literal_0dcba7104046a9a2017b = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_1b234b1ede12fc8692cd = Uint8Array.from([74, 111, 121, 115, 116, 105, 99, 107, 32, 37, 100, 32, 104, 97, 115, 32, 37, 100, 32, 97, 120, 101, 115, 44, 32, 37, 100, 32, 98, 117, 116, 116, 111, 110, 115, 44, 32, 37, 100, 32, 104, 97, 116, 115, 44, 32, 97, 110, 100, 32, 37, 100, 32, 98, 97, 108, 108, 115, 46, 0]);
const __cxx_literal_e3080db9c670a04cae29 = Uint8Array.from([67, 111, 117, 108, 100, 110, 39, 116, 32, 105, 110, 105, 116, 32, 106, 111, 121, 115, 116, 105, 99, 107, 32, 114, 117, 109, 98, 108, 101, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_615fecdae0d06568a00f = Uint8Array.from([67, 111, 117, 108, 100, 110, 39, 116, 32, 105, 110, 105, 116, 32, 106, 111, 121, 115, 116, 105, 99, 107, 32, 114, 117, 109, 98, 108, 101, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_41f67853c0a88f939813 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_d508c2389be378b2639d = Uint8Array.from([78, 111, 32, 99, 111, 110, 116, 114, 111, 108, 108, 101, 114, 115, 32, 97, 114, 101, 32, 117, 115, 97, 98, 108, 101, 46, 0]);
export function joyScanDevices() {
  (__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee().value = (u32((__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee().value & (~4))) & 255));
  if (controller) {
    SDL_GameControllerClose(controller);
    (controller = null);
  }
  if (joydev) {
    SDL_JoystickClose(joydev);
    (joydev = null);
  }
  (numjoysticks = i32(SDL_NumJoysticks()));
  if ((numjoysticks < 1)) {
    ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_df9bccbda9802ad90883, u32(909), __cxx_literal_02669e78ae9d9d7c126c));
  } else {
    ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_6d8eb4e00930ddcdf879, u32(912), __cxx_literal_47aaeee44e235ca897cb));
    let name = cZeroAggregate({"array": "Uint8Array", "dims": [128]});
    for (let i = i32(0); (i < numjoysticks); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      if (Boolean(SDL_IsGameController(i))) {
        Bstrncpyz__header_bcf6245401e3(name, SDL_GameControllerNameForIndex(i), 128);
      } else {
        Bstrncpyz__header_bcf6245401e3(name, SDL_JoystickNameForIndex(i), 128);
      }
      ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_9dd5356554941850f4bc, u32(925), __cxx_literal_7c6c87c4a365cfaa9152, i32((i + 1)), name));
    }
    for (let i = i32(0); (i < numjoysticks); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
      if ((controller = SDL_GameControllerOpen(i))) {
        if (((i32(linked.major) > 2) || ((i32(linked.major) == 2) && ((i32(linked.minor) > 0) || ((i32(linked.minor) == 0) && (i32(linked.patch) >= 14)))))) {
          snprintf(name, 128, __cxx_literal_2d8c0e3fe916e9b17cd0, SDL_GameControllerName(controller), SDL_GameControllerGetSerial(controller));
        } else {
          snprintf(name, 128, __cxx_literal_0108e21a1dc075d4fb67, SDL_GameControllerName(controller));
        }
        ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_2aa2471e5cc4bb10874c, u32(939), __cxx_literal_37b4836c7208a7887529, name));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.flags = (u32((u32(0) & 255)) & 255));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numBalls = i32(0));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats = i32(0));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes = i32(6));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons = i32(21));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.validButtons = u32(4294967295));
        if (((i32(linked.major) > 2) || ((i32(linked.major) == 2) && ((i32(linked.minor) > 0) || ((i32(linked.minor) == 0) && (i32(linked.patch) >= 14)))))) {
          (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes = i32(0));
          for (let j = i32(0); (j < i32(6)); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => j, __cxx_lvalue_5 => { j = __cxx_lvalue_5; }))) {
            if (Boolean(SDL_GameControllerHasAxis(controller, j))) {
              (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes = i32((j + 1)));
            }
          }
          (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.validButtons = u32(0));
          (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons = i32(0));
          for (let j = i32(0); (j < i32(21)); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return next; })(cRef(() => j, __cxx_lvalue_7 => { j = __cxx_lvalue_7; }))) {
            if (Boolean(SDL_GameControllerHasButton(controller, j))) {
              (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons = i32((j + 1)));
              ((__cxx_lvalue_8) => (__cxx_lvalue_8.value = u32((__cxx_lvalue_8.value | u32(i32((1 << j)))))))(cObjectFieldRef(__cxx_global_cell_39a39d1bfab5e142a4f76536().value, "validButtons"));
            }
          }
        }
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.isGameController = u32(1));
        if ((i32(gameControllerDBLoaded) == i32(false))) {
          LoadSDLControllerDB();
        }
        xfree__header_8455ed0a4ad7(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pAxis);
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pAxis = cTypedPointer(xcalloc__header_fb596e059141(u64(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes), 4), Int32Array));
        do {
          xfree__header_8455ed0a4ad7(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pHat);
          (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pHat = null);
        } while (Boolean(0));
        (__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee().value = (u32((__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee().value | 4)) & 255));
        if (((i32(linked.major) > 2) || ((i32(linked.major) == 2) && ((i32(linked.minor) > 0) || ((i32(linked.minor) == 0) && (i32(linked.patch) >= 18)))))) {
          if (Boolean(SDL_GameControllerHasRumble(controller))) {
            (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.hasRumble = u32(1));
          } else {
            do {
              SILENCE_UNUSED__header_07304f9ee8ae(__cxx_literal_b7c123de31554a73a356, ((__cxx_lvalue_9) => cRef(() => __cxx_lvalue_9, () => { throw new TypeError("const C++ reference write"); }))(SDL_GetError()));
            } while (Boolean(0));
          }
        } else {
          if (((i32(linked.major) > 2) || ((i32(linked.major) == 2) && ((i32(linked.minor) > 0) || ((i32(linked.minor) == 0) && (i32(linked.patch) >= 9)))))) {
            if ((!Boolean(SDL_GameControllerRumble(controller, (u32(1) & 65535), (u32(1) & 65535), u32(1))))) {
              (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.hasRumble = u32(1));
            } else {
              do {
                SILENCE_UNUSED__header_07304f9ee8ae(__cxx_literal_04408b8231a8a4afdf16, ((__cxx_lvalue_10) => cRef(() => __cxx_lvalue_10, () => { throw new TypeError("const C++ reference write"); }))(SDL_GetError()));
              } while (Boolean(0));
            }
          }
        }
        return;
      }
    }
    for (let i = i32(0); (i < numjoysticks); ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = i32((previous + 1)); __cxx_lvalue_11.value = next; return previous; })(cRef(() => i, __cxx_lvalue_12 => { i = __cxx_lvalue_12; }))) {
      if ((joydev = SDL_JoystickOpen(i))) {
        ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_2b5588d8b3ab4e2a36fc, u32(1003), __cxx_literal_090dec87c606a5737033, SDL_JoystickNameForIndex(i)));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.flags = (u32((u32(0) & 255)) & 255));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes = i32((min__template_774131ccff66371d(((__cxx_lvalue_13) => cRef(() => __cxx_lvalue_13, () => { throw new TypeError("const C++ reference write"); }))(9), ((__cxx_lvalue_14) => cRef(() => __cxx_lvalue_14, () => { throw new TypeError("const C++ reference write"); }))(SDL_JoystickNumAxes(joydev)))).value));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numBalls = i32(SDL_JoystickNumBalls(joydev)));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons = i32((min__template_774131ccff66371d(((__cxx_lvalue_15) => cRef(() => __cxx_lvalue_15, () => { throw new TypeError("const C++ reference write"); }))(32), ((__cxx_lvalue_16) => cRef(() => __cxx_lvalue_16, () => { throw new TypeError("const C++ reference write"); }))(SDL_JoystickNumButtons(joydev)))).value));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats = i32((min__template_774131ccff66371d(((__cxx_lvalue_17) => cRef(() => __cxx_lvalue_17, () => { throw new TypeError("const C++ reference write"); }))(Math.trunc(i32((36 - __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons)) / 4)), ((__cxx_lvalue_18) => cRef(() => __cxx_lvalue_18, () => { throw new TypeError("const C++ reference write"); }))(SDL_JoystickNumHats(joydev)))).value));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.validButtons = u32(4294967295));
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.isGameController = u32(0));
        ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_0dcba7104046a9a2017b, u32(1015), __cxx_literal_1b234b1ede12fc8692cd, i32((i + 1)), __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes, __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons, __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats, __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numBalls));
        xfree__header_8455ed0a4ad7(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pAxis);
        (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pAxis = cTypedPointer(xcalloc__header_fb596e059141(u64(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes), 4), Int32Array));
        xfree__header_8455ed0a4ad7(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pHat);
        if (Boolean(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats)) {
          (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pHat = cTypedPointer(xcalloc__header_fb596e059141(u64(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats), 4), Int32Array));
        } else {
          (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pHat = null);
        }
        for (let j = i32(0); (j < __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats); ((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = i32((previous + 1)); __cxx_lvalue_19.value = next; return previous; })(cRef(() => j, __cxx_lvalue_20 => { j = __cxx_lvalue_20; }))) {
          ((cDeref(cPointerOffset(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pHat, j, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((-1)));
        }
        SDL_JoystickEventState(1);
        (__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee().value = (u32((__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee().value | 4)) & 255));
        if (((i32(linked.major) > 2) || ((i32(linked.major) == 2) && ((i32(linked.minor) > 0) || ((i32(linked.minor) == 0) && (i32(linked.patch) >= 18)))))) {
          if (Boolean(SDL_JoystickHasRumble(joydev))) {
            (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.hasRumble = u32(1));
          } else {
            do {
              SILENCE_UNUSED__header_25eb5216ac4d(__cxx_literal_e3080db9c670a04cae29, ((__cxx_lvalue_21) => cRef(() => __cxx_lvalue_21, () => { throw new TypeError("const C++ reference write"); }))(SDL_GetError()));
            } while (Boolean(0));
          }
        } else {
          if (((i32(linked.major) > 2) || ((i32(linked.major) == 2) && ((i32(linked.minor) > 0) || ((i32(linked.minor) == 0) && (i32(linked.patch) >= 9)))))) {
            if ((!Boolean(SDL_JoystickRumble(joydev, (u32(1) & 65535), (u32(1) & 65535), u32(1))))) {
              (__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.hasRumble = u32(1));
            } else {
              do {
                SILENCE_UNUSED__header_25eb5216ac4d(__cxx_literal_615fecdae0d06568a00f, ((__cxx_lvalue_22) => cRef(() => __cxx_lvalue_22, () => { throw new TypeError("const C++ reference write"); }))(SDL_GetError()));
              } while (Boolean(0));
            }
          }
        }
        return;
      }
    }
    ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_41f67853c0a88f939813, u32(1053), __cxx_literal_d508c2389be378b2639d));
  }
}

// C/C++ source: source/build/src/sdlayer.cpp:1060
const __cxx_literal_21aee7b05c0e94469c4a = Uint8Array.from([83, 68, 76, 95, 68, 73, 82, 69, 67, 84, 73, 78, 80, 85, 84, 95, 69, 78, 65, 66, 76, 69, 68, 0]);
const __cxx_literal_0ef98deb873372b055a2 = Uint8Array.from([48, 0]);
const __cxx_literal_f08bc0a0da54f57db31a = Uint8Array.from([83, 68, 76, 95, 88, 73, 78, 80, 85, 84, 95, 69, 78, 65, 66, 76, 69, 68, 0]);
const __cxx_literal_063132b8c7d4dd34bfa3 = Uint8Array.from([48, 0]);
const __cxx_literal_3cb3c4694b13fc9f7ca8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_44f0973a5e61c0c788e1 = Uint8Array.from([67, 111, 110, 116, 114, 111, 108, 108, 101, 114, 32, 115, 117, 112, 112, 111, 114, 116, 115, 32, 114, 117, 109, 98, 108, 101, 46, 0]);
export function initinput(hotplugCallback) {
  let i;
  if (hotplugCallback) {
    (__cxx_global_cell_98c8686ca508db9a2275a6f8().value = hotplugCallback);
  }
  (__cxx_global_cell_816e78cbc24a2eb6f3b7a4ee().value = (u32((u32(i32((1 | 2))) & 255)) & 255));
  (__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value = Boolean(false));
  memset(g_keyNameTable, 0, 6144);
  for ((i = i32((i32(512) - 1))); (i >= 0); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if ((!Boolean((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) {
      continue;
    }
    Bstrncpyz__header_bcf6245401e3((cPointerElementRef(g_keyNameTable, (cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)).value), SDL_GetKeyName(i32((i | i32((1 << 30))))), 24);
  }
  if ((i32((i32(__cxx_global_cell_d0cb64ef22766dce0c3d933d().value) & i32(1))) == 0)) {
    if (Boolean(i32((i32(__cxx_global_cell_d0cb64ef22766dce0c3d933d().value) & i32(2))))) {
      SDL_SetHint(__cxx_literal_21aee7b05c0e94469c4a, __cxx_literal_0ef98deb873372b055a2);
    }
    if (Boolean(i32((i32(__cxx_global_cell_d0cb64ef22766dce0c3d933d().value) & i32(4))))) {
      SDL_SetHint(__cxx_literal_f08bc0a0da54f57db31a, __cxx_literal_063132b8c7d4dd34bfa3);
    }
    if ((!Boolean(SDL_InitSubSystem(8192)))) {
      joyScanDevices();
    }
    if (((i32(linked.major) > 2) || ((i32(linked.major) == 2) && ((i32(linked.minor) > 0) || ((i32(linked.minor) == 0) && (i32(linked.patch) >= 9)))))) {
      if (Boolean(i32((i32(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.flags) & i32(2))))) {
        switch (i32((i32(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.flags) & i32(2)))) {
          case i32(2): {
            ((i32(5) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(5), __cxx_literal_3cb3c4694b13fc9f7ca8, u32(1126), __cxx_literal_44f0973a5e61c0c788e1));
          }
          break;
        }
      }
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:1140
export function uninitinput() {
  mouseUninit();
  if (controller) {
    SDL_GameControllerClose(controller);
    (controller = null);
  }
  if (joydev) {
    SDL_JoystickClose(joydev);
    (joydev = null);
  }
}

// C/C++ source: source/build/src/sdlayer.cpp:1160
let __static_joyGetName_tmp = new Uint8Array(64);
let __static_joyGetName_axisStrings = cPointerArray(7, () => [Uint8Array.from([76, 101, 102, 116, 32, 83, 116, 105, 99, 107, 32, 88, 45, 65, 120, 105, 115, 0]), Uint8Array.from([76, 101, 102, 116, 32, 83, 116, 105, 99, 107, 32, 89, 45, 65, 120, 105, 115, 0]), Uint8Array.from([82, 105, 103, 104, 116, 32, 83, 116, 105, 99, 107, 32, 88, 45, 65, 120, 105, 115, 0]), Uint8Array.from([82, 105, 103, 104, 116, 32, 83, 116, 105, 99, 107, 32, 89, 45, 65, 120, 105, 115, 0]), Uint8Array.from([76, 101, 102, 116, 32, 84, 114, 105, 103, 103, 101, 114, 0]), Uint8Array.from([82, 105, 103, 104, 116, 32, 84, 114, 105, 103, 103, 101, 114, 0]), null]);
const __cxx_literal_2ce16483e11603969f13 = Uint8Array.from([65, 120, 105, 115, 32, 37, 100, 0]);
let __static_joyGetName_buttonStrings = cPointerArray(22, () => [Uint8Array.from([65, 0]), Uint8Array.from([66, 0]), Uint8Array.from([88, 0]), Uint8Array.from([89, 0]), Uint8Array.from([66, 97, 99, 107, 0]), Uint8Array.from([71, 117, 105, 100, 101, 0]), Uint8Array.from([83, 116, 97, 114, 116, 0]), Uint8Array.from([76, 101, 102, 116, 32, 83, 116, 105, 99, 107, 0]), Uint8Array.from([82, 105, 103, 104, 116, 32, 83, 116, 105, 99, 107, 0]), Uint8Array.from([76, 101, 102, 116, 32, 83, 104, 111, 117, 108, 100, 101, 114, 0]), Uint8Array.from([82, 105, 103, 104, 116, 32, 83, 104, 111, 117, 108, 100, 101, 114, 0]), Uint8Array.from([68, 45, 80, 97, 100, 32, 85, 112, 0]), Uint8Array.from([68, 45, 80, 97, 100, 32, 68, 111, 119, 110, 0]), Uint8Array.from([68, 45, 80, 97, 100, 32, 76, 101, 102, 116, 0]), Uint8Array.from([68, 45, 80, 97, 100, 32, 82, 105, 103, 104, 116, 0]), Uint8Array.from([77, 105, 115, 99, 0]), Uint8Array.from([80, 97, 100, 100, 108, 101, 32, 49, 0]), Uint8Array.from([80, 97, 100, 100, 108, 101, 32, 50, 0]), Uint8Array.from([80, 97, 100, 100, 108, 101, 32, 51, 0]), Uint8Array.from([80, 97, 100, 100, 108, 101, 32, 52, 0]), Uint8Array.from([84, 111, 117, 99, 104, 112, 97, 100, 0]), null]);
const __cxx_literal_56b8cb2905fedb3e157a = Uint8Array.from([66, 117, 116, 116, 111, 110, 32, 37, 100, 0]);
const __cxx_literal_7abc4d4284cb4be21ab8 = Uint8Array.from([72, 97, 116, 32, 37, 100, 0]);
export function joyGetName(what, num) {

  switch (what) {
    case 0: {
      if ((u32(num) > u32(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes))) {
        return null;
      }
    }
    if (controller) {

      return ((i64(num) < i64((BigInt(i64(ARRAY_SIZE__header_a7771eb202e2(__static_joyGetName_axisStrings))) - BigInt(i64(1))))) ? (cPointerElementRef(__static_joyGetName_axisStrings, num).value) : SDL_GameControllerGetStringForAxis(num));
    }
    sprintf(__static_joyGetName_tmp, __cxx_literal_2ce16483e11603969f13, num);
    return cTypedPointer(__static_joyGetName_tmp, Uint8Array);
    case 1: {
      if ((u32(num) > u32(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons))) {
        return null;
      }
    }
    if (controller) {

      return ((i64(num) < i64((BigInt(i64(ARRAY_SIZE__header_c8618bd4f297(__static_joyGetName_buttonStrings))) - BigInt(i64(1))))) ? (cPointerElementRef(__static_joyGetName_buttonStrings, num).value) : SDL_GameControllerGetStringForButton(num));
    }
    sprintf(__static_joyGetName_tmp, __cxx_literal_56b8cb2905fedb3e157a, num);
    return cTypedPointer(__static_joyGetName_tmp, Uint8Array);
    case 2: {
      if ((u32(num) > u32(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats))) {
        return null;
      }
    }
    sprintf(__static_joyGetName_tmp, __cxx_literal_7abc4d4284cb4be21ab8, num);
    return cTypedPointer(__static_joyGetName_tmp, Uint8Array);
    default: {
      return null;
    }
  }
}

// C/C++ source: source/build/src/sdlayer.cpp:1246
export function mouseInit() {
  mouseGrabInput((__cxx_global_cell_489f4a2f5e930aaf72c81254().value = Boolean(__cxx_global_cell_f2b488870f755876d24f149d().value)));
}

// C/C++ source: source/build/src/sdlayer.cpp:1254
export function mouseUninit() {
  mouseGrabInput(Boolean(0));
  (__cxx_global_cell_489f4a2f5e930aaf72c81254().value = Boolean(Boolean(0)));
}

// C/C++ source: source/build/src/sdlayer.cpp:1277
export function grabmouse_low(a) {
  if (sdl_window) {
    SDL_SetWindowGrab(sdl_window, (Boolean(a) ? 1 : 0));
  }
  return (u32((u32(SDL_SetRelativeMouseMode((Boolean(a) ? 1 : 0))) & 255)) & 255);
}

// C/C++ source: source/build/src/sdlayer.cpp:1296
export function mouseGrabInput(grab) {
  if ((i32(grab) != i32(__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value))) {
    (__cxx_global_cell_52921ad2f7df0862590c48b4().value.x = i32((__cxx_global_cell_52921ad2f7df0862590c48b4().value.y = i32(0))));
  }
  if ((Boolean(appactive) && __cxx_global_cell_489f4a2f5e930aaf72c81254().value)) {
    if (((i32(grab) != i32(__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value)) && (!Boolean(grabmouse_low((u32(grab) & 255)))))) {
      (__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value = Boolean(grab));
    }
  } else {
    (__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value = Boolean(grab));
  }
}

// C/C++ source: source/build/src/sdlayer.cpp:1313
export function mouseLockToWindow(a) {
  if ((!Boolean(i32((i32(a) & 2))))) {
    mouseGrabInput(Boolean(a));
    (__cxx_global_cell_f2b488870f755876d24f149d().value = Boolean(__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value));
  }
  let newstate = i32(((__cxx_global_cell_5a97be12fac9e104b96ea90d().value && (Boolean(u32((cRecordObject(cRecordPointer(__cxx_global_cell_5a97be12fac9e104b96ea90d().value, {"align": 8, "arrayAlign": 8, "fields": {"cb": {"offset": 6384, "pointer": true, "size": 8}, "cvars": {"offset": 2256, "pointer": true, "size": 8}, "draw": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"cols": {"native": "Int32Array", "offset": 56, "size": 4}, "editpal": {"native": "Int32Array", "offset": 36, "size": 4}, "editshade": {"native": "Int32Array", "offset": 32, "size": 4}, "errfmtlen": {"native": "Int32Array", "offset": 64, "size": 4}, "errorfmt": {"offset": 0, "pointer": true, "size": 8}, "head": {"native": "Uint16Array", "offset": 60, "size": 2}, "highlight": {"offset": 16, "pointer": true, "size": 8}, "mode": {"native": "Int32Array", "offset": 48, "size": 4}, "promptpal": {"native": "Int32Array", "offset": 28, "size": 4}, "promptshade": {"native": "Int32Array", "offset": 24, "size": 4}, "rows": {"native": "Int32Array", "offset": 52, "size": 4}, "scrolling": {"native": "Int8Array", "offset": 62, "size": 1}, "textpal": {"native": "Int32Array", "offset": 44, "size": 4}, "textshade": {"native": "Int32Array", "offset": 40, "size": 4}, "warnfmt": {"offset": 8, "pointer": true, "size": 8}, "warnfmtlen": {"native": "Int32Array", "offset": 68, "size": 4}}, "overlaps": false, "projection": true, "size": 72, "union": false}, "offset": 2160}, "editor": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"buf": {"offset": 0, "pointer": true, "size": 8}, "end": {"native": "Int16Array", "offset": 22, "size": 2}, "len": {"native": "Int16Array", "offset": 16, "size": 2}, "pos": {"native": "Int16Array", "offset": 18, "size": 2}, "start": {"native": "Int16Array", "offset": 20, "size": 2}, "tmp": {"offset": 8, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 24, "union": false}, "offset": 64}, "execdepth": {"native": "Int32Array", "offset": 6372, "size": 4}, "flags": {"native": "Uint32Array", "offset": 2248, "size": 4}, "history": {"byteRecord": {"align": 8, "arrayAlign": 8, "fields": {"buf": {"dims": [256], "offset": 0, "pointerArray": true, "size": 2048}, "exec": {"native": "Int32Array", "offset": 2064, "size": 4}, "lines": {"native": "Int32Array", "offset": 2056, "size": 4}, "maxlines": {"native": "Int32Array", "offset": 2048, "size": 4}, "pos": {"native": "Int32Array", "offset": 2052, "size": 4}, "total": {"native": "Int32Array", "offset": 2060, "size": 4}}, "overlaps": false, "projection": true, "size": 2072, "union": false}, "offset": 88}, "keycode": {"native": "Int32Array", "offset": 6376, "size": 4}, "log": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"m_lineidx": {"native": "Uint32Array", "offset": 20, "size": 4}, "m_lines": {"offset": 0, "pointer": true, "size": 8}, "m_pending": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"m_head": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"_M_b": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"_M_p": {"offset": 0, "pointer": true, "size": 8}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 0}}, "overlaps": false, "projection": true, "size": 8, "union": false}, "offset": 8}, "maxerrors": {"native": "Int32Array", "offset": 24, "size": 4}, "mutex": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "projection": true, "size": 32, "union": false}, "offset": 0}, "numcvars": {"native": "Int32Array", "offset": 2252, "size": 4}, "numsymbols": {"native": "Int32Array", "offset": 6368, "size": 4}, "symbols": {"offset": 2264, "pointer": true, "size": 8}, "symbptrs": {"dims": [512], "offset": 2272, "pointerArray": true, "size": 4096}, "text": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"buf": {"offset": 0, "pointer": true, "size": 8}, "fmt": {"offset": 8, "pointer": true, "size": 8}, "lines": {"native": "Int32Array", "offset": 20, "size": 4}, "maxlines": {"native": "Int32Array", "offset": 24, "size": 4}, "pos": {"native": "Int32Array", "offset": 16, "size": 4}, "useclipboard": {"native": "Int32Array", "offset": 28, "size": 4}}, "overlaps": false, "projection": true, "size": 32, "union": false}, "offset": 32}, "version": {"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"buf": {"offset": 0, "pointer": true, "size": 8}, "len": {"native": "Uint8Array", "offset": 8, "size": 1}, "pal": {"native": "Uint8Array", "offset": 10, "size": 1}, "shade": {"native": "Uint8Array", "offset": 9, "size": 1}}, "overlaps": false, "projection": true, "size": 16, "union": false}, "offset": 2232}}, "overlaps": false, "projection": true, "size": 6392, "union": false})).flags & u32(4)))) || Boolean(i32((i32(g_ImGuiCapturedDevices) & 2))))) ? 1 : 0));
  SDL_ShowCursor(newstate);
}

// C/C++ source: source/build/src/sdlayer.cpp:1355
export function sortmodes(a_, b_) {
  let a = cRecordPointer(b_, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {});
  let b = cRecordPointer(a_, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {});
  let x;
  if (((x = i32((i32(cRecordObject(cRecordPointer(a, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).fs) - i32(cRecordObject(cRecordPointer(b, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).fs)))) != 0)) {
    return i32(x);
  }
  if (((x = i32((i32(cRecordObject(cRecordPointer(a, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).bpp) - i32(cRecordObject(cRecordPointer(b, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).bpp)))) != 0)) {
    return i32(x);
  }
  if (((x = i32((cRecordObject(cRecordPointer(a, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).xdim - cRecordObject(cRecordPointer(b, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).xdim))) != 0)) {
    return i32(x);
  }
  if (((x = i32((cRecordObject(cRecordPointer(a, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).ydim - cRecordObject(cRecordPointer(b, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {})).ydim))) != 0)) {
    return i32(x);
  }
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:1370
export let modeschecked = (u32((u32(0) & 255)) & 255);
function __cxx_static_address_3c52322206130a3fcc904774() {
  return __cxx_static_address_3c52322206130a3fcc904774.reference || (__cxx_static_address_3c52322206130a3fcc904774.reference = {
    __cReference: true,
    get value() { return modeschecked; },
    set value(__cxx_lvalue_0) { modeschecked = (u32(__cxx_lvalue_0) & 255); }
  });
}
export function __cxx_private_cell_3c52322206130a3fcc904774() { return __cxx_static_address_3c52322206130a3fcc904774(); }

// C/C++ source: source/build/src/sdlayer.cpp:1373
const __cxx_literal_f7453abc61e02ab37d4c = Uint8Array.from([40, 0]);
const __cxx_literal_0058344bb088f4b635f9 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_a292f564a17ee6c4d832 = Uint8Array.from([68, 101, 116, 101, 99, 116, 105, 110, 103, 32, 118, 105, 100, 101, 111, 32, 109, 111, 100, 101, 115, 32, 102, 111, 114, 32, 100, 105, 115, 112, 108, 97, 121, 32, 37, 100, 32, 40, 37, 115, 41, 46, 46, 46, 0]);
const __cxx_literal_b47288dc6fe02a47a2bb = Uint8Array.from([78, 111, 32, 102, 117, 108, 108, 115, 99, 114, 101, 101, 110, 32, 109, 111, 100, 101, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 33, 10, 0]);
export function videoGetModes(display) {
  let dummy = null;
  const __cxx_lvalue_0 = cRef(() => dummy, __cxx_lvalue_1 => { dummy = __cxx_lvalue_1; });
  let i;
  let maxx = i32(0);
  let maxy = i32(0);
  let dispmode = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"driverdata": {"offset": 16, "pointer": true, "size": 8}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "h": {"native": "Int32Array", "offset": 8, "size": 4}, "refresh_rate": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 24, "union": false}}, {});
  if (((display < 0) || (display >= __cxx_global_cell_9fad9f5c6a95d4e89a1de80a().value))) {
    (display = i32(((__cxx_global_cell_a69b3d47547d48eac82bcf95().value < SDL_GetNumVideoDisplays()) ? __cxx_global_cell_a69b3d47547d48eac82bcf95().value : 0)));
  }
  if ((Boolean(modeschecked) || Boolean(novideo))) {
    return;
  } else {
    let name = xstrdup__header_96c3f6dd42f5(videoGetDisplayName(display));
    let shortened = Bstrtoken(name, __cxx_literal_f7453abc61e02ab37d4c, __cxx_lvalue_0, 1);
    if ((!shortened)) {
      (shortened = name);
    }
    ((i32(2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(2), __cxx_literal_0058344bb088f4b635f9, u32(1388), __cxx_literal_a292f564a17ee6c4d832, display, shortened));
    do {
      xfree__header_8455ed0a4ad7(name);
      (name = null);
    } while (Boolean(0));
  }
  (__cxx_global_cell_959ecb0f89b58217d69a30a7().value = i32(0));
  for ((i = i32(0)); (i < SDL_GetNumDisplayModes(display)); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    SDL_GetDisplayMode(display, i, dispmode);
    if (((!(((((dispmode.w < 10240) && (dispmode.h < 4320)) && (dispmode.w >= 640)) && (dispmode.h >= 480)) && (Math.fround((Math.fround(Math.fround(dispmode.w)) / Math.fround(Math.fround(dispmode.h)))) >= Math.fround(1.20000005)))) || (Boolean(maxrefreshfreq) && (dispmode.refresh_rate > maxrefreshfreq)))) {
      continue;
    }
    {
      let fullscreen;
      for ((fullscreen = i32(1)); (fullscreen >= 0); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return next; })(cRef(() => fullscreen, __cxx_lvalue_5 => { fullscreen = __cxx_lvalue_5; }))) {
        if ((__cxx_global_cell_959ecb0f89b58217d69a30a7().value < 256)) {
          let mn;
          for ((mn = i32(0)); (mn < __cxx_global_cell_959ecb0f89b58217d69a30a7().value); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous + 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => mn, __cxx_lvalue_7 => { mn = __cxx_lvalue_7; }))) {
            if ((((((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).xdim == dispmode.w) && ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).ydim == dispmode.h)) && (i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).bpp) == 8)) && (i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).fs) == fullscreen))) {
              break;
            }
          }
          if ((mn == __cxx_global_cell_959ecb0f89b58217d69a30a7().value)) {
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).xdim = i32(dispmode.w));
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).ydim = i32(dispmode.h));
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).bpp = (u32((u32(8) & 255)) & 255));
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).fs = (u32((u32(fullscreen) & 255)) & 255));
            ((__cxx_lvalue_8) => { const previous = __cxx_lvalue_8.value; const next = i32((previous + 1)); __cxx_lvalue_8.value = next; return previous; })(__cxx_global_cell_959ecb0f89b58217d69a30a7());
          }
        }
      }
    }
    ;
    if (((dispmode.w > maxx) || (dispmode.h > maxy))) {
      (maxx = i32(dispmode.w));
      (maxy = i32(dispmode.h));
    }
  }
  if (((maxx == 0) && (maxy == 0))) {
    initprintf(__cxx_literal_b47288dc6fe02a47a2bb);
    (maxx = i32(10240));
    (maxy = i32(4320));
  }
  ;
  SDL_GetDisplayMode(display, 0, dispmode);
  for ((i = i32(0)); Boolean((cPointerElementRef(g_defaultVideoModes__header_global_a19ca09ee2b13510, i).value).x); ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = i32((previous + 1)); __cxx_lvalue_9.value = next; return previous; })(cRef(() => i, __cxx_lvalue_10 => { i = __cxx_lvalue_10; }))) {
    let mode = (cPointerElementRef(g_defaultVideoModes__header_global_a19ca09ee2b13510, i).value);
    if ((((mode.x > dispmode.w) || (mode.y > dispmode.h)) || (!(((((mode.x < 10240) && (mode.y < 4320)) && (mode.x >= 640)) && (mode.y >= 480)) && (Math.fround((Math.fround(Math.fround(mode.x)) / Math.fround(Math.fround(mode.y)))) >= Math.fround(1.20000005)))))) {
      continue;
    }
    {
      let fullscreen;
      for ((fullscreen = i32(0)); (fullscreen >= 0); ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = i32((previous - 1)); __cxx_lvalue_11.value = next; return next; })(cRef(() => fullscreen, __cxx_lvalue_12 => { fullscreen = __cxx_lvalue_12; }))) {
        if ((__cxx_global_cell_959ecb0f89b58217d69a30a7().value < 256)) {
          let mn;
          for ((mn = i32(0)); (mn < __cxx_global_cell_959ecb0f89b58217d69a30a7().value); ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = i32((previous + 1)); __cxx_lvalue_13.value = next; return previous; })(cRef(() => mn, __cxx_lvalue_14 => { mn = __cxx_lvalue_14; }))) {
            if ((((((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).xdim == mode.x) && ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).ydim == mode.y)) && (i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).bpp) == 8)) && (i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), mn).value).fs) == fullscreen))) {
              break;
            }
          }
          if ((mn == __cxx_global_cell_959ecb0f89b58217d69a30a7().value)) {
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).xdim = i32(mode.x));
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).ydim = i32(mode.y));
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).bpp = (u32((u32(8) & 255)) & 255));
            ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), __cxx_global_cell_959ecb0f89b58217d69a30a7().value).value).fs = (u32((u32(fullscreen) & 255)) & 255));
            ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = i32((previous + 1)); __cxx_lvalue_15.value = next; return previous; })(__cxx_global_cell_959ecb0f89b58217d69a30a7());
          }
        }
      }
    }
    ;
  }
  qsort(validmode, u64(__cxx_global_cell_959ecb0f89b58217d69a30a7().value), 16, sortmodes);
  (modeschecked = (u32((u32(1) & 255)) & 255));
}

// C/C++ source: source/build/src/sdlayer.cpp:1450
export function videoCheckMode(x, y, c, fs, forced) {
  let i;
  let nearest = i32((-1));
  let dx;
  let dy;
  let odx = i32(9999);
  let ody = i32(9999);
  videoGetModes((-1));
  if ((c > 8)) {
    return i32((-1));
  }
  ((cDeref(x, Int32Array).value) = i32(clamp__header_3b54a66910be(i32(((cDeref(x, Int32Array).value) & (~1))), 320, 10240)));
  ((cDeref(y, Int32Array).value) = i32(clamp__header_3b54a66910be(i32(((cDeref(y, Int32Array).value) & (~1))), 200, 4320)));
  for ((i = i32(0)); (i < __cxx_global_cell_959ecb0f89b58217d69a30a7().value); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    if (((i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).bpp) != c) || (i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).fs) != fs))) {
      continue;
    }
    (dx = i32(klabs__header_915012986000(i32(((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).xdim - (cDeref(x, Int32Array).value))))));
    (dy = i32(klabs__header_915012986000(i32(((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), i).value).ydim - (cDeref(y, Int32Array).value))))));
    if ((!Boolean(i32((dx | dy))))) {
      (nearest = i32(i));
      break;
    }
    if (((dx <= odx) && (dy <= ody))) {
      (nearest = i32(i));
      (odx = i32(dx));
      (ody = i32(dy));
    }
  }
  if ((((!Boolean(forced)) && (i32((fs & 1)) == 0)) && ((nearest < 0) || (((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), nearest).value).xdim != (cDeref(x, Int32Array).value)) || ((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), nearest).value).ydim != (cDeref(y, Int32Array).value)))))) {
    return i32(2147483647n);
  }
  if ((nearest < 0)) {
    return i32((-1));
  }
  ((cDeref(x, Int32Array).value) = i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), nearest).value).xdim));
  ((cDeref(y, Int32Array).value) = i32((cPointerElementRef(cRecordPointer(validmode, {"align": 4, "arrayAlign": 1, "fields": {"bpp": {"native": "Uint8Array", "offset": 8, "size": 1}, "extra": {"native": "Int32Array", "offset": 12, "size": 4}, "filler": {"length": 2, "native": "Uint8Array", "offset": 10, "size": 2}, "fs": {"native": "Uint8Array", "offset": 9, "size": 1}, "xdim": {"native": "Int32Array", "offset": 0, "size": 4}, "ydim": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, {}), nearest).value).ydim));
  return i32(nearest);
}

// C/C++ source: source/build/src/sdlayer.cpp:1504
export function videoGetDisplayName(display) {
  return SDL_GetDisplayName(display);
}

// C/C++ source: source/build/src/sdlayer.cpp:1514
export function destroy_window_resources() {
  if (sdl_window) {
    SDL_DestroyWindow(sdl_window);
  }
  (sdl_window = null);
}

// C/C++ source: source/build/src/sdlayer.cpp:1545
export let g_ImGuiFrameActive = false;
export function __cxx_global_cell_5cb269532aae3035c2189ab8() {
  return __cxx_global_cell_5cb269532aae3035c2189ab8.reference || (__cxx_global_cell_5cb269532aae3035c2189ab8.reference = {
    __cReference: true,
    get value() { return g_ImGuiFrameActive; },
    set value(__cxx_lvalue_0) { g_ImGuiFrameActive = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:1571
export function engineBeginImGuiInput() {
  keyFlushChars();
  keyFlushScans();
  SDL_StartTextInput();
}

// C/C++ source: source/build/src/sdlayer.cpp:1627
export function setvideomode_sdlcommon(x, y, c, fs, regrab) {
  if (((((((__cxx_global_cell_a69b3d47547d48eac82bcf95().value == __cxx_global_cell_1593acb7552d6b6c91fb2a4b().value) && (fs == fullscreen)) && ((cDeref(x, Int32Array).value) == xres)) && ((cDeref(y, Int32Array).value) == yres)) && (c == bpp)) && (!Boolean(videomodereset)))) {
    return i32(0);
  }
  if ((videoCheckMode(x, y, c, fs, 0) < 0)) {
    return i32((-1));
  }
  startwin_close();
  if (__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value) {
    ((cDeref(regrab, Int32Array).value) = i32(1));
    mouseGrabInput(Boolean(0));
  }
  while (Boolean(lockcount)) {
    videoEndDrawing();
  }
  {
    softsurface_destroy();
  }
  ((cDeref(cPointerOffset(lastvidgcb, 0, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) = Math.fround(((cDeref(cPointerOffset(lastvidgcb, 1, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) = Math.fround(Math.fround(0)))));
  return i32(1);
}

// C/C++ source: source/build/src/sdlayer.cpp:1675
const __cxx_literal_6e18e956364af4834d97 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_3941a190d8dc2adf51ea = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 113, 117, 101, 114, 121, 32, 100, 101, 115, 107, 116, 111, 112, 32, 100, 105, 115, 112, 108, 97, 121, 32, 109, 111, 100, 101, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_72a90df0ff0ccc8e4aba = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_43f0321cefd6961533ab = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 102, 105, 110, 100, 32, 97, 32, 102, 117, 108, 108, 115, 99, 114, 101, 101, 110, 32, 118, 105, 100, 101, 111, 32, 109, 111, 100, 101, 32, 115, 117, 105, 116, 97, 98, 108, 101, 32, 102, 111, 114, 32, 111, 114, 32, 115, 105, 109, 105, 108, 97, 114, 32, 116, 111, 32, 37, 100, 120, 37, 100, 32, 97, 116, 32, 37, 100, 72, 122, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_b110da84ccca1837af37 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_c527c0aaf9b32207fd67 = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 115, 101, 116, 32, 118, 105, 100, 101, 111, 32, 109, 111, 100, 101, 58, 32, 37, 115, 46, 0]);
let __static_setvideomode_sdlcommonpost_lastrefreshfreq = 0;
const __cxx_literal_e71a812980a2d2a3e87f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_8c9bc437386030db9c68 = Uint8Array.from([82, 101, 102, 114, 101, 115, 104, 32, 114, 97, 116, 101, 58, 32, 37, 46, 50, 102, 72, 122, 46, 0]);
const __cxx_literal_52bdbf5565973bd5f2be = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_8669cc291e81155cad5b = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 115, 101, 116, 32, 119, 105, 110, 100, 111, 119, 32, 102, 117, 108, 108, 115, 99, 114, 101, 101, 110, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_117c72577d6168b3d9ac = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_663066ad007261d4771f = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 115, 101, 116, 32, 119, 105, 110, 100, 111, 119, 101, 100, 32, 109, 111, 100, 101, 58, 32, 37, 115, 46, 0]);
export function setvideomode_sdlcommonpost(x, y, c, fs, regrab) {
  wm_setapptitle(apptitle);
  (xres = i32(x));
  (yres = i32(y));
  (bpp = i32(c));
  (fullscreen = i32(fs));
  (__cxx_global_cell_e7587e075f0e1bcf83dd9001().value = i32(((c > 8) ? 2 : 1)));
  (frameplace = i64(0));
  (lockcount = i32(0));
  (modechange = (u32((u32(1) & 255)) & 255));
  (videomodereset = (u32((u32(0) & 255)) & 255));
  if ((!Boolean(__cxx_global_cell_a8e62b4a4ba82cd2a9215fe2().value))) {
    if (Boolean(1)) {
      if ((SDL_GetWindowGammaRamp(sdl_window, (cPointerElementRef(sysgamma, 0).value), (cPointerElementRef(sysgamma, 1).value), (cPointerElementRef(sysgamma, 2).value)) == 0)) {
        (__cxx_global_cell_a8e62b4a4ba82cd2a9215fe2().value = i32(1));
      }
      if ((Boolean(__cxx_global_cell_a8e62b4a4ba82cd2a9215fe2().value) && (videoSetGamma() < 0))) {
        (__cxx_global_cell_a8e62b4a4ba82cd2a9215fe2().value = i32(0));
      }
    } else {
      (__cxx_global_cell_a8e62b4a4ba82cd2a9215fe2().value = i32(1));
    }
  }
  let displayindex = i32(SDL_GetWindowDisplayIndex(sdl_window));
  let newdisplayindex = i32(((__cxx_global_cell_a69b3d47547d48eac82bcf95().value < SDL_GetNumVideoDisplays()) ? __cxx_global_cell_a69b3d47547d48eac82bcf95().value : displayindex));
  let desktopmode = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"driverdata": {"offset": 16, "pointer": true, "size": 8}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "h": {"native": "Int32Array", "offset": 8, "size": 4}, "refresh_rate": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 24, "union": false}}, {});
  if (Boolean(SDL_GetDesktopDisplayMode(newdisplayindex, desktopmode))) {
    ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_6e18e956364af4834d97, u32(1723), __cxx_literal_3941a190d8dc2adf51ea, SDL_GetError()));
    return i32((-1));
  }
  if ((((((displayindex != newdisplayindex) || (i32((__cxx_global_cell_b9268bcd54dec167c4a7cf60().value.x + x)) < 0)) || (i32((__cxx_global_cell_b9268bcd54dec167c4a7cf60().value.y + y)) < 0)) || (__cxx_global_cell_b9268bcd54dec167c4a7cf60().value.x > desktopmode.w)) || (__cxx_global_cell_b9268bcd54dec167c4a7cf60().value.y > desktopmode.h))) {
    (__cxx_global_cell_e262794d9997adc8dcfb5b2d().value = Boolean(false));
  }
  (refreshfreq = desktopmode.refresh_rate);
  let matchedResolution = i32(((desktopmode.w == x) && (desktopmode.h == y)));
  let borderless = i32((((__cxx_global_cell_67da6fc124c3ab1d5da4a606().value == 1) || ((__cxx_global_cell_67da6fc124c3ab1d5da4a606().value == 2) && Boolean(matchedResolution))) ? i32(16) : 0));
  if (Boolean(fs)) {
    let dispmode = cInitByteRecord({"align": 8, "arrayAlign": 1, "fields": {"driverdata": {"offset": 16, "pointer": true, "size": 8}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "h": {"native": "Int32Array", "offset": 8, "size": 4}, "refresh_rate": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 24, "union": false}, {"format": u32(0), "w": x, "h": y, "refresh_rate": maxrefreshfreq, "driverdata": null}, null, {});
    let newmode = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"driverdata": {"offset": 16, "pointer": true, "size": 8}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "h": {"native": "Int32Array", "offset": 8, "size": 4}, "refresh_rate": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 24, "union": false}}, {});
    if (cPointerCompare(SDL_GetClosestDisplayMode(newdisplayindex, dispmode, newmode), null, "==")) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_72a90df0ff0ccc8e4aba, u32(1746), __cxx_literal_43f0321cefd6961533ab, x, y, maxrefreshfreq, SDL_GetError()));
      return i32((-1));
    } else {
      if (Boolean(SDL_SetWindowDisplayMode(sdl_window, newmode))) {
        ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_b110da84ccca1837af37, u32(1753), __cxx_literal_c527c0aaf9b32207fd67, SDL_GetError()));
        return i32((-1));
      } else {
        (refreshfreq = newmode.refresh_rate);
      }
    }
  }

  if ((refreshfreq != __static_setvideomode_sdlcommonpost_lastrefreshfreq)) {
    ((i32(2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(2), __cxx_literal_e71a812980a2d2a3e87f, u32(1765), __cxx_literal_8c9bc437386030db9c68, refreshfreq));
    (__static_setvideomode_sdlcommonpost_lastrefreshfreq = refreshfreq);
  }
  SDL_SetWindowSize(sdl_window, x, y);
  if (Boolean(fs)) {
    if (Boolean(SDL_SetWindowFullscreen(sdl_window, u32(1)))) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_52bdbf5565973bd5f2be, u32(1775), __cxx_literal_8669cc291e81155cad5b, SDL_GetError()));
      return i32((-1));
    } else {
      SDL_SetWindowPosition(sdl_window, i32(u32((536805376 | u32(newdisplayindex)))), i32(u32((536805376 | u32(newdisplayindex)))));
    }
  } else {
    if (Boolean(SDL_SetWindowFullscreen(sdl_window, u32(0)))) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_117c72577d6168b3d9ac, u32(1784), __cxx_literal_663066ad007261d4771f, SDL_GetError()));
      return i32((-1));
    } else {
      SDL_SetWindowBordered(sdl_window, (Boolean(borderless) ? 0 : 1));
      SDL_SetWindowPosition(sdl_window, (__cxx_global_cell_e262794d9997adc8dcfb5b2d().value ? __cxx_global_cell_b9268bcd54dec167c4a7cf60().value.x : i32(u32((805240832 | u32(newdisplayindex))))), (__cxx_global_cell_e262794d9997adc8dcfb5b2d().value ? __cxx_global_cell_b9268bcd54dec167c4a7cf60().value.y : i32(u32((805240832 | u32(newdisplayindex))))));
    }
  }
  SDL_FlushEvent(u32(512));
  videoFadePalette((u32(__cxx_global_cell_226fe25bac1ac7d5f7db4e7a().value.r) & 255), (u32(__cxx_global_cell_226fe25bac1ac7d5f7db4e7a().value.g) & 255), (u32(__cxx_global_cell_226fe25bac1ac7d5f7db4e7a().value.b) & 255), (u32(__cxx_global_cell_fba044f5949b228db52cb0a4().value) & 255));
  if (Boolean(regrab)) {
    mouseGrabInput(__cxx_global_cell_f2b488870f755876d24f149d().value);
  }
  (__cxx_global_cell_1593acb7552d6b6c91fb2a4b().value = i32(newdisplayindex));
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:1811
const __cxx_literal_31dbc6eca31915fa6a3f = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_6933a745358527a32310 = Uint8Array.from([83, 101, 116, 116, 105, 110, 103, 32, 118, 105, 100, 101, 111, 32, 109, 111, 100, 101, 32, 37, 100, 120, 37, 100, 32, 40, 37, 100, 45, 98, 112, 112, 32, 37, 115, 41, 46, 0]);
const __cxx_literal_d0aeaa30b3099322ea0d = Uint8Array.from([102, 117, 108, 108, 115, 99, 114, 101, 101, 110, 0]);
const __cxx_literal_e1e8855c18b56dcdfdad = Uint8Array.from([119, 105, 110, 100, 111, 119, 101, 100, 0]);
const __cxx_literal_759f14a8ac25454ae6f8 = Uint8Array.from([0]);
const __cxx_literal_22162c307add785171b6 = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 115, 101, 116, 32, 118, 105, 100, 101, 111, 32, 109, 111, 100, 101, 58, 32, 83, 68, 76, 95, 67, 114, 101, 97, 116, 101, 87, 105, 110, 100, 111, 119, 32, 102, 97, 105, 108, 101, 100, 58, 32, 37, 115, 10, 0]);
const __cxx_literal_27bf7c03e1bec8a7f605 = Uint8Array.from([85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 115, 101, 116, 32, 118, 105, 100, 101, 111, 32, 109, 111, 100, 101, 58, 32, 83, 68, 76, 95, 71, 101, 116, 87, 105, 110, 100, 111, 119, 83, 117, 114, 102, 97, 99, 101, 32, 102, 97, 105, 108, 101, 100, 58, 32, 37, 115, 10, 0]);
export function videoSetMode(x, y, c, fs) {
  const __cxx_lvalue_0 = cRef(() => x, __cxx_lvalue_4 => { x = i32(__cxx_lvalue_4); });
  const __cxx_lvalue_1 = cRef(() => y, __cxx_lvalue_5 => { y = i32(__cxx_lvalue_5); });
  let regrab = i32(0);
  const __cxx_lvalue_2 = cRef(() => regrab, __cxx_lvalue_3 => { regrab = i32(__cxx_lvalue_3); });
  let ret;
  (ret = i32(setvideomode_sdlcommon(__cxx_lvalue_0, __cxx_lvalue_1, c, fs, __cxx_lvalue_2)));
  if ((ret != 1)) {
    if ((ret == 0)) {
      if (Boolean(setvideomode_sdlcommonpost(x, y, c, fs, regrab))) {
        return i32((-1));
      }
    }
    return i32(ret);
  }
  ((i32(2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(2), __cxx_literal_31dbc6eca31915fa6a3f, u32(1827), __cxx_literal_6933a745358527a32310, x, y, c, (Boolean(i32((fs & 1))) ? __cxx_literal_d0aeaa30b3099322ea0d : __cxx_literal_e1e8855c18b56dcdfdad)));
  if (sdl_window) {
    return i32(setvideomode_sdlcommonpost(x, y, c, fs, regrab));
  }
  let display = i32(((__cxx_global_cell_a69b3d47547d48eac82bcf95().value < SDL_GetNumVideoDisplays()) ? __cxx_global_cell_a69b3d47547d48eac82bcf95().value : 0));
  let desktopmode = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"driverdata": {"offset": 16, "pointer": true, "size": 8}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "h": {"native": "Int32Array", "offset": 8, "size": 4}, "refresh_rate": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 24, "union": false}}, {});
  SDL_GetDesktopDisplayMode(display, desktopmode);
  let matchedResolution = i32(((desktopmode.w == x) && (desktopmode.h == y)));
  let borderless = i32((((__cxx_global_cell_67da6fc124c3ab1d5da4a606().value == 1) || ((__cxx_global_cell_67da6fc124c3ab1d5da4a606().value == 2) && Boolean(matchedResolution))) ? i32(16) : 0));
  {
    (sdl_window = SDL_CreateWindow(__cxx_literal_759f14a8ac25454ae6f8, (__cxx_global_cell_e262794d9997adc8dcfb5b2d().value ? __cxx_global_cell_b9268bcd54dec167c4a7cf60().value.x : i32(u32((805240832 | u32(display))))), (__cxx_global_cell_e262794d9997adc8dcfb5b2d().value ? __cxx_global_cell_b9268bcd54dec167c4a7cf60().value.y : i32(u32((805240832 | u32(display))))), x, y, u32(i32((i32(32) | borderless)))));
    if ((!sdl_window)) {
      initprintf(__cxx_literal_22162c307add785171b6, SDL_GetError());
      destroy_window_resources();
      return i32((-1));
    }
    ;
    (sdl_surface = SDL_GetWindowSurface(sdl_window));
    if ((!sdl_surface)) {
      initprintf(__cxx_literal_27bf7c03e1bec8a7f605, SDL_GetError());
      destroy_window_resources();
      return i32((-1));
    }
    ;
  }
  setvideomode_sdlcommonpost(x, y, c, fs, regrab);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:1942
export function videoResetMode() {
  (videomodereset = (u32((u32(1) & 255)) & 255));
  (modeschecked = (u32((u32(0) & 255)) & 255));
}

// C/C++ source: source/build/src/sdlayer.cpp:1957
let __static_videoBeginDrawing_backupFrameplace = i64(0);
export function videoBeginDrawing() {
  if ((bpp > 8)) {
    if (Boolean(offscreenrendering)) {
      return;
    }
    (frameplace = i64(0));
    (bytesperline = i32(0));
    (modechange = (u32((u32(0) & 255)) & 255));
    return;
  }
  if ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_82b1d07c07b2d44b437f8e68()) > 0)) {
    return;
  }

  if (Boolean(__cxx_global_cell_9541123d8c6d2c52896ac26a().value)) {
    if (Boolean(offscreenrendering)) {
      if ((!Boolean(__static_videoBeginDrawing_backupFrameplace))) {
        (__static_videoBeginDrawing_backupFrameplace = i64(frameplace));
      } else {
        if (((frameplace != i64(cSourceAddresses.encode(__cxx_global_cell_96cc27380f17556df4ccc300().value))) && (frameplace != __static_videoBeginDrawing_backupFrameplace))) {
          return;
        }
      }
    }
    (frameplace = i64(cSourceAddresses.encode(__cxx_global_cell_96cc27380f17556df4ccc300().value)));
    if (Boolean(offscreenrendering)) {
      return;
    }
  } else {
    if (Boolean(offscreenrendering)) {
      if (Boolean(__static_videoBeginDrawing_backupFrameplace)) {
        (frameplace = i64(__static_videoBeginDrawing_backupFrameplace));
        (__static_videoBeginDrawing_backupFrameplace = i64(0));
      }
      return;
    } else {
      (frameplace = i64(cSourceAddresses.encode(softsurface_getBuffer())));
    }
  }
  if (Boolean(modechange)) {
    (bytesperline = i32(__cxx_global_cell_22f848239c12c0d9f2b6f9e3().value));
    calc_ylookup(bytesperline, __cxx_global_cell_ce636929c03d679219ea2982().value);
    (modechange = (u32((u32(0) & 255)) & 255));
  }
}

// C/C++ source: source/build/src/sdlayer.cpp:2029
export function videoEndDrawing() {
  if ((bpp > 8)) {
    if ((!Boolean(offscreenrendering))) {
      (frameplace = i64(0));
    }
    return;
  }
  if ((!Boolean(frameplace))) {
    return;
  }
  if ((lockcount > 1)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_82b1d07c07b2d44b437f8e68());
    return;
  }
  if ((!Boolean(offscreenrendering))) {
    (frameplace = i64(0));
  }
  if ((lockcount == 0)) {
    return;
  }
  (lockcount = i32(0));
}

// C/C++ source: source/build/src/sdlayer.cpp:2051
const __cxx_literal_add6192bf22d88d3c038 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_e088e1638437dd4c0ccd = Uint8Array.from([70, 114, 97, 109, 101, 32, 119, 97, 115, 32, 115, 116, 105, 108, 108, 32, 108, 111, 99, 107, 101, 100, 32, 97, 116, 32, 97, 32, 100, 101, 112, 116, 104, 32, 111, 102, 32, 37, 100, 32, 119, 104, 101, 110, 32, 118, 105, 100, 101, 111, 83, 104, 111, 119, 70, 114, 97, 109, 101, 40, 41, 32, 119, 97, 115, 32, 99, 97, 108, 108, 101, 100, 33, 0]);
export function videoShowFrame(w) {
  (w = i32(w));
  if ((Boolean(sdl_resize.x) || Boolean(sdl_minimized))) {
    return;
  }
  if (Boolean(offscreenrendering)) {
    return;
  }
  if (Boolean(lockcount)) {
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_add6192bf22d88d3c038, u32(2181), __cxx_literal_e088e1638437dd4c0ccd, lockcount));
    while (Boolean(lockcount)) {
      videoEndDrawing();
    }
  }
  if ((u32((cRecordObject(cRecordPointer(sdl_surface, {"align": 8, "arrayAlign": 1, "fields": {"clip_rect": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"h": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 8, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 64}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "format": {"offset": 8, "pointer": true, "size": 8}, "h": {"native": "Int32Array", "offset": 20, "size": 4}, "list_blitmap": {"offset": 56, "pointer": true, "size": 8}, "locked": {"native": "Int32Array", "offset": 48, "size": 4}, "map": {"offset": 80, "pointer": true, "size": 8}, "pitch": {"native": "Int32Array", "offset": 24, "size": 4}, "pixels": {"offset": 32, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 88, "size": 4}, "userdata": {"offset": 40, "pointer": true, "size": 8}, "w": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 96, "union": false}, {})).flags & u32(2))) != u32(0))) {
    SDL_LockSurface(sdl_surface);
  }
  softsurface_blitBuffer(cTypedPointer(cRecordObject(cRecordPointer(sdl_surface, {"align": 8, "arrayAlign": 1, "fields": {"clip_rect": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"h": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 8, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 64}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "format": {"offset": 8, "pointer": true, "size": 8}, "h": {"native": "Int32Array", "offset": 20, "size": 4}, "list_blitmap": {"offset": 56, "pointer": true, "size": 8}, "locked": {"native": "Int32Array", "offset": 48, "size": 4}, "map": {"offset": 80, "pointer": true, "size": 8}, "pitch": {"native": "Int32Array", "offset": 24, "size": 4}, "pixels": {"offset": 32, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 88, "size": 4}, "userdata": {"offset": 40, "pointer": true, "size": 8}, "w": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 96, "union": false}, {})).pixels, Uint32Array), u32(cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(sdl_surface, {"align": 8, "arrayAlign": 1, "fields": {"clip_rect": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"h": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 8, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 64}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "format": {"offset": 8, "pointer": true, "size": 8}, "h": {"native": "Int32Array", "offset": 20, "size": 4}, "list_blitmap": {"offset": 56, "pointer": true, "size": 8}, "locked": {"native": "Int32Array", "offset": 48, "size": 4}, "map": {"offset": 80, "pointer": true, "size": 8}, "pitch": {"native": "Int32Array", "offset": 24, "size": 4}, "pixels": {"offset": 32, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 88, "size": 4}, "userdata": {"offset": 40, "pointer": true, "size": 8}, "w": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 96, "union": false}, {})).format, {"align": 8, "arrayAlign": 1, "fields": {"Aloss": {"native": "Uint8Array", "offset": 39, "size": 1}, "Amask": {"native": "Uint32Array", "offset": 32, "size": 4}, "Ashift": {"native": "Uint8Array", "offset": 43, "size": 1}, "BitsPerPixel": {"native": "Uint8Array", "offset": 16, "size": 1}, "Bloss": {"native": "Uint8Array", "offset": 38, "size": 1}, "Bmask": {"native": "Uint32Array", "offset": 28, "size": 4}, "Bshift": {"native": "Uint8Array", "offset": 42, "size": 1}, "BytesPerPixel": {"native": "Uint8Array", "offset": 17, "size": 1}, "Gloss": {"native": "Uint8Array", "offset": 37, "size": 1}, "Gmask": {"native": "Uint32Array", "offset": 24, "size": 4}, "Gshift": {"native": "Uint8Array", "offset": 41, "size": 1}, "Rloss": {"native": "Uint8Array", "offset": 36, "size": 1}, "Rmask": {"native": "Uint32Array", "offset": 20, "size": 4}, "Rshift": {"native": "Uint8Array", "offset": 40, "size": 1}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "next": {"offset": 48, "pointer": true, "size": 8}, "padding": {"length": 2, "native": "Uint8Array", "offset": 18, "size": 2}, "palette": {"offset": 8, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 44, "size": 4}}, "overlaps": false, "size": 56, "union": false}, {})).BitsPerPixel));
  if ((u32((cRecordObject(cRecordPointer(sdl_surface, {"align": 8, "arrayAlign": 1, "fields": {"clip_rect": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"h": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 8, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 64}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "format": {"offset": 8, "pointer": true, "size": 8}, "h": {"native": "Int32Array", "offset": 20, "size": 4}, "list_blitmap": {"offset": 56, "pointer": true, "size": 8}, "locked": {"native": "Int32Array", "offset": 48, "size": 4}, "map": {"offset": 80, "pointer": true, "size": 8}, "pitch": {"native": "Int32Array", "offset": 24, "size": 4}, "pixels": {"offset": 32, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 88, "size": 4}, "userdata": {"offset": 40, "pointer": true, "size": 8}, "w": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 96, "union": false}, {})).flags & u32(2))) != u32(0))) {
    SDL_UnlockSurface(sdl_surface);
  }
  if (Boolean(SDL_UpdateWindowSurface(sdl_window))) {
    (sdl_surface = SDL_GetWindowSurface(sdl_window));
    SDL_UpdateWindowSurface(sdl_window);
  }
  do {

  } while (Boolean(0));
}

// C/C++ source: source/build/src/sdlayer.cpp:2205
export function videoUpdatePalette(start, num) {
  (start = i32(start));
  (num = i32(num));
  if ((bpp > 8)) {
    return i32(0);
  }
  {
    if (sdl_surface) {
      softsurface_setPalette(curpalettefaded, cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(sdl_surface, {"align": 8, "arrayAlign": 1, "fields": {"clip_rect": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"h": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 8, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 64}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "format": {"offset": 8, "pointer": true, "size": 8}, "h": {"native": "Int32Array", "offset": 20, "size": 4}, "list_blitmap": {"offset": 56, "pointer": true, "size": 8}, "locked": {"native": "Int32Array", "offset": 48, "size": 4}, "map": {"offset": 80, "pointer": true, "size": 8}, "pitch": {"native": "Int32Array", "offset": 24, "size": 4}, "pixels": {"offset": 32, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 88, "size": 4}, "userdata": {"offset": 40, "pointer": true, "size": 8}, "w": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 96, "union": false}, {})).format, {"align": 8, "arrayAlign": 1, "fields": {"Aloss": {"native": "Uint8Array", "offset": 39, "size": 1}, "Amask": {"native": "Uint32Array", "offset": 32, "size": 4}, "Ashift": {"native": "Uint8Array", "offset": 43, "size": 1}, "BitsPerPixel": {"native": "Uint8Array", "offset": 16, "size": 1}, "Bloss": {"native": "Uint8Array", "offset": 38, "size": 1}, "Bmask": {"native": "Uint32Array", "offset": 28, "size": 4}, "Bshift": {"native": "Uint8Array", "offset": 42, "size": 1}, "BytesPerPixel": {"native": "Uint8Array", "offset": 17, "size": 1}, "Gloss": {"native": "Uint8Array", "offset": 37, "size": 1}, "Gmask": {"native": "Uint32Array", "offset": 24, "size": 4}, "Gshift": {"native": "Uint8Array", "offset": 41, "size": 1}, "Rloss": {"native": "Uint8Array", "offset": 36, "size": 1}, "Rmask": {"native": "Uint32Array", "offset": 20, "size": 4}, "Rshift": {"native": "Uint8Array", "offset": 40, "size": 1}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "next": {"offset": 48, "pointer": true, "size": 8}, "padding": {"length": 2, "native": "Uint8Array", "offset": 18, "size": 2}, "palette": {"offset": 8, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 44, "size": 4}}, "overlaps": false, "size": 56, "union": false}, {})).Rmask, cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(sdl_surface, {"align": 8, "arrayAlign": 1, "fields": {"clip_rect": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"h": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 8, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 64}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "format": {"offset": 8, "pointer": true, "size": 8}, "h": {"native": "Int32Array", "offset": 20, "size": 4}, "list_blitmap": {"offset": 56, "pointer": true, "size": 8}, "locked": {"native": "Int32Array", "offset": 48, "size": 4}, "map": {"offset": 80, "pointer": true, "size": 8}, "pitch": {"native": "Int32Array", "offset": 24, "size": 4}, "pixels": {"offset": 32, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 88, "size": 4}, "userdata": {"offset": 40, "pointer": true, "size": 8}, "w": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 96, "union": false}, {})).format, {"align": 8, "arrayAlign": 1, "fields": {"Aloss": {"native": "Uint8Array", "offset": 39, "size": 1}, "Amask": {"native": "Uint32Array", "offset": 32, "size": 4}, "Ashift": {"native": "Uint8Array", "offset": 43, "size": 1}, "BitsPerPixel": {"native": "Uint8Array", "offset": 16, "size": 1}, "Bloss": {"native": "Uint8Array", "offset": 38, "size": 1}, "Bmask": {"native": "Uint32Array", "offset": 28, "size": 4}, "Bshift": {"native": "Uint8Array", "offset": 42, "size": 1}, "BytesPerPixel": {"native": "Uint8Array", "offset": 17, "size": 1}, "Gloss": {"native": "Uint8Array", "offset": 37, "size": 1}, "Gmask": {"native": "Uint32Array", "offset": 24, "size": 4}, "Gshift": {"native": "Uint8Array", "offset": 41, "size": 1}, "Rloss": {"native": "Uint8Array", "offset": 36, "size": 1}, "Rmask": {"native": "Uint32Array", "offset": 20, "size": 4}, "Rshift": {"native": "Uint8Array", "offset": 40, "size": 1}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "next": {"offset": 48, "pointer": true, "size": 8}, "padding": {"length": 2, "native": "Uint8Array", "offset": 18, "size": 2}, "palette": {"offset": 8, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 44, "size": 4}}, "overlaps": false, "size": 56, "union": false}, {})).Gmask, cRecordObject(cRecordPointer(cRecordObject(cRecordPointer(sdl_surface, {"align": 8, "arrayAlign": 1, "fields": {"clip_rect": {"byteRecord": {"align": 4, "arrayAlign": 1, "fields": {"h": {"native": "Int32Array", "offset": 12, "size": 4}, "w": {"native": "Int32Array", "offset": 8, "size": 4}, "x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "size": 16, "union": false}, "offset": 64}, "flags": {"native": "Uint32Array", "offset": 0, "size": 4}, "format": {"offset": 8, "pointer": true, "size": 8}, "h": {"native": "Int32Array", "offset": 20, "size": 4}, "list_blitmap": {"offset": 56, "pointer": true, "size": 8}, "locked": {"native": "Int32Array", "offset": 48, "size": 4}, "map": {"offset": 80, "pointer": true, "size": 8}, "pitch": {"native": "Int32Array", "offset": 24, "size": 4}, "pixels": {"offset": 32, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 88, "size": 4}, "userdata": {"offset": 40, "pointer": true, "size": 8}, "w": {"native": "Int32Array", "offset": 16, "size": 4}}, "overlaps": false, "size": 96, "union": false}, {})).format, {"align": 8, "arrayAlign": 1, "fields": {"Aloss": {"native": "Uint8Array", "offset": 39, "size": 1}, "Amask": {"native": "Uint32Array", "offset": 32, "size": 4}, "Ashift": {"native": "Uint8Array", "offset": 43, "size": 1}, "BitsPerPixel": {"native": "Uint8Array", "offset": 16, "size": 1}, "Bloss": {"native": "Uint8Array", "offset": 38, "size": 1}, "Bmask": {"native": "Uint32Array", "offset": 28, "size": 4}, "Bshift": {"native": "Uint8Array", "offset": 42, "size": 1}, "BytesPerPixel": {"native": "Uint8Array", "offset": 17, "size": 1}, "Gloss": {"native": "Uint8Array", "offset": 37, "size": 1}, "Gmask": {"native": "Uint32Array", "offset": 24, "size": 4}, "Gshift": {"native": "Uint8Array", "offset": 41, "size": 1}, "Rloss": {"native": "Uint8Array", "offset": 36, "size": 1}, "Rmask": {"native": "Uint32Array", "offset": 20, "size": 4}, "Rshift": {"native": "Uint8Array", "offset": 40, "size": 1}, "format": {"native": "Uint32Array", "offset": 0, "size": 4}, "next": {"offset": 48, "pointer": true, "size": 8}, "padding": {"length": 2, "native": "Uint8Array", "offset": 18, "size": 2}, "palette": {"offset": 8, "pointer": true, "size": 8}, "refcount": {"native": "Int32Array", "offset": 44, "size": 4}}, "overlaps": false, "size": 56, "union": false}, {})).Bmask);
    }
  }
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:2232
const __cxx_literal_4ade88acad29a11ce0f5 = Uint8Array.from([70, 97, 105, 108, 101, 100, 32, 115, 101, 116, 116, 105, 110, 103, 32, 119, 105, 110, 100, 111, 119, 32, 103, 97, 109, 109, 97, 32, 114, 97, 109, 112, 58, 32, 37, 115, 46, 0]);
export function videoSetGamma() {
  if (Boolean(novideo)) {
    return i32(0);
  }
  let i;
  let gammaTable = cZeroAggregate({"array": "Uint16Array", "dims": [768]});
  let gamma = Math.fround((max__template_9f711f2400ba566e(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(0.75)), min__template_d0e4358054a560bb(((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(1.25)), __cxx_global_cell_92f6ec0c3a993b574f308abb()))).value);
  let contrast = Math.fround((max__template_9f711f2400ba566e(((__cxx_lvalue_2) => cRef(() => __cxx_lvalue_2, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(0.5)), min__template_d0e4358054a560bb(((__cxx_lvalue_3) => cRef(() => __cxx_lvalue_3, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(1.5)), __cxx_global_cell_eb7ec64efb5dec6e758a65c7()))).value);
  let invgamma = Math.fround(Math.fround((Math.fround(1) / gamma)));
  let norm = Math.fround(powf(Math.fround(255), Math.fround((invgamma - Math.fround(1)))));
  if ((((cDeref(cPointerOffset(lastvidgcb, 0, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) == gamma) && ((cDeref(cPointerOffset(lastvidgcb, 1, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) == contrast))) {
    return i32(0);
  }
  for ((i = i32(0)); (i < 256); ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous + 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; }))) {
    let val = Math.fround((max__template_9f711f2400ba566e(((__cxx_lvalue_6) => cRef(() => __cxx_lvalue_6, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(0)), ((__cxx_lvalue_7) => cRef(() => __cxx_lvalue_7, () => { throw new TypeError("const C++ reference write"); }))(Math.fround((Math.fround((Math.fround(i) * contrast)) - Math.fround((Math.fround((contrast - Math.fround(1))) * Math.fround(127)))))))).value);
    if ((gamma != Math.fround(1))) {
      (val = Math.fround(Math.fround((powf(val, invgamma) / norm))));
    }
    ((cDeref(cPointerOffset(gammaTable, i, Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (u32(((cDeref(cPointerOffset(gammaTable, i32((i + 256)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (u32(((cDeref(cPointerOffset(gammaTable, i32((i + 512)), Uint16Array.BYTES_PER_ELEMENT), Uint16Array).value) = (u32((u32((u32((max__template_9f711f2400ba566e(((__cxx_lvalue_8) => cRef(() => __cxx_lvalue_8, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(0)), min__template_d0e4358054a560bb(((__cxx_lvalue_9) => cRef(() => __cxx_lvalue_9, () => { throw new TypeError("const C++ reference write"); }))(Math.fround(65535)), ((__cxx_lvalue_10) => cRef(() => __cxx_lvalue_10, () => { throw new TypeError("const C++ reference write"); }))(Math.fround((val * Math.fround(256))))))).value) & 65535)) & 65535)) & 65535))) & 65535))) & 65535));
  }
  (i = i32(((-2147483647) - 1)));
  if (sdl_window) {
    (i = i32(SDL_SetWindowGammaRamp(sdl_window, cPointerOffset(gammaTable, 0, Uint16Array.BYTES_PER_ELEMENT), cPointerOffset(gammaTable, 256, Uint16Array.BYTES_PER_ELEMENT), cPointerOffset(gammaTable, 512, Uint16Array.BYTES_PER_ELEMENT))));
  }
  if ((i < 0)) {
    if ((i != i32(((-2147483647) - 1)))) {
      do {
        SILENCE_UNUSED__header_6c4dd990742e(__cxx_literal_4ade88acad29a11ce0f5, ((__cxx_lvalue_11) => cRef(() => __cxx_lvalue_11, () => { throw new TypeError("const C++ reference write"); }))(SDL_GetError()));
      } while (Boolean(0));
    }
    (__cxx_global_cell_a8e62b4a4ba82cd2a9215fe2().value = i32(0));
  } else {
    ((cDeref(cPointerOffset(lastvidgcb, 0, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) = Math.fround(gamma));
    ((cDeref(cPointerOffset(lastvidgcb, 1, Float32Array.BYTES_PER_ELEMENT), Float32Array).value) = Math.fround(contrast));
    (__cxx_global_cell_a8e62b4a4ba82cd2a9215fe2().value = i32(1));
  }
  return i32(i);
}

export let sdlappicon = cZeroAggregate({"byteRecord": {"align": 8, "arrayAlign": 1, "fields": {"height": {"native": "Int32Array", "offset": 4, "size": 4}, "pixels": {"offset": 8, "pointer": true, "size": 8}, "width": {"native": "Int32Array", "offset": 0, "size": 4}}, "overlaps": false, "size": 16, "union": false}});
export function __cxx_global_cell_2089c0bc3ad32484ac117017() {
  return __cxx_global_cell_2089c0bc3ad32484ac117017.reference || (__cxx_global_cell_2089c0bc3ad32484ac117017.reference = {
    __cReference: true,
    get value() { return sdlappicon; },
    set value(__cxx_lvalue_0) { throw new TypeError("record address cannot replace original object storage"); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:2300
export function loadappicon() {
  let surf = SDL_CreateRGBSurfaceFrom(sdlappicon.pixels, sdlappicon.width, sdlappicon.height, 32, i32(Math.imul(sdlappicon.width, 4)), u32(255n), u32(65280n), u32(16711680n), u32(4278190080n));
  return surf;
}

// C/C++ source: source/build/src/sdlayer.cpp:2318
export function handleevents_peekkeys() {
  SDL_PumpEvents();
  return i32(SDL_PeepEvents(null, 1, 1, u32(768), u32(768)));
}

// C/C++ source: source/build/src/sdlayer.cpp:2329
export function handleevents_updatemousestate(state) {
  (__cxx_global_cell_e05bfe76ea6b9140ad7ed9e7().value = (u32((u32(((i32(state) == 0) ? 3 : 1)) & 255)) & 255));
}

// C/C++ source: source/build/src/sdlayer.cpp:2340
export function handleevents_sdlcommon(ev) {
  switch (cRecordObject(ev).type) {
    case u32(1024): {
      (__cxx_global_cell_c9714796681e8c5a7f827938().value.x = i32(cRecordObject(ev).motion.x));
    }
    (__cxx_global_cell_c9714796681e8c5a7f827938().value.y = i32(cRecordObject(ev).motion.y));
    ;
    case u32(1537): {
      if ((Boolean(appactive) && __cxx_global_cell_98758ea3e7ef83f477f7ff1f().value)) {
        {
          ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((Number(__cxx_lvalue_0.value) + Number(cRecordObject(ev).motion.xrel)))))(cObjectFieldRef(__cxx_global_cell_52921ad2f7df0862590c48b4().value, "x"));
          ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((Number(__cxx_lvalue_1.value) + Number(cRecordObject(ev).motion.yrel)))))(cObjectFieldRef(__cxx_global_cell_52921ad2f7df0862590c48b4().value, "y"));
        }
      }
    }
    break;
    case u32(1025):
    case u32(1026): {
      let j;
      switch (i32(cRecordObject(ev).button.button)) {
        default: {
          (j = i32((-1)));
        }
        break;
        case 1: {
          (j = i32(0));
        }
        handleevents_updatemousestate(cRecordObject(ev).button.state);
        break;
        case 3: {
          (j = i32(1));
        }
        break;
        case 2: {
          (j = i32(2));
        }
        break;
        case 4: {
          (j = i32(3));
        }
        break;
        case 5: {
          (j = i32(6));
        }
        break;
      }
      if ((j < 0)) {
        break;
      }
      if ((i32(cRecordObject(ev).button.state) == 1)) {
        (__cxx_global_cell_1e0923736d676262c5e9d588().value = i32((__cxx_global_cell_1e0923736d676262c5e9d588().value | i32((1 << j)))));
      } else {
        (__cxx_global_cell_1e0923736d676262c5e9d588().value = i32((__cxx_global_cell_1e0923736d676262c5e9d588().value & (~i32((1 << j))))));
      }
      if (__cxx_global_cell_1cf0029028a3e73171a1adee().value) {
        __cxx_global_cell_1cf0029028a3e73171a1adee().value(i32((j + 1)), i32((i32(cRecordObject(ev).button.state) == 1)));
      }
      break;
    }
    case u32(1619):
    case u32(1620): {
      if ((__cxx_global_cell_98c8686ca508db9a2275a6f8().value && (SDL_NumJoysticks() != numjoysticks))) {
        __cxx_global_cell_98c8686ca508db9a2275a6f8().value();
      }
    }
    break;
    case u32(1536): {
      if (Boolean(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.isGameController)) {
        break;
      }
    }
    ;
    case u32(1616): {
      if ((Boolean(appactive) && (i32(cRecordObject(ev).jaxis.axis) < __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numAxes))) {
        ((cDeref(cPointerOffset(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pAxis, cRecordObject(ev).jaxis.axis, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32(cRecordObject(ev).jaxis.value));
      }
    }
    break;
    case u32(1538): {
      let hatvals = new Int32Array([(-1), 0, 9000, 4500, 18000, (-1), 13500, (-1), 27000, 27500, (-1), (-1), 22500, (-1), (-1), (-1)]);
      if ((Boolean(appactive) && (i32(cRecordObject(ev).jhat.hat) < __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numHats))) {
        ((cDeref(cPointerOffset(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.pHat, cRecordObject(ev).jhat.hat, Int32Array.BYTES_PER_ELEMENT), Int32Array).value) = i32((cDeref(cPointerOffset(hatvals, i32((i32(cRecordObject(ev).jhat.value) & 15)), Int32Array.BYTES_PER_ELEMENT), Int32Array).value)));
      }
      break;
    }
    case u32(1539):
    case u32(1540): {
      if (Boolean(__cxx_global_cell_39a39d1bfab5e142a4f76536().value.__cxx_anonymous_12.__cxx_anonymous_1.isGameController)) {
        break;
      }
    }
    ;
    case u32(1617):
    case u32(1618): {
      if ((Boolean(appactive) && (i32(cRecordObject(ev).jbutton.button) < __cxx_global_cell_39a39d1bfab5e142a4f76536().value.numButtons))) {
        if ((i32(cRecordObject(ev).jbutton.state) == 1)) {
          ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = i32((__cxx_lvalue_2.value | i32((1 << i32(cRecordObject(ev).jbutton.button)))))))(cObjectFieldRef(__cxx_global_cell_39a39d1bfab5e142a4f76536().value, "bits"));
        } else {
          ((__cxx_lvalue_3) => (__cxx_lvalue_3.value = i32((__cxx_lvalue_3.value & (~i32((1 << i32(cRecordObject(ev).jbutton.button))))))))(cObjectFieldRef(__cxx_global_cell_39a39d1bfab5e142a4f76536().value, "bits"));
        }
      }
    }
    break;
    case u32(256): {
      (quitevent = (u32((u32(1) & 255)) & 255));
    }
    return i32((-1));
  }
  return i32(0);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_bb6efa1861c3764c = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_c29e735be0ca84fbb5adedc3() {
  return __cxx_static_address_c29e735be0ca84fbb5adedc3.reference || (__cxx_static_address_c29e735be0ca84fbb5adedc3.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_bb6efa1861c3764c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_c29e735be0ca84fbb5adedc3() { return __cxx_static_address_c29e735be0ca84fbb5adedc3(); }

// C/C++ source: source/build/include/baselayer.h:172
export const g_defaultVideoModes__header_global_a19ca09ee2b13510 = cByteRecordNDArray({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, [25], {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}, cStaticInitializerValues([cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1440}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1200}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 2560, "y": 1080}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1440}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1200}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1920, "y": 1080}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1680, "y": 1050}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 1200}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1600, "y": 900}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1366, "y": 768}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 1024}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 960}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1280, "y": 720}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1152, "y": 864}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 768}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 1024, "y": 600}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 800, "y": 600}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 480}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 640, "y": 400}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 512, "y": 384}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 480, "y": 360}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 400, "y": 300}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 240}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 320, "y": 200}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype}), cInitByteRecord({"align": 4, "arrayAlign": 1, "fields": {"x": {"native": "Int32Array", "offset": 0, "size": 4}, "y": {"native": "Int32Array", "offset": 4, "size": 4}}, "overlaps": false, "prototype": "__cxx_record_vec2_2150e186aab2ebda", "size": 8, "union": false}, cStaticInitializerValues({"x": 0, "y": 0}), null, {"__cxx_record_vec2_2150e186aab2ebda": () => __cxx_record_vec2_2150e186aab2ebda().prototype})]));
function __cxx_static_address_6610e82ad8b3dac81373b255() {
  return __cxx_static_address_6610e82ad8b3dac81373b255.reference || (__cxx_static_address_6610e82ad8b3dac81373b255.reference = {
    __cReference: true,
    get value() { return g_defaultVideoModes__header_global_a19ca09ee2b13510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/baselayer.h:188
export const g_keyAsciiTable__header_global_e0315c00aee82342 = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 45, 61, (u32(0) & 255), (u32(0) & 255), 113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 91, 93, (u32(0) & 255), (u32(0) & 255), 97, 115, 100, 102, 103, 104, 106, 107, 108, 59, (u32(39) & 255), 96, (u32(0) & 255), (u32(92) & 255), 122, 120, 99, 118, 98, 110, 109, 44, 46, 47, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_a3fbcdbf6cb7d9e264ce099d() {
  return __cxx_static_address_a3fbcdbf6cb7d9e264ce099d.reference || (__cxx_static_address_a3fbcdbf6cb7d9e264ce099d.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTable__header_global_e0315c00aee82342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_a3fbcdbf6cb7d9e264ce099d() { return __cxx_static_address_a3fbcdbf6cb7d9e264ce099d(); }

// C/C++ source: source/build/include/baselayer.h:196
export const g_keyAsciiTableShift__header_global_288e11816b172bec = new Uint8Array([(u32(0) & 255), (u32(0) & 255), 33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, (u32(0) & 255), (u32(0) & 255), 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 123, 125, (u32(0) & 255), (u32(0) & 255), 65, 83, 68, 70, 71, 72, 74, 75, 76, 58, 34, 126, (u32(0) & 255), 124, 90, 88, 67, 86, 66, 78, 77, 60, 62, 63, (u32(0) & 255), 42, (u32(0) & 255), (u32(32) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), 55, 56, 57, 45, 52, 53, 54, 43, 49, 50, 51, 48, 46, (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255), (u32(0) & 255)]);
function __cxx_static_address_efb79ba6d28a4db07d04f7e3() {
  return __cxx_static_address_efb79ba6d28a4db07d04f7e3.reference || (__cxx_static_address_efb79ba6d28a4db07d04f7e3.reference = {
    __cReference: true,
    get value() { return g_keyAsciiTableShift__header_global_288e11816b172bec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_efb79ba6d28a4db07d04f7e3() { return __cxx_static_address_efb79ba6d28a4db07d04f7e3(); }

// C/C++ source: source/build/include/build.h:895
export const pow2long__header_global_1344c1eedea669f9 = new Int32Array([1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483647]);
function __cxx_static_address_b99b9eb92262b0cb91d0d901() {
  return __cxx_static_address_b99b9eb92262b0cb91d0d901.reference || (__cxx_static_address_b99b9eb92262b0cb91d0d901.reference = {
    __cReference: true,
    get value() { return pow2long__header_global_1344c1eedea669f9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_b99b9eb92262b0cb91d0d901() { return __cxx_static_address_b99b9eb92262b0cb91d0d901(); }

// C/C++ source: source/build/include/build.h:907
export const pow2ulong__header_global_13af12a96e6bc5c8 = new Uint32Array([u32(1), u32(2), u32(4), u32(8), u32(16), u32(32), u32(64), u32(128), u32(256), u32(512), u32(1024), u32(2048), u32(4096), u32(8192), u32(16384), u32(32768), u32(65536), u32(131072), u32(262144), u32(524288), u32(1048576), u32(2097152), u32(4194304), u32(8388608), u32(16777216), u32(33554432), u32(67108864), u32(134217728), u32(268435456), u32(536870912), u32(1073741824), u32(2147483648n)]);
function __cxx_static_address_73e0c2b75512bd62ab4f9cfe() {
  return __cxx_static_address_73e0c2b75512bd62ab4f9cfe.reference || (__cxx_static_address_73e0c2b75512bd62ab4f9cfe.reference = {
    __cReference: true,
    get value() { return pow2ulong__header_global_13af12a96e6bc5c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_73e0c2b75512bd62ab4f9cfe() { return __cxx_static_address_73e0c2b75512bd62ab4f9cfe(); }

// C/C++ source: source/build/include/build.h:919
export const pow264__header_global_7021f25436c9b8b6 = new BigInt64Array([BigInt(i64(1)), BigInt(i64(2)), BigInt(i64(4)), BigInt(i64(8)), BigInt(i64(16)), BigInt(i64(32)), BigInt(i64(64)), BigInt(i64(128)), BigInt(i64(256)), BigInt(i64(512)), BigInt(i64(1024)), BigInt(i64(2048)), BigInt(i64(4096)), BigInt(i64(8192)), BigInt(i64(16384)), BigInt(i64(32768)), BigInt(i64(65536)), BigInt(i64(131072)), BigInt(i64(262144)), BigInt(i64(524288)), BigInt(i64(1048576)), BigInt(i64(2097152)), BigInt(i64(4194304)), BigInt(i64(8388608)), BigInt(i64(16777216)), BigInt(i64(33554432)), BigInt(i64(67108864)), BigInt(i64(134217728)), BigInt(i64(268435456)), BigInt(i64(536870912)), BigInt(i64(1073741824)), BigInt(2147483648n), BigInt(4294967296n), BigInt(8589934592n), BigInt(17179869184n), BigInt(34359738368n), BigInt(68719476736n), BigInt(137438953472n), BigInt(274877906944n), BigInt(549755813888n), BigInt(1099511627776n), BigInt(2199023255552n), BigInt(4398046511104n), BigInt(8796093022208n), BigInt(17592186044416n), BigInt(35184372088832n), BigInt(70368744177664n), BigInt(140737488355328n), BigInt(281474976710656n), BigInt(562949953421312n), BigInt(1125899906842624n), BigInt(2251799813685248n), BigInt(4503599627370496n), BigInt(9007199254740992n), BigInt(18014398509481984n), BigInt(36028797018963968n), BigInt(72057594037927936n), BigInt(144115188075855872n), BigInt(288230376151711744n), BigInt(576460752303423488n), BigInt(1152921504606846976n), BigInt(2305843009213693952n), BigInt(4611686018427387904n), BigInt(9223372036854775807n)]);
function __cxx_static_address_7753289a0a1614ce5c84bbc5() {
  return __cxx_static_address_7753289a0a1614ce5c84bbc5.reference || (__cxx_static_address_7753289a0a1614ce5c84bbc5.reference = {
    __cReference: true,
    get value() { return pow264__header_global_7021f25436c9b8b6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_7753289a0a1614ce5c84bbc5() { return __cxx_static_address_7753289a0a1614ce5c84bbc5(); }

// C/C++ source: source/build/src/sdlkeytrans.cpp:5
export let keytranslation__header_global_2a81fca88473fd62 = new Uint8Array(512);
function __cxx_static_address_8ca7d7a7ca60e7cb410b8814() {
  return __cxx_static_address_8ca7d7a7ca60e7cb410b8814.reference || (__cxx_static_address_8ca7d7a7ca60e7cb410b8814.reference = {
    __cReference: true,
    get value() { return keytranslation__header_global_2a81fca88473fd62; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_8ca7d7a7ca60e7cb410b8814() { return __cxx_static_address_8ca7d7a7ca60e7cb410b8814(); }

// C/C++ source: source/build/include/compat.h:1235
export function Bstrncpyz__header_bcf6245401e3(dst, src, n) {
  if ((n > u64(0))) {
    memcpy(dst, src, (min__template_c237f4424e2bda8a(((__cxx_lvalue_0) => cRef(() => __cxx_lvalue_0, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(strlen(src)) + BigInt(u64(1))))), ((__cxx_lvalue_1) => cRef(() => __cxx_lvalue_1, () => { throw new TypeError("const C++ reference write"); }))(u64((BigInt(n) - BigInt(u64(1))))))).value);
    ((cDeref(cPointerOffset(dst, u64((BigInt(n) - BigInt(u64(1)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(0) & 255));
  }
  return dst;
}

export function ARRAY_SIZE__header_0e5dad7260e0(arg0) {
  return u64(32n);
}

// C/C++ source: source/build/include/compat.h:1367
export function engineDestroyAllocator__header_912759590fbb() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}

// C/C++ source: source/build/src/sdlkeytrans.cpp:144
export function buildkeytranslationtable__header_0624c58d148e() {
  memset(keytranslation__header_global_2a81fca88473fd62, 0, 512);
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 42, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(14) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 43, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(15) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 40, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(28) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 72, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(89) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 41, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(1) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 44, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(57) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 54, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(51) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 100, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(86) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 45, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(12) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 55, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(52) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 56, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(53) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 39, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(11) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 30, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(2) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 31, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(3) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 32, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(4) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 33, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(5) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 34, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(6) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 35, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(7) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 36, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(8) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 37, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(9) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 38, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(10) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 51, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(39) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 52, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(40) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 46, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(13) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 47, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(26) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 49, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(43) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 48, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(27) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 4, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(30) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(48) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 6, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(46) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(32) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 8, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(18) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 9, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(33) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 10, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(34) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 11, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(35) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 12, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(23) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 13, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(36) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 14, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(37) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 15, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(38) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 16, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(50) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 17, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(49) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 18, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(24) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 19, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(25) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 20, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(16) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 21, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(19) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 22, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(31) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 23, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(20) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 24, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(22) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 25, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(47) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 26, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(17) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 27, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(45) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 28, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(21) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 29, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(44) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 76, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(211) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 98, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(82) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 89, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(79) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 90, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(80) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 91, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(81) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 92, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(75) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 93, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(76) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 216, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(76) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 156, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(76) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 94, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(77) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 95, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(71) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 96, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(72) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 97, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(73) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 99, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(83) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 84, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(181) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 85, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(55) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 86, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(74) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 87, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(78) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 88, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(156) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 82, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(200) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 81, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(208) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 79, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(205) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 80, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(203) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 73, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(210) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 74, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(199) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 77, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(207) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 75, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(201) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 78, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(209) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 58, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(59) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 59, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(60) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 60, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(61) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 61, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(62) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 62, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(63) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 63, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(64) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 64, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(65) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 65, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(66) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 66, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(67) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 67, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(68) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 68, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(87) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 69, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(88) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 83, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(69) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 57, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(58) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 71, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(70) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 229, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(54) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 225, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(42) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 228, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(157) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 224, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(29) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 230, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(184) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 226, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(56) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 227, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(219) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 231, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(220) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 154, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(84) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 118, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(221) & 255)) & 255));
  ((cDeref(cPointerOffset(keytranslation__header_global_2a81fca88473fd62, 53, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32((u32(41) & 255)) & 255));
  return i32(0);
}

// C/C++ source: source/build/include/compat.h:1428
export function xaligned_alloc__header_a6ee02102c42(alignment, size) {
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, size, alignment);
  if (cPointerCompare(ptr, null, "!=")) {
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

// C/C++ source: source/build/include/compat.h:1450
export function xaligned_free__header_8fde0869932d(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_8455ed0a4ad7(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}

// C/C++ source: source/build/include/compat.h:1400
export function xcalloc__header_fb596e059141(nmemb, size) {
  let siz = u64((BigInt(nmemb) * BigInt(size)));
  let ptr = Alloc__cxx_static_e0036cfb06bcfe42(__cxx_global_cell_11016d3c7177543e564ab46c().value, siz, u64(16));
  if (cPointerCompare(ptr, null, "!=")) {
    memset(ptr, 0, siz);
    return ptr;
  }
  handle_memerr(i32(size));
  __builtin_unreachable();
}

export function SILENCE_UNUSED__header_07304f9ee8ae(arg0, arg1) {

}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_774131ccff66371d(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function SILENCE_UNUSED__header_25eb5216ac4d(arg0, arg1) {

}

export function ARRAY_SIZE__header_a7771eb202e2(arg0) {
  return u64(7n);
}

export function ARRAY_SIZE__header_c8618bd4f297(arg0) {
  return u64(22n);
}

// C/C++ source: source/build/include/compat.h:1378
export function xstrdup__header_96c3f6dd42f5(s) {
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

export function clamp__header_3b54a66910be(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

// C/C++ source: source/build/include/pragmas.h:321
export function klabs__header_915012986000(a) {
  return i32(abs(a));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:254
export function max__template_9f711f2400ba566e(__a, __b) {
  if ((__a.value < __b.value)) {
    return __b;
  }
  return __a;
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_d0e4358054a560bb(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

export function SILENCE_UNUSED__header_6c4dd990742e(arg0, arg1) {

}

// C/C++ source: source/build/include/baselayer.h:311
export function keyBufferFull__header_2416764f7b64() {
  return i32((i32((i32((i32(__cxx_global_cell_ee6f4502eccd328f27b46fb8().value) + 1)) & i32((64 - 1)))) == i32(__cxx_global_cell_a6fc8c10b0aec7fd31285ec6().value)));
}

// C/C++ source: source/build/include/baselayer.h:316
export function keyBufferInsert__header_d7a503e0bd19(code) {
  ((cDeref(cPointerOffset(g_keyAsciiFIFO, __cxx_global_cell_ee6f4502eccd328f27b46fb8().value, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (u32(code) & 255));
  (__cxx_global_cell_ee6f4502eccd328f27b46fb8().value = (u32((u32(i32((i32((i32(__cxx_global_cell_ee6f4502eccd328f27b46fb8().value) + 1)) & i32((64 - 1))))) & 255)) & 255));
}

// C/C++ source: @sysroot/usr/include/c++/12/bits/stl_algobase.h:230
export function min__template_c237f4424e2bda8a(__a, __b) {
  if ((__b.value < __a.value)) {
    return __b;
  }
  return __a;
}

// Original Clang-generated fragment; imports existing owner storage.
export { system_getcvars, videoSetVsync } from "./_source_legacy_sdlayer_cpp_f0278981403a.mjs";
