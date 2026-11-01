// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/a-c.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/a-c.cpp:30
export let bpl = 0;
function __cxx_static_address_08e39f37b042ed02c5013c69() {
  return __cxx_static_address_08e39f37b042ed02c5013c69.reference || (__cxx_static_address_08e39f37b042ed02c5013c69.reference = {
    __cReference: true,
    get value() { return bpl; },
    set value(__cxx_lvalue_0) { bpl = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_08e39f37b042ed02c5013c69() { return __cxx_static_address_08e39f37b042ed02c5013c69(); }

// C/C++ source: source/build/src/a-c.cpp:39
export function setvlinebpl(dabpl) {
  (bpl = i32(dabpl));
}
