// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/sdlayer.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/sdlayer.cpp:63
export function startwin_open() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:64
export function startwin_close() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:65
export function startwin_puts(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:66
export function startwin_idle(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:67
export function startwin_settitle(s) {
  (s = s);
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:68
export function startwin_run() {
  return i32(0);
}

// C/C++ source: source/build/src/sdlayer.cpp:69
export function startwin_isopen() {
  return Boolean(false);
}

// Original Clang-generated fragment; imports existing owner storage.
export { frameplace, initsystem, lockcount, m_initprintf, novideo, wm_msgbox, __cxx_global_cell_f0c9c3446e396d6353338d7e, __cxx_global_cell_82b1d07c07b2d44b437f8e68, __cxx_private_cell_9d6af81b93470456d23952cd, __cxx_global_cell_468c46341ac515257fedfe76 } from "./_source_legacy_sdlayer_cpp_129bd76e9bc2.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { g_defaultVideoModes__header_global_a19ca09ee2b13510, maxrefreshfreq, modeschecked, sortmodes, videoGetDisplayName, videoGetModes, xfree, xstrdup, __cxx_global_cell_bbb4a9ec7fb6f0c4ded01621, __cxx_private_cell_3c52322206130a3fcc904774 } from "./_source_legacy_sdlayer_cpp_b79d97dcee59.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { bpp, bytesperline, modechange, offscreenrendering, videoEndDrawing, __cxx_global_cell_b3926346e92cac557f00175c, __cxx_global_cell_56606cfee73eb8d6c7d57541, __cxx_global_cell_1fc8813e2419d4023365727f, __cxx_global_cell_93d7c17084d3a8832fd9f6c6 } from "./_source_legacy_sdlayer_cpp_5618fe6b8180.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { videoBeginDrawing } from "./_source_legacy_sdlayer_cpp_351c1c6c6ef4.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { SILENCE_UNUSED__header_6c4dd990742e, __atomic_add, __atomic_add_single, __cxx_operator_11a696315e969ab4, __cxx_operator_35d41574d9c68141, __cxx_operator_9d5bfff63c86ec9c, __exchange_and_add, __exchange_and_add_single, __gthread_active_p, __gthread_mutex_lock, __gthread_mutex_unlock, __gthread_recursive_mutex_lock, __gthread_recursive_mutex_unlock, __is_constant_evaluated, _mm_and_si128, _mm_or_si128, _mm_xor_si128, fix16_from_dbl, fix16_from_float, fix16_from_int, fix16_half__header_global_62cc3068420b56ba, fix16_mod, fix16_one__header_global_920416620894b39b, fix16_to_dbl, fix16_to_float, fix16_to_int, flt_f161r__header_global_7e8639f9b3f99b36, lastvidgcb, libdivide_128_div_128_to_64, libdivide_32_div_16_to_16, libdivide_count_leading_zeros16, libdivide_count_leading_zeros32, libdivide_count_leading_zeros64, libdivide_mullhi_s16, libdivide_mullhi_s32, libdivide_mullhi_s64, libdivide_mullhi_u16, libdivide_mullhi_u32, libdivide_mullhi_u64, max__template_9f711f2400ba566e, min, operator_delete___ZdlPv12ImNewWrapperS_, operator_delete___ZdlPvS_, operator_delete_array___ZdaPvS_, sdl_surface, sdl_window, tabledivide32, videoSetGamma, videoUpdatePalette, __cxx_private_cell_b7667aed095ebace4c73b0ae, __cxx_private_cell_36c1ac07e31aed8d3265cb02, __cxx_private_cell_1807b37dcb1d3a7c8be4b656 } from "./_source_legacy_sdlayer_cpp_899c72b357a7.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { videoResetMode, videomodereset, __cxx_global_cell_be076cccfa4a217ba3cad38e } from "./_source_legacy_sdlayer_cpp_ef62cc3b2d10.mjs";

// Original Clang-generated fragment; imports existing owner storage.
export { refreshfreq, __cxx_global_cell_84c518e352f66f31d8eaf74c } from "./_source_legacy_sdlayer_cpp_d9a18aa75ae8.mjs";
