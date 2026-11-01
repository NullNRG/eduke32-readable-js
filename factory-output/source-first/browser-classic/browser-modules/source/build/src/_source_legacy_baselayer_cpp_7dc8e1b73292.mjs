// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/baselayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Create__cxx_static_b7202f8c9d4230a6 } from "./smmalloc_generic.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";


// C/C++ source: source/build/src/baselayer.cpp:160
export function engineSetupAllocator() {
  engineCreateAllocator();
}

// C/C++ source: source/build/include/compat.h:1361
export function engineCreateAllocator() {
  (__cxx_global_cell_11016d3c7177543e564ab46c().value = Create__cxx_static_b7202f8c9d4230a6());
}
