// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/mod_load.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_ccdf522415230c9e = i32(3754936);
function __cxx_static_address_0c279664734c0094086625d5() {
  return __cxx_static_address_0c279664734c0094086625d5.reference || (__cxx_static_address_0c279664734c0094086625d5.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_ccdf522415230c9e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_c08cd11377fa7fb3 = i32(1144);
function __cxx_static_address_d682c009ab69e59812aabd62() {
  return __cxx_static_address_d682c009ab69e59812aabd62.reference || (__cxx_static_address_d682c009ab69e59812aabd62.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_c08cd11377fa7fb3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_bddbbe7f0e8a9ebb = i32(2147483647);
function __cxx_static_address_69123183b0f35542fbd8c6d5() {
  return __cxx_static_address_69123183b0f35542fbd8c6d5.reference || (__cxx_static_address_69123183b0f35542fbd8c6d5.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_bddbbe7f0e8a9ebb; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_41758815e3249ca0 = i32(2147483648);
function __cxx_static_address_35c5ee0c3ef3b20f30d45fad() {
  return __cxx_static_address_35c5ee0c3ef3b20f30d45fad.reference || (__cxx_static_address_35c5ee0c3ef3b20f30d45fad.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_41758815e3249ca0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_3ed71354cefcf7e1 = i32(2147483648);
function __cxx_static_address_b709a84b0f7ffe6f4504d2b5() {
  return __cxx_static_address_b709a84b0f7ffe6f4504d2b5.reference || (__cxx_static_address_b709a84b0f7ffe6f4504d2b5.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_3ed71354cefcf7e1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_61efcd86018bac5b = i32(65536);
function __cxx_static_address_36123f71341cd516b632c0ed() {
  return __cxx_static_address_36123f71341cd516b632c0ed.reference || (__cxx_static_address_36123f71341cd516b632c0ed.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_61efcd86018bac5b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_3cc5ae5d7f34ca1d = i32(32768);
function __cxx_static_address_2a46f57847427fab39f2d2ae() {
  return __cxx_static_address_2a46f57847427fab39f2d2ae.reference || (__cxx_static_address_2a46f57847427fab39f2d2ae.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_3cc5ae5d7f34ca1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_605cd2e41f096d02 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_4d7529c942a1bec690d1d0c7() {
  return __cxx_static_address_4d7529c942a1bec690d1d0c7.reference || (__cxx_static_address_4d7529c942a1bec690d1d0c7.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_605cd2e41f096d02; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_4f4b2e61fa100b61 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_373bdba0c77810e760652b5b() {
  return __cxx_static_address_373bdba0c77810e760652b5b.reference || (__cxx_static_address_373bdba0c77810e760652b5b.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_4f4b2e61fa100b61; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return (allocator).value.Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return (allocator).value.Free(p);
}
