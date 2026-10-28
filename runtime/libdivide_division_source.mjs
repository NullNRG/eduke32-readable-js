// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/include/libdivide.h
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
// Bounded source-language pointer aliases over native JS typed buffers/arrays.
// Embedded in generated ES modules; never a CPU, ISA or opcode interpreter.
const cPointer = source => {
  if (source?.__cDeferredPointer === true) return cPointer(source.resolve());
  if (source && source.__cPointer === true) return source;
  if(source?.__cReference===true&&source.value?.[Symbol.for('source-first.original-byte-record-storage/1')])
    return cPointer(source.value);
  const record=source?.[Symbol.for('source-first.original-byte-record-storage/1')];
  if(record)return cPointer(record.bytes);
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
    const allocation=globalThis[Symbol.for('source-first.pointer-array-allocations/1')]?.get(pointer.buffer);
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
  if (source===null) return null;
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
const cPointerOffset = (source, delta, stride=1) => {
  const initial=cPointer(source);
  const p=Array.isArray(source) ? {...initial, upper:source.length*stride, stride} : initial;
  if (p.array && p.stride!==stride) throw new TypeError('Cannot reinterpret JS numeric-array element widths');
  const change=Number(delta)*stride, next=p.offset+change;
  if (!Number.isSafeInteger(change) || !Number.isSafeInteger(next) || next<p.lower || next>p.upper)
    throw new RangeError('C pointer escapes original array bounds');
  if(p.__cPointer===true&&p.__cReference===true){
    if(next===p.offset)return p;
    return {__cPointer:true,buffer:p.buffer,array:p.array,lower:p.lower,upper:p.upper,offset:next,
      ...(p.array?{stride:p.stride}: {})};
  }
  const result={...p,offset:next};
  return result;
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
// An address-reinterpreted scalar has one native byte allocation. Reads via
// its source identifier and all typed/byte aliases share the same DataView.
const cScalarStorage = (Type, initial) => {
  const array=new Type([initial]),pointer=cPointer(array),reference=cDeref(pointer,Type);
  return {...pointer,__cReference:true,
    get value(){return reference.value;},set value(value){reference.value=value;}};
};
const cPointerCompare = (left,right,op) => {
  if (left?.__cDeferredReference===true) left=left.resolve();
  if (right?.__cDeferredReference===true) right=right.resolve();
  if(left?.__cReference===true&&left.__cPointer!==true&&left.value?.[Symbol.for('source-first.original-byte-record-storage/1')])left=left.value;
  if(right?.__cReference===true&&right.__cPointer!==true&&right.value?.[Symbol.for('source-first.original-byte-record-storage/1')])right=right.value;
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
const cObjectFieldRef = (owner, field) => { const storage=owner?.[Symbol.for("source-first.original-byte-record-storage/1")]; if(storage)return globalThis[Symbol.for("source-first.record-pointer-views/1")].fieldReference(owner,field); const key=Symbol.for("source-object-field-references/1"); if (!Object.hasOwn(owner,key)) Object.defineProperty(owner,key,{value:new Map()}); const refs=owner[key]; if (!refs.has(field)) refs.set(field,{__cReference:true,get value(){return owner[field];},set value(value){owner[field]=value;}}); return refs.get(field); };
const cRef = (read, write) => ({ __cReference:true, get value() { return read(); }, set value(v) { write(v); } });
const cArrayRef = (array, index) => cRef(() => array[index], v => { array[index] = v; });
const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));
const i128 = value => BigInt.asIntN(128, BigInt(value));
const u128 = value => BigInt.asUintN(128, BigInt(value));

// C/C++ source: source/build/include/libdivide.h:321
export function libdivide_mullhi_u32(x, y) {
  let xl = u64(x);
  let yl = u64(y);
  let rl = u64((BigInt(xl) * BigInt(yl)));
  return u32(u64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/build/include/libdivide.h:327
export function libdivide_mullhi_s32(x, y) {
  let xl = i64(x);
  let yl = i64(y);
  let rl = i64((BigInt(xl) * BigInt(yl)));
  return i32(i64((BigInt(rl) >> BigInt(32))));
}

// C/C++ source: source/build/include/libdivide.h:334
export function libdivide_mullhi_u64(x, y) {
  let xl = u128(u128(x));
  let yl = u128(u128(y));
  let rl = u128(u128((BigInt(xl) * BigInt(yl))));
  return u64(u128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/build/include/libdivide.h:360
export function libdivide_mullhi_s64(x, y) {
  let xl = i128(i128(x));
  let yl = i128(i128(y));
  let rl = i128(i128((BigInt(xl) * BigInt(yl))));
  return i64(i128((BigInt(rl) >> BigInt(64))));
}

// C/C++ source: source/build/include/libdivide.h:934
export function libdivide_u32_do_raw(numer, magic, more) {
  if ((!Boolean(magic))) {
    return u32((numer >>> i32(more)));
  } else {
    let q = u32(libdivide_mullhi_u32(magic, numer));
    if (Boolean(i32((i32(more) & i32(64))))) {
      let t = u32(((u32((numer - q)) >>> 1) + q));
      return u32((t >>> i32((i32(more) & i32(31)))));
    } else {
      return u32((q >>> i32(more)));
    }
  }
}

// C/C++ source: source/build/include/libdivide.h:950
export function libdivide_u32_do(numer, denom) {
  return u32(libdivide_u32_do_raw(numer, cRecordObject(denom).magic, cRecordObject(denom).more));
}

// C/C++ source: source/build/include/libdivide.h:954
export function libdivide_u32_branchfree_do(numer, denom) {
  let q = u32(libdivide_mullhi_u32(cRecordObject(denom).magic, numer));
  let t = u32(((u32((numer - q)) >>> 1) + q));
  return u32((t >>> i32(cRecordObject(denom).more)));
}

// C/C++ source: source/build/include/libdivide.h:1097
export function libdivide_u64_do_raw(numer, magic, more) {
  if ((!Boolean(magic))) {
    return u64((BigInt(numer) >> BigInt(i32(more))));
  } else {
    let q = u64(libdivide_mullhi_u64(magic, numer));
    if (Boolean(i32((i32(more) & i32(64))))) {
      let t = u64((BigInt(u64((BigInt(u64((BigInt(numer) - BigInt(q)))) >> BigInt(1)))) + BigInt(q)));
      return u64((BigInt(t) >> BigInt(i32((i32(more) & i32(63))))));
    } else {
      return u64((BigInt(q) >> BigInt(i32(more))));
    }
  }
}

// C/C++ source: source/build/include/libdivide.h:1113
export function libdivide_u64_do(numer, denom) {
  return u64(libdivide_u64_do_raw(numer, cRecordObject(denom).magic, cRecordObject(denom).more));
}

// C/C++ source: source/build/include/libdivide.h:1117
export function libdivide_u64_branchfree_do(numer, denom) {
  let q = u64(libdivide_mullhi_u64(cRecordObject(denom).magic, numer));
  let t = u64((BigInt(u64((BigInt(u64((BigInt(numer) - BigInt(q)))) >> BigInt(1)))) + BigInt(q)));
  return u64((BigInt(t) >> BigInt(i32(cRecordObject(denom).more))));
}

// C/C++ source: source/build/include/libdivide.h:1456
export function libdivide_s32_do_raw(numer, magic, more) {
  let shift = ((((i32((i32(more) & i32(31)))) & 255)) & 255);
  if ((!Boolean(magic))) {
    let sign = u32(i32((i32(((((((more) << 24) >> 24)) << 24) >> 24)) >> 7)));
    let mask = u32((u32((u32(1) << i32(shift))) - u32(1)));
    let uq = u32((u32(numer) + u32((u32(i32((numer >> 31))) & mask))));
    let q = i32(uq);
    (q = i32((q >> i32(shift))));
    (q = i32(u32((u32((u32(q) ^ sign)) - sign))));
    return i32(q);
  } else {
    let uq = u32(libdivide_mullhi_s32(magic, numer));
    if (Boolean(i32((i32(more) & i32(64))))) {
      let sign = i32((i32(((((((more) << 24) >> 24)) << 24) >> 24)) >> 7));
      (uq = u32((Number(uq) + Number(u32((u32((u32(numer) ^ u32(sign))) - u32(sign)))))));
    }
    let q = i32(uq);
    (q = i32((q >> i32(shift))));
    (q = i32((Number(q) + Number(i32((q < 0))))));
    return i32(q);
  }
}

// C/C++ source: source/build/include/libdivide.h:1483
export function libdivide_s32_do(numer, denom) {
  return i32(libdivide_s32_do_raw(numer, cRecordObject(denom).magic, cRecordObject(denom).more));
}

// C/C++ source: source/build/include/libdivide.h:1487
export function libdivide_s32_branchfree_do(numer, denom) {
  let more = ((cRecordObject(denom).more) & 255);
  let shift = ((((i32((i32(more) & i32(31)))) & 255)) & 255);
  let sign = i32((i32(((((((more) << 24) >> 24)) << 24) >> 24)) >> 7));
  let magic = i32(cRecordObject(denom).magic);
  let q = i32(libdivide_mullhi_s32(magic, numer));
  (q = i32((Number(q) + Number(numer))));
  let is_power_of_2 = u32((magic == 0));
  let q_sign = u32(i32((q >> 31)));
  (q = i32((Number(q) + Number(u32((q_sign & u32((u32((u32(1) << i32(shift))) - is_power_of_2))))))));
  (q = i32((q >> i32(shift))));
  (q = i32((i32((q ^ sign)) - sign)));
  return i32(q);
}

// C/C++ source: source/build/include/libdivide.h:1628
export function libdivide_s64_do_raw(numer, magic, more) {
  let shift = ((((i32((i32(more) & i32(63)))) & 255)) & 255);
  if ((!Boolean(magic))) {
    let mask = u64((BigInt(u64((BigInt(u64(1)) << BigInt(i32(shift))))) - BigInt(u64(1))));
    let uq = u64((BigInt(u64(numer)) + BigInt(u64((BigInt(u64(i64((BigInt(numer) >> BigInt(63))))) & BigInt(mask))))));
    let q = i64(uq);
    (q = i64((BigInt(q) >> BigInt(i32(shift)))));
    let sign = i64(i32((i32(((((((more) << 24) >> 24)) << 24) >> 24)) >> 7)));
    (q = i64((BigInt(i64((BigInt(q) ^ BigInt(sign)))) - BigInt(sign))));
    return i64(q);
  } else {
    let uq = u64(libdivide_mullhi_s64(magic, numer));
    if (Boolean(i32((i32(more) & i32(64))))) {
      let sign = i64(i32((i32(((((((more) << 24) >> 24)) << 24) >> 24)) >> 7)));
      (uq = u64((BigInt(uq) + BigInt(u64((BigInt(u64((BigInt(u64(numer)) ^ BigInt(u64(sign))))) - BigInt(u64(sign))))))));
    }
    let q = i64(uq);
    (q = i64((BigInt(q) >> BigInt(i32(shift)))));
    (q = i64((BigInt(q) + BigInt(i64((q < i64(0)))))));
    return i64(q);
  }
}

// C/C++ source: source/build/include/libdivide.h:1656
export function libdivide_s64_do(numer, denom) {
  return i64(libdivide_s64_do_raw(numer, cRecordObject(denom).magic, cRecordObject(denom).more));
}

// C/C++ source: source/build/include/libdivide.h:1660
export function libdivide_s64_branchfree_do(numer, denom) {
  let more = ((cRecordObject(denom).more) & 255);
  let shift = ((((i32((i32(more) & i32(63)))) & 255)) & 255);
  let sign = i64(i32((i32(((((((more) << 24) >> 24)) << 24) >> 24)) >> 7)));
  let magic = i64(cRecordObject(denom).magic);
  let q = i64(libdivide_mullhi_s64(magic, numer));
  (q = i64((BigInt(q) + BigInt(numer))));
  let is_power_of_2 = u64((magic == i64(0)));
  let q_sign = u64(i64((BigInt(q) >> BigInt(63))));
  (q = i64((BigInt(q) + BigInt(u64((BigInt(q_sign) & BigInt(u64((BigInt(u64((BigInt(u64(1)) << BigInt(i32(shift))))) - BigInt(is_power_of_2))))))))));
  (q = i64((BigInt(q) >> BigInt(i32(shift)))));
  (q = i64((BigInt(i64((BigInt(q) ^ BigInt(sign)))) - BigInt(sign))));
  return i64(q);
}
