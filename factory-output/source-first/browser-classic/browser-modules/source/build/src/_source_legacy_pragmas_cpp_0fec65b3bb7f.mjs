// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/pragmas.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));

// C/C++ source: source/build/src/pragmas.cpp:28
export let lastd_s64 = 0n;
export function __cxx_global_cell_f8287b2e627d0e3f51b90c55() {
  return __cxx_global_cell_f8287b2e627d0e3f51b90c55.reference || (__cxx_global_cell_f8287b2e627d0e3f51b90c55.reference = {
    __cReference: true,
    get value() { return lastd_s64; },
    set value(__cxx_lvalue_0) { lastd_s64 = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/pragmas.cpp:29
export let lastd_s64_b = 0n;
export function __cxx_global_cell_bb3de2e29ec4bffc85e65aa8() {
  return __cxx_global_cell_bb3de2e29ec4bffc85e65aa8.reference || (__cxx_global_cell_bb3de2e29ec4bffc85e65aa8.reference = {
    __cReference: true,
    get value() { return lastd_s64_b; },
    set value(__cxx_lvalue_0) { lastd_s64_b = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/pragmas.cpp:31
export let lastd_s32 = 0;
export function __cxx_global_cell_a6e3cfd4eba13fb9886cb240() {
  return __cxx_global_cell_a6e3cfd4eba13fb9886cb240.reference || (__cxx_global_cell_a6e3cfd4eba13fb9886cb240.reference = {
    __cReference: true,
    get value() { return lastd_s32; },
    set value(__cxx_lvalue_0) { lastd_s32 = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/pragmas.cpp:32
export let lastd_s32_b = 0;
export function __cxx_global_cell_b6db0759e33cdbb028a91dc6() {
  return __cxx_global_cell_b6db0759e33cdbb028a91dc6.reference || (__cxx_global_cell_b6db0759e33cdbb028a91dc6.reference = {
    __cReference: true,
    get value() { return lastd_s32_b; },
    set value(__cxx_lvalue_0) { lastd_s32_b = i32(__cxx_lvalue_0); }
  });
}
