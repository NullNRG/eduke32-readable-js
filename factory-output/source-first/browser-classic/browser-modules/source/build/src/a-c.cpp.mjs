// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/build/src/a-c.cpp
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => typeof value === "bigint" ? Number(BigInt.asIntN(32,value)) : Number(value) | 0;

// C/C++ source: source/build/src/a-c.cpp:30
export let bpl = 0;
function __cxx_static_address_08e39f37b042ed02c5013c69() {
  return __cxx_static_address_08e39f37b042ed02c5013c69.reference || (__cxx_static_address_08e39f37b042ed02c5013c69.reference = {
    __cReference: true,
    get value() { return bpl; },
    set value(__cxx_lvalue_0) { bpl = i32(__cxx_lvalue_0); }
  });
}
export function __cxx_private_cell_08e39f37b042ed02c5013c69() { return __cxx_static_address_08e39f37b042ed02c5013c69(); }

// C/C++ source: source/build/src/a-c.cpp:39
export function setvlinebpl(dabpl) {
  (bpl = i32(dabpl));
}

// Original Clang-generated fragment; imports existing owner storage.
export { FIX16_MAX__header_global_c9123f4f75cb056b, FIX16_MIN__header_global_f2c0a39d05116715, FIX16_OVERFLOW__header_global_c99f1792c3a553a6, drawslab, fix16_deg_to_rad_mult__header_global_e78a7657337498de, fix16_half__header_global_3d2360ac85a99e08, fix16_one__header_global_b9fb9d14c629fddb, fix16_rad_to_deg_mult__header_global_a7d1ff7e793747d5, fixtransluscence, flt_f161r__header_global_67ef219796cc7ffc, g_saturate, gbuf, gbxinc, gbyinc, getpix, ghlinepal, glogx, glogy, gpal, gpal2, gpinc, gtrans, hlineasm4, mhline, msethlineshift, msetupspritevline, mspritevline, mvlineasm1, mvlineasm4, ourmulscale32, pow2char__header_global_57cafba49656a1f1, sethlinesizes, setpalookupaddress, settransnormal, settransreverse, setupdrawslab, setuphlineasm4, setupmvlineasm, setupspritevline, setuptvlineasm, setuptvlineasm2, setupvlineasm, slopevlin, spritevline, tabledivide32__header_ae98b977268b, thline, transmode, tsethlineshift, tsetupspritevline, tspritevline, tvlineasm1, tvlineasm2, vlineasm1, vlineasm4, vlineasm4nlogy, __cxx_private_cell_97546b2e341941f0fb9652d0, __cxx_private_cell_22041f041b11566b4a219496, __cxx_private_cell_746de1f23df795448427ba94, __cxx_private_cell_4ae885815807b83a5016eb2f, __cxx_private_cell_cc1156dd7b32ac0a09a14194, __cxx_private_cell_7570717bd938431cbd93672c, __cxx_private_cell_d44ff7f9144b4a045ba0e5d9, __cxx_private_cell_d1618eacc5ba224050538fb0, __cxx_private_cell_90869b78067f120311d76d19, __cxx_global_cell_f73a7c611278ae39b7b9ad95, __cxx_private_cell_e49878c5ee3c24762fc31d7c, __cxx_private_cell_56c35658398e128fe4dd492b, __cxx_private_cell_9aa917fe275d0cd39c0e94bf } from "./_source_legacy_a-c_cpp_58b400c3e48e.mjs";
