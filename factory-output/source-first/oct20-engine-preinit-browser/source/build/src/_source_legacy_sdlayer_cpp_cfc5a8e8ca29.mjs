// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { SDL_GetCurrentVideoDriver } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetError } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_GetNumVideoDisplays } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_InitSubSystem } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetThreadPriority } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_StopTextInput } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_WasInit } from "../../../browser-abi/sdl_provider.mjs";
import { apptitle } from "./engine.cpp.mjs";
import { current_verbosity_cutoff } from "./loguru.cpp.mjs";
import { __cxx_global_cell_f0c9c3446e396d6353338d7e } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_9fad9f5c6a95d4e89a1de80a } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_82b1d07c07b2d44b437f8e68 } from "./sdlayer.cpp.mjs";
import { loguru_log } from "../../../browser-abi/loguru_provider.mjs";
import { __cxx_private_cell_9d6af81b93470456d23952cd } from "./sdlayer.cpp.mjs";
import { mutex_init } from "./mutex.cpp.mjs";
import { __cxx_global_cell_468c46341ac515257fedfe76 } from "./sdlayer.cpp.mjs";
import { sdlayer_checkversion } from "../../../browser-abi/libc_provider.mjs";
import { sysReadCPUID } from "../../../browser-abi/libc_provider.mjs";
import { timerInit } from "../../../browser-abi/libc_provider.mjs";
import { wm_setapptitle } from "../../../browser-abi/libc_provider.mjs";

const i32 = value => Number(value) | 0;
const u32 = value => Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));

// C/C++ source: source/build/src/sdlayer.cpp:694
const __cxx_literal_0200870c3cd3ed94e7b8 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_dc6b608369385de95e87 = Uint8Array.from([83, 68, 76, 32, 105, 110, 105, 116, 105, 97, 108, 105, 122, 97, 116, 105, 111, 110, 32, 102, 97, 105, 108, 101, 100, 58, 32, 37, 115, 46, 0]);
const __cxx_literal_f9c2e386a86e67220044 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_76cf4e26d88954330c6f = Uint8Array.from([78, 111, 110, 45, 105, 110, 116, 101, 114, 97, 99, 116, 105, 118, 101, 32, 109, 111, 100, 101, 32, 101, 110, 97, 98, 108, 101, 100, 59, 32, 116, 104, 105, 115, 32, 105, 115, 32, 112, 114, 111, 98, 97, 98, 108, 121, 32, 110, 111, 116, 32, 119, 104, 97, 116, 32, 121, 111, 117, 32, 119, 97, 110, 116, 46, 0]);
const __cxx_literal_13513bd90decd22d5fcb = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_afa8282434f57ce86435 = Uint8Array.from([86, 105, 100, 101, 111, 32, 111, 117, 116, 112, 117, 116, 32, 100, 105, 115, 97, 98, 108, 101, 100, 46, 0]);
const __cxx_literal_fcffc1ec4ab2cb2cd1d7 = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 115, 100, 108, 97, 121, 101, 114, 46, 99, 112, 112, 0]);
const __cxx_literal_4de2ff059fb0c38bc87e = Uint8Array.from([85, 115, 105, 110, 103, 32, 39, 37, 115, 39, 32, 118, 105, 100, 101, 111, 32, 100, 114, 105, 118, 101, 114, 46, 0]);
export function initsystem() {
  mutex_init(__cxx_private_cell_9d6af81b93470456d23952cd());
  sysReadCPUID();
  if (Boolean(sdlayer_checkversion())) {
    return i32((-1));
  }
  let err = i32(0);
  if ((SDL_WasInit(32) != 32)) {
    (err = i32(SDL_InitSubSystem(32)));
  }
  if (Boolean(err)) {
    ((i32(-2) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(-2), __cxx_literal_0200870c3cd3ed94e7b8, u32(713), __cxx_literal_dc6b608369385de95e87, SDL_GetError()));
    ((i32(-1) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(-1), __cxx_literal_f9c2e386a86e67220044, u32(714), __cxx_literal_76cf4e26d88954330c6f));
    ((i32(2) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(2), __cxx_literal_13513bd90decd22d5fcb, u32(715), __cxx_literal_afa8282434f57ce86435));
    (__cxx_global_cell_468c46341ac515257fedfe76().value = ((((1) & 255)) & 255));
  }
  SDL_StopTextInput();
  SDL_SetThreadPriority(2);
  timerInit(120);
  (__cxx_global_cell_f0c9c3446e396d6353338d7e().value = i64(0));
  (__cxx_global_cell_82b1d07c07b2d44b437f8e68().value = i32(0));
  if ((!Boolean(__cxx_global_cell_468c46341ac515257fedfe76().value))) {
    let drvname = SDL_GetCurrentVideoDriver();
    if (drvname) {
      ((i32(0) > current_verbosity_cutoff()) ? 0 : loguru_log(i32(0), __cxx_literal_fcffc1ec4ab2cb2cd1d7, u32(747), __cxx_literal_4de2ff059fb0c38bc87e, drvname));
    }
    wm_setapptitle(apptitle);
    (__cxx_global_cell_9fad9f5c6a95d4e89a1de80a().value = i32(SDL_GetNumVideoDisplays()));
  }
  return i32(0);
}
