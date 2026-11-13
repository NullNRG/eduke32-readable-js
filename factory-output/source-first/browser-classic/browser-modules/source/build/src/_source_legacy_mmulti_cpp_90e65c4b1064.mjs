// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/mmulti.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/build/src/mmulti.cpp:78
export let numplayers = 0;
export function __cxx_global_cell_af3e7a8f9b4d40a559acf109() {
  return __cxx_global_cell_af3e7a8f9b4d40a559acf109.reference || (__cxx_global_cell_af3e7a8f9b4d40a559acf109.reference = {
    __cReference: true,
    get value() { return numplayers; },
    set value(__cxx_lvalue_0) { numplayers = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:79
export let connecthead = 0;
export function __cxx_global_cell_37274ddda5136df9cc793c3b() {
  return __cxx_global_cell_37274ddda5136df9cc793c3b.reference || (__cxx_global_cell_37274ddda5136df9cc793c3b.reference = {
    __cReference: true,
    get value() { return connecthead; },
    set value(__cxx_lvalue_0) { connecthead = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/mmulti.cpp:79
export let connectpoint2 = new Int32Array(16);
function __cxx_static_address_20737f63fb1db8ca738d74b8() {
  return __cxx_static_address_20737f63fb1db8ca738d74b8.reference || (__cxx_static_address_20737f63fb1db8ca738d74b8.reference = {
    __cReference: true,
    get value() { return connectpoint2; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
