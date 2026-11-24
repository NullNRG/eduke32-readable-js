// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/game.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/duke3d/src/game.cpp:6570
const __cxx_literal_c78e4775dc9dcda6e134 = Uint8Array.from([86, 77, 0]);
const __cxx_literal_6e1a221b34653c7ace70 = Uint8Array.from([67, 79, 78, 0]);
export function dukeVerbosityCallback(verbosity) {
  switch (i32(verbosity)) {
    default: {
      return null;
    }
    case i32(9): {
      return __cxx_literal_c78e4775dc9dcda6e134;
    }
    case i32(10): {
      return __cxx_literal_6e1a221b34653c7ace70;
    }
  }
}
