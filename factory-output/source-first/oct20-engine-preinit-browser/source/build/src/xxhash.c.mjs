// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/xxhash.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_d1c6106b29c226af = i32(3754936);
function __cxx_static_address_dacda2883f2e2ace03f97323() {
  return __cxx_static_address_dacda2883f2e2ace03f97323.reference || (__cxx_static_address_dacda2883f2e2ace03f97323.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_d1c6106b29c226af; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_738c255896868252 = i32(1144);
function __cxx_static_address_73b8d9104a42006d8a508bb9() {
  return __cxx_static_address_73b8d9104a42006d8a508bb9.reference || (__cxx_static_address_73b8d9104a42006d8a508bb9.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_738c255896868252; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_4f427a52a3975952 = i32(2147483647);
function __cxx_static_address_ea6fb8759f7022ff91bf02b9() {
  return __cxx_static_address_ea6fb8759f7022ff91bf02b9.reference || (__cxx_static_address_ea6fb8759f7022ff91bf02b9.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_4f427a52a3975952; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_4a29317daef4683f = i32(2147483648);
function __cxx_static_address_05851fc3fa1fa5171cba0775() {
  return __cxx_static_address_05851fc3fa1fa5171cba0775.reference || (__cxx_static_address_05851fc3fa1fa5171cba0775.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_4a29317daef4683f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_645fed144b513ef7 = i32(2147483648);
function __cxx_static_address_5b759f50762150d08f10de8f() {
  return __cxx_static_address_5b759f50762150d08f10de8f.reference || (__cxx_static_address_5b759f50762150d08f10de8f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_645fed144b513ef7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_5f7d19d74bbdb3e2 = i32(65536);
function __cxx_static_address_0fc9704b4b1d158c8451a591() {
  return __cxx_static_address_0fc9704b4b1d158c8451a591.reference || (__cxx_static_address_0fc9704b4b1d158c8451a591.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_5f7d19d74bbdb3e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_f6d6456418338f2f = i32(32768);
function __cxx_static_address_76a97a3437a7b8d5992a37b7() {
  return __cxx_static_address_76a97a3437a7b8d5992a37b7.reference || (__cxx_static_address_76a97a3437a7b8d5992a37b7.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_f6d6456418338f2f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_804dafcc96560964 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_12959bc30588933154dc3b0c() {
  return __cxx_static_address_12959bc30588933154dc3b0c.reference || (__cxx_static_address_12959bc30588933154dc3b0c.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_804dafcc96560964; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/xxhash.h:4317
export const PRIME_MX1__header_global_0fc482c25bbe6c9c = u64(1609587791953885689n);
function __cxx_static_address_239a87f2d2757a75a93e809a() {
  return __cxx_static_address_239a87f2d2757a75a93e809a.reference || (__cxx_static_address_239a87f2d2757a75a93e809a.reference = {
    __cReference: true,
    get value() { return PRIME_MX1__header_global_0fc482c25bbe6c9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/xxhash.h:4318
export const PRIME_MX2__header_global_be66945cd96bb6de = u64(11507291218515648293n);
function __cxx_static_address_3f2bbe01ec605ce1d03bae93() {
  return __cxx_static_address_3f2bbe01ec605ce1d03bae93.reference || (__cxx_static_address_3f2bbe01ec605ce1d03bae93.reference = {
    __cReference: true,
    get value() { return PRIME_MX2__header_global_be66945cd96bb6de; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_228be13e22766fd0 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_65004fcbb8adf8cb7da5e06c() {
  return __cxx_static_address_65004fcbb8adf8cb7da5e06c.reference || (__cxx_static_address_65004fcbb8adf8cb7da5e06c.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_228be13e22766fd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
