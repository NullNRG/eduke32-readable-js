// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/vfs.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/vfs.cpp:1446
export let lz4CompressionLevel = i32(5);
export function __cxx_global_cell_2e953df8db08c3fc6f0c3e07() {
  return __cxx_global_cell_2e953df8db08c3fc6f0c3e07.reference || (__cxx_global_cell_2e953df8db08c3fc6f0c3e07.reference = {
    __cReference: true,
    get value() { return lz4CompressionLevel; },
    set value(__cxx_lvalue_0) { lz4CompressionLevel = i32(__cxx_lvalue_0); }
  });
}
