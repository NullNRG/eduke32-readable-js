// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/effects.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_d0b32b637ec00187 = i32(3754936);
function __cxx_static_address_b2dd4161038d9f7d7cf516dc() {
  return __cxx_static_address_b2dd4161038d9f7d7cf516dc.reference || (__cxx_static_address_b2dd4161038d9f7d7cf516dc.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_d0b32b637ec00187; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c3871ac7cfc6cb6d = i32(1144);
function __cxx_static_address_51f6fa83d34f96ae12d1c83c() {
  return __cxx_static_address_51f6fa83d34f96ae12d1c83c.reference || (__cxx_static_address_51f6fa83d34f96ae12d1c83c.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c3871ac7cfc6cb6d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_f6ec5eca36ae15aa = i32(2147483647);
function __cxx_static_address_c4c9a4c4d8d9a4919289de57() {
  return __cxx_static_address_c4c9a4c4d8d9a4919289de57.reference || (__cxx_static_address_c4c9a4c4d8d9a4919289de57.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_f6ec5eca36ae15aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_7d6cc68b6f6a133c = i32(2147483648);
function __cxx_static_address_b79d92b76753dc11a71fd599() {
  return __cxx_static_address_b79d92b76753dc11a71fd599.reference || (__cxx_static_address_b79d92b76753dc11a71fd599.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_7d6cc68b6f6a133c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_831e761bbd3a248b = i32(2147483648);
function __cxx_static_address_c62a70dd5529b2c021ed9731() {
  return __cxx_static_address_c62a70dd5529b2c021ed9731.reference || (__cxx_static_address_c62a70dd5529b2c021ed9731.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_831e761bbd3a248b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_d0da5276cc6d1f94 = i32(65536);
function __cxx_static_address_9ea6906f97636cdb88474c67() {
  return __cxx_static_address_9ea6906f97636cdb88474c67.reference || (__cxx_static_address_9ea6906f97636cdb88474c67.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_d0da5276cc6d1f94; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_4d2c3a15da9a8e91 = i32(32768);
function __cxx_static_address_4a63c8061c8b2b6d6361d39e() {
  return __cxx_static_address_4a63c8061c8b2b6d6361d39e.reference || (__cxx_static_address_4a63c8061c8b2b6d6361d39e.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_4d2c3a15da9a8e91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_45e82ebd66a3b958 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_f74b58a9f4f05dedb30635f6() {
  return __cxx_static_address_f74b58a9f4f05dedb30635f6.reference || (__cxx_static_address_f74b58a9f4f05dedb30635f6.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_45e82ebd66a3b958; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_34544843696e1de0 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_39f9ab33792b126a6e15bfc5() {
  return __cxx_static_address_39f9ab33792b126a6e15bfc5.reference || (__cxx_static_address_39f9ab33792b126a6e15bfc5.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_34544843696e1de0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
