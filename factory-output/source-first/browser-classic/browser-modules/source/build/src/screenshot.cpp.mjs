// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/screenshot.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

// C/C++ source: source/build/src/screenshot.cpp:12
export let screenshot_dir = (() => { const bytes = new Uint8Array(256); bytes.set([115, 99, 114, 101, 101, 110, 115, 104, 111, 116, 115]); return bytes; })();
function __cxx_static_address_4fb43c5855d73c5fbdc34f60() {
  return __cxx_static_address_4fb43c5855d73c5fbdc34f60.reference || (__cxx_static_address_4fb43c5855d73c5fbdc34f60.reference = {
    __cReference: true,
    get value() { return screenshot_dir; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
