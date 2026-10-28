// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/fix16.cpp
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
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_ff2bf6befb2f588a = i32(3754936);
function __cxx_static_address_863d40a2b51f4af43a22e2c6() {
  return __cxx_static_address_863d40a2b51f4af43a22e2c6.reference || (__cxx_static_address_863d40a2b51f4af43a22e2c6.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_ff2bf6befb2f588a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_64817fc3e0c5c4b0 = i32(1144);
function __cxx_static_address_c5486325e12842f2afbe114c() {
  return __cxx_static_address_c5486325e12842f2afbe114c.reference || (__cxx_static_address_c5486325e12842f2afbe114c.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_64817fc3e0c5c4b0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/libdivide.h:142
export function libdivide_u32_t() {
  return libdivide_u32_t.type || (libdivide_u32_t.type = class libdivide_u32_t__implementation {
  constructor() {
    this.magic = undefined;
    this.more = undefined;
  }
});
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_dd5b544cf1a4f51a = i32(2147483647);
function __cxx_static_address_e1eb684c313327695452b6d8() {
  return __cxx_static_address_e1eb684c313327695452b6d8.reference || (__cxx_static_address_e1eb684c313327695452b6d8.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_dd5b544cf1a4f51a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_01e9fa8148425ee2 = i32(2147483648);
function __cxx_static_address_4d8ba3fe307e190f0873c3c7() {
  return __cxx_static_address_4d8ba3fe307e190f0873c3c7.reference || (__cxx_static_address_4d8ba3fe307e190f0873c3c7.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_01e9fa8148425ee2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c9178fba267c7772 = i32(2147483648);
function __cxx_static_address_dd9680b6be98d6da4fc1a7c2() {
  return __cxx_static_address_dd9680b6be98d6da4fc1a7c2.reference || (__cxx_static_address_dd9680b6be98d6da4fc1a7c2.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c9178fba267c7772; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_1c692de263de3c80 = i32(65536);
function __cxx_static_address_170b564da930cfa900272048() {
  return __cxx_static_address_170b564da930cfa900272048.reference || (__cxx_static_address_170b564da930cfa900272048.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_1c692de263de3c80; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_286ad3f573e14f0e = i32(32768);
function __cxx_static_address_a4f6f454acd7d135a3757ced() {
  return __cxx_static_address_a4f6f454acd7d135a3757ced.reference || (__cxx_static_address_a4f6f454acd7d135a3757ced.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_286ad3f573e14f0e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_913f3ae238b7e9f0 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_987ce5bc01a07b8ae96c3d92() {
  return __cxx_static_address_987ce5bc01a07b8ae96c3d92.reference || (__cxx_static_address_987ce5bc01a07b8ae96c3d92.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_913f3ae238b7e9f0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/fix16.cpp:9
export function fix16_add(a, b) {
  let _a = u32(a);
  let _b = u32(b);
  let sum = u32((_a + _b));
  if (((!Boolean(u32((u32((_a ^ _b)) & 2147483648)))) && Boolean(u32((u32((_a ^ sum)) & 2147483648))))) {
    return i32(FIX16_OVERFLOW__header_global_c9178fba267c7772);
  }
  return i32(sum);
}

// C/C++ source: source/build/src/fix16.cpp:24
export function fix16_sub(a, b) {
  let _a = u32(a);
  let _b = u32(b);
  let diff = u32((_a - _b));
  if ((Boolean(u32((u32((_a ^ _b)) & 2147483648))) && Boolean(u32((u32((_a ^ diff)) & 2147483648))))) {
    return i32(FIX16_OVERFLOW__header_global_c9178fba267c7772);
  }
  return i32(diff);
}

// C/C++ source: source/build/src/fix16.cpp:38
export function fix16_sadd(a, b) {
  let result = i32(fix16_add(a, b));
  if ((result == FIX16_OVERFLOW__header_global_c9178fba267c7772)) {
    return i32(((a >= 0) ? FIX16_MAX__header_global_dd5b544cf1a4f51a : FIX16_MIN__header_global_01e9fa8148425ee2));
  }
  return i32(result);
}

// C/C++ source: source/build/src/fix16.cpp:48
export function fix16_ssub(a, b) {
  let result = i32(fix16_sub(a, b));
  if ((result == FIX16_OVERFLOW__header_global_c9178fba267c7772)) {
    return i32(((a >= 0) ? FIX16_MAX__header_global_dd5b544cf1a4f51a : FIX16_MIN__header_global_01e9fa8148425ee2));
  }
  return i32(result);
}

// C/C++ source: source/build/src/fix16.cpp:66
export function fix16_mul(inArg0, inArg1) {
  let product = i64((BigInt(i64(inArg0)) * BigInt(i64(inArg1))));
  let upper = u32((BigInt(product) >> BigInt(47)));
  if ((product < i64(0))) {
    if (Boolean((~upper))) {
      return i32(FIX16_OVERFLOW__header_global_c9178fba267c7772);
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => product, __cxx_lvalue_1 => { product = __cxx_lvalue_1; }));
  } else {
    if (Boolean(upper)) {
      return i32(FIX16_OVERFLOW__header_global_c9178fba267c7772);
    }
  }
  let result = i32((BigInt(product) >> BigInt(16)));
  (result = i32((Number(result) + Number((BigInt((BigInt(product) & BigInt(i64(32768)))) >> BigInt(15))))));
  return i32(result);
}

// C/C++ source: source/build/src/fix16.cpp:94
export function fix16_smul(inArg0, inArg1) {
  let result = i32(fix16_mul(inArg0, inArg1));
  if ((result == FIX16_OVERFLOW__header_global_c9178fba267c7772)) {
    if ((i32((inArg0 >= 0)) == i32((inArg1 >= 0)))) {
      return i32(FIX16_MAX__header_global_dd5b544cf1a4f51a);
    } else {
      return i32(FIX16_MIN__header_global_01e9fa8148425ee2);
    }
  }
  return i32(result);
}

// C/C++ source: source/build/src/fix16.cpp:209
export function fix16_lerp8(inArg0, inArg1, inFract) {
  let tempOut = i64(int64_mul_i32_i32__header_a4a681487bfb(inArg0, i32((i32((1 << 8)) - i32(inFract)))));
  (tempOut = i64(int64_add__header_1acc03e5f985(tempOut, int64_mul_i32_i32__header_a4a681487bfb(inArg1, i32(inFract)))));
  (tempOut = i64(int64_shift__header_344b0e4a1f0d(tempOut, ((((-8)) << 24) >> 24))));
  return i32(int64_lo__header_b38385bd87ce(tempOut));
}

// C/C++ source: source/build/src/fix16.cpp:217
export function fix16_lerp16(inArg0, inArg1, inFract) {
  let tempOut = i64(int64_mul_i32_i32__header_a4a681487bfb(inArg0, i32((i32((i32(1) << 16)) - i32(inFract)))));
  (tempOut = i64(int64_add__header_1acc03e5f985(tempOut, int64_mul_i32_i32__header_a4a681487bfb(inArg1, i32(inFract)))));
  (tempOut = i64(int64_shift__header_344b0e4a1f0d(tempOut, ((((-16)) << 24) >> 24))));
  return i32(int64_lo__header_b38385bd87ce(tempOut));
}

// C/C++ source: source/build/src/fix16.cpp:225
export function fix16_lerp32(inArg0, inArg1, inFract) {
  let tempOut;
  (tempOut = i64((BigInt(i64(inArg0)) * BigInt(i64(u32((u32(0) - inFract)))))));
  (tempOut = i64((BigInt(tempOut) + BigInt((BigInt(i64(inArg1)) * BigInt(i64(inFract)))))));
  (tempOut = i64((BigInt(tempOut) >> BigInt(32))));
  return i32(tempOut);
}

// C/C++ source: source/build/src/fix16.cpp:234
export const scales = new Uint32Array([u32(1), u32(10), u32(100), u32(1000), u32(10000), u32(100000), u32(100000), u32(100000)]);
function __cxx_static_address_3ae330fcfa1eb93da2c1b358() {
  return __cxx_static_address_3ae330fcfa1eb93da2c1b358.reference || (__cxx_static_address_3ae330fcfa1eb93da2c1b358.reference = {
    __cReference: true,
    get value() { return scales; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/fix16.cpp:239
export function itoa_loop(buf, scale, value, skip) {
  while (Boolean(scale)) {
    let digit = u32(Math.trunc(value / scale));
    if ((((!skip) || Boolean(digit)) || (scale == u32(1)))) {
      (skip = Boolean(false));
      ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => buf, __cxx_lvalue_1 => { buf = __cxx_lvalue_1; })), Uint8Array).value) = ((((u32((u32(48) + digit))) & 255)) & 255));
      (value = u32((Number(value) % Number(scale))));
    }
    (scale = u32((Number(scale) / Number(u32(10)))));
  }
  return buf;
}

// C/C++ source: source/build/src/fix16.cpp:257
export function fix16_to_str(value, buf, decimals) {
  let uvalue = u32(((value >= 0) ? value : (-value)));
  if ((value < 0)) {
    ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => buf, __cxx_lvalue_1 => { buf = __cxx_lvalue_1; })), Uint8Array).value) = ((45) & 255));
  }
  let intpart = u32((uvalue >>> 16));
  let fracpart = u32((uvalue & u32(65535)));
  let scale = u32((cDeref(cPointerOffset(scales, i32((decimals & 7)), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value));
  (fracpart = u32(fix16_mul(i32(fracpart), i32(scale))));
  if ((fracpart >= scale)) {
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => intpart, __cxx_lvalue_3 => { intpart = __cxx_lvalue_3; }));
    (fracpart = u32((Number(fracpart) - Number(scale))));
  }
  (buf = itoa_loop(buf, u32(10000), intpart, true));
  if ((scale != u32(1))) {
    ((cDeref(((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_4.value = next; return previous; })(cRef(() => buf, __cxx_lvalue_5 => { buf = __cxx_lvalue_5; })), Uint8Array).value) = ((46) & 255));
    (buf = itoa_loop(buf, Math.trunc(scale / u32(10)), fracpart, false));
  }
  ((cDeref(buf, Uint8Array).value) = ((0) & 255));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_4b6f253cf59fc4f5 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_1937acac579b669c02310fd4() {
  return __cxx_static_address_1937acac579b669c02310fd4.reference || (__cxx_static_address_1937acac579b669c02310fd4.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_4b6f253cf59fc4f5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/fix16.cpp:21
export function int64_mul_i32_i32__header_a4a681487bfb(x, y) {
  return i64(i32(Math.imul(x, y)));
}

// C/C++ source: source/build/src/fix16.cpp:16
export function int64_add__header_1acc03e5f985(x, y) {
  return i64((BigInt(x) + BigInt(y)));
}

// C/C++ source: source/build/src/fix16.cpp:19
export function int64_shift__header_344b0e4a1f0d(x, y) {
  return i64(((i32(y) < 0) ? (BigInt(x) >> BigInt((-i32(y)))) : (BigInt(x) << BigInt(i32(y)))));
}

// C/C++ source: source/build/src/fix16.cpp:14
export function int64_lo__header_b38385bd87ce(x) {
  return u32((BigInt(u64(x)) & BigInt((BigInt((BigInt(1n) << BigInt(32))) - BigInt(u64(1))))));
}
