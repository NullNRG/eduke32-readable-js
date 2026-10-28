// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/midi.cpp
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
export const fix16_rad_to_deg_mult__header_global_a0edd773ff1e0618 = i32(3754936);
function __cxx_static_address_73fb8b5df898e99b42fc9080() {
  return __cxx_static_address_73fb8b5df898e99b42fc9080.reference || (__cxx_static_address_73fb8b5df898e99b42fc9080.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_a0edd773ff1e0618; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_538451e0546e2050 = i32(1144);
function __cxx_static_address_892b24b7dd0134b8076a8d41() {
  return __cxx_static_address_892b24b7dd0134b8076a8d41.reference || (__cxx_static_address_892b24b7dd0134b8076a8d41.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_538451e0546e2050; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:52
export const _MIDI_CommandLengths = new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 1, 1, 2, 0]);
function __cxx_static_address_f53fa3b36473681f02144c74() {
  return __cxx_static_address_f53fa3b36473681f02144c74.reference || (__cxx_static_address_f53fa3b36473681f02144c74.reference = {
    __cReference: true,
    get value() { return _MIDI_CommandLengths; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:54
export let _MIDI_TrackPtr = null;
function __cxx_static_address_9e07cfd6cbdf174551c29d11() {
  return __cxx_static_address_9e07cfd6cbdf174551c29d11.reference || (__cxx_static_address_9e07cfd6cbdf174551c29d11.reference = {
    __cReference: true,
    get value() { return _MIDI_TrackPtr; },
    set value(__cxx_lvalue_0) { _MIDI_TrackPtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:55
export let _MIDI_TrackMemSize = 0;
function __cxx_static_address_426a69c7fe6e7b761fd10cd0() {
  return __cxx_static_address_426a69c7fe6e7b761fd10cd0.reference || (__cxx_static_address_426a69c7fe6e7b761fd10cd0.reference = {
    __cReference: true,
    get value() { return _MIDI_TrackMemSize; },
    set value(__cxx_lvalue_0) { _MIDI_TrackMemSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:56
export let _MIDI_NumTracks = 0;
function __cxx_static_address_f4183c3ec3fd9395df913c94() {
  return __cxx_static_address_f4183c3ec3fd9395df913c94.reference || (__cxx_static_address_f4183c3ec3fd9395df913c94.reference = {
    __cReference: true,
    get value() { return _MIDI_NumTracks; },
    set value(__cxx_lvalue_0) { _MIDI_NumTracks = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:58
export let _MIDI_SongActive = 0;
function __cxx_static_address_58b7496334f94aa28e3d2f8b() {
  return __cxx_static_address_58b7496334f94aa28e3d2f8b.reference || (__cxx_static_address_58b7496334f94aa28e3d2f8b.reference = {
    __cReference: true,
    get value() { return _MIDI_SongActive; },
    set value(__cxx_lvalue_0) { _MIDI_SongActive = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:59
export let _MIDI_SongLoaded = 0;
function __cxx_static_address_693d7d04934d696c57a3af34() {
  return __cxx_static_address_693d7d04934d696c57a3af34.reference || (__cxx_static_address_693d7d04934d696c57a3af34.reference = {
    __cReference: true,
    get value() { return _MIDI_SongLoaded; },
    set value(__cxx_lvalue_0) { _MIDI_SongLoaded = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:60
export let _MIDI_Loop = 0;
function __cxx_static_address_3cfac08e1d7a9991f55a5fce() {
  return __cxx_static_address_3cfac08e1d7a9991f55a5fce.reference || (__cxx_static_address_3cfac08e1d7a9991f55a5fce.reference = {
    __cReference: true,
    get value() { return _MIDI_Loop; },
    set value(__cxx_lvalue_0) { _MIDI_Loop = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:62
export let _MIDI_Division = 0;
function __cxx_static_address_5853ca0819e48a48ff7f424c() {
  return __cxx_static_address_5853ca0819e48a48ff7f424c.reference || (__cxx_static_address_5853ca0819e48a48ff7f424c.reference = {
    __cReference: true,
    get value() { return _MIDI_Division; },
    set value(__cxx_lvalue_0) { _MIDI_Division = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:63
export let _MIDI_Tick = 0;
function __cxx_static_address_f02a488c57f154fa267b42e4() {
  return __cxx_static_address_f02a488c57f154fa267b42e4.reference || (__cxx_static_address_f02a488c57f154fa267b42e4.reference = {
    __cReference: true,
    get value() { return _MIDI_Tick; },
    set value(__cxx_lvalue_0) { _MIDI_Tick = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:64
export let _MIDI_Beat = i32(1);
function __cxx_static_address_afe727f04c96d00c27cdd6ac() {
  return __cxx_static_address_afe727f04c96d00c27cdd6ac.reference || (__cxx_static_address_afe727f04c96d00c27cdd6ac.reference = {
    __cReference: true,
    get value() { return _MIDI_Beat; },
    set value(__cxx_lvalue_0) { _MIDI_Beat = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:65
export let _MIDI_Measure = i32(1);
function __cxx_static_address_667eb95f89184c51f02577bc() {
  return __cxx_static_address_667eb95f89184c51f02577bc.reference || (__cxx_static_address_667eb95f89184c51f02577bc.reference = {
    __cReference: true,
    get value() { return _MIDI_Measure; },
    set value(__cxx_lvalue_0) { _MIDI_Measure = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:66
export let _MIDI_Time = 0;
function __cxx_static_address_81330e8e221a67b69bd6eac2() {
  return __cxx_static_address_81330e8e221a67b69bd6eac2.reference || (__cxx_static_address_81330e8e221a67b69bd6eac2.reference = {
    __cReference: true,
    get value() { return _MIDI_Time; },
    set value(__cxx_lvalue_0) { _MIDI_Time = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:67
export let _MIDI_BeatsPerMeasure = 0;
function __cxx_static_address_fdb7c5683b05fe48ae45afb0() {
  return __cxx_static_address_fdb7c5683b05fe48ae45afb0.reference || (__cxx_static_address_fdb7c5683b05fe48ae45afb0.reference = {
    __cReference: true,
    get value() { return _MIDI_BeatsPerMeasure; },
    set value(__cxx_lvalue_0) { _MIDI_BeatsPerMeasure = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:68
export let _MIDI_TicksPerBeat = 0;
function __cxx_static_address_e40f5165bb882483ac94ceac() {
  return __cxx_static_address_e40f5165bb882483ac94ceac.reference || (__cxx_static_address_e40f5165bb882483ac94ceac.reference = {
    __cReference: true,
    get value() { return _MIDI_TicksPerBeat; },
    set value(__cxx_lvalue_0) { _MIDI_TicksPerBeat = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:69
export let _MIDI_TimeBase = 0;
function __cxx_static_address_70c2c62fbdc9255ffbb80d43() {
  return __cxx_static_address_70c2c62fbdc9255ffbb80d43.reference || (__cxx_static_address_70c2c62fbdc9255ffbb80d43.reference = {
    __cReference: true,
    get value() { return _MIDI_TimeBase; },
    set value(__cxx_lvalue_0) { _MIDI_TimeBase = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:70
export let _MIDI_FPSecondsPerTick = 0;
function __cxx_static_address_2ed72754319321fbd245a3a2() {
  return __cxx_static_address_2ed72754319321fbd245a3a2.reference || (__cxx_static_address_2ed72754319321fbd245a3a2.reference = {
    __cReference: true,
    get value() { return _MIDI_FPSecondsPerTick; },
    set value(__cxx_lvalue_0) { _MIDI_FPSecondsPerTick = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:71
export let _MIDI_TotalTime = 0;
function __cxx_static_address_7d95de1c643527ac5ce28f9f() {
  return __cxx_static_address_7d95de1c643527ac5ce28f9f.reference || (__cxx_static_address_7d95de1c643527ac5ce28f9f.reference = {
    __cReference: true,
    get value() { return _MIDI_TotalTime; },
    set value(__cxx_lvalue_0) { _MIDI_TotalTime = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:72
export let _MIDI_TotalTicks = 0;
function __cxx_static_address_4aac9142305e311eecf3b855() {
  return __cxx_static_address_4aac9142305e311eecf3b855.reference || (__cxx_static_address_4aac9142305e311eecf3b855.reference = {
    __cReference: true,
    get value() { return _MIDI_TotalTicks; },
    set value(__cxx_lvalue_0) { _MIDI_TotalTicks = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:73
export let _MIDI_TotalBeats = 0;
function __cxx_static_address_cc0045876fa43040a54475e8() {
  return __cxx_static_address_cc0045876fa43040a54475e8.reference || (__cxx_static_address_cc0045876fa43040a54475e8.reference = {
    __cReference: true,
    get value() { return _MIDI_TotalBeats; },
    set value(__cxx_lvalue_0) { _MIDI_TotalBeats = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:74
export let _MIDI_TotalMeasures = 0;
function __cxx_static_address_bdd1308d1d4e30f056fde96a() {
  return __cxx_static_address_bdd1308d1d4e30f056fde96a.reference || (__cxx_static_address_bdd1308d1d4e30f056fde96a.reference = {
    __cReference: true,
    get value() { return _MIDI_TotalMeasures; },
    set value(__cxx_lvalue_0) { _MIDI_TotalMeasures = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:76
export let _MIDI_PositionInTicks = 0;
export function __cxx_global_cell_6c32a6acbc578619946b696c() {
  return __cxx_global_cell_6c32a6acbc578619946b696c.reference || (__cxx_global_cell_6c32a6acbc578619946b696c.reference = {
    __cReference: true,
    get value() { return _MIDI_PositionInTicks; },
    set value(__cxx_lvalue_0) { _MIDI_PositionInTicks = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:77
export let _MIDI_GlobalPositionInTicks = 0;
export function __cxx_global_cell_ce9451e16d242c0b6f6ad7f1() {
  return __cxx_global_cell_ce9451e16d242c0b6f6ad7f1.reference || (__cxx_global_cell_ce9451e16d242c0b6f6ad7f1.reference = {
    __cReference: true,
    get value() { return _MIDI_GlobalPositionInTicks; },
    set value(__cxx_lvalue_0) { _MIDI_GlobalPositionInTicks = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:79
export let _MIDI_Context = 0;
function __cxx_static_address_7fa867f09f8781b25f394af8() {
  return __cxx_static_address_7fa867f09f8781b25f394af8.reference || (__cxx_static_address_7fa867f09f8781b25f394af8.reference = {
    __cReference: true,
    get value() { return _MIDI_Context; },
    set value(__cxx_lvalue_0) { _MIDI_Context = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:81
export let _MIDI_ActiveTracks = 0;
function __cxx_static_address_5311eb352c91e22dae85fdeb() {
  return __cxx_static_address_5311eb352c91e22dae85fdeb.reference || (__cxx_static_address_5311eb352c91e22dae85fdeb.reference = {
    __cReference: true,
    get value() { return _MIDI_ActiveTracks; },
    set value(__cxx_lvalue_0) { _MIDI_ActiveTracks = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:82
export let _MIDI_TotalVolume = i32(255);
function __cxx_static_address_92e4eb8f92d2b354bb37a644() {
  return __cxx_static_address_92e4eb8f92d2b354bb37a644.reference || (__cxx_static_address_92e4eb8f92d2b354bb37a644.reference = {
    __cReference: true,
    get value() { return _MIDI_TotalVolume; },
    set value(__cxx_lvalue_0) { _MIDI_TotalVolume = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_276f22e3d44cf116 = i32(2147483647);
function __cxx_static_address_050d0297720b06c8359859f9() {
  return __cxx_static_address_050d0297720b06c8359859f9.reference || (__cxx_static_address_050d0297720b06c8359859f9.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_276f22e3d44cf116; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_6446b8e5627ce080 = i32(2147483648);
function __cxx_static_address_50f53270091a28140eeea95f() {
  return __cxx_static_address_50f53270091a28140eeea95f.reference || (__cxx_static_address_50f53270091a28140eeea95f.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_6446b8e5627ce080; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_9ce8131ad62c5625 = i32(2147483648);
function __cxx_static_address_e6c39a2cca00594e7cabb854() {
  return __cxx_static_address_e6c39a2cca00594e7cabb854.reference || (__cxx_static_address_e6c39a2cca00594e7cabb854.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_9ce8131ad62c5625; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_9cbfd3e223175bcc = i32(65536);
function __cxx_static_address_f9360118f1c5f3faad0a3d8f() {
  return __cxx_static_address_f9360118f1c5f3faad0a3d8f.reference || (__cxx_static_address_f9360118f1c5f3faad0a3d8f.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_9cbfd3e223175bcc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_1104c09af5a7364f = i32(32768);
function __cxx_static_address_f1115a38b96057aa6b3f71a5() {
  return __cxx_static_address_f1115a38b96057aa6b3f71a5.reference || (__cxx_static_address_f1115a38b96057aa6b3f71a5.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_1104c09af5a7364f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_2be30c8896897aa6 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_2cc5eade98f2bf4e2790e422() {
  return __cxx_static_address_2cc5eade98f2bf4e2790e422.reference || (__cxx_static_address_2cc5eade98f2bf4e2790e422.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_2be30c8896897aa6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:84
export let _MIDI_ChannelVolume = new Int32Array(16);
function __cxx_static_address_8b8240bb72b37a4c19440e2c() {
  return __cxx_static_address_8b8240bb72b37a4c19440e2c.reference || (__cxx_static_address_8b8240bb72b37a4c19440e2c.reference = {
    __cReference: true,
    get value() { return _MIDI_ChannelVolume; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:86
export let _MIDI_Funcs = null;
function __cxx_static_address_e758fe009e23590f5f0d7995() {
  return __cxx_static_address_e758fe009e23590f5f0d7995.reference || (__cxx_static_address_e758fe009e23590f5f0d7995.reference = {
    __cReference: true,
    get value() { return _MIDI_Funcs; },
    set value(__cxx_lvalue_0) { _MIDI_Funcs = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:88
export let _MIDI_Reset = 0;
function __cxx_static_address_fce9ea75e878eedadc002c9c() {
  return __cxx_static_address_fce9ea75e878eedadc002c9c.reference || (__cxx_static_address_fce9ea75e878eedadc002c9c.reference = {
    __cReference: true,
    get value() { return _MIDI_Reset; },
    set value(__cxx_lvalue_0) { _MIDI_Reset = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:90
export let MV_MIDIRenderTempo = i32((-1));
export function __cxx_global_cell_ece418416652c380cd3a06e4() {
  return __cxx_global_cell_ece418416652c380cd3a06e4.reference || (__cxx_global_cell_ece418416652c380cd3a06e4.reference = {
    __cReference: true,
    get value() { return MV_MIDIRenderTempo; },
    set value(__cxx_lvalue_0) { MV_MIDIRenderTempo = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:91
export let MV_MIDIRenderTimer = 0;
export function __cxx_global_cell_34ab867f9f9964abc4c8037b() {
  return __cxx_global_cell_34ab867f9f9964abc4c8037b.reference || (__cxx_global_cell_34ab867f9f9964abc4c8037b.reference = {
    __cReference: true,
    get value() { return MV_MIDIRenderTimer; },
    set value(__cxx_lvalue_0) { MV_MIDIRenderTimer = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:93
export let _MIDI_SongPtr = null;
function __cxx_static_address_2b00573c1d409fa58282ec73() {
  return __cxx_static_address_2b00573c1d409fa58282ec73.reference || (__cxx_static_address_2b00573c1d409fa58282ec73.reference = {
    __cReference: true,
    get value() { return _MIDI_SongPtr; },
    set value(__cxx_lvalue_0) { _MIDI_SongPtr = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:108
export function _MIDI_ReadNumber(from, size) {
  if ((size > u64(4))) {
    (size = u64(4));
  }
  let FromPtr = cTypedPointer(from, Uint8Array);
  let value = i32(0);
  while (Boolean(((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u64((previous - 1n)); __cxx_lvalue_0.value = next; return previous; })(cRef(() => size, __cxx_lvalue_1 => { size = __cxx_lvalue_1; })))) {
    (value = i32((value << 8)));
    (value = i32((Number(value) + Number(i32((cDeref(((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = cPointerOffset(previous, 1, Uint8Array.BYTES_PER_ELEMENT); __cxx_lvalue_2.value = next; return previous; })(cRef(() => FromPtr, __cxx_lvalue_3 => { FromPtr = __cxx_lvalue_3; })), Uint8Array).value))))));
  }
  return i32(value);
}

// C/C++ source: source/audiolib/src/midi.cpp:125
export function _MIDI_ReadDelta(ptr) {
  let value;
  do {
    (value = i32((cDeref((ptr).value.pos, Uint8Array).value)));
    ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = cPointerOffset(__cxx_lvalue_0.value, 1, Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef((ptr).value, "pos"));
  } while (Boolean(0));
  if (Boolean(i32((value & 128)))) {
    (value = i32((value & 127)));
    let c;
    do {
      do {
        (c = (((cDeref((ptr).value.pos, Uint8Array).value)) & 255));
        ((__cxx_lvalue_1) => (__cxx_lvalue_1.value = cPointerOffset(__cxx_lvalue_1.value, 1, Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef((ptr).value, "pos"));
      } while (Boolean(0));
      (value = i32((i32((value << 7)) + i32((i32(c) & 127)))));
    } while (Boolean(i32((i32(c) & 128))));
  }
  return i32(value);
}

// C/C++ source: source/audiolib/src/midi.cpp:178
export function _MIDI_AdvanceTick() {
  ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = u32((previous + 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_6c32a6acbc578619946b696c());
  (_MIDI_Time = u32((Number(_MIDI_Time) + Number(u32(_MIDI_FPSecondsPerTick)))));
  ((__cxx_lvalue_1) => { const previous = __cxx_lvalue_1.value; const next = i32((previous + 1)); __cxx_lvalue_1.value = next; return previous; })(__cxx_static_address_f02a488c57f154fa267b42e4());
  while ((_MIDI_Tick > _MIDI_TicksPerBeat)) {
    (_MIDI_Tick = i32((Number(_MIDI_Tick) - Number(_MIDI_TicksPerBeat))));
    ((__cxx_lvalue_2) => { const previous = __cxx_lvalue_2.value; const next = i32((previous + 1)); __cxx_lvalue_2.value = next; return previous; })(__cxx_static_address_afe727f04c96d00c27cdd6ac());
  }
  while ((_MIDI_Beat > _MIDI_BeatsPerMeasure)) {
    (_MIDI_Beat = i32((Number(_MIDI_Beat) - Number(_MIDI_BeatsPerMeasure))));
    ((__cxx_lvalue_3) => { const previous = __cxx_lvalue_3.value; const next = i32((previous + 1)); __cxx_lvalue_3.value = next; return previous; })(__cxx_static_address_667eb95f89184c51f02577bc());
  }
}

// C/C++ source: source/audiolib/src/midi.cpp:196
export function _MIDI_SysEx(Track) {
  let length = i32(_MIDI_ReadDelta(Track));
  ((__cxx_lvalue_0) => (__cxx_lvalue_0.value = cPointerOffset(__cxx_lvalue_0.value, length, Uint8Array.BYTES_PER_ELEMENT)))(cObjectFieldRef((Track).value, "pos"));
}

// C/C++ source: source/audiolib/src/midi.cpp:524
export function _MIDI_SendControlChange(channel, c1, c2) {
  if ((cPointerCompare(_MIDI_Funcs, null, "==") || cPointerCompare(cRecordObject(_MIDI_Funcs).ControlChange, null, "=="))) {
    return i32(-1);
  }
  cRecordObject(_MIDI_Funcs).ControlChange(channel, c1, c2);
  return i32(0);
}

// C/C++ source: source/audiolib/src/midi.cpp:534
export function _MIDI_SendProgramChange(channel, c1) {
  if ((cPointerCompare(_MIDI_Funcs, null, "==") || cPointerCompare(cRecordObject(_MIDI_Funcs).ProgramChange, null, "=="))) {
    return i32(-1);
  }
  cRecordObject(_MIDI_Funcs).ProgramChange(channel, c1);
  return i32(0);
}

// C/C++ source: source/audiolib/src/midi.cpp:650
export function MIDI_SetLoopFlag(loopflag) {
  (_MIDI_Loop = i32(loopflag));
}

// C/C++ source: source/audiolib/src/midi.cpp:652
export function MIDI_ContinueSong() {
  if ((!Boolean(_MIDI_SongLoaded))) {
    return;
  }
  (_MIDI_SongActive = i32(1));
}

// C/C++ source: source/audiolib/src/midi.cpp:669
export function MIDI_SetMidiFuncs(funcs) {
  (_MIDI_Funcs = funcs);
}

// C/C++ source: source/audiolib/src/midi.cpp:944
export function MIDI_GetSongPosition(pos) {
  let mil = u32(Math.imul(u32((_MIDI_Time & u32(i32((i32((1 << 16)) - 1))))), u32(1000)));
  let sec = u32((_MIDI_Time >>> 16));
  (cRecordObject(pos).milliseconds = u32(((mil >>> 16) + u32(Math.imul(sec, u32(1000))))));
  (cRecordObject(pos).tickposition = u32(_MIDI_PositionInTicks));
  (cRecordObject(pos).measure = u32(_MIDI_Measure));
  (cRecordObject(pos).beat = u32(_MIDI_Beat));
  (cRecordObject(pos).tick = u32(_MIDI_Tick));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_7d00111facc2fbfd = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_d06bdce38e97ae42851f637f() {
  return __cxx_static_address_d06bdce38e97ae42851f637f.reference || (__cxx_static_address_d06bdce38e97ae42851f637f.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_7d00111facc2fbfd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/midi.cpp:1036
export function B_UNBUF32__header_c263e3884392(buf) {
  return u32((cDeref(cTypedPointer(buf, Uint32Array), Uint32Array).value));
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return cRecordObject(allocator).Free(p);
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return cRecordObject(allocator).Alloc(bytesCount, alignment);
}
