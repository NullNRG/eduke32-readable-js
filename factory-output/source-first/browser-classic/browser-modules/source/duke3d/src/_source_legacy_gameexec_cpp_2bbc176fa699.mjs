// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/gameexec.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/duke3d/src/gameexec.cpp:59
export let g_currentEvent = i32((-1));
export function __cxx_global_cell_21076f22805c1a4afdf49a3b() {
  return __cxx_global_cell_21076f22805c1a4afdf49a3b.reference || (__cxx_global_cell_21076f22805c1a4afdf49a3b.reference = {
    __cReference: true,
    get value() { return g_currentEvent; },
    set value(__cxx_lvalue_0) { g_currentEvent = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:72
export let g_thisActorVarID = i32((-1));
export function __cxx_global_cell_d034c01693142b00a1d9d58d() {
  return __cxx_global_cell_d034c01693142b00a1d9d58d.reference || (__cxx_global_cell_d034c01693142b00a1d9d58d.reference = {
    __cReference: true,
    get value() { return g_thisActorVarID; },
    set value(__cxx_lvalue_0) { g_thisActorVarID = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/duke3d/src/gameexec.cpp:142
export let apScriptEvents = new BigInt64Array(164);
function __cxx_static_address_3503e715f3a18f8448b8e65b() {
  return __cxx_static_address_3503e715f3a18f8448b8e65b.reference || (__cxx_static_address_3503e715f3a18f8448b8e65b.reference = {
    __cReference: true,
    get value() { return apScriptEvents; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
