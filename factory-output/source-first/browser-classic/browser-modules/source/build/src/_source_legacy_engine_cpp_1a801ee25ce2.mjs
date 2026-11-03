// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/engine.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
import { Destroy__cxx_static_777d0ae31c789182 } from "./smmalloc_generic.cpp.mjs";
import { baselayer_init } from "./baselayer.cpp.mjs";
import { engineInitClipMaps } from "./clip.cpp.mjs";
import { __cxx_global_cell_11016d3c7177543e564ab46c } from "./compat.cpp.mjs";
import { initcrc16 } from "./engine.cpp.mjs";
import { initcrc32table } from "./crc32.cpp.mjs";
import { initdivtables } from "./pragmas.cpp.mjs";
import { initprintf } from "./baselayer.cpp.mjs";
import { initsystem } from "./sdlayer.cpp.mjs";
import { makeasmwriteable } from "./baselayer.cpp.mjs";
import { __cxx_private_cell_5127bf7d54074c32ac833da9 } from "./engine.cpp.mjs";
import { __cxx_global_cell_9d5d7fcf3aa35a4809f92551 } from "./engine.cpp.mjs";
import { sector_s } from "./engine.cpp.mjs";
import { __cxx_global_cell_4a046e33ecf7aced9bfd0007 } from "./engine.cpp.mjs";
import { sprite_s } from "./engine.cpp.mjs";
import { __cxx_global_cell_e6d5c05c99c236717ba2a685 } from "./engine.cpp.mjs";
import { spriteext_s } from "./engine.cpp.mjs";
import { __cxx_global_cell_2487f0a2e0979a5d48ff1cd7 } from "./engine.cpp.mjs";
import { spritesmooth_s } from "./engine.cpp.mjs";
import { __cxx_global_cell_4f8c0a98fe113810db905f6a } from "./engine.cpp.mjs";
import { tsprite_s } from "./engine.cpp.mjs";
import { __cxx_global_cell_46fbe924187022a575efe0a8 } from "./engine.cpp.mjs";
import { __cxx_global_cell_959ecb0f89b58217d69a30a7 } from "./engine.cpp.mjs";
import { videoGetModes } from "./sdlayer.cpp.mjs";
import { __cxx_global_cell_4d8aaa64f68587b18e27604c } from "./engine.cpp.mjs";
import { wall_s } from "./engine.cpp.mjs";
import { __cxx_global_cell_64b1dd24a985c284baf44a16 } from "./engine.cpp.mjs";
import { wallext_s } from "./engine.cpp.mjs";
import { wm_msgbox } from "./sdlayer.cpp.mjs";

// Browser-hosted termination for an exactly verified ISO C exit(int) ABI.
// Throwing stops the current stack; the launcher decides whether to close the
// native browser runtime. This does not emulate a CPU or import an SDL library.
const cProcess = Object.freeze({
  exit(status) {
    const code = Number(status);
    if (!Number.isFinite(code) || !Number.isSafeInteger(code))
      throw new TypeError('C exit status must be an integer');
    const stopped = new Error(`C process terminated with status ${code | 0}`);
    stopped.name = 'CProcessExit';
    stopped.status = code | 0;
    throw stopped;
  }
});

const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/engine.cpp:9163
const __cxx_literal_c876c9c22ecfaae716aa = Uint8Array.from([102, 97, 116, 97, 108, 95, 101, 120, 105, 116, 40, 37, 115, 41, 32, 97, 116, 32, 37, 115, 58, 37, 100, 32, 105, 110, 32, 37, 115, 40, 41, 10, 0]);
const __cxx_literal_8488f30316d5fbc67cde = Uint8Array.from([70, 97, 105, 108, 117, 114, 101, 32, 105, 110, 32, 105, 110, 105, 116, 115, 121, 115, 116, 101, 109, 40, 41, 33, 0]);
const __cxx_literal_634d6d4988aa7cc661aa = Uint8Array.from([115, 111, 117, 114, 99, 101, 47, 98, 117, 105, 108, 100, 47, 115, 114, 99, 47, 101, 110, 103, 105, 110, 101, 46, 99, 112, 112, 0]);
const __cxx_literal_b87cdf3990e677a7c98a = Uint8Array.from([70, 97, 116, 97, 108, 32, 69, 114, 114, 111, 114, 0]);
const __cxx_literal_1d03fc45b53c4617d37a = Uint8Array.from([37, 115, 0]);
const __cxx_literal_c152a20c6d57361de8f4 = Uint8Array.from([70, 97, 105, 108, 117, 114, 101, 32, 105, 110, 32, 105, 110, 105, 116, 115, 121, 115, 116, 101, 109, 40, 41, 33, 0]);
export function enginePreInit() {
  baselayer_init();
  initdivtables();
  if (Boolean(initsystem())) {
    do {
      initprintf(__cxx_literal_c876c9c22ecfaae716aa, __cxx_literal_8488f30316d5fbc67cde, __cxx_literal_634d6d4988aa7cc661aa, 9169, "enginePreInit");
      engineDestroyAllocator__header_0328fac25cb3();
      do {
        wm_msgbox(__cxx_literal_b87cdf3990e677a7c98a, __cxx_literal_1d03fc45b53c4617d37a, __cxx_literal_c152a20c6d57361de8f4);
        cProcess.exit(1);
      } while (Boolean(0));
    } while (Boolean(0));
  }
  makeasmwriteable();
  (__cxx_global_cell_9d5d7fcf3aa35a4809f92551().value = sector_s);
  (__cxx_global_cell_4d8aaa64f68587b18e27604c().value = wall_s);
  (__cxx_global_cell_64b1dd24a985c284baf44a16().value = wallext_s);
  (__cxx_global_cell_4a046e33ecf7aced9bfd0007().value = sprite_s);
  (__cxx_global_cell_4f8c0a98fe113810db905f6a().value = tsprite_s);
  (__cxx_global_cell_e6d5c05c99c236717ba2a685().value = spriteext_s);
  (__cxx_global_cell_2487f0a2e0979a5d48ff1cd7().value = spritesmooth_s);
  (__cxx_global_cell_46fbe924187022a575efe0a8().value = i32(1));
  (__cxx_global_cell_959ecb0f89b58217d69a30a7().value = i32(0));
  videoGetModes((-1));
  initcrc16();
  initcrc32table();
  engineInitClipMaps();
  (__cxx_private_cell_5127bf7d54074c32ac833da9().value = i32(1));
  return i32(0);
}

// C/C++ source: source/build/include/compat.h:1367
export function engineDestroyAllocator__header_0328fac25cb3() {
  Destroy__cxx_static_777d0ae31c789182(__cxx_global_cell_11016d3c7177543e564ab46c().value);
}
