// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_private_cell_3c52322206130a3fcc904774 } from "./sdlayer.cpp.mjs";

const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;

// C/C++ source: source/build/src/sdlayer.cpp:104
export let videomodereset = (u32((u32(0) & 255)) & 255);
export function __cxx_global_cell_be076cccfa4a217ba3cad38e() {
  return __cxx_global_cell_be076cccfa4a217ba3cad38e.reference || (__cxx_global_cell_be076cccfa4a217ba3cad38e.reference = {
    __cReference: true,
    get value() { return videomodereset; },
    set value(__cxx_lvalue_0) { videomodereset = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:1940
export function videoResetMode() {
  (videomodereset = (u32((u32(1) & 255)) & 255));
  (__cxx_private_cell_3c52322206130a3fcc904774().value = (u32((u32(0) & 255)) & 255));
}
