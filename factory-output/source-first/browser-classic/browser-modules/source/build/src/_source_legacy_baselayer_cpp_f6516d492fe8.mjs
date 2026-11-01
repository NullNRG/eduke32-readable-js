// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/baselayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

// C/C++ source: source/build/src/baselayer.cpp:194
export let g_useLogCallback = Boolean(true);
export function __cxx_global_cell_079877be927e9ceeb785b6a6() {
  return __cxx_global_cell_079877be927e9ceeb785b6a6.reference || (__cxx_global_cell_079877be927e9ceeb785b6a6.reference = {
    __cReference: true,
    get value() { return g_useLogCallback; },
    set value(__cxx_lvalue_0) { g_useLogCallback = Boolean(__cxx_lvalue_0); }
  });
}
