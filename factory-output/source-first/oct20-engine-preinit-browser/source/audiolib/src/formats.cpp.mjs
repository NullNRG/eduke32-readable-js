// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/formats.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_ca50201490124488 = i32(3754936);
function __cxx_static_address_f9ada689a5908019a5fbb3d9() {
  return __cxx_static_address_f9ada689a5908019a5fbb3d9.reference || (__cxx_static_address_f9ada689a5908019a5fbb3d9.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_ca50201490124488; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_f6a4d562721925da = i32(1144);
function __cxx_static_address_05f253cbaf0ee821c3ded69a() {
  return __cxx_static_address_05f253cbaf0ee821c3ded69a.reference || (__cxx_static_address_05f253cbaf0ee821c3ded69a.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_f6a4d562721925da; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/libdivide.h:152
export function libdivide_u64_t() {
  return libdivide_u64_t.type || (libdivide_u64_t.type = class libdivide_u64_t__implementation {
  constructor() {
    this.magic = undefined;
    this.more = undefined;
  }
});
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_db95c53413e0520f = i32(2147483647);
function __cxx_static_address_d8f037d6be53a2ccc64da4c0() {
  return __cxx_static_address_d8f037d6be53a2ccc64da4c0.reference || (__cxx_static_address_d8f037d6be53a2ccc64da4c0.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_db95c53413e0520f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_e3c878f4b18005a2 = i32(2147483648);
function __cxx_static_address_07ae2862044f93624751437a() {
  return __cxx_static_address_07ae2862044f93624751437a.reference || (__cxx_static_address_07ae2862044f93624751437a.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_e3c878f4b18005a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_a0064ed2e49012e2 = i32(2147483648);
function __cxx_static_address_47fc47419658d6683eaa798d() {
  return __cxx_static_address_47fc47419658d6683eaa798d.reference || (__cxx_static_address_47fc47419658d6683eaa798d.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_a0064ed2e49012e2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_e9655db9877be6c8 = i32(65536);
function __cxx_static_address_3080d8ff187855138c0e7b82() {
  return __cxx_static_address_3080d8ff187855138c0e7b82.reference || (__cxx_static_address_3080d8ff187855138c0e7b82.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_e9655db9877be6c8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_067af8f06d12d77f = i32(32768);
function __cxx_static_address_dce37d65502ca64a93a55d5a() {
  return __cxx_static_address_dce37d65502ca64a93a55d5a.reference || (__cxx_static_address_dce37d65502ca64a93a55d5a.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_067af8f06d12d77f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_0b828d038ee2bb27 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_d3cd4614a31aca7141b2c23d() {
  return __cxx_static_address_d3cd4614a31aca7141b2c23d.reference || (__cxx_static_address_d3cd4614a31aca7141b2c23d.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_0b828d038ee2bb27; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_59efea4015865d69 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_eae2f563a3c9b11c127ce1b4() {
  return __cxx_static_address_eae2f563a3c9b11c127ce1b4.reference || (__cxx_static_address_eae2f563a3c9b11c127ce1b4.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_59efea4015865d69; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function B_PASS16__header_47dfeee2d5f9(x) {
  return ((x) & 65535);
}

export function B_PASS32__header_1f27dcaa6e04(x) {
  return u32(x);
}
