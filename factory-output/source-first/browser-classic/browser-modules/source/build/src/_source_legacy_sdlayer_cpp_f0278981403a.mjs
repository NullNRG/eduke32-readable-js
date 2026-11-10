// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_global_cell_b3926346e92cac557f00175c } from "./sdlayer.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { __cxx_global_cell_b58ae57ccd52d0f91d0874d6 } from "./sdlayer.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { __cxx_global_cell_46fbe924187022a575efe0a8 } from "./engine.cpp.mjs";
import { videoResetMode } from "./sdlayer.cpp.mjs";
import { videoSetGameMode } from "./engine.cpp.mjs";
import { __cxx_global_cell_f60600beda8cdf07cf996425 } from "./baselayer.cpp.mjs";
import { __cxx_private_cell_4aa781b00af78a297342921a } from "./sdlayer.cpp.mjs";
import { __cxx_private_cell_0cb7862380d719c241f6375a } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_56bd65d018548900199db93f } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_18fd7bea782d2fdc86805764 } from "./sdlayer.cpp.mjs";

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }

// C/C++ source: source/build/src/sdlayer.cpp:602
const __cxx_literal_54e56b94aceb03cf253a = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_e57927a259622697488a = Uint8Array.from([86, 83, 121, 110, 99, 32, 99, 111, 110, 102, 105, 103, 117, 114, 97, 116, 105, 111, 110, 32, 108, 111, 99, 107, 101, 100, 32, 98, 121, 32, 118, 105, 100, 101, 111, 32, 100, 114, 105, 118, 101, 114, 46, 0]);
const __cxx_literal_fefcec947cc33c978a13 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_9265f00fb8ee4e22a7bf = Uint8Array.from([70, 97, 105, 108, 101, 100, 32, 116, 111, 32, 115, 101, 116, 32, 118, 105, 100, 101, 111, 32, 109, 111, 100, 101, 33, 0]);
export function videoSetVsync(newSync) {
  if (((newSync != 0) && Boolean(__cxx_private_cell_0cb7862380d719c241f6375a().value))) {
    ((i32(-1) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-1), __cxx_literal_54e56b94aceb03cf253a, u32(606), __cxx_literal_e57927a259622697488a));
    return i32(__cxx_private_cell_4aa781b00af78a297342921a().value);
  }
  if ((__cxx_private_cell_4aa781b00af78a297342921a().value == newSync)) {
    return i32(newSync);
  }
  {
    (__cxx_private_cell_4aa781b00af78a297342921a().value = i32(newSync));
    videoResetMode();
    if (Boolean(videoSetGameMode((u32(__cxx_global_cell_b58ae57ccd52d0f91d0874d6().value) & 255), __cxx_global_cell_56bd65d018548900199db93f().value, __cxx_global_cell_18fd7bea782d2fdc86805764().value, __cxx_global_cell_b3926346e92cac557f00175c().value, __cxx_global_cell_46fbe924187022a575efe0a8().value))) {
      ((i32(-2) > current_verbosity_cutoff()) ? void 0 : loguru_log(i32(-2), __cxx_literal_fefcec947cc33c978a13, u32(644), __cxx_literal_9265f00fb8ee4e22a7bf));
    }
  }
  return i32(newSync);
}

// C/C++ source: source/build/src/sdlayer.cpp:788
export function system_getcvars() {
  (__cxx_global_cell_f60600beda8cdf07cf996425().value = i32(videoSetVsync(__cxx_global_cell_f60600beda8cdf07cf996425().value)));
}
