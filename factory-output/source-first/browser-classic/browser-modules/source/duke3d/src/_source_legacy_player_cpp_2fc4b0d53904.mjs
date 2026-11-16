// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/player.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/duke3d/src/player.cpp:3016
export let g_myAimMode = 0;
export function __cxx_global_cell_08999a64c4501ca30fea06a5() {
  return __cxx_global_cell_08999a64c4501ca30fea06a5.reference || (__cxx_global_cell_08999a64c4501ca30fea06a5.reference = {
    __cReference: true,
    get value() { return g_myAimMode; },
    set value(__cxx_lvalue_0) { g_myAimMode = i32(__cxx_lvalue_0); }
  });
}
