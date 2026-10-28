// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/mimalloc/src/bitmap.c
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
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));


const clz64 = value => {let v=BigInt.asUintN(64,BigInt(value));if(v===0n)return 64;let n=0;while((v&(1n<<63n))===0n){v<<=1n;n++;}return n;};
const ctz64 = (value,width) => {let v=BigInt.asUintN(width,BigInt(value));if(v===0n)return width;let n=0;while((v&1n)===0n){v>>=1n;n++;}return n;};
const popcnt = value => {let v=value,n=0;while(v){v&=v-1n;n++;}return n;};

const __builtin_clzl = x => clz64(x);
const __builtin_ctzl = x => ctz64(x,64);
// C/C++ source: source/mimalloc/src/bitmap.c:28
export function mi_bitmap_mask_(count, bitidx) {
  ;
  ;
  if ((count >= u64(i32(Math.imul(8, i32((1 << 3))))))) {
    return u64((~u64(0)));
  }
  if ((count == u64(0))) {
    return u64(0);
  }
  return u64((BigInt((BigInt((BigInt(u64(1)) << BigInt(count))) - BigInt(u64(1)))) << BigInt(bitidx)));
}

// C/C++ source: source/mimalloc/src/bitmap.c:306
export function mi_bitmap_mask_across(bitmap_idx, bitmap_fields, count, pre_mask, mid_mask, post_mask) {
  bitmap_fields;
  let bitidx = u64(mi_bitmap_index_bit_in_field__header_4da1e0a3f6ce(bitmap_idx));
  if (Boolean(i64((!(!((BigInt(bitidx) + BigInt(count)) <= u64(i32(Math.imul(8, i32((1 << 3))))))))))) {
    ((cDeref(pre_mask, BigUint64Array).value) = u64(mi_bitmap_mask_(count, bitidx)));
    ((cDeref(mid_mask, BigUint64Array).value) = u64(0));
    ((cDeref(post_mask, BigUint64Array).value) = u64(0));
    ;
    return u64(0);
  } else {
    let pre_bits = u64((BigInt(u64(i32(Math.imul(8, i32((1 << 3)))))) - BigInt(bitidx)));
    ;
    ((cDeref(pre_mask, BigUint64Array).value) = u64(mi_bitmap_mask_(pre_bits, bitidx)));
    (count = u64((BigInt(count) - BigInt(pre_bits))));
    let mid_count = u64((BigInt(count) / BigInt(u64(i32(Math.imul(8, i32((1 << 3))))))));
    ((cDeref(mid_mask, BigUint64Array).value) = u64((~u64(0))));
    (count = u64((BigInt(count) % BigInt(u64(i32(Math.imul(8, i32((1 << 3)))))))));
    ((cDeref(post_mask, BigUint64Array).value) = u64(((count == u64(0)) ? u64(0) : mi_bitmap_mask_(count, u64(0)))));
    ;
    return u64(mid_count);
  }
}

// C/C++ source: source/mimalloc/src/bitmap.c:814
export function mi_ctz__header_2e0431390e95(x) {
  if ((x == u64(0))) {
    return u64(i32(Math.imul(i32((1 << 3)), 8)));
  }
  return u64(__builtin_ctzl(x));
}

// C/C++ source: source/mimalloc/src/bitmap.c:42
export function mi_bitmap_index_create__header_afea02ec1cc2(idx, bitidx) {
  ;
  return mi_bitmap_index_create_ex__header_019a4ca2a84b(idx, bitidx);
}

// C/C++ source: source/mimalloc/src/bitmap.c:806
export function mi_clz__header_d81fccd574c8(x) {
  if ((x == u64(0))) {
    return u64(i32(Math.imul(i32((1 << 3)), 8)));
  }
  return u64(__builtin_clzl(x));
}

// C/C++ source: source/mimalloc/src/bitmap.c:48
export function mi_bitmap_index_field__header_473985066532(bitmap_idx) {
  return u64((BigInt(bitmap_idx) / BigInt(u64(i32(Math.imul(8, i32((1 << 3))))))));
}

// C/C++ source: source/mimalloc/src/bitmap.c:53
export function mi_bitmap_index_bit_in_field__header_4da1e0a3f6ce(bitmap_idx) {
  return u64((BigInt(bitmap_idx) % BigInt(u64(i32(Math.imul(8, i32((1 << 3))))))));
}

// C/C++ source: source/mimalloc/src/bitmap.c:339
export function _mi_divide_up__header_cac9727d0244(size, divider) {
  ;
  return u64(((divider == u64(0)) ? size : (BigInt((BigInt((BigInt(size) + BigInt(divider))) - BigInt(u64(1)))) / BigInt(divider))));
}

// C/C++ source: source/mimalloc/src/bitmap.c:38
export function mi_bitmap_index_create_ex__header_019a4ca2a84b(idx, bitidx) {
  ;
  return (BigInt((BigInt(idx) * BigInt(u64(i32(Math.imul(8, i32((1 << 3)))))))) + BigInt(bitidx));
}
