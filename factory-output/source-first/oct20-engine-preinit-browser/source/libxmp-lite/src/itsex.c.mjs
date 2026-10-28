// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/itsex.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_b2355c5516b83288 = i32(3754936);
function __cxx_static_address_bb1df29db1b3061cc69332c1() {
  return __cxx_static_address_bb1df29db1b3061cc69332c1.reference || (__cxx_static_address_bb1df29db1b3061cc69332c1.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_b2355c5516b83288; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_65a876555e34d50b = i32(1144);
function __cxx_static_address_9df118bc8fb5adc9f82bf22e() {
  return __cxx_static_address_9df118bc8fb5adc9f82bf22e.reference || (__cxx_static_address_9df118bc8fb5adc9f82bf22e.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_65a876555e34d50b; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_9e6391f8609102ce = i32(2147483647);
function __cxx_static_address_381302f93d86388fd2831a4b() {
  return __cxx_static_address_381302f93d86388fd2831a4b.reference || (__cxx_static_address_381302f93d86388fd2831a4b.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_9e6391f8609102ce; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_a87ade0fd78ec884 = i32(2147483648);
function __cxx_static_address_eb3b9f361924e0ea7f62c172() {
  return __cxx_static_address_eb3b9f361924e0ea7f62c172.reference || (__cxx_static_address_eb3b9f361924e0ea7f62c172.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_a87ade0fd78ec884; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_3de9ada3999c2638 = i32(2147483648);
function __cxx_static_address_6e2ca07a49fbe892e1f9edaa() {
  return __cxx_static_address_6e2ca07a49fbe892e1f9edaa.reference || (__cxx_static_address_6e2ca07a49fbe892e1f9edaa.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_3de9ada3999c2638; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_040472e8c2a115f1 = i32(65536);
function __cxx_static_address_85bac4750fe6128dcb4a7809() {
  return __cxx_static_address_85bac4750fe6128dcb4a7809.reference || (__cxx_static_address_85bac4750fe6128dcb4a7809.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_040472e8c2a115f1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_78a9aaffd7d8dca1 = i32(32768);
function __cxx_static_address_f935b1aa54396f741abab464() {
  return __cxx_static_address_f935b1aa54396f741abab464.reference || (__cxx_static_address_f935b1aa54396f741abab464.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_78a9aaffd7d8dca1; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_bdb935f08aae0c68 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_ae6a2e0cb67398a4b62720c6() {
  return __cxx_static_address_ae6a2e0cb67398a4b62720c6.reference || (__cxx_static_address_ae6a2e0cb67398a4b62720c6.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_bdb935f08aae0c68; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_ae4c4a5cb609b268 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_3de5d6cd716d59b160d897f5() {
  return __cxx_static_address_3de5d6cd716d59b160d897f5.reference || (__cxx_static_address_3de5d6cd716d59b160d897f5.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_ae4c4a5cb609b268; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
