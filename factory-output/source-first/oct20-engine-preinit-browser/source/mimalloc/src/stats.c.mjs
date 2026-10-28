// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/mimalloc/src/stats.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i64 = value => BigInt.asIntN(64, BigInt(value));

// C/C++ source: source/mimalloc/src/stats.c:369
export let mi_process_start = 0n;
function __cxx_static_address_79dbbf3a0961e6250e74b374() {
  return __cxx_static_address_79dbbf3a0961e6250e74b374.reference || (__cxx_static_address_79dbbf3a0961e6250e74b374.reference = {
    __cReference: true,
    get value() { return mi_process_start; },
    set value(__cxx_lvalue_0) { mi_process_start = i64(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/mimalloc/src/stats.c:417
export let mi_clock_diff = 0n;
function __cxx_static_address_f1a5ed949ed5bb3ade924325() {
  return __cxx_static_address_f1a5ed949ed5bb3ade924325.reference || (__cxx_static_address_f1a5ed949ed5bb3ade924325.reference = {
    __cReference: true,
    get value() { return mi_clock_diff; },
    set value(__cxx_lvalue_0) { mi_clock_diff = i64(__cxx_lvalue_0); }
  });
}
