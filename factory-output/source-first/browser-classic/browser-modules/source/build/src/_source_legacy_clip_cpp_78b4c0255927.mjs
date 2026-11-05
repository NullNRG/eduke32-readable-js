// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/clip.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/build/src/clip.cpp:70
export let quickloadboard = i32(0);
export function __cxx_global_cell_135b27d87941a5cb2fdb33a1() {
  return __cxx_global_cell_135b27d87941a5cb2fdb33a1.reference || (__cxx_global_cell_135b27d87941a5cb2fdb33a1.reference = {
    __cReference: true,
    get value() { return quickloadboard; },
    set value(__cxx_lvalue_0) { quickloadboard = i32(__cxx_lvalue_0); }
  });
}
