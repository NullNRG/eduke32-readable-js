// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/mimalloc/src/libc.c
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

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/mimalloc/src/libc.c:19
export function _mi_toupper(c) {
  if (((i32(c) >= i32(97)) && (i32(c) <= i32(122)))) {
    return ((((i32((i32((i32(c) - i32(97))) + i32(65)))) & 255)) & 255);
  } else {
    return ((c) & 255);
  }
}

// C/C++ source: source/mimalloc/src/libc.c:24
export function _mi_strnicmp(s, t, n) {
  if ((n == u64(0))) {
    return i32(0);
  }
  for (; (((i32((cDeref(s, Uint8Array).value)) != 0) && (i32((cDeref(t, Uint8Array).value)) != 0)) && (n > u64(0))); ((((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => s, __cxx_lvalue_1 => { s = __cxx_lvalue_1; })), ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => t, __cxx_lvalue_3 => { t = __cxx_lvalue_3; }))), ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous - 1n)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => n, __cxx_lvalue_5 => { n = __cxx_lvalue_5; })))) {
    if ((i32(_mi_toupper((cDeref(s, Uint8Array).value))) != i32(_mi_toupper((cDeref(t, Uint8Array).value))))) {
      break;
    }
  }
  return i32(((n == u64(0)) ? 0 : i32((i32((cDeref(s, Uint8Array).value)) - i32((cDeref(t, Uint8Array).value))))));
}

// C/C++ source: source/mimalloc/src/libc.c:32
export function _mi_strlcpy(dest, src, dest_size) {
  if (((cPointerCompare(dest, null, "==") || cPointerCompare(src, null, "==")) || (dest_size == u64(0)))) {
    return;
  }
  while (((i32((cDeref(src, Uint8Array).value)) != 0) && (dest_size > u64(1)))) {
    ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => dest, __cxx_lvalue_1 => { dest = __cxx_lvalue_1; })), Uint8Array).value) = (((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => src, __cxx_lvalue_3 => { src = __cxx_lvalue_3; })), Uint8Array).value)) & 255));
    ((__cxx_lvalue_4) => { const previous = __cxx_lvalue_4.value; const next = u64((previous - 1n)); __cxx_lvalue_4.value = next; return previous; })(cRef(() => dest_size, __cxx_lvalue_5 => { dest_size = __cxx_lvalue_5; }));
  }
  ((cDeref(dest, Uint8Array).value) = ((((0) & 255)) & 255));
}

// C/C++ source: source/mimalloc/src/libc.c:43
export function _mi_strlcat(dest, src, dest_size) {
  if (((cPointerCompare(dest, null, "==") || cPointerCompare(src, null, "==")) || (dest_size == u64(0)))) {
    return;
  }
  while (((i32((cDeref(dest, Uint8Array).value)) != 0) && (dest_size > u64(1)))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => dest, __cxx_lvalue_1 => { dest = __cxx_lvalue_1; }));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u64((previous - 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => dest_size, __cxx_lvalue_3 => { dest_size = __cxx_lvalue_3; }));
  }
  _mi_strlcpy(dest, src, dest_size);
}

// C/C++ source: source/mimalloc/src/libc.c:54
export function _mi_strlen(s) {
  if (cPointerCompare(s, null, "==")) {
    return u64(0);
  }
  let len = u64(0);
  while ((i32((cDeref(cPointerOffset(s, len, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => len, __cxx_lvalue_1 => { len = __cxx_lvalue_1; }));
  }
  return u64(len);
}

// C/C++ source: source/mimalloc/src/libc.c:61
export function _mi_strnlen(s, max_len) {
  if (cPointerCompare(s, null, "==")) {
    return u64(0);
  }
  let len = u64(0);
  while (((i32((cDeref(cPointerOffset(s, len, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) != 0) && (len < max_len))) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => len, __cxx_lvalue_1 => { len = __cxx_lvalue_1; }));
  }
  return u64(len);
}

// C/C++ source: source/mimalloc/src/libc.c:95
export function mi_outc(c, out, end) {
  let p = (out).value;
  if (cPointerCompare(p, end, ">=")) {
    return;
  }
  ((cDeref(p, Uint8Array).value) = ((c) & 255));
  ((out).value = cPointerOffset(p, 1, Uint8Array.BYTES_PER_ELEMENT));
}

// C/C++ source: source/mimalloc/src/libc.c:102
export function mi_outs(s, out, end) {
  if (cPointerCompare(s, null, "==")) {
    return;
  }
  let p = (out).value;
  while (((i32((cDeref(s, Uint8Array).value)) != 0) && cPointerCompare(p, end, "<"))) {
    ((cDeref(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => p, __cxx_lvalue_1 => { p = __cxx_lvalue_1; })), Uint8Array).value) = (((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => s, __cxx_lvalue_3 => { s = __cxx_lvalue_3; })), Uint8Array).value)) & 255));
  }
  ((out).value = p);
}

