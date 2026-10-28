// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/it_load.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) return source;
  const allocation=source&&globalThis[Symbol.for('source-first.cpp-heap/1')]?.objects.get(source);
  if (allocation) return {__cPointer:true,buffer:allocation.slots,lower:0,
    upper:allocation.extent,offset:0,array:true,stride:allocation.extent};
  if (Array.isArray(source)) {
    const bytes=source[Symbol.for('source-first.clang-byte-record-array/1')];
    return { __cPointer:true, buffer:source, lower:0, upper:bytes?bytes.length:source.length,
      offset:0,array:true,stride:bytes&&source.length?bytes.length/source.length:1 };
  }
  if (!ArrayBuffer.isView(source) || source instanceof DataView)
    throw new TypeError('C pointer requires bounded array storage');
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
    if (index!==0) throw new RangeError('C single-object pointer escapes original storage');
    return source;
  }
  const pointer=cPointer(source);
  if (!pointer.array) {
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer);
    const offset=pointer.offset+index*8;
    if(!allocation)throw new TypeError('C aggregate/pointer slot requires a proven source array');
    if(!Number.isSafeInteger(offset)||offset%8||offset<pointer.lower||offset+8>pointer.upper||
        offset<allocation.lower||offset+8>allocation.upper)throw new RangeError('Pointer slot escapes original LP64 allocation');
    return {get value(){return allocation.read(offset);},set value(value){allocation.write(offset,value);}};
  }
  const stride=pointer.stride || 1;
  const offset=pointer.offset+index*stride;
  if (!Number.isSafeInteger(offset) || offset<pointer.lower || offset>=pointer.upper || offset%stride)
    throw new RangeError('C aggregate/pointer array index escapes original bounds');
  const slot=offset/stride;
  return {get value(){return pointer.buffer[slot];},set value(next){pointer.buffer[slot]=next;}};
};
const cTypedPointer = (source, Type) => {
  if (!Type || !Number.isSafeInteger(Type.BYTES_PER_ELEMENT)) throw new TypeError('Unsupported pointer element type');
  if (source===null) return null;
  const pointerBytes=source?.[Symbol.for('source-first.clang-byte-record-array/1')];
  if(pointerBytes)return cPointer(pointerBytes);
  if (Array.isArray(source)) return { ...cPointer(source), upper:source.length*Type.BYTES_PER_ELEMENT, stride:Type.BYTES_PER_ELEMENT };
  return cPointer(source);
};
const cPointerOffset = (source, delta, stride=1) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || next<p.lower || next>p.upper)
    throw new RangeError('C pointer escapes original array bounds');
  return { ...p, offset:next };
};
const cDeref = (source, Type) => {
  if (source && !ArrayBuffer.isView(source) && source.__cPointer !== true &&
      typeof source==='object' && 'value' in source) return source;
  const p=cPointer(source);
  if (p.array) {
    if (p.offset>=p.upper) throw new RangeError('C array pointer dereferences one-past-end');
    if (Type.BYTES_PER_ELEMENT!==p.stride || p.offset%p.stride!==0)
      throw new TypeError('Array element type does not match original pointer stride');
    const index=p.offset/p.stride;
    return {get value(){return p.buffer[index];}, set value(value){p.buffer[index]=value;}};
  }
  const width=Type?.BYTES_PER_ELEMENT;
  if (!Number.isSafeInteger(width) || width<=0 || p.offset+width>p.upper)
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
const cPointerCompare = (left,right,op) => {
  if (left?.__cDeferredReference===true) left=left.resolve();
  if (right?.__cDeferredReference===true) right=right.resolve();
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
  if (left?.__cReference===true || right?.__cReference===true) {
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
  const a=Array.isArray(left) ? {...cPointer(left),upper:left.length*stride,stride} : cPointer(left);
  const b=Array.isArray(right) ? {...cPointer(right),upper:right.length*stride,stride} : cPointer(right);
  if (a.buffer!==b.buffer || a.lower!==b.lower || a.upper!==b.upper)
    throw new TypeError('Cannot subtract pointers to different source arrays');
  const delta=(a.offset-b.offset)/stride;
  if (!Number.isSafeInteger(delta)) throw new RangeError('Misaligned C pointer difference');
  return delta;
};

const cRecordObject = source => {
  if (source?.__cDeferredPointer === true || source?.__cDeferredReference === true) return cRecordObject(source.resolve());
  if (source?.__cReference === true) return source.value;
  if (Array.isArray(source)) { if (!source.length) throw new RangeError("C record pointer dereferences empty array"); return source[0]; }
  if (source?.__cPointer === true) {
    if (!source.array) throw new TypeError("C record pointer requires source-backed object slots");
    return cPointerElementRef(source,0).value;
  }
  return source;
};
const cStaticReference = resolve => ({ __cReference:true, __cDeferredReference:true, resolve, get value() { return resolve().value; }, set value(value) { resolve().value=value; } });
const cObjectFieldRef = (owner, field) => { const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };
const cRef = (read, write) => ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } });
const cArrayRef = (array, index) => cRef(() => array[index], v => { array[index] = v; });
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_58aac0d6b046a85d = i32(3754936);
function __cxx_static_address_1af18f99fc8dab7830dce478() {
  return __cxx_static_address_1af18f99fc8dab7830dce478.reference || (__cxx_static_address_1af18f99fc8dab7830dce478.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_58aac0d6b046a85d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_085c6c6a4a90a589 = i32(1144);
function __cxx_static_address_13151a3667502a06afb92a0c() {
  return __cxx_static_address_13151a3667502a06afb92a0c.reference || (__cxx_static_address_13151a3667502a06afb92a0c.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_085c6c6a4a90a589; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_fd2cbb6396669744 = i32(2147483647);
function __cxx_static_address_290eba5709e28654b5a9b561() {
  return __cxx_static_address_290eba5709e28654b5a9b561.reference || (__cxx_static_address_290eba5709e28654b5a9b561.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_fd2cbb6396669744; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_45d9a395e054c510 = i32(2147483648);
function __cxx_static_address_9f67fea11f2d19a0a6d01a45() {
  return __cxx_static_address_9f67fea11f2d19a0a6d01a45.reference || (__cxx_static_address_9f67fea11f2d19a0a6d01a45.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_45d9a395e054c510; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_7c723b2d964533b9 = i32(2147483648);
function __cxx_static_address_25306643577b6320f731d3b2() {
  return __cxx_static_address_25306643577b6320f731d3b2.reference || (__cxx_static_address_25306643577b6320f731d3b2.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_7c723b2d964533b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_120f8336c832cf61 = i32(65536);
function __cxx_static_address_b54694f9a0f2ca350046c052() {
  return __cxx_static_address_b54694f9a0f2ca350046c052.reference || (__cxx_static_address_b54694f9a0f2ca350046c052.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_120f8336c832cf61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_d74dc82c3dac7e8d = i32(32768);
function __cxx_static_address_4a6ba414fb2a2fec7ae88190() {
  return __cxx_static_address_4a6ba414fb2a2fec7ae88190.reference || (__cxx_static_address_4a6ba414fb2a2fec7ae88190.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_d74dc82c3dac7e8d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_b76854f34d44cce4 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_61007ea0bf96745dd1bc9c2a() {
  return __cxx_static_address_61007ea0bf96745dd1bc9c2a.reference || (__cxx_static_address_61007ea0bf96745dd1bc9c2a.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_b76854f34d44cce4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/it_load.c:57
export const fx = new Uint8Array([((255) & 255), ((163) & 255), ((11) & 255), ((142) & 255), ((10) & 255), ((2) & 255), ((1) & 255), ((3) & 255), ((4) & 255), ((29) & 255), ((180) & 255), ((6) & 255), ((5) & 255), ((128) & 255), ((129) & 255), ((9) & 255), ((137) & 255), ((27) & 255), ((7) & 255), ((254) & 255), ((135) & 255), ((172) & 255), ((16) & 255), ((17) & 255), ((8) & 255), ((138) & 255), ((190) & 255), ((255) & 255), ((191) & 255), ((255) & 255), ((255) & 255), ((255) & 255)]);
function __cxx_static_address_5facbd34e140e13fe9df1a82() {
  return __cxx_static_address_5facbd34e140e13fe9df1a82.reference || (__cxx_static_address_5facbd34e140e13fe9df1a82.reference = {
    __cReference: true,
    get value() { return fx; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/it_load.c:92
export function xlat_fx(c, e, last_fxp, new_fx) {
  let h = ((((i32((i32((i32(cRecordObject(e).fxp) & 240)) >> 4))) & 255)) & 255);
  let l = ((((i32((i32(cRecordObject(e).fxp) & 15))) & 255)) & 255);
  switch (i32((cRecordObject(e).fxt = (((cDeref(cPointerOffset(fx, cRecordObject(e).fxt, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255)))) {
    case 254: {
      (cRecordObject(e).fxt = ((((14) & 255)) & 255));
    }
    if (((i32(h) == 0) && (i32(cRecordObject(e).fxp) == 0))) {
      (cRecordObject(e).fxp = (((cDeref(cPointerOffset(last_fxp, c, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      (h = ((((i32((i32((i32(cRecordObject(e).fxp) & 240)) >> 4))) & 255)) & 255));
      (l = ((((i32((i32(cRecordObject(e).fxp) & 15))) & 255)) & 255));
    } else {
      ((cDeref(cPointerOffset(last_fxp, c, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((cRecordObject(e).fxp) & 255));
    }
    switch (i32(h)) {
      case 1: {
        (cRecordObject(e).fxp = ((((i32((48 | i32(l)))) & 255)) & 255));
      }
      break;
      case 2: {
        (cRecordObject(e).fxt = (((cRecordObject(e).fxp = ((((0) & 255)) & 255))) & 255));
      }
      break;
      case 3: {
        (cRecordObject(e).fxp = ((((i32((64 | i32(l)))) & 255)) & 255));
      }
      break;
      case 4: {
        (cRecordObject(e).fxp = ((((i32((112 | i32(l)))) & 255)) & 255));
      }
      break;
      case 5: {
        if ((i32(l) <= 3)) {
          (cRecordObject(e).fxt = ((((139) & 255)) & 255));
          (cRecordObject(e).fxp = ((l) & 255));
        } else {
          (cRecordObject(e).fxt = (((cRecordObject(e).fxp = ((((0) & 255)) & 255))) & 255));
        }
      }
      break;
      case 6: {
        (cRecordObject(e).fxp = ((((i32((224 | i32(l)))) & 255)) & 255));
      }
      break;
      case 7: {
        (cRecordObject(e).fxt = ((((131) & 255)) & 255));
      }
      ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = (((__cxx_lvalue_0.value & 15)) & 255)))(cObjectFieldRef(cRecordObject(e), "fxp"));
      break;
      case 8: {
        (cRecordObject(e).fxt = ((((8) & 255)) & 255));
      }
      (cRecordObject(e).fxp = ((((i32((i32(l) << 4))) & 255)) & 255));
      break;
      case 9: {
        if (((i32(l) == 0) || (i32(l) == 1))) {
          (cRecordObject(e).fxt = ((((141) & 255)) & 255));
          (cRecordObject(e).fxp = ((l) & 255));
        } else {
          if (((i32(l) == 14) || (i32(l) == 15))) {
            (cRecordObject(e).fxt = ((((143) & 255)) & 255));
            (cRecordObject(e).fxp = ((((i32((i32(l) - 14))) & 255)) & 255));
          }
        }
      }
      break;
      case 10: {
        (cRecordObject(e).fxt = ((((140) & 255)) & 255));
      }
      (cRecordObject(e).fxp = ((l) & 255));
      break;
      case 11: {
        (cRecordObject(e).fxp = ((((i32((96 | i32(l)))) & 255)) & 255));
      }
      break;
      case 12:
      case 13: {
        if ((i32((cRecordObject(e).fxp = ((l) & 255))) == 0)) {
          ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = (((previous + 1)) & 255); __cxx_lvalue_1.value = next; return previous; })(cObjectFieldRef(cRecordObject(e), "fxp"));
        }
      }
      ((__cxx_lvalue_2) => (__cxx_lvalue_2.value = (((__cxx_lvalue_2.value | i32((i32(h) << 4)))) & 255)))(cObjectFieldRef(cRecordObject(e), "fxp"));
      break;
      case 14: {
        (cRecordObject(e).fxt = ((((136) & 255)) & 255));
      }
      (cRecordObject(e).fxp = ((l) & 255));
      break;
      case 15: {
        (cRecordObject(e).fxt = ((((189) & 255)) & 255));
      }
      (cRecordObject(e).fxp = ((l) & 255));
      break;
      default: {
        (cRecordObject(e).fxt = (((cRecordObject(e).fxp = ((((0) & 255)) & 255))) & 255));
      }
    }
    break;
    case 29: {
      if (((!Boolean(new_fx)) && (i32(cRecordObject(e).fxp) != 0))) {
        (cRecordObject(e).fxp = ((((i32((i32((i32((i32((i32((i32(cRecordObject(e).fxp) & 240)) >> 4)) + 1)) << 4)) | i32((i32((i32(cRecordObject(e).fxp) & 15)) + 1))))) & 255)) & 255));
      }
    }
    break;
    case 16: {
      if ((i32(cRecordObject(e).fxp) > 128)) {
        (cRecordObject(e).fxt = (((cRecordObject(e).fxp = ((((0) & 255)) & 255))) & 255));
      }
    }
    break;
    case 255: {
      (cRecordObject(e).fxt = (((cRecordObject(e).fxp = ((((0) & 255)) & 255))) & 255));
    }
    break;
  }
}

// C/C++ source: source/libxmp-lite/src/it_load.c:193
export function xlat_volfx(event) {
  let b;
  (b = i32(cRecordObject(event).vol));
  (cRecordObject(event).vol = ((((0) & 255)) & 255));
  if ((b <= 64)) {
    (cRecordObject(event).vol = ((((i32((b + 1))) & 255)) & 255));
  } else {
    if (((b >= 65) && (b <= 74))) {
      (cRecordObject(event).f2t = ((((194) & 255)) & 255));
      (cRecordObject(event).f2p = ((((i32((b - 65))) & 255)) & 255));
    } else {
      if (((b >= 75) && (b <= 84))) {
        (cRecordObject(event).f2t = ((((195) & 255)) & 255));
        (cRecordObject(event).f2p = ((((i32((b - 75))) & 255)) & 255));
      } else {
        if (((b >= 85) && (b <= 94))) {
          (cRecordObject(event).f2t = ((((192) & 255)) & 255));
          (cRecordObject(event).f2p = ((((i32((b - 85))) & 255)) & 255));
        } else {
          if (((b >= 95) && (b <= 104))) {
            (cRecordObject(event).f2t = ((((193) & 255)) & 255));
            (cRecordObject(event).f2p = ((((i32((b - 95))) & 255)) & 255));
          } else {
            if (((b >= 105) && (b <= 114))) {
              (cRecordObject(event).f2t = ((((2) & 255)) & 255));
              (cRecordObject(event).f2p = ((((i32((i32((b - 105)) << 2))) & 255)) & 255));
            } else {
              if (((b >= 115) && (b <= 124))) {
                (cRecordObject(event).f2t = ((((1) & 255)) & 255));
                (cRecordObject(event).f2p = ((((i32((i32((b - 115)) << 2))) & 255)) & 255));
              } else {
                if (((b >= 128) && (b <= 192))) {
                  if ((b == 192)) {
                    (cRecordObject(event).f2p = ((((255) & 255)) & 255));
                  } else {
                    (cRecordObject(event).f2p = ((((i32((i32((b - 128)) << 2))) & 255)) & 255));
                  }
                  (cRecordObject(event).f2t = ((((8) & 255)) & 255));
                } else {
                  if (((b >= 193) && (b <= 202))) {
                    let val = new Uint8Array([((0) & 255), ((1) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((96) & 255), ((128) & 255), ((255) & 255)]);
                    (cRecordObject(event).f2t = ((((3) & 255)) & 255));
                    (cRecordObject(event).f2p = (((cDeref(cPointerOffset(val, i32((b - 193)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
                  } else {
                    if (((b >= 203) && (b <= 212))) {
                      (cRecordObject(event).f2t = ((((4) & 255)) & 255));
                      (cRecordObject(event).f2p = ((((i32((b - 203))) & 255)) & 255));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// C/C++ source: source/libxmp-lite/src/it_load.c:241
export function fix_name(s, l) {
  let i;
  for ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => l, __cxx_lvalue_1 => { l = __cxx_lvalue_1; })), (i = i32(0))); (i < l); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    if ((i32((cDeref(cPointerOffset(s, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == 0)) {
      ((cDeref(cPointerOffset(s, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((32) & 255)) & 255));
    }
  }
  for (((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => i, __cxx_lvalue_5 => { i = __cxx_lvalue_5; })); ((i >= 0) && (i32((cDeref(cPointerOffset(s, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(32))); ((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = i32((previous - 1)); __cxx_lvalue_6.value = next; return previous; })(cRef(() => i, __cxx_lvalue_7 => { i = __cxx_lvalue_7; }))) {
    if ((i32((cDeref(cPointerOffset(s, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) == i32(32))) {
      ((cDeref(cPointerOffset(s, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/it_load.c:700
export function force_sample_length(xxs, xtra, len) {
  (cRecordObject(xxs).len = i32(len));
  if ((cRecordObject(xxs).lpe > cRecordObject(xxs).len)) {
    (cRecordObject(xxs).lpe = i32(cRecordObject(xxs).len));
  }
  if ((cRecordObject(xxs).lps >= cRecordObject(xxs).len)) {
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = i32((__cxx_lvalue_0.value & (~i32((1 << 1)))))))(cObjectFieldRef(cRecordObject(xxs), "flg"));
  }
  if (xtra) {
    if ((cRecordObject(xtra).sue > cRecordObject(xxs).len)) {
      (cRecordObject(xtra).sue = i32(cRecordObject(xxs).len));
    }
    if ((cRecordObject(xtra).sus >= cRecordObject(xxs).len)) {
      ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = i32((__cxx_lvalue_1.value & (~i32((i32((1 << 5)) | i32((1 << 6)))))))))(cObjectFieldRef(cRecordObject(xxs), "flg"));
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_0fa4cf7ca3583c17 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_4e4a8d1ae5e8cea00a8494e1() {
  return __cxx_static_address_4e4a8d1ae5e8cea00a8494e1.reference || (__cxx_static_address_4e4a8d1ae5e8cea00a8494e1.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_0fa4cf7ca3583c17; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}
