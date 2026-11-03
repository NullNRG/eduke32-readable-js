// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/timer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;

// C/C++ source: source/build/src/timer.cpp:119
export function timerGetTicks() {
  return u32(timerGetTicks(u32(1000)));
}

// C/C++ source: source/build/src/timer.cpp:120
export function timerGetFractionalTicks() {
  return timerGetTicks(1000);
}

// Original Clang-generated fragment; imports existing owner storage.
export { clockTicksPerSecond, timerGetNanoTickRate, __cxx_private_cell_9bf3f9df2ac908b4b68699d4 } from "./_source_legacy_timer_cpp_bd47cf9eac81.mjs";
