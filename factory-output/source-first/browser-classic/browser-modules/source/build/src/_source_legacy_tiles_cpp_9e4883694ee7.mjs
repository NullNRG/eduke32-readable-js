// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/tiles.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { __cxx_private_cell_285d8cf53eb734ff32159c0e } from "./tiles.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { __cxx_private_cell_66c8e98d93985e734f8d0050 } from "./tiles.cpp.mjs";
import { kclose } from "./vfs.cpp.mjs";


// C/C++ source: source/build/src/tiles.cpp:894
export function Buninitart() {
  if ((__cxx_private_cell_285d8cf53eb734ff32159c0e().value != (-1))) {
    kclose(__cxx_private_cell_285d8cf53eb734ff32159c0e().value);
  }
  do {
    xfree__header_eef6e15431f5(__cxx_private_cell_66c8e98d93985e734f8d0050().value);
    (__cxx_private_cell_66c8e98d93985e734f8d0050().value = null);
  } while (Boolean(0));
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree__header_eef6e15431f5(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}
