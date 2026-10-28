// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/sample.c
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
export const fix16_rad_to_deg_mult__header_global_cd0de510269d5a0d = i32(3754936);
function __cxx_static_address_d83bf84f7798da1605c6d32f() {
  return __cxx_static_address_d83bf84f7798da1605c6d32f.reference || (__cxx_static_address_d83bf84f7798da1605c6d32f.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_cd0de510269d5a0d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_ea92108975df74a1 = i32(1144);
function __cxx_static_address_21adef56bcdaf51e9b56c1a6() {
  return __cxx_static_address_21adef56bcdaf51e9b56c1a6.reference || (__cxx_static_address_21adef56bcdaf51e9b56c1a6.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_ea92108975df74a1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_63f4ad1d50737093 = i32(2147483647);
function __cxx_static_address_b3f202196a5226b83fdc24be() {
  return __cxx_static_address_b3f202196a5226b83fdc24be.reference || (__cxx_static_address_b3f202196a5226b83fdc24be.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_63f4ad1d50737093; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_89565f993e6262b2 = i32(2147483648);
function __cxx_static_address_a8d185ca714d9b5ab0e6646e() {
  return __cxx_static_address_a8d185ca714d9b5ab0e6646e.reference || (__cxx_static_address_a8d185ca714d9b5ab0e6646e.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_89565f993e6262b2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_f7e8b230e26a6850 = i32(2147483648);
function __cxx_static_address_e7cabe7618095be355e28bfa() {
  return __cxx_static_address_e7cabe7618095be355e28bfa.reference || (__cxx_static_address_e7cabe7618095be355e28bfa.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_f7e8b230e26a6850; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_32ae1eba7e7c4fc5 = i32(65536);
function __cxx_static_address_7d47df0f0ba3630888d2d365() {
  return __cxx_static_address_7d47df0f0ba3630888d2d365.reference || (__cxx_static_address_7d47df0f0ba3630888d2d365.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_32ae1eba7e7c4fc5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_3ca172530b8ab8ff = i32(32768);
function __cxx_static_address_220e0b5ee4b47b0ee3b41fe3() {
  return __cxx_static_address_220e0b5ee4b47b0ee3b41fe3.reference || (__cxx_static_address_220e0b5ee4b47b0ee3b41fe3.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_3ca172530b8ab8ff; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_81f62cc6a5e1c18a = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_364df248a95ae64a3b856fff() {
  return __cxx_static_address_364df248a95ae64a3b856fff.reference || (__cxx_static_address_364df248a95ae64a3b856fff.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_81f62cc6a5e1c18a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/sample.c:99
export function convert_delta(p, l, r) {
  let w = cTypedPointer(p, Uint16Array);
  let absval = ((((0) & 65535)) & 65535);
  if (Boolean(r)) {
    for (; Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => l, __cxx_lvalue_1 => { l = __cxx_lvalue_1; }))); ) {
      (absval = ((((i32((i32((cDeref(w, Uint16Array).value)) + i32(absval)))) & 65535)) & 65535));
      ((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint16Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => w, __cxx_lvalue_3 => { w = __cxx_lvalue_3; })), Uint16Array).value) = ((absval) & 65535));
    }
  } else {
    for (; Boolean(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = i32((previous - 1)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => l, __cxx_lvalue_5 => { l = __cxx_lvalue_5; }))); ) {
      (absval = ((((i32((i32((cDeref(p, Uint8Array).value)) + i32(absval)))) & 65535)) & 65535));
      ((cDeref(((__cxx_lvalue_6) => { const previous = __cxx_lvalue_6.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_6.value = next; return previous; })(cRef(() => p, __cxx_lvalue_7 => { p = __cxx_lvalue_7; })), Uint8Array).value) = ((((((absval) & 255)) & 255)) & 255));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/sample.c:118
export function convert_signal(p, l, r) {
  let w = cTypedPointer(p, Uint16Array);
  if (Boolean(r)) {
    for (; Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => l, __cxx_lvalue_1 => { l = __cxx_lvalue_1; }))); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint16Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => w, __cxx_lvalue_3 => { w = __cxx_lvalue_3; }))) {
      ((__cxx_lvalue_4) => (__cxx_lvalue_4.value = (((__cxx_lvalue_4.value + 32768)) & 65535)))(cDeref(w, Uint16Array));
    }
  } else {
    for (; Boolean(((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = i32((previous - 1)); __cxx_lvalue_5.value = next; return previous; })(cRef(() => l, __cxx_lvalue_6 => { l = __cxx_lvalue_6; }))); ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_7.value = next; return previous; })(cRef(() => p, __cxx_lvalue_8 => { p = __cxx_lvalue_8; }))) {
      ((__cxx_lvalue_9) => (__cxx_lvalue_9.value = (((__cxx_lvalue_9.value + i32(((((128) & 255)) & 255)))) & 255)))(cDeref(p, Uint8Array));
    }
  }
}

// C/C++ source: source/libxmp-lite/src/sample.c:132
export function convert_endian(p, l) {
  let b;
  let i;
  for ((i = i32(0)); (i < l); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    (b = (((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    ((cDeref(cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((b) & 255));
    (p = cPointerOffset(p, 2, Uint8Array.BYTES_PER_ELEMENT));
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_06c875ca3b810b47 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_ef12182f4857252b6957979d() {
  return __cxx_static_address_ef12182f4857252b6957979d.reference || (__cxx_static_address_ef12182f4857252b6957979d.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_06c875ca3b810b47; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return (allocator).value.Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return (allocator).value.Free(p);
}
