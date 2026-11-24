// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/player.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function u64(value) { return BigInt.asUintN(64, BigInt(value)); }

// C/C++ source: source/duke3d/src/player.cpp:3017
export let g_lastInputTicks = 0n;
export function __cxx_global_cell_579cbee071346f2d65498ce0() {
  return __cxx_global_cell_579cbee071346f2d65498ce0.reference || (__cxx_global_cell_579cbee071346f2d65498ce0.reference = {
    __cReference: true,
    get value() { return g_lastInputTicks; },
    set value(__cxx_lvalue_0) { g_lastInputTicks = u64(__cxx_lvalue_0); }
  });
}
