// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/actors.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

// C/C++ source: source/duke3d/src/actors.cpp:41
export let g_radiusDmgStatnums = new Uint8Array(128);
function __cxx_static_address_8914a219ba61db83076bee19() {
  return __cxx_static_address_8914a219ba61db83076bee19.reference || (__cxx_static_address_8914a219ba61db83076bee19.reference = {
    __cReference: true,
    get value() { return g_radiusDmgStatnums; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
