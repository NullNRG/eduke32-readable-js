// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/drivers.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_02832a3454e71f3c = i32(3754936);
function __cxx_static_address_f32383ab2d656d5eb962e8b6() {
  return __cxx_static_address_f32383ab2d656d5eb962e8b6.reference || (__cxx_static_address_f32383ab2d656d5eb962e8b6.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_02832a3454e71f3c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_ef87cfed95ff3f8f = i32(1144);
function __cxx_static_address_85b5ef33b6c740b97d94b5e7() {
  return __cxx_static_address_85b5ef33b6c740b97d94b5e7.reference || (__cxx_static_address_85b5ef33b6c740b97d94b5e7.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_ef87cfed95ff3f8f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/drivers.cpp:46
export let ASS_PCMSoundDriver = i32(-2);
export function __cxx_global_cell_b7436cfda3dbd8e4449f9401() {
  return __cxx_global_cell_b7436cfda3dbd8e4449f9401.reference || (__cxx_global_cell_b7436cfda3dbd8e4449f9401.reference = {
    __cReference: true,
    get value() { return ASS_PCMSoundDriver; },
    set value(__cxx_lvalue_0) { ASS_PCMSoundDriver = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/drivers.cpp:47
export let ASS_MIDISoundDriver = i32(-2);
export function __cxx_global_cell_a2ef5e6e4ca64a0ec064952a() {
  return __cxx_global_cell_a2ef5e6e4ca64a0ec064952a.reference || (__cxx_global_cell_a2ef5e6e4ca64a0ec064952a.reference = {
    __cReference: true,
    get value() { return ASS_MIDISoundDriver; },
    set value(__cxx_lvalue_0) { ASS_MIDISoundDriver = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/drivers.cpp:48
export let ASS_EMIDICard = i32((-1));
export function __cxx_global_cell_4604759fda8076584cf859ab() {
  return __cxx_global_cell_4604759fda8076584cf859ab.reference || (__cxx_global_cell_4604759fda8076584cf859ab.reference = {
    __cReference: true,
    get value() { return ASS_EMIDICard; },
    set value(__cxx_lvalue_0) { ASS_EMIDICard = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_e9072e0fb1c4ab78 = i32(2147483647);
function __cxx_static_address_b8fa6a524c88d5b26c84e840() {
  return __cxx_static_address_b8fa6a524c88d5b26c84e840.reference || (__cxx_static_address_b8fa6a524c88d5b26c84e840.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_e9072e0fb1c4ab78; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_2eed7752c4a3d6e7 = i32(2147483648);
function __cxx_static_address_505a23c614f7d4505a4e621e() {
  return __cxx_static_address_505a23c614f7d4505a4e621e.reference || (__cxx_static_address_505a23c614f7d4505a4e621e.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_2eed7752c4a3d6e7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_bb0b898179026cd1 = i32(2147483648);
function __cxx_static_address_2b6ad9088bb249c76b455b0c() {
  return __cxx_static_address_2b6ad9088bb249c76b455b0c.reference || (__cxx_static_address_2b6ad9088bb249c76b455b0c.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_bb0b898179026cd1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_71b58e00309487d8 = i32(65536);
function __cxx_static_address_2bc5b635bf24dca7083d15ea() {
  return __cxx_static_address_2bc5b635bf24dca7083d15ea.reference || (__cxx_static_address_2bc5b635bf24dca7083d15ea.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_71b58e00309487d8; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_8cfedb537cc7999d = i32(32768);
function __cxx_static_address_cc1ba41f5753c8705c8af644() {
  return __cxx_static_address_cc1ba41f5753c8705c8af644.reference || (__cxx_static_address_cc1ba41f5753c8705c8af644.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_8cfedb537cc7999d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_70c1794092e56e91 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_1c11efa3eb73117abdab7284() {
  return __cxx_static_address_1c11efa3eb73117abdab7284.reference || (__cxx_static_address_1c11efa3eb73117abdab7284.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_70c1794092e56e91; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_114e1bf56d5214c6 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_280b70a5c36f3cd1aa628290() {
  return __cxx_static_address_280b70a5c36f3cd1aa628290.reference || (__cxx_static_address_280b70a5c36f3cd1aa628290.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_114e1bf56d5214c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
