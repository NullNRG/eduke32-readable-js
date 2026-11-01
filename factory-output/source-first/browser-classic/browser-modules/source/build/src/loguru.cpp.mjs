// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/loguru.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/loguru.cpp:192
export let g_stderr_verbosity = i32(0);
export function __cxx_global_cell_15062f896ae6daef493e80a9() {
  return __cxx_global_cell_15062f896ae6daef493e80a9.reference || (__cxx_global_cell_15062f896ae6daef493e80a9.reference = {
    __cReference: true,
    get value() { return g_stderr_verbosity; },
    set value(__cxx_lvalue_0) { g_stderr_verbosity = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/loguru.cpp:210
export let s_max_out_verbosity = i32(-9);
function __cxx_static_address_f4928d8d17572e35a08071db() {
  return __cxx_static_address_f4928d8d17572e35a08071db.reference || (__cxx_static_address_f4928d8d17572e35a08071db.reference = {
    __cReference: true,
    get value() { return s_max_out_verbosity; },
    set value(__cxx_lvalue_0) { s_max_out_verbosity = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_f4928d8d17572e35a08071db() { return __cxx_static_address_f4928d8d17572e35a08071db(); }

// C/C++ source: source/build/src/loguru.cpp:1079
export function current_verbosity_cutoff() {
  return ((g_stderr_verbosity > s_max_out_verbosity) ? g_stderr_verbosity : s_max_out_verbosity);
}
