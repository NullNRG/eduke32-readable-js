// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/timer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/build/src/timer.cpp:40
export let clockTicksPerSecond = 0;
function __cxx_static_address_9bf3f9df2ac908b4b68699d4() {
  return __cxx_static_address_9bf3f9df2ac908b4b68699d4.reference || (__cxx_static_address_9bf3f9df2ac908b4b68699d4.reference = {
    __cReference: true,
    get value() { return clockTicksPerSecond; },
    set value(__cxx_lvalue_0) { clockTicksPerSecond = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_9bf3f9df2ac908b4b68699d4() { return __cxx_static_address_9bf3f9df2ac908b4b68699d4(); }

// C/C++ source: source/build/src/timer.cpp:116
export function timerGetNanoTickRate() {
  return u64((BigInt(u64((BigInt(1000000n) / BigInt(u64(100))))) * BigInt(u64(clockTicksPerSecond))));
}
