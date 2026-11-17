// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/player.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/duke3d/src/player.cpp:41
export let g_numObituaries = i32(0);
export function __cxx_global_cell_14c7f525d32b0838223674c4() {
  return __cxx_global_cell_14c7f525d32b0838223674c4.reference || (__cxx_global_cell_14c7f525d32b0838223674c4.reference = {
    __cReference: true,
    get value() { return g_numObituaries; },
    set value(__cxx_lvalue_0) { g_numObituaries = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/player.cpp:42
export let g_numSelfObituaries = i32(0);
export function __cxx_global_cell_30b06f32517f69cb2a10e60b() {
  return __cxx_global_cell_30b06f32517f69cb2a10e60b.reference || (__cxx_global_cell_30b06f32517f69cb2a10e60b.reference = {
    __cReference: true,
    get value() { return g_numSelfObituaries; },
    set value(__cxx_lvalue_0) { g_numSelfObituaries = i32(__cxx_lvalue_0); }
  });
}
