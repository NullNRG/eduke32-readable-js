// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/mix.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_62c1729be2d2f653 = i32(3754936);
function __cxx_static_address_26a090ea05d108e83a2d877f() {
  return __cxx_static_address_26a090ea05d108e83a2d877f.reference || (__cxx_static_address_26a090ea05d108e83a2d877f.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_62c1729be2d2f653; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_4807d302be967855 = i32(1144);
function __cxx_static_address_8011d6fcad2617d5ef1f71f0() {
  return __cxx_static_address_8011d6fcad2617d5ef1f71f0.reference || (__cxx_static_address_8011d6fcad2617d5ef1f71f0.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_4807d302be967855; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_ed03417aff2a5d21 = i32(2147483647);
function __cxx_static_address_d8f253f01b7b73ddeabc1657() {
  return __cxx_static_address_d8f253f01b7b73ddeabc1657.reference || (__cxx_static_address_d8f253f01b7b73ddeabc1657.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_ed03417aff2a5d21; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_714d6b5d18d2484b = i32(2147483648);
function __cxx_static_address_abb2934f3238c89f80c598f6() {
  return __cxx_static_address_abb2934f3238c89f80c598f6.reference || (__cxx_static_address_abb2934f3238c89f80c598f6.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_714d6b5d18d2484b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_eefbb78adc986f3b = i32(2147483648);
function __cxx_static_address_9ac165c4752d48106b71ae87() {
  return __cxx_static_address_9ac165c4752d48106b71ae87.reference || (__cxx_static_address_9ac165c4752d48106b71ae87.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_eefbb78adc986f3b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_94483d03be566b9c = i32(65536);
function __cxx_static_address_b7869800cff48a3cba145727() {
  return __cxx_static_address_b7869800cff48a3cba145727.reference || (__cxx_static_address_b7869800cff48a3cba145727.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_94483d03be566b9c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_a108afda6c5c13dd = i32(32768);
function __cxx_static_address_54ad6d96dbb966e7f1426537() {
  return __cxx_static_address_54ad6d96dbb966e7f1426537.reference || (__cxx_static_address_54ad6d96dbb966e7f1426537.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_a108afda6c5c13dd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_5e77f4511b12abf2 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_eb55906df13d9312e52d90f7() {
  return __cxx_static_address_eb55906df13d9312e52d90f7.reference || (__cxx_static_address_eb55906df13d9312e52d90f7.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_5e77f4511b12abf2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_5f99eac2f0cc2c1a = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_a41889d61a80adf8881ff4c5() {
  return __cxx_static_address_a41889d61a80adf8881ff4c5.reference || (__cxx_static_address_a41889d61a80adf8881ff4c5.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_5f99eac2f0cc2c1a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
