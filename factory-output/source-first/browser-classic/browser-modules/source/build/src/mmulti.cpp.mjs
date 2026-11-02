// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/mmulti.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/mmulti.cpp:78
export let myconnectindex = 0;
export function __cxx_global_cell_04adffdeab684b9c52206917() {
  return __cxx_global_cell_04adffdeab684b9c52206917.reference || (__cxx_global_cell_04adffdeab684b9c52206917.reference = {
    __cReference: true,
    get value() { return myconnectindex; },
    set value(__cxx_lvalue_0) { myconnectindex = i32(__cxx_lvalue_0); }
  });
}
