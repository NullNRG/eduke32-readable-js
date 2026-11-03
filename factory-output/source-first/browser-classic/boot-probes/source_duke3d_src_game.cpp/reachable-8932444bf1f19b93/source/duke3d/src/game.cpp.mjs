// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/game.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.

export function __cxx_operator_11a696315e969ab4(lhs, rhs) {
  return Boolean((lhs.wholeTicks < rhs.wholeTicks));
}

export function __cxx_operator_6d2a22ee5048dd1a(lhs, rhs) {
  return Boolean((!__cxx_operator_11a696315e969ab4(lhs, rhs)));
}
