// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/clip.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Free__cxx_static_0dfd3f42f0dc2c05 } from "./smmalloc_generic.cpp.mjs";
import { __cxx_private_cell_f4829d62b637a7e07f0c4164 } from "./clip.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { __cxx_private_cell_e294f0cffcd2011dd0c1f90e } from "./clip.cpp.mjs";
import { __cxx_private_cell_41e4fa070a0f95f448e441a0 } from "./clip.cpp.mjs";
import { __cxx_private_cell_e674a507ed0dfb7131f5a12a } from "./clip.cpp.mjs";
import { __cxx_private_cell_82ff90ff2035d3a5d25a58f8 } from "./clip.cpp.mjs";
import { memset } from "../../../browser-abi/libc_provider.mjs";
import { __cxx_private_cell_6de88d0220636c0d278cf585 } from "./clip.cpp.mjs";
import { __cxx_private_cell_1962575eca7da77b7889e5f2 } from "./clip.cpp.mjs";
import { __cxx_global_cell_0d84c36af55f8d659082f1bb } from "./engine.cpp.mjs";
import { __cxx_global_cell_9fbed4c78bef6ce8bf955682 } from "./engine.cpp.mjs";
import { __cxx_private_cell_0b512b0edb21b3d1c60abb62 } from "./clip.cpp.mjs";
import { __cxx_private_cell_766fd1e403d55ca6e080b2a8 } from "./clip.cpp.mjs";
import { __cxx_private_cell_0ff100be733c4310d0190bb7 } from "./clip.cpp.mjs";
import { __cxx_private_cell_37a3831bb27146574bdca01b } from "./clip.cpp.mjs";

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;
const u32 = value => typeof value === "bigint" ? Number(BigInt.asUintN(32,value)) : Number(value) >>> 0;

// C/C++ source: source/build/src/clip.cpp:90
export function engineInitClipMaps() {
  (__cxx_private_cell_6de88d0220636c0d278cf585().value = i32(0));
  (__cxx_private_cell_1962575eca7da77b7889e5f2().value = i32(0));
  do {
    xfree(__cxx_private_cell_0ff100be733c4310d0190bb7().value);
    (__cxx_private_cell_0ff100be733c4310d0190bb7().value = null);
  } while (Boolean(0));
  do {
    xfree(__cxx_private_cell_766fd1e403d55ca6e080b2a8().value);
    (__cxx_private_cell_766fd1e403d55ca6e080b2a8().value = null);
  } while (Boolean(0));
  do {
    xfree(__cxx_private_cell_37a3831bb27146574bdca01b().value);
    (__cxx_private_cell_37a3831bb27146574bdca01b().value = null);
  } while (Boolean(0));
  do {
    xfree(__cxx_private_cell_e294f0cffcd2011dd0c1f90e().value);
    (__cxx_private_cell_e294f0cffcd2011dd0c1f90e().value = null);
  } while (Boolean(0));
  do {
    xfree(__cxx_private_cell_e674a507ed0dfb7131f5a12a().value);
    (__cxx_private_cell_e674a507ed0dfb7131f5a12a().value = null);
  } while (Boolean(0));
  do {
    xfree(__cxx_private_cell_82ff90ff2035d3a5d25a58f8().value);
    (__cxx_private_cell_82ff90ff2035d3a5d25a58f8().value = null);
  } while (Boolean(0));
  do {
    xfree(__cxx_private_cell_41e4fa070a0f95f448e441a0().value);
    (__cxx_private_cell_41e4fa070a0f95f448e441a0().value = null);
  } while (Boolean(0));
  memset(__cxx_private_cell_0b512b0edb21b3d1c60abb62().value, (-1), 61440);
  memset(__cxx_private_cell_f4829d62b637a7e07f0c4164().value, 0, 24);
  (__cxx_global_cell_0d84c36af55f8d659082f1bb().value = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16));
  (__cxx_global_cell_9fbed4c78bef6ce8bf955682().value = ((u32(((u32(0) << 16) >> 16)) << 16) >> 16));
}

// C/C++ source: source/build/include/compat.h:1449
export function xfree(ptr) {
  Free__cxx_static_0dfd3f42f0dc2c05(__cxx_global_cell_11016d3c7177543e564ab46c().value, ptr);
}
