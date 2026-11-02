// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/engine.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;

// C/C++ source: source/build/src/engine.cpp:93
export let novoxmips = i32(0);
export function __cxx_global_cell_7e42dba8ea8f9a8bc3318fdc() {
  return __cxx_global_cell_7e42dba8ea8f9a8bc3318fdc.reference || (__cxx_global_cell_7e42dba8ea8f9a8bc3318fdc.reference = {
    __cReference: true,
    get value() { return novoxmips; },
    set value(__cxx_lvalue_0) { novoxmips = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:130
export let r_screenxy = u32(0);
export function __cxx_global_cell_585083e70b316eace630e342() {
  return __cxx_global_cell_585083e70b316eace630e342.reference || (__cxx_global_cell_585083e70b316eace630e342.reference = {
    __cReference: true,
    get value() { return r_screenxy; },
    set value(__cxx_lvalue_0) { r_screenxy = u32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:132
export let r_rotatespriteinterp = i32(1);
export function __cxx_global_cell_839b6dd579d4126718a101c3() {
  return __cxx_global_cell_839b6dd579d4126718a101c3.reference || (__cxx_global_cell_839b6dd579d4126718a101c3.reference = {
    __cReference: true,
    get value() { return r_rotatespriteinterp; },
    set value(__cxx_lvalue_0) { r_rotatespriteinterp = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:133
export let r_fpgrouscan = i32(1);
export function __cxx_global_cell_d33e7d272649317fa29cc706() {
  return __cxx_global_cell_d33e7d272649317fa29cc706.reference || (__cxx_global_cell_d33e7d272649317fa29cc706.reference = {
    __cReference: true,
    get value() { return r_fpgrouscan; },
    set value(__cxx_lvalue_0) { r_fpgrouscan = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:135
export let r_borderless = i32(2);
export function __cxx_global_cell_67da6fc124c3ab1d5da4a606() {
  return __cxx_global_cell_67da6fc124c3ab1d5da4a606.reference || (__cxx_global_cell_67da6fc124c3ab1d5da4a606.reference = {
    __cReference: true,
    get value() { return r_borderless; },
    set value(__cxx_lvalue_0) { r_borderless = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:139
export let g_videoGamma = Math.fround(Math.fround(1));
export function __cxx_global_cell_92f6ec0c3a993b574f308abb() {
  return __cxx_global_cell_92f6ec0c3a993b574f308abb.reference || (__cxx_global_cell_92f6ec0c3a993b574f308abb.reference = {
    __cReference: true,
    get value() { return g_videoGamma; },
    set value(__cxx_lvalue_0) { g_videoGamma = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:140
export let g_videoContrast = Math.fround(Math.fround(1));
export function __cxx_global_cell_eb7ec64efb5dec6e758a65c7() {
  return __cxx_global_cell_eb7ec64efb5dec6e758a65c7.reference || (__cxx_global_cell_eb7ec64efb5dec6e758a65c7.reference = {
    __cReference: true,
    get value() { return g_videoContrast; },
    set value(__cxx_lvalue_0) { g_videoContrast = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:141
export let g_videoSaturation = Math.fround(Math.fround(1));
export function __cxx_global_cell_a6f1e8c839618189cf2ebd7a() {
  return __cxx_global_cell_a6f1e8c839618189cf2ebd7a.reference || (__cxx_global_cell_a6f1e8c839618189cf2ebd7a.reference = {
    __cReference: true,
    get value() { return g_videoSaturation; },
    set value(__cxx_lvalue_0) { g_videoSaturation = Math.fround(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:816
export let maxspritesonscreen = 0;
export function __cxx_global_cell_4723a60d88a1aa0814b17967() {
  return __cxx_global_cell_4723a60d88a1aa0814b17967.reference || (__cxx_global_cell_4723a60d88a1aa0814b17967.reference = {
    __cReference: true,
    get value() { return maxspritesonscreen; },
    set value(__cxx_lvalue_0) { maxspritesonscreen = i32(__cxx_lvalue_0); }
  });
}
