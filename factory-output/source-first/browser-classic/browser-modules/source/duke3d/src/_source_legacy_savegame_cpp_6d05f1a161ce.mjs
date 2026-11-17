// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/savegame.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/duke3d/src/savegame.cpp:136
export let g_lastAutoSaveArbitraryID = i32((-1));
export function __cxx_global_cell_465a0b3c161b50504ffed39e() {
  return __cxx_global_cell_465a0b3c161b50504ffed39e.reference || (__cxx_global_cell_465a0b3c161b50504ffed39e.reference = {
    __cReference: true,
    get value() { return g_lastAutoSaveArbitraryID; },
    set value(__cxx_lvalue_0) { g_lastAutoSaveArbitraryID = i32(__cxx_lvalue_0); }
  });
}
