// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/flac.cpp
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
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_12089c48479fb55a = i32(3754936);
function __cxx_static_address_d72d2cc9ed1cf2df0645c741() {
  return __cxx_static_address_d72d2cc9ed1cf2df0645c741.reference || (__cxx_static_address_d72d2cc9ed1cf2df0645c741.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_12089c48479fb55a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_af8b4cd1fa4b5cec = i32(1144);
function __cxx_static_address_4df8996f602be94b4c94a1f7() {
  return __cxx_static_address_4df8996f602be94b4c94a1f7.reference || (__cxx_static_address_4df8996f602be94b4c94a1f7.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_af8b4cd1fa4b5cec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/libdivide.h:152
export function libdivide_u64_t() {
  return libdivide_u64_t.type || (libdivide_u64_t.type = class libdivide_u64_t__implementation {
  constructor() {
    this.magic = undefined;
    this.more = undefined;
  }
});
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_609a0ad6461338e6 = i32(2147483647);
function __cxx_static_address_8f2ff928be752a14463ad579() {
  return __cxx_static_address_8f2ff928be752a14463ad579.reference || (__cxx_static_address_8f2ff928be752a14463ad579.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_609a0ad6461338e6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_8616b2771ca698b5 = i32(2147483648);
function __cxx_static_address_c354f5bd4a263d8620e7b125() {
  return __cxx_static_address_c354f5bd4a263d8620e7b125.reference || (__cxx_static_address_c354f5bd4a263d8620e7b125.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_8616b2771ca698b5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_0f2e14cfbe8e6486 = i32(2147483648);
function __cxx_static_address_10108101cc9767c12f8e24fc() {
  return __cxx_static_address_10108101cc9767c12f8e24fc.reference || (__cxx_static_address_10108101cc9767c12f8e24fc.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_0f2e14cfbe8e6486; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_76764604b2c88ae6 = i32(65536);
function __cxx_static_address_b4c5f66e1335da48b4f5ca6c() {
  return __cxx_static_address_b4c5f66e1335da48b4f5ca6c.reference || (__cxx_static_address_b4c5f66e1335da48b4f5ca6c.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_76764604b2c88ae6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_fa65a60c774efca2 = i32(32768);
function __cxx_static_address_5e7500b155e766ed7b02a4d8() {
  return __cxx_static_address_5e7500b155e766ed7b02a4d8.reference || (__cxx_static_address_5e7500b155e766ed7b02a4d8.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_fa65a60c774efca2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_c0a7316410f776a0 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_4c607c47fc7c2a317f23156e() {
  return __cxx_static_address_4c607c47fc7c2a317f23156e.reference || (__cxx_static_address_4c607c47fc7c2a317f23156e.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_c0a7316410f776a0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/flac.cpp:94
export function write_flac(ptr, size, nmemb, datasource) {
  (ptr = ptr);
  (size = u64(size));
  (nmemb = u64(nmemb));
  (datasource = datasource);
  return u64(0);
}

// C/C++ source: source/audiolib/src/flac.cpp:104
export function seek_flac(datasource, offset, whence) {
  let flac = datasource;
  switch (whence) {
    case 0: {
      (cRecordObject(flac).pos = u64(0));
    }
    break;
    case 1: {
      break;
    }
    case 2: {
      (cRecordObject(flac).pos = u64(cRecordObject(flac).length));
    }
    break;
  }
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = u64((BigInt(__cxx_lvalue_0.value) + BigInt(u64(offset))))))(cObjectFieldRef(cRecordObject(flac), "pos"));
  if ((cRecordObject(flac).pos > cRecordObject(flac).length)) {
    (cRecordObject(flac).pos = u64(cRecordObject(flac).length));
  }
  return i32(0);
}

// C/C++ source: source/audiolib/src/flac.cpp:125
export function tell_flac(datasource) {
  let flac = datasource;
  return i64(cRecordObject(flac).pos);
}

// C/C++ source: source/audiolib/src/flac.cpp:132
export function length_flac(datasource) {
  let flac = datasource;
  return i64(cRecordObject(flac).length);
}

// C/C++ source: source/audiolib/src/flac.cpp:139
export function eof_flac(datasource) {
  let flac = datasource;
  return i32((cRecordObject(flac).pos == cRecordObject(flac).length));
}

// C/C++ source: source/audiolib/src/flac.cpp:146
export function close_flac(datasource) {
  (datasource = datasource);
  return i32(0);
}

// C/C++ source: source/audiolib/src/flac.cpp:177
export function seek_flac_stream(decoder, absolute_byte_offset, client_data) {
  (decoder = decoder);
  if ((seek_flac(client_data, i64(absolute_byte_offset), 0) < 0)) {
    return 1;
  } else {
    return 0;
  }
}

// C/C++ source: source/audiolib/src/flac.cpp:187
export function tell_flac_stream(decoder, absolute_byte_offset, client_data) {
  (decoder = decoder);
  ((cDeref(absolute_byte_offset, BigUint64Array).value) = u64(tell_flac(client_data)));
  return 0;
}

// C/C++ source: source/audiolib/src/flac.cpp:195
export function length_flac_stream(decoder, stream_length, client_data) {
  (decoder = decoder);
  ((cDeref(stream_length, BigUint64Array).value) = u64(length_flac(client_data)));
  return 0;
}

// C/C++ source: source/audiolib/src/flac.cpp:203
export function eof_flac_stream(decoder, client_data) {
  (decoder = decoder);
  return eof_flac(client_data);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_f536c26d5f5639c8 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_501ce29303b33ab44a0fd056() {
  return __cxx_static_address_501ce29303b33ab44a0fd056.reference || (__cxx_static_address_501ce29303b33ab44a0fd056.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_f536c26d5f5639c8; },
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
