// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { SDL_SetRelativeMouseMode } from "../../../browser-abi/sdl_provider.mjs";
import { SDL_SetWindowGrab } from "../../../browser-abi/sdl_provider.mjs";
import { __cxx_global_cell_489f4a2f5e930aaf72c81254 } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_98758ea3e7ef83f477f7ff1f } from "./baselayer.cpp.mjs";
import { __cxx_global_cell_f2b488870f755876d24f149d } from "./baselayer.cpp.mjs";
import { g_mousePos } from "./baselayer.cpp.mjs";
import { __cxx_private_cell_1807b37dcb1d3a7c8be4b656 } from "./sdlayer.cpp.mjs";

function i32(value) { return typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0; }
function u32(value) { return typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0; }

// C/C++ source: source/build/src/sdlayer.cpp:82
export let appactive = (u32((u32(1) & 255)) & 255);
export function __cxx_global_cell_026e4893be4e21af32359651() {
  return __cxx_global_cell_026e4893be4e21af32359651.reference || (__cxx_global_cell_026e4893be4e21af32359651.reference = {
    __cReference: true,
    get value() { return appactive; },
    set value(__cxx_lvalue_0) { appactive = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:1246
export function mouseInit() {
  mouseGrabInput((__cxx_global_cell_489f4a2f5e930aaf72c81254().value = Boolean(__cxx_global_cell_f2b488870f755876d24f149d().value)));
}

// C/C++ source: source/build/src/sdlayer.cpp:1254
export function mouseUninit() {
  mouseGrabInput(Boolean(0));
  (__cxx_global_cell_489f4a2f5e930aaf72c81254().value = Boolean(Boolean(0)));
}

// C/C++ source: source/build/src/sdlayer.cpp:1277
export function grabmouse_low(a) {
  if (__cxx_private_cell_1807b37dcb1d3a7c8be4b656().value) {
    SDL_SetWindowGrab(__cxx_private_cell_1807b37dcb1d3a7c8be4b656().value, (Boolean(a) ? 1 : 0));
  }
  return (u32((u32(SDL_SetRelativeMouseMode((Boolean(a) ? 1 : 0))) & 255)) & 255);
}

// C/C++ source: source/build/src/sdlayer.cpp:1296
export function mouseGrabInput(grab) {
  if ((i32(grab) != i32(__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value))) {
    (g_mousePos.x = i32((g_mousePos.y = i32(0))));
  }
  if ((Boolean(appactive) && __cxx_global_cell_489f4a2f5e930aaf72c81254().value)) {
    if (((i32(grab) != i32(__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value)) && (!Boolean(grabmouse_low((u32(grab) & 255)))))) {
      (__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value = Boolean(grab));
    }
  } else {
    (__cxx_global_cell_98758ea3e7ef83f477f7ff1f().value = Boolean(grab));
  }
}
