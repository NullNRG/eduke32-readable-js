// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/engine.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;

// C/C++ source: source/build/src/engine.cpp:1528
export let qsetmode = i32(0);
export function __cxx_global_cell_6fba320e7d23de23519fe332() {
  return __cxx_global_cell_6fba320e7d23de23519fe332.reference || (__cxx_global_cell_6fba320e7d23de23519fe332.reference = {
    __cReference: true,
    get value() { return qsetmode; },
    set value(__cxx_lvalue_0) { qsetmode = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:761
export let xdim = 0;
export function __cxx_global_cell_22f848239c12c0d9f2b6f9e3() {
  return __cxx_global_cell_22f848239c12c0d9f2b6f9e3.reference || (__cxx_global_cell_22f848239c12c0d9f2b6f9e3.reference = {
    __cReference: true,
    get value() { return xdim; },
    set value(__cxx_lvalue_0) { xdim = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/build.h:761
export let ydim = 0;
export function __cxx_global_cell_ce636929c03d679219ea2982() {
  return __cxx_global_cell_ce636929c03d679219ea2982.reference || (__cxx_global_cell_ce636929c03d679219ea2982.reference = {
    __cReference: true,
    get value() { return ydim; },
    set value(__cxx_lvalue_0) { ydim = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_712730224f5e2862 = new Uint8Array([(u32(1) & 255), (u32(2) & 255), (u32(4) & 255), (u32(8) & 255), (u32(16) & 255), (u32(32) & 255), (u32(64) & 255), (u32(128) & 255)]);
function __cxx_static_address_3dbbd23dc4df226e70c52d7b() {
  return __cxx_static_address_3dbbd23dc4df226e70c52d7b.reference || (__cxx_static_address_3dbbd23dc4df226e70c52d7b.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_712730224f5e2862; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
export function __cxx_private_cell_3dbbd23dc4df226e70c52d7b() { return __cxx_static_address_3dbbd23dc4df226e70c52d7b(); }

// C/C++ source: source/build/include/build.h:764
export let ylookup = null;
export function __cxx_global_cell_6ef139bca6611fb821515c5d() {
  return __cxx_global_cell_6ef139bca6611fb821515c5d.reference || (__cxx_global_cell_6ef139bca6611fb821515c5d.reference = {
    __cReference: true,
    get value() { return ylookup; },
    set value(__cxx_lvalue_0) { ylookup = __cxx_lvalue_0; }
  });
}
