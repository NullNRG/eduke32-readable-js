// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/audiolib/src/fx_man.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_eafbd8a0e900b376 = i32(3754936);
function __cxx_static_address_e5ccd16efe99f5b819854c0a() {
  return __cxx_static_address_e5ccd16efe99f5b819854c0a.reference || (__cxx_static_address_e5ccd16efe99f5b819854c0a.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_eafbd8a0e900b376; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_e54e263cc4cb6f49 = i32(1144);
function __cxx_static_address_3ae21668caff6ebcee24f562() {
  return __cxx_static_address_3ae21668caff6ebcee24f562.reference || (__cxx_static_address_3ae21668caff6ebcee24f562.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_e54e263cc4cb6f49; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:48
export let FX_ErrorCode = i32(0);
export function __cxx_global_cell_103ca1df5a9531b359a2ae15() {
  return __cxx_global_cell_103ca1df5a9531b359a2ae15.reference || (__cxx_global_cell_103ca1df5a9531b359a2ae15.reference = {
    __cReference: true,
    get value() { return FX_ErrorCode; },
    set value(__cxx_lvalue_0) { FX_ErrorCode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:49
export let FX_Installed = 0;
export function __cxx_global_cell_baecce8e0d645df20f706806() {
  return __cxx_global_cell_baecce8e0d645df20f706806.reference || (__cxx_global_cell_baecce8e0d645df20f706806.reference = {
    __cReference: true,
    get value() { return FX_Installed; },
    set value(__cxx_lvalue_0) { FX_Installed = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:50
export let FX_MixRate = 0;
export function __cxx_global_cell_6208087938e6e1dc88de0fa9() {
  return __cxx_global_cell_6208087938e6e1dc88de0fa9.reference || (__cxx_global_cell_6208087938e6e1dc88de0fa9.reference = {
    __cReference: true,
    get value() { return FX_MixRate; },
    set value(__cxx_lvalue_0) { FX_MixRate = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_48e64ce66ac7db95 = i32(2147483647);
function __cxx_static_address_7e57229ed362b4c4ccb825aa() {
  return __cxx_static_address_7e57229ed362b4c4ccb825aa.reference || (__cxx_static_address_7e57229ed362b4c4ccb825aa.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_48e64ce66ac7db95; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_416db87f9f45431a = i32(2147483648);
function __cxx_static_address_c036cbc4ad69a300778b5327() {
  return __cxx_static_address_c036cbc4ad69a300778b5327.reference || (__cxx_static_address_c036cbc4ad69a300778b5327.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_416db87f9f45431a; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_09b3a1f238a7aa4b = i32(2147483648);
function __cxx_static_address_b91315366f1c46b3774f28a5() {
  return __cxx_static_address_b91315366f1c46b3774f28a5.reference || (__cxx_static_address_b91315366f1c46b3774f28a5.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_09b3a1f238a7aa4b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_45574ce70fbb7ca9 = i32(65536);
function __cxx_static_address_ca4aaaaa725c78720afda2d7() {
  return __cxx_static_address_ca4aaaaa725c78720afda2d7.reference || (__cxx_static_address_ca4aaaaa725c78720afda2d7.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_45574ce70fbb7ca9; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_f3d74b55499c59fd = i32(32768);
function __cxx_static_address_49a742c0ad8c08bd3408dcd4() {
  return __cxx_static_address_49a742c0ad8c08bd3408dcd4.reference || (__cxx_static_address_49a742c0ad8c08bd3408dcd4.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_f3d74b55499c59fd; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_68259065915759c0 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_8116e680b7317318753b9f05() {
  return __cxx_static_address_8116e680b7317318753b9f05.reference || (__cxx_static_address_8116e680b7317318753b9f05.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_68259065915759c0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:215
export const FMT_CDXA_MAGIC = u32(i32((i32((i32((i32(67) + i32((i32(68) << 8)))) + i32((i32(88) << 16)))) + i32((i32(65) << 24)))));
function __cxx_static_address_ee07dfa8be63a723f91ce6ab() {
  return __cxx_static_address_ee07dfa8be63a723f91ce6ab.reference || (__cxx_static_address_ee07dfa8be63a723f91ce6ab.reference = {
    __cReference: true,
    get value() { return FMT_CDXA_MAGIC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:216
export const FMT_FLAC_MAGIC = u32(i32((i32((i32((i32(102) + i32((i32(76) << 8)))) + i32((i32(97) << 16)))) + i32((i32(67) << 24)))));
function __cxx_static_address_69d7f73975b3708931ee7690() {
  return __cxx_static_address_69d7f73975b3708931ee7690.reference || (__cxx_static_address_69d7f73975b3708931ee7690.reference = {
    __cReference: true,
    get value() { return FMT_FLAC_MAGIC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:217
export const FMT_OGG_MAGIC = u32(i32((i32((i32((i32(79) + i32((i32(103) << 8)))) + i32((i32(103) << 16)))) + i32((i32(83) << 24)))));
function __cxx_static_address_9fa466d751db642c6bff3d75() {
  return __cxx_static_address_9fa466d751db642c6bff3d75.reference || (__cxx_static_address_9fa466d751db642c6bff3d75.reference = {
    __cReference: true,
    get value() { return FMT_OGG_MAGIC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:218
export const FMT_RIFF_MAGIC = u32(i32((i32((i32((i32(82) + i32((i32(73) << 8)))) + i32((i32(70) << 16)))) + i32((i32(70) << 24)))));
function __cxx_static_address_23baab4903e4a1cf7bd08889() {
  return __cxx_static_address_23baab4903e4a1cf7bd08889.reference || (__cxx_static_address_23baab4903e4a1cf7bd08889.reference = {
    __cReference: true,
    get value() { return FMT_RIFF_MAGIC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:219
export const FMT_VOC_MAGIC = u32(i32((i32((i32((i32(67) + i32((i32(114) << 8)))) + i32((i32(101) << 16)))) + i32((i32(97) << 24)))));
function __cxx_static_address_3caf855c3d05b7cbaa8d73ea() {
  return __cxx_static_address_3caf855c3d05b7cbaa8d73ea.reference || (__cxx_static_address_3caf855c3d05b7cbaa8d73ea.reference = {
    __cReference: true,
    get value() { return FMT_VOC_MAGIC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:220
export const FMT_WAVE_MAGIC = u32(i32((i32((i32((i32(87) + i32((i32(65) << 8)))) + i32((i32(86) << 16)))) + i32((i32(69) << 24)))));
function __cxx_static_address_bfa589417eaaafd1697ec394() {
  return __cxx_static_address_bfa589417eaaafd1697ec394.reference || (__cxx_static_address_bfa589417eaaafd1697ec394.reference = {
    __cReference: true,
    get value() { return FMT_WAVE_MAGIC; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_3c032a43a0425e3f = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_7293e4be8d25f6ff5a5748bb() {
  return __cxx_static_address_7293e4be8d25f6ff5a5748bb.reference || (__cxx_static_address_7293e4be8d25f6ff5a5748bb.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_3c032a43a0425e3f; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/audiolib/src/fx_man.cpp:91
export function FX_SetErrorCode__header_cbce4c78bfae(status) {
  (FX_ErrorCode = i32(status));
  return i32(-1);
}

export function B_PASS32__header_40f06050db62(x) {
  return u32(x);
}

export function ARRAY_SIZE__header_0b86b055d68c(arg0) {
  return u64(8n);
}

export function ARRAY_SIZE__header_f2f23e6f8615(arg0) {
  return u64(8n);
}
