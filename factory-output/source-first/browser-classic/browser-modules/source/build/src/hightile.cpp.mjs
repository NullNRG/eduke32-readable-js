// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/hightile.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/hightile.cpp:18
export let usehightile = i32(1);
export function __cxx_global_cell_528ff86eb213577eb56b717e() {
  return __cxx_global_cell_528ff86eb213577eb56b717e.reference || (__cxx_global_cell_528ff86eb213577eb56b717e.reference = {
    __cReference: true,
    get value() { return usehightile; },
    set value(__cxx_lvalue_0) { usehightile = i32(__cxx_lvalue_0); }
  });
}

// Original Clang-generated fragment; imports existing owner storage.
export { hicfindsubst, hicinitcounter, hicreplc, __cxx_global_cell_d15a38cdc2ff2e55bd064950 } from "./_source_legacy_hightile_cpp_fe224354b065.mjs";
