// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/dataio.c
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_500b27279a97c178 = i32(3754936);
function __cxx_static_address_7954a73b6eda30fe4a07c02a() {
  return __cxx_static_address_7954a73b6eda30fe4a07c02a.reference || (__cxx_static_address_7954a73b6eda30fe4a07c02a.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_500b27279a97c178; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_f5e592cb05d4baca = i32(1144);
function __cxx_static_address_ffe84e2fda488aa50b6955a7() {
  return __cxx_static_address_ffe84e2fda488aa50b6955a7.reference || (__cxx_static_address_ffe84e2fda488aa50b6955a7.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_f5e592cb05d4baca; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_a3e6047ada959093 = i32(2147483647);
function __cxx_static_address_6a2c6b039a57d9e33808605c() {
  return __cxx_static_address_6a2c6b039a57d9e33808605c.reference || (__cxx_static_address_6a2c6b039a57d9e33808605c.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_a3e6047ada959093; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_15cdfa6243bf9b50 = i32(2147483648);
function __cxx_static_address_82bd0769022151d88ad3ba7f() {
  return __cxx_static_address_82bd0769022151d88ad3ba7f.reference || (__cxx_static_address_82bd0769022151d88ad3ba7f.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_15cdfa6243bf9b50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_5f3c4101da315f73 = i32(2147483648);
function __cxx_static_address_4e4e02b07d98a49f0c0a56d6() {
  return __cxx_static_address_4e4e02b07d98a49f0c0a56d6.reference || (__cxx_static_address_4e4e02b07d98a49f0c0a56d6.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_5f3c4101da315f73; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_ec46c38311c67ecc = i32(65536);
function __cxx_static_address_b2fe6c45062cc450c1fff7ee() {
  return __cxx_static_address_b2fe6c45062cc450c1fff7ee.reference || (__cxx_static_address_b2fe6c45062cc450c1fff7ee.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_ec46c38311c67ecc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_380c96d9cafa4f26 = i32(32768);
function __cxx_static_address_ef6633c88802bbd151890d4b() {
  return __cxx_static_address_ef6633c88802bbd151890d4b.reference || (__cxx_static_address_ef6633c88802bbd151890d4b.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_380c96d9cafa4f26; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_c2d69207cf43c828 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_a1441e047fd38e1e6f028ba5() {
  return __cxx_static_address_a1441e047fd38e1e6f028ba5.reference || (__cxx_static_address_a1441e047fd38e1e6f028ba5.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_c2d69207cf43c828; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/dataio.c:158
export function readmem16l(m) {
  let a;
  let b;
  (a = u32((cDeref(cPointerOffset(m, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (b = u32((cDeref(cPointerOffset(m, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  return ((u32((u32((b << 8)) | a))) & 65535);
}

// C/C++ source: source/libxmp-lite/src/dataio.c:168
export function readmem16b(m) {
  let a;
  let b;
  (a = u32((cDeref(cPointerOffset(m, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (b = u32((cDeref(cPointerOffset(m, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  return ((u32((u32((a << 8)) | b))) & 65535);
}

// C/C++ source: source/libxmp-lite/src/dataio.c:178
export function readmem24l(m) {
  let a;
  let b;
  let c;
  (a = u32((cDeref(cPointerOffset(m, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (b = u32((cDeref(cPointerOffset(m, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (c = u32((cDeref(cPointerOffset(m, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  return u32((u32((u32((c << 16)) | u32((b << 8)))) | a));
}

// C/C++ source: source/libxmp-lite/src/dataio.c:189
export function readmem24b(m) {
  let a;
  let b;
  let c;
  (a = u32((cDeref(cPointerOffset(m, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (b = u32((cDeref(cPointerOffset(m, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (c = u32((cDeref(cPointerOffset(m, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  return u32((u32((u32((a << 16)) | u32((b << 8)))) | c));
}

// C/C++ source: source/libxmp-lite/src/dataio.c:200
export function readmem32l(m) {
  let a;
  let b;
  let c;
  let d;
  (a = u32((cDeref(cPointerOffset(m, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (b = u32((cDeref(cPointerOffset(m, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (c = u32((cDeref(cPointerOffset(m, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (d = u32((cDeref(cPointerOffset(m, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  return u32((u32((u32((u32((d << 24)) | u32((c << 16)))) | u32((b << 8)))) | a));
}

// C/C++ source: source/libxmp-lite/src/dataio.c:212
export function readmem32b(m) {
  let a;
  let b;
  let c;
  let d;
  (a = u32((cDeref(cPointerOffset(m, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (b = u32((cDeref(cPointerOffset(m, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (c = u32((cDeref(cPointerOffset(m, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  (d = u32((cDeref(cPointerOffset(m, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)));
  return u32((u32((u32((u32((a << 24)) | u32((b << 16)))) | u32((c << 8)))) | d));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_10d2b2fd460fef70 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_4fdaf95646d98d2ba2c38af2() {
  return __cxx_static_address_4fdaf95646d98d2ba2c38af2.reference || (__cxx_static_address_4fdaf95646d98d2ba2c38af2.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_10d2b2fd460fef70; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
