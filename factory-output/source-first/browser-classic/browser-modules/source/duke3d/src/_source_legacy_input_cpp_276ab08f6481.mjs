// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/duke3d/src/input.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { CONTROL_ClearAllButtons } from "../../mact/src/control.cpp.mjs";
import { JOYSTICK_ClearAllButtons } from "../../mact/src/joystick.cpp.mjs";
import { JOYSTICK_GetButtons } from "../../mact/src/joystick.cpp.mjs";
import { KB_ClearKeysDown__header_e905ff1838cf } from "./input.cpp.mjs";
import { MOUSE_ClearAllButtons__header_2e77d05bcea3 } from "./input.cpp.mjs";
import { MOUSE_GetButtons__header_76a106d5f825 } from "./input.cpp.mjs";
import { __cxx_global_cell_ee6f4502eccd328f27b46fb8 } from "../../build/src/baselayer.cpp.mjs";
import { __cxx_global_cell_a6fc8c10b0aec7fd31285ec6 } from "../../build/src/baselayer.cpp.mjs";
import { keyFlushChars } from "../../build/src/baselayer.cpp.mjs";
import { mouseAdvanceClickState } from "../../build/src/baselayer.cpp.mjs";

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }

// C/C++ source: source/duke3d/src/input.cpp:33
export function I_CheckAllInput() {
  return i32((((i32(__cxx_global_cell_a6fc8c10b0aec7fd31285ec6().value) != i32(__cxx_global_cell_ee6f4502eccd328f27b46fb8().value)) || Boolean(MOUSE_GetButtons__header_76a106d5f825())) || Boolean(JOYSTICK_GetButtons())));
}

// C/C++ source: source/duke3d/src/input.cpp:42
export function I_ClearAllInput() {
  keyFlushChars();
  KB_ClearKeysDown__header_e905ff1838cf();
  MOUSE_ClearAllButtons__header_2e77d05bcea3();
  JOYSTICK_ClearAllButtons();
  CONTROL_ClearAllButtons();
  mouseAdvanceClickState();
}
