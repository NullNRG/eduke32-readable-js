// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { SDL_GetDisplayName } from "../../../browser-abi/sdl_provider.mjs";


// C/C++ source: source/build/src/sdlayer.cpp:1504
export function videoGetDisplayName(display) {
  return SDL_GetDisplayName(display);
}
