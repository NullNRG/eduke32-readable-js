// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/load.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_549957078d56b6e7 = i32(3754936);
function __cxx_static_address_6755f7407960aa58e38ac97b() {
  return __cxx_static_address_6755f7407960aa58e38ac97b.reference || (__cxx_static_address_6755f7407960aa58e38ac97b.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_549957078d56b6e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_40d3b0cba3c28abe = i32(1144);
function __cxx_static_address_be583c4f8667c1170deeb0eb() {
  return __cxx_static_address_be583c4f8667c1170deeb0eb.reference || (__cxx_static_address_be583c4f8667c1170deeb0eb.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_40d3b0cba3c28abe; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_4b06dc42c567406c = i32(2147483647);
function __cxx_static_address_9e5e919d7fc320b2a651694e() {
  return __cxx_static_address_9e5e919d7fc320b2a651694e.reference || (__cxx_static_address_9e5e919d7fc320b2a651694e.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_4b06dc42c567406c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_df9085defc2a2e7d = i32(2147483648);
function __cxx_static_address_5dda1cf8b2ef0d0d4fcea0b9() {
  return __cxx_static_address_5dda1cf8b2ef0d0d4fcea0b9.reference || (__cxx_static_address_5dda1cf8b2ef0d0d4fcea0b9.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_df9085defc2a2e7d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_a3ca84e7d5a758b9 = i32(2147483648);
function __cxx_static_address_dbf7cf35d8b0b9d68a09415f() {
  return __cxx_static_address_dbf7cf35d8b0b9d68a09415f.reference || (__cxx_static_address_dbf7cf35d8b0b9d68a09415f.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_a3ca84e7d5a758b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_c7bc8be79707b391 = i32(65536);
function __cxx_static_address_d00bb03e7d1db7bcf905ae54() {
  return __cxx_static_address_d00bb03e7d1db7bcf905ae54.reference || (__cxx_static_address_d00bb03e7d1db7bcf905ae54.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_c7bc8be79707b391; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_dd45ddc66ddbcdab = i32(32768);
function __cxx_static_address_3f482ebd6e264fb7d47753f4() {
  return __cxx_static_address_3f482ebd6e264fb7d47753f4.reference || (__cxx_static_address_3f482ebd6e264fb7d47753f4.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_dd45ddc66ddbcdab; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_77f8cbe064b079aa = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_5c081b0241650cf8ae29e359() {
  return __cxx_static_address_5c081b0241650cf8ae29e359.reference || (__cxx_static_address_5c081b0241650cf8ae29e359.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_77f8cbe064b079aa; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_03c1e01a3f7de50c = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_b2ff08e78e241049696b807d() {
  return __cxx_static_address_b2ff08e78e241049696b807d.reference || (__cxx_static_address_b2ff08e78e241049696b807d.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_03c1e01a3f7de50c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return (allocator).value.Free(p);
}
