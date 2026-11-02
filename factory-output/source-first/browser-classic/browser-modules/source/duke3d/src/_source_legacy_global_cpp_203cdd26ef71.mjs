// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/global.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/duke3d/src/global.h:110
export let g_mostConcurrentPlayers = 0;
export function __cxx_global_cell_462926f90efdfe463807ff55() {
  return __cxx_global_cell_462926f90efdfe463807ff55.reference || (__cxx_global_cell_462926f90efdfe463807ff55.reference = {
    __cReference: true,
    get value() { return g_mostConcurrentPlayers; },
    set value(__cxx_lvalue_0) { g_mostConcurrentPlayers = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/global.cpp:49
export let g_gametypeFlags = (() => { const items = new Int32Array(16); items.set([i32((i32((i32((i32((i32((i32(4) | i32(8))) | i32(16))) | i32(1024))) | i32(2048))) | i32(16384))), i32((i32((i32((i32((i32((i32((i32((i32((i32((i32(1) | i32(2))) | i32(32))) | i32(64))) | i32(128))) | i32(256))) | i32(512))) | i32(4096))) | i32(8192))) | i32(32768))), i32((i32((i32((i32((i32(2) | i32(4))) | i32(8))) | i32(16))) | i32(16384))), i32((i32((i32((i32((i32((i32((i32((i32(4) | i32(8))) | i32(16))) | i32(1024))) | i32(2048))) | i32(16384))) | i32(65536))) | i32(131072))), i32((i32((i32((i32((i32((i32((i32(2) | i32(4))) | i32(8))) | i32(16))) | i32(16384))) | i32(65536))) | i32(131072)))]); return items; })();
function __cxx_static_address_b1eac4f18cf99731a8269cd6() {
  return __cxx_static_address_b1eac4f18cf99731a8269cd6.reference || (__cxx_static_address_b1eac4f18cf99731a8269cd6.reference = {
    __cReference: true,
    get value() { return g_gametypeFlags; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
