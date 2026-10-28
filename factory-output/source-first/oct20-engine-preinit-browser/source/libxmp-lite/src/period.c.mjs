// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/period.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;
const floor = a => Math.floor(a);
const ceil = a => Math.ceil(a);

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_82210c445a9931c6 = i32(3754936);
function __cxx_static_address_f297b037e0f7aae185b15188() {
  return __cxx_static_address_f297b037e0f7aae185b15188.reference || (__cxx_static_address_f297b037e0f7aae185b15188.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_82210c445a9931c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_132adb1d3a852245 = i32(1144);
function __cxx_static_address_d746214948e6fa82ecff0d0e() {
  return __cxx_static_address_d746214948e6fa82ecff0d0e.reference || (__cxx_static_address_d746214948e6fa82ecff0d0e.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_132adb1d3a852245; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_18484f5036a80239 = i32(2147483647);
function __cxx_static_address_7762d34fa70deaef5338f5a8() {
  return __cxx_static_address_7762d34fa70deaef5338f5a8.reference || (__cxx_static_address_7762d34fa70deaef5338f5a8.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_18484f5036a80239; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_90d2ca1a1651f3fc = i32(2147483648);
function __cxx_static_address_711e30c9ccd02fdc585fe9f0() {
  return __cxx_static_address_711e30c9ccd02fdc585fe9f0.reference || (__cxx_static_address_711e30c9ccd02fdc585fe9f0.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_90d2ca1a1651f3fc; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_140cd57cbc3fd25f = i32(2147483648);
function __cxx_static_address_987f85725f72ad7915bf991a() {
  return __cxx_static_address_987f85725f72ad7915bf991a.reference || (__cxx_static_address_987f85725f72ad7915bf991a.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_140cd57cbc3fd25f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_b09aaaf25235cb9c = i32(65536);
function __cxx_static_address_1e69bf117c873e5627fe121d() {
  return __cxx_static_address_1e69bf117c873e5627fe121d.reference || (__cxx_static_address_1e69bf117c873e5627fe121d.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_b09aaaf25235cb9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_b631b5f490c80e6b = i32(32768);
function __cxx_static_address_5ced12456b9b6c203951d53e() {
  return __cxx_static_address_5ced12456b9b6c203951d53e.reference || (__cxx_static_address_5ced12456b9b6c203951d53e.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_b631b5f490c80e6b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_e8db79630255eabb = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_b5f5f8a8b49b89a39c58499a() {
  return __cxx_static_address_b5f5f8a8b49b89a39c58499a.reference || (__cxx_static_address_b5f5f8a8b49b89a39c58499a.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_e8db79630255eabb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/period.c:139
export function libxmp_round(val) {
  return ((val >= 0) ? floor((val + 0.5)) : ceil((val - 0.5)));
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_1323b69610f732d5 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_80787b962cb3dbe0ff38c640() {
  return __cxx_static_address_80787b962cb3dbe0ff38c640.reference || (__cxx_static_address_80787b962cb3dbe0ff38c640.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_1323b69610f732d5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
