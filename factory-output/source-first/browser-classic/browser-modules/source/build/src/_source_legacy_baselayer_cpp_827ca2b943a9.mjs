// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/baselayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/build/src/baselayer.cpp:39
export let keystatus = new Uint8Array(256);
function __cxx_static_address_445951956ef36b38c80e3fc7() {
  return __cxx_static_address_445951956ef36b38c80e3fc7.reference || (__cxx_static_address_445951956ef36b38c80e3fc7.reference = {
    __cReference: true,
    get value() { return keystatus; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:257
export let keypresscallback = null;
export function __cxx_global_cell_77d14caa4bb6e2cb2f6b3f8f() {
  return __cxx_global_cell_77d14caa4bb6e2cb2f6b3f8f.reference || (__cxx_global_cell_77d14caa4bb6e2cb2f6b3f8f.reference = {
    __cReference: true,
    get value() { return keypresscallback; },
    set value(__cxx_lvalue_0) { keypresscallback = __cxx_lvalue_0; }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:259
export function keySetCallback(callback) {
  (keypresscallback = callback);
}

// C/C++ source: source/build/src/baselayer.cpp:316
export let g_mouseBits = 0;
export function __cxx_global_cell_1e0923736d676262c5e9d588() {
  return __cxx_global_cell_1e0923736d676262c5e9d588.reference || (__cxx_global_cell_1e0923736d676262c5e9d588.reference = {
    __cReference: true,
    get value() { return g_mouseBits; },
    set value(__cxx_lvalue_0) { g_mouseBits = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:321
export let g_mouseInsideWindow = Boolean(Boolean(1));
export function __cxx_global_cell_80f8e5fd148b9081d92a796f() {
  return __cxx_global_cell_80f8e5fd148b9081d92a796f.reference || (__cxx_global_cell_80f8e5fd148b9081d92a796f.reference = {
    __cReference: true,
    get value() { return g_mouseInsideWindow; },
    set value(__cxx_lvalue_0) { g_mouseInsideWindow = Boolean(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/baselayer.cpp:322
export let g_mouseLockedToWindow = Boolean(Boolean(1));
export function __cxx_global_cell_f2b488870f755876d24f149d() {
  return __cxx_global_cell_f2b488870f755876d24f149d.reference || (__cxx_global_cell_f2b488870f755876d24f149d.reference = {
    __cReference: true,
    get value() { return g_mouseLockedToWindow; },
    set value(__cxx_lvalue_0) { g_mouseLockedToWindow = Boolean(__cxx_lvalue_0); }
  });
}
