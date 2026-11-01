// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/softsurface.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

// C/C++ source: source/build/src/softsurface.cpp:14
export let buffer = null;
function __cxx_static_address_e932603ef52898dc443ece98() {
  return __cxx_static_address_e932603ef52898dc443ece98.reference || (__cxx_static_address_e932603ef52898dc443ece98.reference = {
    __cReference: true,
    get value() { return buffer; },
    set value(__cxx_lvalue_0) { buffer = __cxx_lvalue_0; }
  });
}
export function __cxx_private_cell_e932603ef52898dc443ece98() { return __cxx_static_address_e932603ef52898dc443ece98(); }

// C/C++ source: source/build/src/softsurface.cpp:125
export function softsurface_getBuffer() {
  return buffer;
}
