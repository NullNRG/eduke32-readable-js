// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/engine.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/engine.cpp:86
export let usevoxels = i32(1);
export function __cxx_global_cell_77d5c24237b7b046074e378d() {
  return __cxx_global_cell_77d5c24237b7b046074e378d.reference || (__cxx_global_cell_77d5c24237b7b046074e378d.reference = {
    __cReference: true,
    get value() { return usevoxels; },
    set value(__cxx_lvalue_0) { usevoxels = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/engine.cpp:427
export let r_tror_nomaskpass = i32(1);
export function __cxx_global_cell_8afc3f1714c50fd848123c08() {
  return __cxx_global_cell_8afc3f1714c50fd848123c08.reference || (__cxx_global_cell_8afc3f1714c50fd848123c08.reference = {
    __cReference: true,
    get value() { return r_tror_nomaskpass; },
    set value(__cxx_lvalue_0) { r_tror_nomaskpass = i32(__cxx_lvalue_0); }
  });
}
