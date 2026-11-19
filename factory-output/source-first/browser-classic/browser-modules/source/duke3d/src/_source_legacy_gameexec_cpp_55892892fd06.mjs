// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gameexec.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one = i32(65536);
function __cxx_static_address_b75bc85902bf31ade587fe9c() {
  return __cxx_static_address_b75bc85902bf31ade587fe9c.reference || (__cxx_static_address_b75bc85902bf31ade587fe9c.reference = {
    __cReference: true,
    get value() { return fix16_one; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:46
export function fix16_from_int__header_6768ed80e668(a) {
  return i32(Math.imul(a, fix16_one));
}
