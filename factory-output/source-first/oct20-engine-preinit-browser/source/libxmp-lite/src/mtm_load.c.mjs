// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/mtm_load.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_a7e4ce61163f5f51 = i32(3754936);
function __cxx_static_address_dff3aead81c37a969157a9c0() {
  return __cxx_static_address_dff3aead81c37a969157a9c0.reference || (__cxx_static_address_dff3aead81c37a969157a9c0.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_a7e4ce61163f5f51; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_720b426e9897c8e8 = i32(1144);
function __cxx_static_address_3bb13ba12603e21026f56d1e() {
  return __cxx_static_address_3bb13ba12603e21026f56d1e.reference || (__cxx_static_address_3bb13ba12603e21026f56d1e.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_720b426e9897c8e8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/mtm_load.c:25
export class mtm_file_header {
  constructor() {
    this.magic = undefined;
    this.version = undefined;
    this.name = undefined;
    this.tracks = undefined;
    this.patterns = undefined;
    this.modlen = undefined;
    this.extralen = undefined;
    this.samples = undefined;
    this.attr = undefined;
    this.rows = undefined;
    this.channels = undefined;
    this.pan = undefined;
  }
}

// C/C++ source: source/libxmp-lite/src/mtm_load.c:40
export class mtm_instrument_header {
  constructor() {
    this.name = undefined;
    this.length = undefined;
    this.loop_start = undefined;
    this.loopend = undefined;
    this.finetune = undefined;
    this.volume = undefined;
    this.attr = undefined;
  }
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_3c90bd1b68664a0b = i32(2147483647);
function __cxx_static_address_f80a3e72e026ffcfc7a9ab5b() {
  return __cxx_static_address_f80a3e72e026ffcfc7a9ab5b.reference || (__cxx_static_address_f80a3e72e026ffcfc7a9ab5b.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_3c90bd1b68664a0b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_79296c8ff948bab8 = i32(2147483648);
function __cxx_static_address_f724a262adbb9e44465b9fa8() {
  return __cxx_static_address_f724a262adbb9e44465b9fa8.reference || (__cxx_static_address_f724a262adbb9e44465b9fa8.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_79296c8ff948bab8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_91d3ece184c29e6c = i32(2147483648);
function __cxx_static_address_044ab77bfa5b2a80a2b2064a() {
  return __cxx_static_address_044ab77bfa5b2a80a2b2064a.reference || (__cxx_static_address_044ab77bfa5b2a80a2b2064a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_91d3ece184c29e6c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_d8163a32338905f4 = i32(65536);
function __cxx_static_address_4fffffcd89ce3c5293e59f1f() {
  return __cxx_static_address_4fffffcd89ce3c5293e59f1f.reference || (__cxx_static_address_4fffffcd89ce3c5293e59f1f.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_d8163a32338905f4; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_c81e35b9499a3384 = i32(32768);
function __cxx_static_address_f1625dd40d9407da1d228acb() {
  return __cxx_static_address_f1625dd40d9407da1d228acb.reference || (__cxx_static_address_f1625dd40d9407da1d228acb.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_c81e35b9499a3384; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_bfa28c6706bfa81d = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_2eb5f17c76a242d8410a4a6f() {
  return __cxx_static_address_2eb5f17c76a242d8410a4a6f.reference || (__cxx_static_address_2eb5f17c76a242d8410a4a6f.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_bfa28c6706bfa81d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_496d8d3404d9e0f6 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_dbcbb4dbfacad4df4e8f1405() {
  return __cxx_static_address_dbcbb4dbfacad4df4e8f1405.reference || (__cxx_static_address_dbcbb4dbfacad4df4e8f1405.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_496d8d3404d9e0f6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return (allocator).value.Alloc(bytesCount, alignment);
}
