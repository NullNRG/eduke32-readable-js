// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/smmalloc.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;

// C/C++ source: source/build/src/smmalloc.cpp:218
export function GetNextPow2(n) {
  (n = u32((Number(n) - Number(u32(1)))));
  (n = u32((n | (n >>> 16))));
  (n = u32((n | (n >>> 8))));
  (n = u32((n | (n >>> 4))));
  (n = u32((n | (n >>> 2))));
  (n = u32((n | (n >>> 1))));
  return i32(u32((n + u32(1))));
}