// C/C++ source: source/mimalloc/src/libc.c:111
export function mi_out_fill(fill, len, out, end) {
  let p = (out).value;
  for (let i = u64(0); ((i < len) && cPointerCompare(p, end, "<")); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => p, __cxx_lvalue_3 => { p = __cxx_lvalue_3; })), Uint8Array).value) = ((fill) & 255));
  }
  ((out).value = p);
}

// C/C++ source: source/mimalloc/src/libc.c:119
export function mi_out_alignright(fill, start, len, extra, end) {
  if (((len == u64(0)) || (extra == u64(0)))) {
    return;
  }
  if (cPointerCompare(cPointerOffset(cPointerOffset(start, len, Uint8Array.BYTES_PER_ELEMENT), extra, Uint8Array.BYTES_PER_ELEMENT), end, ">=")) {
    return;
  }
  for (let i = u64(1); (i <= len); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
    ((cDeref(cPointerOffset(start, (BigInt((BigInt(len) + BigInt(extra))) - BigInt(i)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(start, (BigInt(len) - BigInt(i)), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
  }
  for (let i = u64(0); (i < extra); ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = u64((previous + 1n)); __cxx_lvalue_2.value = next; return previous; })(cRef(() => i, __cxx_lvalue_3 => { i = __cxx_lvalue_3; }))) {
    ((cDeref(cPointerOffset(start, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((fill) & 255));
  }
}

// C/C++ source: source/mimalloc/src/libc.c:133
export function mi_out_num(x, base, prefix, out, end) {
  if ((((x == u64(0)) || (base == u64(0))) || (base > u64(16)))) {
    if ((i32(prefix) != 0)) {
      mi_outc(prefix, out, end);
    }
    mi_outc(48, out, end);
  } else {
    let start = (out).value;
    while ((x > u64(0))) {
      let digit = (((((((BigInt(x) % BigInt(base))) & 255)) & 255)) & 255);
      mi_outc(((((i32(digit) <= 9) ? i32((i32(48) + i32(digit))) : i32((i32((i32(65) + i32(digit))) - 10)))) & 255), out, end);
      (x = u64((BigInt(x) / BigInt(base))));
    }
    if ((i32(prefix) != 0)) {
      mi_outc(prefix, out, end);
    }
    let len = u64(cPointerDiff((out).value, start, Uint8Array.BYTES_PER_ELEMENT));
    for (let i = u64(0); (i < (BigInt(len) / BigInt(u64(2)))); ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous + 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => i, __cxx_lvalue_1 => { i = __cxx_lvalue_1; }))) {
      let c = (((cDeref(cPointerOffset(start, (BigInt((BigInt(len) - BigInt(i))) - BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255);
      ((cDeref(cPointerOffset(start, (BigInt((BigInt(len) - BigInt(i))) - BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = (((cDeref(cPointerOffset(start, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value)) & 255));
      ((cDeref(cPointerOffset(start, i, Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((c) & 255));
    }
  }
}

// C/C++ source: source/mimalloc/src/libc.c:163
const __cxx_literal_24ba0b6a880712a83d22 = Uint8Array.from([48, 120, 0]);
export function _mi_vsnprintf(buf, bufsize, fmt, args) {
  if (((cPointerCompare(buf, null, "==") || (bufsize == u64(0))) || cPointerCompare(fmt, null, "=="))) {
    return;
  }
  ((cDeref(cPointerOffset(buf, (BigInt(bufsize) - BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT), Uint8Array).value) = ((((0) & 255)) & 255));
  let end = cPointerOffset(buf, (BigInt(bufsize) - BigInt(u64(1))), Uint8Array.BYTES_PER_ELEMENT);
  let __cxx_in = fmt;
  let out = buf;
  while (true) {
    if (cPointerCompare(out, end, ">=")) {
      break;
    }
    let c;
    (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
    if ((i32(c) == 0)) {
      break;
    }
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_0.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_1 => { __cxx_in = __cxx_lvalue_1; }));
    ;
    if ((i32(c) != i32(37))) {
      if ((((((i32(c) >= i32(32)) && (i32(c) <= i32(126))) || (i32(c) == i32(10))) || (i32(c) == i32(13))) || (i32(c) == i32(9)))) {
        mi_outc(c, cRef(() => out, __cxx_lvalue_2 => { out = __cxx_lvalue_2; }), end);
      }
    } else {
      (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
      if ((i32(c) == 0)) {
        break;
      }
      ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_3.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_4 => { __cxx_in = __cxx_lvalue_4; }));
      ;
      let fill = ((32) & 255);
      let width = u64(0);
      let numtype = ((100) & 255);
      let numplus = ((((0) & 255)) & 255);
      let alignright = Boolean(true);
      if (((i32(c) == i32(43)) || (i32(c) == i32(32)))) {
        (numplus = ((c) & 255));
        (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
        if ((i32(c) == 0)) {
          break;
        }
        ((__cxx_lvalue_5) => { const previous = __cxx_lvalue_5.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_5.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_6 => { __cxx_in = __cxx_lvalue_6; }));
        ;
      }
      if ((i32(c) == i32(45))) {
        (alignright = Boolean(false));
        (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
        if ((i32(c) == 0)) {
          break;
        }
        ((__cxx_lvalue_7) => { const previous = __cxx_lvalue_7.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_7.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_8 => { __cxx_in = __cxx_lvalue_8; }));
        ;
      }
      if ((i32(c) == i32(48))) {
        (fill = ((48) & 255));
        (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
        if ((i32(c) == 0)) {
          break;
        }
        ((__cxx_lvalue_9) => { const previous = __cxx_lvalue_9.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_9.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_10 => { __cxx_in = __cxx_lvalue_10; }));
        ;
      }
      if (((i32(c) >= i32(49)) && (i32(c) <= i32(57)))) {
        (width = u64(i32((i32(c) - i32(48)))));
        (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
        if ((i32(c) == 0)) {
          break;
        }
        ((__cxx_lvalue_11) => { const previous = __cxx_lvalue_11.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_11.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_12 => { __cxx_in = __cxx_lvalue_12; }));
        ;
        while (((i32(c) >= i32(48)) && (i32(c) <= i32(57)))) {
          (width = u64((BigInt((BigInt(u64(10)) * BigInt(width))) + BigInt(u64(i32((i32(c) - i32(48))))))));
          (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
          if ((i32(c) == 0)) {
            break;
          }
          ((__cxx_lvalue_13) => { const previous = __cxx_lvalue_13.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_13.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_14 => { __cxx_in = __cxx_lvalue_14; }));
          ;
        }
        if ((i32(c) == 0)) {
          break;
        }
      }
      if ((((i32(c) == i32(122)) || (i32(c) == i32(116))) || (i32(c) == i32(76)))) {
        (numtype = ((c) & 255));
        (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
        if ((i32(c) == 0)) {
          break;
        }
        ((__cxx_lvalue_15) => { const previous = __cxx_lvalue_15.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_15.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_16 => { __cxx_in = __cxx_lvalue_16; }));
        ;
      } else {
        if ((i32(c) == i32(108))) {
          (numtype = ((c) & 255));
          (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
          if ((i32(c) == 0)) {
            break;
          }
          ((__cxx_lvalue_17) => { const previous = __cxx_lvalue_17.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_17.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_18 => { __cxx_in = __cxx_lvalue_18; }));
          ;
          if ((i32(c) == i32(108))) {
            (numtype = ((76) & 255));
            (c = (((cDeref(__cxx_in, Uint8Array).value)) & 255));
            if ((i32(c) == 0)) {
              break;
            }
            ((__cxx_lvalue_19) => { const previous = __cxx_lvalue_19.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_19.value = next; return previous; })(cRef(() => __cxx_in, __cxx_lvalue_20 => { __cxx_in = __cxx_lvalue_20; }));
            ;
          }
        }
      }
      let start = out;
      if ((i32(c) == i32(115))) {
        let s = cVariadic.next(args);
        mi_outs(s, cRef(() => out, __cxx_lvalue_21 => { out = __cxx_lvalue_21; }), end);
      } else {
        if ((((i32(c) == i32(112)) || (i32(c) == i32(120))) || (i32(c) == i32(117)))) {
          let x = u64(0);
          if (((i32(c) == i32(120)) || (i32(c) == i32(117)))) {
            if ((i32(numtype) == i32(122))) {
              (x = u64(cVariadic.next(args)));
            } else {
              if ((i32(numtype) == i32(116))) {
                (x = u64(cVariadic.next(args)));
              } else {
                if ((i32(numtype) == i32(76))) {
                  (x = u64(cVariadic.next(args)));
                } else {
                  if ((i32(numtype) == i32(108))) {
                    (x = u64(cVariadic.next(args)));
                  } else {
                    (x = u64(u32(cVariadic.next(args))));
                  }
                }
              }
            }
          } else {
            if ((i32(c) == i32(112))) {
              (x = u64(cVariadic.next(args)));
              mi_outs(__cxx_literal_24ba0b6a880712a83d22, cRef(() => out, __cxx_lvalue_22 => { out = __cxx_lvalue_22; }), end);
              (start = out);
              (width = u64(((width >= u64(2)) ? (BigInt(width) - BigInt(u64(2))) : u64(0))));
            }
          }
          if (((width == u64(0)) && ((i32(c) == i32(120)) || (i32(c) == i32(112))))) {
            if ((i32(c) == i32(112))) {
              (width = u64((BigInt(u64(2)) * BigInt(((x <= u64(4294967295)) ? u64(4) : (((BigInt(x) >> BigInt(16)) <= u64(4294967295)) ? u64(6) : 8))))));
            }
            if ((width == u64(0))) {
              (width = u64(2));
            }
            (fill = ((48) & 255));
          }
          mi_out_num(x, u64((((i32(c) == i32(120)) || (i32(c) == i32(112))) ? 16 : 10)), numplus, cRef(() => out, __cxx_lvalue_23 => { out = __cxx_lvalue_23; }), end);
        } else {
          if (((i32(c) == i32(105)) || (i32(c) == i32(100)))) {
            let x = i64(0);
            if ((i32(numtype) == i32(122))) {
              (x = i64(cVariadic.next(args)));
            } else {
              if ((i32(numtype) == i32(116))) {
                (x = i64(cVariadic.next(args)));
              } else {
                if ((i32(numtype) == i32(76))) {
                  (x = i64(cVariadic.next(args)));
                } else {
                  if ((i32(numtype) == i32(108))) {
                    (x = i64(cVariadic.next(args)));
                  } else {
                    (x = i64(i32(cVariadic.next(args))));
                  }
                }
              }
            }
            let pre = ((((0) & 255)) & 255);
            if ((x < i64(0))) {
              (pre = ((45) & 255));
              if ((x > (BigInt((-9223372036854775807n)) - BigInt(i64(1))))) {
                (x = i64((-x)));
              }
            } else {
              if ((i32(numplus) != 0)) {
                (pre = ((numplus) & 255));
              }
            }
            mi_out_num(u64(x), u64(10), pre, cRef(() => out, __cxx_lvalue_24 => { out = __cxx_lvalue_24; }), end);
          } else {
            if (((i32(c) >= i32(32)) && (i32(c) <= i32(126)))) {
              mi_outc(37, cRef(() => out, __cxx_lvalue_25 => { out = __cxx_lvalue_25; }), end);
              mi_outc(c, cRef(() => out, __cxx_lvalue_26 => { out = __cxx_lvalue_26; }), end);
            }
          }
        }
      }
      ;
      ;
      let len = u64(cPointerDiff(out, start, Uint8Array.BYTES_PER_ELEMENT));
      if ((len < width)) {
        mi_out_fill(fill, (BigInt(width) - BigInt(len)), cRef(() => out, __cxx_lvalue_27 => { out = __cxx_lvalue_27; }), end);
        if ((alignright && cPointerCompare(out, end, "<="))) {
          mi_out_alignright(fill, start, len, (BigInt(width) - BigInt(len)), end);
        }
      }
    }
  }
  ;
  ((cDeref(out, Uint8Array).value) = ((((0) & 255)) & 255));
}

// C/C++ source: source/mimalloc/src/libc.c:270
export function _mi_snprintf(buf, buflen, fmt, ...__cxx_varargs) {
  let args = cVariadic.empty();
  cVariadic.start(args, __cxx_varargs);
  _mi_vsnprintf(buf, buflen, fmt, args);
  cVariadic.end(args);
}
