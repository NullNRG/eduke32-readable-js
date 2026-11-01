// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { __cxx_global_cell_f0c9c3446e396d6353338d7e } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_82b1d07c07b2d44b437f8e68 } from "./sdlayer.cpp.mjs";

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));

// C/C++ source: source/build/src/sdlayer.cpp:98
export let bpp = i32(0);
export function __cxx_global_cell_b3926346e92cac557f00175c() {
  return __cxx_global_cell_b3926346e92cac557f00175c.reference || (__cxx_global_cell_b3926346e92cac557f00175c.reference = {
    __cReference: true,
    get value() { return bpp; },
    set value(__cxx_lvalue_0) { bpp = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:98
export let bytesperline = 0;
export function __cxx_global_cell_56606cfee73eb8d6c7d57541() {
  return __cxx_global_cell_56606cfee73eb8d6c7d57541.reference || (__cxx_global_cell_56606cfee73eb8d6c7d57541.reference = {
    __cReference: true,
    get value() { return bytesperline; },
    set value(__cxx_lvalue_0) { bytesperline = i32(__cxx_lvalue_0); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:102
export let modechange = (u32((u32(1) & 255)) & 255);
export function __cxx_global_cell_1fc8813e2419d4023365727f() {
  return __cxx_global_cell_1fc8813e2419d4023365727f.reference || (__cxx_global_cell_1fc8813e2419d4023365727f.reference = {
    __cReference: true,
    get value() { return modechange; },
    set value(__cxx_lvalue_0) { modechange = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:103
export let offscreenrendering = (u32((u32(0) & 255)) & 255);
export function __cxx_global_cell_93d7c17084d3a8832fd9f6c6() {
  return __cxx_global_cell_93d7c17084d3a8832fd9f6c6.reference || (__cxx_global_cell_93d7c17084d3a8832fd9f6c6.reference = {
    __cReference: true,
    get value() { return offscreenrendering; },
    set value(__cxx_lvalue_0) { offscreenrendering = (u32(__cxx_lvalue_0) & 255); }
  });
}

// C/C++ source: source/build/src/sdlayer.cpp:2027
export function videoEndDrawing() {
  if ((bpp > 8)) {
    if ((!Boolean(offscreenrendering))) {
      (__cxx_global_cell_f0c9c3446e396d6353338d7e().value = i64(0));
    }
    return;
  }
  if ((!Boolean(__cxx_global_cell_f0c9c3446e396d6353338d7e().value))) {
    return;
  }
  if ((__cxx_global_cell_82b1d07c07b2d44b437f8e68().value > 1)) {
    ((__cxx_lvalue_0) => { const previous = __cxx_lvalue_0.value; const next = i32((previous - 1)); __cxx_lvalue_0.value = next; return previous; })(__cxx_global_cell_82b1d07c07b2d44b437f8e68());
    return;
  }
  if ((!Boolean(offscreenrendering))) {
    (__cxx_global_cell_f0c9c3446e396d6353338d7e().value = i64(0));
  }
  if ((__cxx_global_cell_82b1d07c07b2d44b437f8e68().value == 0)) {
    return;
  }
  (__cxx_global_cell_82b1d07c07b2d44b437f8e68().value = i32(0));
}
