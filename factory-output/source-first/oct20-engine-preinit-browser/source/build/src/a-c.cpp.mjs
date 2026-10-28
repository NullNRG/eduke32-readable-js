// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/a-c.cpp
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
export const fix16_rad_to_deg_mult__header_global_a7d1ff7e793747d5 = i32(3754936);
function __cxx_static_address_55e37a253533e3e7c7a145eb() {
  return __cxx_static_address_55e37a253533e3e7c7a145eb.reference || (__cxx_static_address_55e37a253533e3e7c7a145eb.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_a7d1ff7e793747d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_e78a7657337498de = i32(1144);
function __cxx_static_address_086aad3710e1ab0b7abf5e0b() {
  return __cxx_static_address_086aad3710e1ab0b7abf5e0b.reference || (__cxx_static_address_086aad3710e1ab0b7abf5e0b.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_e78a7657337498de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:30
export let bpl = 0;
function __cxx_static_address_08e39f37b042ed02c5013c69() {
  return __cxx_static_address_08e39f37b042ed02c5013c69.reference || (__cxx_static_address_08e39f37b042ed02c5013c69.reference = {
    __cReference: true,
    get value() { return bpl; },
    set value(__cxx_lvalue_0) { bpl = i32(__cxx_lvalue_0); }
  });
}

export let transmode = i32(0);
function __cxx_static_address_9aa917fe275d0cd39c0e94bf() {
  return __cxx_static_address_9aa917fe275d0cd39c0e94bf.reference || (__cxx_static_address_9aa917fe275d0cd39c0e94bf.reference = {
    __cReference: true,
    get value() { return transmode; },
    set value(__cxx_lvalue_0) { transmode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:31
export let gbuf = null;
function __cxx_static_address_22041f041b11566b4a219496() {
  return __cxx_static_address_22041f041b11566b4a219496.reference || (__cxx_static_address_22041f041b11566b4a219496.reference = {
    __cReference: true,
    get value() { return gbuf; },
    set value(__cxx_lvalue_0) { gbuf = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/a-c.cpp:32
export let glogx = 0;
function __cxx_static_address_7570717bd938431cbd93672c() {
  return __cxx_static_address_7570717bd938431cbd93672c.reference || (__cxx_static_address_7570717bd938431cbd93672c.reference = {
    __cReference: true,
    get value() { return glogx; },
    set value(__cxx_lvalue_0) { glogx = i32(__cxx_lvalue_0); }
  });
}

export let glogy = 0;
function __cxx_static_address_d44ff7f9144b4a045ba0e5d9() {
  return __cxx_static_address_d44ff7f9144b4a045ba0e5d9.reference || (__cxx_static_address_d44ff7f9144b4a045ba0e5d9.reference = {
    __cReference: true,
    get value() { return glogy; },
    set value(__cxx_lvalue_0) { glogy = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:33
export let gpinc = 0;
export function __cxx_global_cell_f73a7c611278ae39b7b9ad95() {
  return __cxx_global_cell_f73a7c611278ae39b7b9ad95.reference || (__cxx_global_cell_f73a7c611278ae39b7b9ad95.reference = {
    __cReference: true,
    get value() { return gpinc; },
    set value(__cxx_lvalue_0) { gpinc = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:34
export let gbxinc = 0;
function __cxx_static_address_746de1f23df795448427ba94() {
  return __cxx_static_address_746de1f23df795448427ba94.reference || (__cxx_static_address_746de1f23df795448427ba94.reference = {
    __cReference: true,
    get value() { return gbxinc; },
    set value(__cxx_lvalue_0) { gbxinc = i32(__cxx_lvalue_0); }
  });
}

export let gbyinc = 0;
function __cxx_static_address_4ae885815807b83a5016eb2f() {
  return __cxx_static_address_4ae885815807b83a5016eb2f.reference || (__cxx_static_address_4ae885815807b83a5016eb2f.reference = {
    __cReference: true,
    get value() { return gbyinc; },
    set value(__cxx_lvalue_0) { gbyinc = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_c9123f4f75cb056b = i32(2147483647);
function __cxx_static_address_7f34366c1603b079c45b1d92() {
  return __cxx_static_address_7f34366c1603b079c45b1d92.reference || (__cxx_static_address_7f34366c1603b079c45b1d92.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_c9123f4f75cb056b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_f2c0a39d05116715 = i32(2147483648);
function __cxx_static_address_f290ff8f285eb3e8e26746e7() {
  return __cxx_static_address_f290ff8f285eb3e8e26746e7.reference || (__cxx_static_address_f290ff8f285eb3e8e26746e7.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_f2c0a39d05116715; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_c99f1792c3a553a6 = i32(2147483648);
function __cxx_static_address_9738d8767c372602cf002c32() {
  return __cxx_static_address_9738d8767c372602cf002c32.reference || (__cxx_static_address_9738d8767c372602cf002c32.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_c99f1792c3a553a6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_b9fb9d14c629fddb = i32(65536);
function __cxx_static_address_22d6e0cfde8d70a034d1a397() {
  return __cxx_static_address_22d6e0cfde8d70a034d1a397.reference || (__cxx_static_address_22d6e0cfde8d70a034d1a397.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_b9fb9d14c629fddb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_3d2360ac85a99e08 = i32(32768);
function __cxx_static_address_a39689cc6dd54d1ebac80c39() {
  return __cxx_static_address_a39689cc6dd54d1ebac80c39.reference || (__cxx_static_address_a39689cc6dd54d1ebac80c39.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_3d2360ac85a99e08; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_67ef219796cc7ffc = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_c8d6528c236357cf30d7cef9() {
  return __cxx_static_address_c8d6528c236357cf30d7cef9.reference || (__cxx_static_address_c8d6528c236357cf30d7cef9.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_67ef219796cc7ffc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:35
export let gpal = null;
function __cxx_static_address_d1618eacc5ba224050538fb0() {
  return __cxx_static_address_d1618eacc5ba224050538fb0.reference || (__cxx_static_address_d1618eacc5ba224050538fb0.reference = {
    __cReference: true,
    get value() { return gpal; },
    set value(__cxx_lvalue_0) { gpal = __cxx_lvalue_0; }
  });
}

export let ghlinepal = null;
function __cxx_static_address_cc1156dd7b32ac0a09a14194() {
  return __cxx_static_address_cc1156dd7b32ac0a09a14194.reference || (__cxx_static_address_cc1156dd7b32ac0a09a14194.reference = {
    __cReference: true,
    get value() { return ghlinepal; },
    set value(__cxx_lvalue_0) { ghlinepal = __cxx_lvalue_0; }
  });
}

export let gtrans = null;
function __cxx_static_address_e49878c5ee3c24762fc31d7c() {
  return __cxx_static_address_e49878c5ee3c24762fc31d7c.reference || (__cxx_static_address_e49878c5ee3c24762fc31d7c.reference = {
    __cReference: true,
    get value() { return gtrans; },
    set value(__cxx_lvalue_0) { gtrans = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/a-c.cpp:36
export let gpal2 = null;
function __cxx_static_address_90869b78067f120311d76d19() {
  return __cxx_static_address_90869b78067f120311d76d19.reference || (__cxx_static_address_90869b78067f120311d76d19.reference = {
    __cReference: true,
    get value() { return gpal2; },
    set value(__cxx_lvalue_0) { gpal2 = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/a-c.cpp:39
export function setvlinebpl(dabpl) {
  (bpl = i32(dabpl));
}

// C/C++ source: source/build/src/a-c.cpp:40
export function fixtransluscence(datransoff) {
  (gtrans = cTypedPointer(datransoff, Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:44
export function settransnormal() {
  (transmode = i32(0));
}

// C/C++ source: source/build/src/a-c.cpp:45
export function settransreverse() {
  (transmode = i32(1));
}

// C/C++ source: source/build/src/a-c.cpp:50
export function sethlinesizes(logx, logy, bufplc) {
  (glogx = i32(logx));
  (glogy = i32(logy));
  (gbuf = cTypedPointer(bufplc, Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:52
export function setpalookupaddress(paladdr) {
  (ghlinepal = paladdr);
}

// C/C++ source: source/build/src/a-c.cpp:53
export function setuphlineasm4(bxinc, byinc) {
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
}

// C/C++ source: source/build/src/a-c.cpp:121
export function ourmulscale32(a, b) {
  return u32((BigInt((BigInt(u64(a)) * BigInt(u64(b)))) >> BigInt(32)));
}

// C/C++ source: source/build/src/a-c.cpp:131
export function setupvlineasm(neglogy) {
  (glogy = i32(neglogy));
}

// C/C++ source: source/build/src/a-c.cpp:330
export let g_saturate = 0;
function __cxx_static_address_97546b2e341941f0fb9652d0() {
  return __cxx_static_address_97546b2e341941f0fb9652d0.reference || (__cxx_static_address_97546b2e341941f0fb9652d0.reference = {
    __cReference: true,
    get value() { return g_saturate; },
    set value(__cxx_lvalue_0) { g_saturate = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/a-c.cpp:336
export function setupmvlineasm(neglogy, dosaturate) {
  (glogy = i32(neglogy));
  (g_saturate = i32((-i32((!(!Boolean(dosaturate)))))));
}

// C/C++ source: source/build/src/a-c.cpp:462
export function setuptvlineasm(neglogy, dosaturate) {
  (glogy = i32(neglogy));
  (g_saturate = i32((-i32((!(!Boolean(dosaturate)))))));
}

// C/C++ source: source/build/src/a-c.cpp:496
export function setuptvlineasm2(neglogy, paloffs1, paloffs2) {
  (glogy = i32(neglogy));
  (gpal = cTypedPointer(paloffs1, Uint8Array));
  (gpal2 = cTypedPointer(paloffs2, Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:543
export function msethlineshift(logx, logy) {
  (glogx = i32(logx));
  (glogy = i32(logy));
}

// C/C++ source: source/build/src/a-c.cpp:569
export function tsethlineshift(logx, logy) {
  (glogx = i32(logx));
  (glogy = i32(logy));
}

// C/C++ source: source/build/src/a-c.cpp:600
export function setupspritevline(paloffs, bxinc, byinc, ysiz) {
  (gpal = cTypedPointer(paloffs, Uint8Array));
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
  (glogy = i32(ysiz));
}

// C/C++ source: source/build/src/a-c.cpp:607
export function spritevline(bx, by, cnt, bufplc, p) {
  (gbuf = cTypedPointer(bufplc, Uint8Array));
  for (; (cnt > i64(1)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))) {
    ((cDeref(cTypedPointer(p, Uint8Array), Uint8Array).value) = (((cDeref(cPointerOffset(gpal, (cDeref(cPointerOffset(gbuf, i32((i32(Math.imul(i32((bx >> 16)), glogy)) + i32((by >> 16)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    (bx = i32((Number(bx) + Number(gbxinc))));
    (by = i32((Number(by) + Number(gbyinc))));
    (p = i64((BigInt(p) + BigInt(i64(bpl)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:620
export function msetupspritevline(paloffs, bxinc, byinc, ysiz) {
  (gpal = cTypedPointer(paloffs, Uint8Array));
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
  (glogy = i32(ysiz));
}

// C/C++ source: source/build/src/a-c.cpp:627
export function mspritevline(bx, by, cnt, bufplc, p) {
  let ch;
  (gbuf = cTypedPointer(bufplc, Uint8Array));
  for (; (cnt > i64(1)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))) {
    (ch = (((cDeref(cPointerOffset(gbuf, i32((i32(Math.imul(i32((bx >> 16)), glogy)) + i32((by >> 16)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cTypedPointer(p, Uint8Array), Uint8Array).value) = (((cDeref(cPointerOffset(gpal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (bx = i32((Number(bx) + Number(gbxinc))));
    (by = i32((Number(by) + Number(gbyinc))));
    (p = i64((BigInt(p) + BigInt(i64(bpl)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:642
export function tsetupspritevline(paloffs, bxinc, byinc, ysiz) {
  (gpal = cTypedPointer(paloffs, Uint8Array));
  (gbxinc = i32(bxinc));
  (gbyinc = i32(byinc));
  (glogy = i32(ysiz));
}

// C/C++ source: source/build/src/a-c.cpp:649
export function tspritevline(bx, by, cnt, bufplc, p) {
  let ch;
  (gbuf = cTypedPointer(bufplc, Uint8Array));
  let shift = ((((i32((transmode << 3))) & 255)) & 255);
  for (; (cnt > i64(1)); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => cnt, __cxx_lvalue_1 => { cnt = __cxx_lvalue_1; }))) {
    (ch = (((cDeref(cPointerOffset(gbuf, i32((i32(Math.imul(i32((bx >> 16)), glogy)) + i32((by >> 16)))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    if ((i32(ch) != 255)) {
      ((cDeref(cTypedPointer(p, Uint8Array), Uint8Array).value) = (((cDeref(cPointerOffset(gtrans, i32((i32((i32((cDeref(cTypedPointer(p, Uint8Array), Uint8Array).value)) << i32((8 - i32(shift))))) + i32((i32((cDeref(cPointerOffset(gpal, ch, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) << i32(shift))))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
    }
    (bx = i32((Number(bx) + Number(gbxinc))));
    (by = i32((Number(by) + Number(gbyinc))));
    (p = i64((BigInt(p) + BigInt(i64(bpl)))));
  }
}

// C/C++ source: source/build/src/a-c.cpp:667
export function setupdrawslab(dabpl, pal) {
  (bpl = i32(dabpl));
  (gpal = cTypedPointer(pal, Uint8Array));
}

// C/C++ source: source/build/src/a-c.cpp:673
export function drawslab(dx, v, dy, vi, vptr, p) {
  do {
    let c = (((cDeref(cPointerOffset(gpal, i32((cDeref(cTypedPointer((BigInt(i64(i32((v >> 16)))) + BigInt(vptr)), Uint8Array), Uint8Array).value)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
    for (let x = i32(0); (x < dx); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => x, __cxx_lvalue_1 => { x = __cxx_lvalue_1; }))) {
      ((cDeref(cPointerOffset(cTypedPointer(p, Uint8Array), x, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((c) & 255));
    }
    (p = i64((BigInt(p) + BigInt(i64(bpl)))));
    (v = i32((Number(v) + Number(vi))));
  } while (Boolean(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous - 1)); __cxx_lvalue_2.value = next; return next; })(cRef(() => dy, __cxx_lvalue_3 => { dy = __cxx_lvalue_3; }))));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_57cafba49656a1f1 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_56c35658398e128fe4dd492b() {
  return __cxx_static_address_56c35658398e128fe4dd492b.reference || (__cxx_static_address_56c35658398e128fe4dd492b.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_57cafba49656a1f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
