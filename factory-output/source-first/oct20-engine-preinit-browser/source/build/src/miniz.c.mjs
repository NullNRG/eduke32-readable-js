// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/miniz.c
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
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_6d12afa4c343a06c = i32(3754936);
function __cxx_static_address_f112a34999b87602e3b8253e() {
  return __cxx_static_address_f112a34999b87602e3b8253e.reference || (__cxx_static_address_f112a34999b87602e3b8253e.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_6d12afa4c343a06c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_b599deb19bd65f21 = i32(1144);
function __cxx_static_address_a6c690038289bb7e446f64ac() {
  return __cxx_static_address_a6c690038289bb7e446f64ac.reference || (__cxx_static_address_a6c690038289bb7e446f64ac.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_b599deb19bd65f21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_8ef238e24f05a7c8 = i32(2147483647);
function __cxx_static_address_a554008b88ad34ecfe8566c5() {
  return __cxx_static_address_a554008b88ad34ecfe8566c5.reference || (__cxx_static_address_a554008b88ad34ecfe8566c5.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_8ef238e24f05a7c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_bffffc08f4fdbf22 = i32(2147483648);
function __cxx_static_address_db1f9932a95e46db67d3d6dd() {
  return __cxx_static_address_db1f9932a95e46db67d3d6dd.reference || (__cxx_static_address_db1f9932a95e46db67d3d6dd.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_bffffc08f4fdbf22; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_2674075c4f5c6b33 = i32(2147483648);
function __cxx_static_address_11db2402aab12c29ab697729() {
  return __cxx_static_address_11db2402aab12c29ab697729.reference || (__cxx_static_address_11db2402aab12c29ab697729.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_2674075c4f5c6b33; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_4962ed3c0deac434 = i32(65536);
function __cxx_static_address_1d10534ec8ca0fb5afe48159() {
  return __cxx_static_address_1d10534ec8ca0fb5afe48159.reference || (__cxx_static_address_1d10534ec8ca0fb5afe48159.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_4962ed3c0deac434; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_b4b666105f11dbdf = i32(32768);
function __cxx_static_address_9cf38af3a5aeba8146cbbe93() {
  return __cxx_static_address_9cf38af3a5aeba8146cbbe93.reference || (__cxx_static_address_9cf38af3a5aeba8146cbbe93.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_b4b666105f11dbdf; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_503bbc6d958b27e4 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_b35eadd673c3abd283910373() {
  return __cxx_static_address_b35eadd673c3abd283910373.reference || (__cxx_static_address_b35eadd673c3abd283910373.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_503bbc6d958b27e4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/miniz.c:40
export function mz_adler32(adler, ptr, buf_len) {
  let i;
  let s1 = u32((BigInt(adler) & BigInt(u64(65535))));
  let s2 = u32((BigInt(adler) >> BigInt(16)));
  let block_len = u64((BigInt(buf_len) % BigInt(u64(5552))));
  if ((!ptr)) {
    return u64(1);
  }
  while (Boolean(buf_len)) {
    for ((i = u32(0)); (u64(u32((i + u32(7)))) < block_len); ((i = u32((Number(i) + Number(u32(8))))), (ptr = cPointerOffset(ptr, 8, Uint8Array.BYTES_PER_ELEMENT)))) {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 4, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 5, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 6, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
      ((s1 = u32((Number(s1) + Number(u32((cDeref(cPointerOffset(ptr, 7, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
    }
    for (; (u64(i) < block_len); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return next; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      ((s1 = u32((Number(s1) + Number(u32((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => ptr, __cxx_lvalue_3 => { ptr = __cxx_lvalue_3; })), Uint8Array).value)))))), (s2 = u32((Number(s2) + Number(s1)))));
    }
    ((s1 = u32((Number(s1) % Number(65521)))), (s2 = u32((Number(s2) % Number(65521)))));
    (buf_len = u64((BigInt(buf_len) - BigInt(block_len))));
    (block_len = u64(5552));
  }
  return u64(u32((u32((s2 << 16)) + s1)));
}

// C/C++ source: source/build/src/miniz.c:95
let __static_mz_crc32_s_crc_table = new Uint32Array([u32(0), u32(1996959894), 3993919788, 2567524794, u32(124634137), u32(1886057615), 3915621685, 2657392035, u32(249268274), u32(2044508324), 3772115230, 2547177864, u32(162941995), u32(2125561021), 3887607047, 2428444049, u32(498536548), u32(1789927666), 4089016648, 2227061214, u32(450548861), u32(1843258603), 4107580753, 2211677639, u32(325883990), u32(1684777152), 4251122042, 2321926636, u32(335633487), u32(1661365465), 4195302755, 2366115317, u32(997073096), u32(1281953886), 3579855332, 2724688242, u32(1006888145), u32(1258607687), 3524101629, 2768942443, u32(901097722), u32(1119000684), 3686517206, 2898065728, u32(853044451), u32(1172266101), 3705015759, 2882616665, u32(651767980), u32(1373503546), 3369554304, 3218104598, u32(565507253), u32(1454621731), 3485111705, 3099436303, u32(671266974), u32(1594198024), 3322730930, 2970347812, u32(795835527), u32(1483230225), 3244367275, 3060149565, u32(1994146192), u32(31158534), 2563907772, 4023717930, u32(1907459465), u32(112637215), 2680153253, 3904427059, u32(2013776290), u32(251722036), 2517215374, 3775830040, u32(2137656763), u32(141376813), 2439277719, 3865271297, u32(1802195444), u32(476864866), 2238001368, 4066508878, u32(1812370925), u32(453092731), 2181625025, 4111451223, u32(1706088902), u32(314042704), 2344532202, 4240017532, u32(1658658271), u32(366619977), 2362670323, 4224994405, u32(1303535960), u32(984961486), 2747007092, 3569037538, u32(1256170817), u32(1037604311), 2765210733, 3554079995, u32(1131014506), u32(879679996), 2909243462, 3663771856, u32(1141124467), u32(855842277), 2852801631, 3708648649, u32(1342533948), u32(654459306), 3188396048, 3373015174, u32(1466479909), u32(544179635), 3110523913, 3462522015, u32(1591671054), u32(702138776), 2966460450, 3352799412, u32(1504918807), u32(783551873), 3082640443, 3233442989, 3988292384, 2596254646, u32(62317068), u32(1957810842), 3939845945, 2647816111, u32(81470997), u32(1943803523), 3814918930, 2489596804, u32(225274430), u32(2053790376), 3826175755, 2466906013, u32(167816743), u32(2097651377), 4027552580, 2265490386, u32(503444072), u32(1762050814), 4150417245, 2154129355, u32(426522225), u32(1852507879), 4275313526, 2312317920, u32(282753626), u32(1742555852), 4189708143, 2394877945, u32(397917763), u32(1622183637), 3604390888, 2714866558, u32(953729732), u32(1340076626), 3518719985, 2797360999, u32(1068828381), u32(1219638859), 3624741850, 2936675148, u32(906185462), u32(1090812512), 3747672003, 2825379669, u32(829329135), u32(1181335161), 3412177804, 3160834842, u32(628085408), u32(1382605366), 3423369109, 3138078467, u32(570562233), u32(1426400815), 3317316542, 2998733608, u32(733239954), u32(1555261956), 3268935591, 3050360625, u32(752459403), u32(1541320221), 2607071920, 3965973030, u32(1969922972), u32(40735498), 2617837225, 3943577151, u32(1913087877), u32(83908371), 2512341634, 3803740692, u32(2075208622), u32(213261112), 2463272603, 3855990285, u32(2094854071), u32(198958881), 2262029012, 4057260610, u32(1759359992), u32(534414190), 2176718541, 4139329115, u32(1873836001), u32(414664567), 2282248934, 4279200368, u32(1711684554), u32(285281116), 2405801727, 4167216745, u32(1634467795), u32(376229701), 2685067896, 3608007406, u32(1308918612), u32(956543938), 2808555105, 3495958263, u32(1231636301), u32(1047427035), 2932959818, 3654703836, u32(1088359270), u32(936918000), 2847714899, 3736837829, u32(1202900863), u32(817233897), 3183342108, 3401237130, u32(1404277552), u32(615818150), 3134207493, 3453421203, u32(1423857449), u32(601450431), 3009837614, 3294710456, u32(1567103746), u32(711928724), 3020668471, 3272380065, u32(1510334235), u32(755167117)]);
export function mz_crc32(crc, ptr, buf_len) {

  let mz_crc32 = u32((u32(crc) ^ 4294967295));
  let pByte_buf = cTypedPointer(ptr, Uint8Array);
  while ((buf_len >= u64(4))) {
    (mz_crc32 = u32(((mz_crc32 >>> 8) ^ (cDeref(cPointerOffset(__static_mz_crc32_s_crc_table, u32((u32((mz_crc32 ^ u32((cDeref(cPointerOffset(pByte_buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & u32(255))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))));
    (mz_crc32 = u32(((mz_crc32 >>> 8) ^ (cDeref(cPointerOffset(__static_mz_crc32_s_crc_table, u32((u32((mz_crc32 ^ u32((cDeref(cPointerOffset(pByte_buf, 1, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & u32(255))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))));
    (mz_crc32 = u32(((mz_crc32 >>> 8) ^ (cDeref(cPointerOffset(__static_mz_crc32_s_crc_table, u32((u32((mz_crc32 ^ u32((cDeref(cPointerOffset(pByte_buf, 2, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & u32(255))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))));
    (mz_crc32 = u32(((mz_crc32 >>> 8) ^ (cDeref(cPointerOffset(__static_mz_crc32_s_crc_table, u32((u32((mz_crc32 ^ u32((cDeref(cPointerOffset(pByte_buf, 3, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & u32(255))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))));
    (pByte_buf = cPointerOffset(pByte_buf, 4, Uint8Array.BYTES_PER_ELEMENT));
    (buf_len = u64((BigInt(buf_len) - BigInt(u64(4)))));
  }
  while (Boolean(buf_len)) {
    (mz_crc32 = u32(((mz_crc32 >>> 8) ^ (cDeref(cPointerOffset(__static_mz_crc32_s_crc_table, u32((u32((mz_crc32 ^ u32((cDeref(cPointerOffset(pByte_buf, 0, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)))) & u32(255))), Uint32Array.BYTES_PER_ELEMENT), Uint32Array).value))));
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return next; })(cRef(() => pByte_buf, __cxx_lvalue_1 => { pByte_buf = __cxx_lvalue_1; }));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u64((previous - 1n)); __cxx_lvalue_2.value = next; return next; })(cRef(() => buf_len, __cxx_lvalue_3 => { buf_len = __cxx_lvalue_3; }));
  }
  return u64((~mz_crc32));
}

// C/C++ source: source/build/src/miniz.c:182
const __cxx_literal_83572a3de406cfcc4548 = Uint8Array.from([49, 49, 46, 48, 46, 50, 0]);
export function mz_version() {
  return __cxx_literal_83572a3de406cfcc4548;
}

// C/C++ source: source/build/src/miniz.c:299
export function mz_deflateEnd(pStream) {
  if ((!pStream)) {
    return i32(-2);
  }
  if (cRecordObject(pStream).state) {
    cRecordObject(pStream).zfree(cRecordObject(pStream).opaque, cRecordObject(pStream).state);
    (cRecordObject(pStream).state = null);
  }
  return i32(0);
}

// C/C++ source: source/build/src/miniz.c:311
export function mz_deflateBound(pStream, source_len) {
  pStream;
  return (((BigInt(u64(128)) + BigInt((BigInt((BigInt(source_len) * BigInt(u64(110)))) / BigInt(u64(100))))) > (BigInt((BigInt(u64(128)) + BigInt(source_len))) + BigInt((BigInt((BigInt((BigInt(source_len) / BigInt(u64(i32(Math.imul(31, 1024)))))) + BigInt(u64(1)))) * BigInt(u64(5)))))) ? (BigInt(u64(128)) + BigInt((BigInt((BigInt(source_len) * BigInt(u64(110)))) / BigInt(u64(100))))) : (BigInt((BigInt(u64(128)) + BigInt(source_len))) + BigInt((BigInt((BigInt((BigInt(source_len) / BigInt(u64(i32(Math.imul(31, 1024)))))) + BigInt(u64(1)))) * BigInt(u64(5))))));
}

// C/C++ source: source/build/src/miniz.c:353
export function mz_compressBound(source_len) {
  return mz_deflateBound(null, source_len);
}

// C/C++ source: source/build/src/miniz.c:412
export function mz_inflateReset(pStream) {
  let pDecomp;
  if ((!pStream)) {
    return i32(-2);
  }
  (cRecordObject(pStream).data_type = i32(0));
  (cRecordObject(pStream).adler = u64(0));
  (cRecordObject(pStream).msg = null);
  (cRecordObject(pStream).total_in = u64(0));
  (cRecordObject(pStream).total_out = u64(0));
  (cRecordObject(pStream).reserved = u64(0));
  (pDecomp = cRecordObject(pStream).state);
  do {
    (cRecordObject(cObjectFieldRef((pDecomp).value, "m_decomp")).m_state = u32(0));
  } while (Boolean(0));
  ((pDecomp).value.m_dict_ofs = u32(0));
  ((pDecomp).value.m_dict_avail = u32(0));
  ((pDecomp).value.m_last_status = 1);
  ((pDecomp).value.m_first_call = u32(1));
  ((pDecomp).value.m_has_flushed = u32(0));
  ;
  return i32(0);
}

// C/C++ source: source/build/src/miniz.c:550
export function mz_inflateEnd(pStream) {
  if ((!pStream)) {
    return i32(-2);
  }
  if (cRecordObject(pStream).state) {
    cRecordObject(pStream).zfree(cRecordObject(pStream).opaque, cRecordObject(pStream).state);
    (cRecordObject(pStream).state = null);
  }
  return i32(0);
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_eab4c713e175c9a7 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_cc56cd4f4c7db163947bb6de() {
  return __cxx_static_address_cc56cd4f4c7db163947bb6de.reference || (__cxx_static_address_cc56cd4f4c7db163947bb6de.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_eab4c713e175c9a7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:866
export function _sm_realloc(allocator, p, bytesCount, alignment) {
  return cRecordObject(allocator).Realloc(p, bytesCount, alignment);
}
