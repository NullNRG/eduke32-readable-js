// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/libxmp-lite/src/filter.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;

// C/C++ source: source/build/include/fix16.h:111
export const fix16_rad_to_deg_mult__header_global_54c28687c321d791 = i32(3754936);
function __cxx_static_address_57fcc6bdc94f38b0b8b4a87b() {
  return __cxx_static_address_57fcc6bdc94f38b0b8b4a87b.reference || (__cxx_static_address_57fcc6bdc94f38b0b8b4a87b.reference = {
    __cReference: true,
    get value() { return fix16_rad_to_deg_mult__header_global_54c28687c321d791; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:114
export const fix16_deg_to_rad_mult__header_global_891841e3607e4a82 = i32(1144);
function __cxx_static_address_138a8f043ab4a0f5fc2b16d7() {
  return __cxx_static_address_138a8f043ab4a0f5fc2b16d7.reference || (__cxx_static_address_138a8f043ab4a0f5fc2b16d7.reference = {
    __cReference: true,
    get value() { return fix16_deg_to_rad_mult__header_global_891841e3607e4a82; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:31
export const FIX16_MAX__header_global_ababbe94506e71e3 = i32(2147483647);
function __cxx_static_address_3ab9c60be409936c3c8d4c3d() {
  return __cxx_static_address_3ab9c60be409936c3c8d4c3d.reference || (__cxx_static_address_3ab9c60be409936c3c8d4c3d.reference = {
    __cReference: true,
    get value() { return FIX16_MAX__header_global_ababbe94506e71e3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:32
export const FIX16_MIN__header_global_b21fb41d0eeafb50 = i32(2147483648);
function __cxx_static_address_97cab4d036983b5287cc7eb4() {
  return __cxx_static_address_97cab4d036983b5287cc7eb4.reference || (__cxx_static_address_97cab4d036983b5287cc7eb4.reference = {
    __cReference: true,
    get value() { return FIX16_MIN__header_global_b21fb41d0eeafb50; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:33
export const FIX16_OVERFLOW__header_global_052b6b637e603505 = i32(2147483648);
function __cxx_static_address_4fbf23491a655c90387fe57e() {
  return __cxx_static_address_4fbf23491a655c90387fe57e.reference || (__cxx_static_address_4fbf23491a655c90387fe57e.reference = {
    __cReference: true,
    get value() { return FIX16_OVERFLOW__header_global_052b6b637e603505; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:35
export const fix16_one__header_global_b87785bf6866b6c3 = i32(65536);
function __cxx_static_address_0a10c1b3c143f5a47fc65a03() {
  return __cxx_static_address_0a10c1b3c143f5a47fc65a03.reference || (__cxx_static_address_0a10c1b3c143f5a47fc65a03.reference = {
    __cReference: true,
    get value() { return fix16_one__header_global_b87785bf6866b6c3; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:36
export const fix16_half__header_global_05d1285865189342 = i32(32768);
function __cxx_static_address_4270c91b1345be6b1cc8c154() {
  return __cxx_static_address_4270c91b1345be6b1cc8c154.reference || (__cxx_static_address_4270c91b1345be6b1cc8c154.reference = {
    __cReference: true,
    get value() { return fix16_half__header_global_05d1285865189342; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/fix16.h:37
export const flt_f161r__header_global_a252e8a071c882b7 = Math.fround(Math.fround((Math.fround(1) / Math.fround(65536))));
function __cxx_static_address_7d9c741d508838aec5b53c95() {
  return __cxx_static_address_7d9c741d508838aec5b53c95.reference || (__cxx_static_address_7d9c741d508838aec5b53c95.reference = {
    __cReference: true,
    get value() { return flt_f161r__header_global_a252e8a071c882b7; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/libxmp-lite/src/filter.c:34
export const resonance_table = new Float32Array([Math.fround(1), Math.fround(0.978644609), Math.fround(0.957745254), Math.fround(0.937292218), Math.fround(0.917275905), Math.fround(0.897687137), Math.fround(0.878516674), Math.fround(0.859755575), Math.fround(0.84139514), Math.fround(0.823426783), Math.fround(0.805842161), Math.fround(0.788633108), Math.fround(0.771791517), Math.fround(0.755309581), Math.fround(0.73917967), Math.fround(0.723394156), Math.fround(0.707945764), Math.fround(0.692827284), Math.fround(0.678031683), Math.fround(0.663552046), Math.fround(0.649381638), Math.fround(0.635513842), Math.fround(0.621942163), Math.fround(0.60866034), Math.fround(0.595662117), Math.fround(0.582941532), Math.fround(0.570492566), Math.fround(0.558309495), Math.fround(0.54638654), Math.fround(0.534718215), Math.fround(0.523299098), Math.fround(0.512123823), Math.fround(0.501187205), Math.fround(0.490484178), Math.fround(0.480009675), Math.fround(0.469758868), Math.fround(0.459726989), Math.fround(0.449909329), Math.fround(0.440301329), Math.fround(0.430898517), Math.fround(0.421696514), Math.fround(0.412690997), Math.fround(0.403877825), Math.fround(0.395252854), Math.fround(0.386812061), Math.fround(0.378551513), Math.fround(0.370467395), Math.fround(0.362555921), Math.fround(0.354813397), Math.fround(0.347236216), Math.fround(0.339820832), Math.fround(0.332563818), Math.fround(0.325461775), Math.fround(0.318511426), Math.fround(0.311709464), Math.fround(0.305052787), Math.fround(0.298538268), Math.fround(0.292162865), Math.fround(0.2859236), Math.fround(0.279817581), Math.fround(0.273841977), Math.fround(0.267993957), Math.fround(0.262270838), Math.fround(0.256669939), Math.fround(0.251188636), Math.fround(0.245824412), Math.fround(0.240574732), Math.fround(0.235437155), Math.fround(0.230409294), Math.fround(0.225488812), Math.fround(0.220673412), Math.fround(0.21596083), Math.fround(0.211348906), Math.fround(0.206835464), Math.fround(0.202418402), Math.fround(0.198095679), Math.fround(0.193865269), Math.fround(0.18972519), Math.fround(0.185673535), Math.fround(0.181708395), Math.fround(0.177827939), Math.fround(0.174030349), Math.fround(0.170313865), Math.fround(0.166676745), Math.fround(0.16311729), Math.fround(0.15963386), Math.fround(0.156224802), Math.fround(0.152888566), Math.fround(0.149623573), Math.fround(0.146428287), Math.fround(0.143301263), Math.fround(0.140240997), Math.fround(0.137246102), Math.fround(0.134315148), Math.fround(0.131446794), Math.fround(0.128639698), Math.fround(0.125892535), Math.fround(0.123204052), Math.fround(0.120572984), Math.fround(0.117998093), Math.fround(0.115478195), Math.fround(0.113012113), Math.fround(0.110598691), Math.fround(0.108236812), Math.fround(0.105925374), Math.fround(0.103663296), Math.fround(0.101449519), Math.fround(0.0992830246), Math.fround(0.097162798), Math.fround(0.0950878412), Math.fround(0.0930572077), Math.fround(0.0910699293), Math.fround(0.0891250967), Math.fround(0.0872217938), Math.fround(0.0853591337), Math.fround(0.0835362524), Math.fround(0.0817523002), Math.fround(0.0800064504), Math.fround(0.0782978758), Math.fround(0.0766257941), Math.fround(0.0749894232), Math.fround(0.0733879879), Math.fround(0.0718207583), Math.fround(0.0702869967), Math.fround(0.0687859878), Math.fround(0.0673170387), Math.fround(0.0658794567), Math.fround(0.064472571)]);
function __cxx_static_address_ba7b73715495859de0f03982() {
  return __cxx_static_address_ba7b73715495859de0f03982.reference || (__cxx_static_address_ba7b73715495859de0f03982.reference = {
    __cReference: true,
    get value() { return resonance_table; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}

// C/C++ source: source/build/include/compat.h:1169
export const pow2char__header_global_ddb828773fc9a5c6 = new Uint8Array([((1) & 255), ((2) & 255), ((4) & 255), ((8) & 255), ((16) & 255), ((32) & 255), ((64) & 255), ((128) & 255)]);
function __cxx_static_address_a70208f93829eec5ed002e51() {
  return __cxx_static_address_a70208f93829eec5ed002e51.reference || (__cxx_static_address_a70208f93829eec5ed002e51.reference = {
    __cReference: true,
    get value() { return pow2char__header_global_ddb828773fc9a5c6; },
    set value(__cxx_lvalue_0) { throw new TypeError("static aggregate/const address assignment needs proven copy semantics"); }
  });
}
