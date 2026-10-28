// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/enet.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_4ac708e16b809873 = i32(3754936);
function __cxx_static_address_37fca3ea2a7413b6992ab823() {
  return __cxx_static_address_37fca3ea2a7413b6992ab823.reference || (__cxx_static_address_37fca3ea2a7413b6992ab823.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_4ac708e16b809873; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_9aeabb4faa24150e = i32(1144);
function __cxx_static_address_fa204206f21bb68f1083ef3f() {
  return __cxx_static_address_fa204206f21bb68f1083ef3f.reference || (__cxx_static_address_fa204206f21bb68f1083ef3f.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_9aeabb4faa24150e; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_9f692d6ab77400d2 = i32(2147483647);
function __cxx_static_address_62b57d4c84b11268b22fb999() {
  return __cxx_static_address_62b57d4c84b11268b22fb999.reference || (__cxx_static_address_62b57d4c84b11268b22fb999.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_9f692d6ab77400d2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_04ad5a1563cb8dd0 = i32(2147483648);
function __cxx_static_address_aed79e9dac211219cf6107aa() {
  return __cxx_static_address_aed79e9dac211219cf6107aa.reference || (__cxx_static_address_aed79e9dac211219cf6107aa.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_04ad5a1563cb8dd0; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_3383c73917720661 = i32(2147483648);
function __cxx_static_address_645c1584f60872b4714dea15() {
  return __cxx_static_address_645c1584f60872b4714dea15.reference || (__cxx_static_address_645c1584f60872b4714dea15.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_3383c73917720661; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_2f3f5874822e34ec = i32(65536);
function __cxx_static_address_7bca858714fe181026662db8() {
  return __cxx_static_address_7bca858714fe181026662db8.reference || (__cxx_static_address_7bca858714fe181026662db8.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_2f3f5874822e34ec; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_b8174fdad2b330a2 = i32(32768);
function __cxx_static_address_336b4bd5bab8743f241fca49() {
  return __cxx_static_address_336b4bd5bab8743f241fca49.reference || (__cxx_static_address_336b4bd5bab8743f241fca49.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_b8174fdad2b330a2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_2b2b9305d3bad561 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_b81778b5b007cecad819aae1() {
  return __cxx_static_address_b81778b5b007cecad819aae1.reference || (__cxx_static_address_b81778b5b007cecad819aae1.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_2b2b9305d3bad561; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/enet.h:1402
export let initializedCRC32__header_global_d80c9f612a78f35a = i32(0);
function __cxx_static_address_99d055a4a67bbec6e8deaaec() {
  return __cxx_static_address_99d055a4a67bbec6e8deaaec.reference || (__cxx_static_address_99d055a4a67bbec6e8deaaec.reference = {
    __cReference: true,
    get value() { return initializedCRC32__header_global_d80c9f612a78f35a; },
    set value(__cxx_lvalue_0) { initializedCRC32__header_global_d80c9f612a78f35a = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_d07ba97e1a932a1d = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_f48960433dca3dbb81b7c635() {
  return __cxx_static_address_f48960433dca3dbb81b7c635.reference || (__cxx_static_address_f48960433dca3dbb81b7c635.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_d07ba97e1a932a1d; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/enet.h:1403
export let crcTable__header_global_454fc0e1c0694461 = new Uint32Array(256);
function __cxx_static_address_85243eb86119996d56a13b76() {
  return __cxx_static_address_85243eb86119996d56a13b76.reference || (__cxx_static_address_85243eb86119996d56a13b76.reference = {
    __cReference: true,
    get value() { return crcTable__header_global_454fc0e1c0694461; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/enet.h:1462
export let commandSizes__header_global_a3f2782a4ffae1b3 = new BigUint64Array([BigInt(u64(0)), BigInt(8), BigInt(48), BigInt(44), BigInt(8), BigInt(4), BigInt(6), BigInt(8), BigInt(24), BigInt(8), BigInt(12), BigInt(16), BigInt(24)]);
function __cxx_static_address_3cb803478f94d57ba06c3b46() {
  return __cxx_static_address_3cb803478f94d57ba06c3b46.reference || (__cxx_static_address_3cb803478f94d57ba06c3b46.reference = {
    __cReference: true,
    get value() { return commandSizes__header_global_a3f2782a4ffae1b3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
