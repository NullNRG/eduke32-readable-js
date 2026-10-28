// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/driver_sf2.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_33dd37b6894955ef = i32(3754936);
function __cxx_static_address_3fd4ce5e3bd2caf2f0bdcfff() {
  return __cxx_static_address_3fd4ce5e3bd2caf2f0bdcfff.reference || (__cxx_static_address_3fd4ce5e3bd2caf2f0bdcfff.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_33dd37b6894955ef; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_a5635e0c21240d23 = i32(1144);
function __cxx_static_address_9a200a68e691f20500d70459() {
  return __cxx_static_address_9a200a68e691f20500d70459.reference || (__cxx_static_address_9a200a68e691f20500d70459.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_a5635e0c21240d23; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:29
export let SF2_EffectSampleBlockSize = i32(16);
export function __cxx_global_cell_dc7285e85848cfdbb8713307() {
  return __cxx_global_cell_dc7285e85848cfdbb8713307.reference || (__cxx_global_cell_dc7285e85848cfdbb8713307.reference = {
    __cReference: true,
    get value() { return SF2_EffectSampleBlockSize; },
    set value(__cxx_lvalue_0) { SF2_EffectSampleBlockSize = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:42
export let sf2_synth = null;
function __cxx_static_address_11a19fcc2b44d441f658d0d4() {
  return __cxx_static_address_11a19fcc2b44d441f658d0d4.reference || (__cxx_static_address_11a19fcc2b44d441f658d0d4.reference = {
    __cReference: true,
    get value() { return sf2_synth; },
    set value(__cxx_lvalue_0) { sf2_synth = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:43
export let SF2_BankFile = new Uint8Array(256);
function __cxx_static_address_1c75263a4d5afa11463e6c4c() {
  return __cxx_static_address_1c75263a4d5afa11463e6c4c.reference || (__cxx_static_address_1c75263a4d5afa11463e6c4c.reference = {
    __cReference: true,
    get value() { return SF2_BankFile; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_4989522356231e55 = i32(2147483647);
function __cxx_static_address_c3f224d50cd9ccf23d215f97() {
  return __cxx_static_address_c3f224d50cd9ccf23d215f97.reference || (__cxx_static_address_c3f224d50cd9ccf23d215f97.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_4989522356231e55; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_5344c4ab55eea48d = i32(2147483648);
function __cxx_static_address_7f16a23392ee196d96439a9e() {
  return __cxx_static_address_7f16a23392ee196d96439a9e.reference || (__cxx_static_address_7f16a23392ee196d96439a9e.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_5344c4ab55eea48d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_88108347eb8c9df2 = i32(2147483648);
function __cxx_static_address_df99c7c89728f075fd626637() {
  return __cxx_static_address_df99c7c89728f075fd626637.reference || (__cxx_static_address_df99c7c89728f075fd626637.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_88108347eb8c9df2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_633ff7e2d5cdb0b9 = i32(65536);
function __cxx_static_address_f822c1febeb08913df8a9be3() {
  return __cxx_static_address_f822c1febeb08913df8a9be3.reference || (__cxx_static_address_f822c1febeb08913df8a9be3.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_633ff7e2d5cdb0b9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_28df9fbf77797979 = i32(32768);
function __cxx_static_address_c70f53eea40c827aa023735d() {
  return __cxx_static_address_c70f53eea40c827aa023735d.reference || (__cxx_static_address_c70f53eea40c827aa023735d.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_28df9fbf77797979; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_0e2ecd562970eda5 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_1fad51ec038e15ea31a50861() {
  return __cxx_static_address_1fad51ec038e15ea31a50861.reference || (__cxx_static_address_1fad51ec038e15ea31a50861.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_0e2ecd562970eda5; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:44
export let SF2_Volume = i32(255);
function __cxx_static_address_676bd4c8ee58d5d584a61f52() {
  return __cxx_static_address_676bd4c8ee58d5d584a61f52.reference || (__cxx_static_address_676bd4c8ee58d5d584a61f52.reference = {
    __cReference: true,
    get value() { return SF2_Volume; },
    set value(__cxx_lvalue_0) { SF2_Volume = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:45
export let ErrorCode = i32(0);
function __cxx_static_address_1edba3aebeac4c1459f10d84() {
  return __cxx_static_address_1edba3aebeac4c1459f10d84.reference || (__cxx_static_address_1edba3aebeac4c1459f10d84.reference = {
    __cReference: true,
    get value() { return ErrorCode; },
    set value(__cxx_lvalue_0) { ErrorCode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:47
export function SF2_SetError(status) {
  return i32((ErrorCode = i32(status)));
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:49
export function SF2Drv_GetError() {
  return i32(ErrorCode);
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:61
export function SF2_SetVolume(volume) {
  (SF2_Volume = i32(clamp__header_bad434625931(volume, 0, 255)));
}

// C/C++ source: source/audiolib/src/driver_sf2.cpp:63
const __cxx_literal_19952f27ae75f7b10f30 = Uint8Array.from([83, 70, 50, 32, 111, 107, 46, 0]);
const __cxx_literal_1dd789ad9eb0feaa5f63 = Uint8Array.from([83, 70, 50, 32, 98, 97, 110, 107, 32, 101, 114, 114, 111, 114, 46, 0]);
const __cxx_literal_98439625f0b58dc0c31c = Uint8Array.from([85, 110, 107, 110, 111, 119, 110, 32, 83, 70, 50, 32, 101, 114, 114, 111, 114, 46, 0]);
export function SF2Drv_ErrorString(ErrorNumber) {
  switch (ErrorNumber) {
    case i32(-1): {
      return SF2Drv_ErrorString(ErrorCode);
    }
    case i32(0): {
      return __cxx_literal_19952f27ae75f7b10f30;
    }
    case i32(1): {
      return __cxx_literal_1dd789ad9eb0feaa5f63;
    }
    default: {
      return __cxx_literal_98439625f0b58dc0c31c;
    }
  }
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_dd56260b5b6ed13c = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_5c4a12ad2d5c316c3ba3ba91() {
  return __cxx_static_address_5c4a12ad2d5c316c3ba3ba91.reference || (__cxx_static_address_5c4a12ad2d5c316c3ba3ba91.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_dd56260b5b6ed13c; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

export function clamp__header_bad434625931(__cxx_in, min, max) {
  return i32(((__cxx_in <= i32(min)) ? i32(min) : ((__cxx_in >= i32(max)) ? i32(max) : __cxx_in)));
}

export function clamp__header_d2fc5e931422(__cxx_in, min, max) {
  return Math.fround(((__cxx_in <= Math.fround(Math.fround(min))) ? Math.fround(Math.fround(min)) : ((__cxx_in >= Math.fround(Math.fround(max))) ? Math.fround(Math.fround(max)) : __cxx_in)));
}

// C/C++ source: source/build/include/smmalloc.h:859
export function _sm_malloc(allocator, bytesCount, alignment) {
  return (allocator).value.Alloc(bytesCount, alignment);
}

// C/C++ source: source/build/include/smmalloc.h:864
export function _sm_free(allocator, p) {
  return (allocator).value.Free(p);
}
