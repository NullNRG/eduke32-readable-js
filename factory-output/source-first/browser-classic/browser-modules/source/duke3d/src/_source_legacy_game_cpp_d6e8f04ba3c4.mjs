// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/game.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { CONTROL_DefineFlag } from "../../mact/src/control.cpp.mjs";

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/duke3d/src/game.cpp:7490
export function G_SetupGameButtons() {
  CONTROL_DefineFlag(i32(0), 0);
  CONTROL_DefineFlag(i32(1), 0);
  CONTROL_DefineFlag(i32(2), 0);
  CONTROL_DefineFlag(i32(3), 0);
  CONTROL_DefineFlag(i32(4), 0);
  CONTROL_DefineFlag(i32(5), 0);
  CONTROL_DefineFlag(i32(6), 0);
  CONTROL_DefineFlag(i32(7), 0);
  CONTROL_DefineFlag(i32(56), 0);
  CONTROL_DefineFlag(i32(9), 0);
  CONTROL_DefineFlag(i32(10), 0);
  CONTROL_DefineFlag(i32(11), 0);
  CONTROL_DefineFlag(i32(12), 0);
  CONTROL_DefineFlag(i32(13), 0);
  CONTROL_DefineFlag(i32(14), 0);
  CONTROL_DefineFlag(i32(15), 0);
  CONTROL_DefineFlag(i32(16), 0);
  CONTROL_DefineFlag(i32(17), 0);
  CONTROL_DefineFlag(i32(18), 0);
  CONTROL_DefineFlag(i32(19), 0);
  CONTROL_DefineFlag(i32(20), 0);
  CONTROL_DefineFlag(i32(21), 0);
  CONTROL_DefineFlag(i32(22), 0);
  CONTROL_DefineFlag(i32(23), 0);
  CONTROL_DefineFlag(i32(24), 0);
  CONTROL_DefineFlag(i32(25), 0);
  CONTROL_DefineFlag(i32(26), 0);
  CONTROL_DefineFlag(i32(27), 0);
  CONTROL_DefineFlag(i32(28), 0);
  CONTROL_DefineFlag(i32(29), 0);
  CONTROL_DefineFlag(i32(30), 0);
  CONTROL_DefineFlag(i32(31), 0);
  CONTROL_DefineFlag(i32(32), 0);
  CONTROL_DefineFlag(i32(33), 0);
  CONTROL_DefineFlag(i32(34), 0);
  CONTROL_DefineFlag(i32(35), 0);
  CONTROL_DefineFlag(i32(36), 0);
  CONTROL_DefineFlag(i32(37), 0);
  CONTROL_DefineFlag(i32(38), 0);
  CONTROL_DefineFlag(i32(39), 0);
  CONTROL_DefineFlag(i32(40), 0);
  CONTROL_DefineFlag(i32(41), 0);
  CONTROL_DefineFlag(i32(42), 0);
  CONTROL_DefineFlag(i32(43), 0);
  CONTROL_DefineFlag(i32(44), 0);
  CONTROL_DefineFlag(i32(45), 0);
  CONTROL_DefineFlag(i32(46), 0);
  CONTROL_DefineFlag(i32(47), 0);
  CONTROL_DefineFlag(i32(48), 0);
  CONTROL_DefineFlag(i32(49), 0);
  CONTROL_DefineFlag(i32(50), 0);
  CONTROL_DefineFlag(i32(51), 0);
  CONTROL_DefineFlag(i32(8), 0);
  CONTROL_DefineFlag(i32(57), 0);
  CONTROL_DefineFlag(i32(58), 0);
  CONTROL_DefineFlag(i32(59), 0);
  CONTROL_DefineFlag(i32(60), 0);
  CONTROL_DefineFlag(i32(61), 0);
  CONTROL_DefineFlag(i32(62), 0);
}
