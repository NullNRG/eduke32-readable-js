// Source-first C/C++ -> JavaScript (original identifiers/structured statements).
// Original translation unit: source/mimalloc/src/segment-map.c
// Status: partial STRICT semantic conversion, not a full engine module.
// Narrowing helpers preserve C integer widths; no CPU/opcode interpreter.
const i32 = value => Number(value) | 0;
const i64 = value => BigInt.asIntN(64, BigInt(value));
const u64 = value => BigInt.asUintN(64, BigInt(value));

// C/C++ source: source/mimalloc/src/segment-map.c:36
export class mi_segmap_part_s {
  constructor() {
    this.memid = undefined;
    this.map = undefined;
  }
}

// C/C++ source: source/mimalloc/src/segment-map.c:445
export function _mi_ptr_segment__header_5b41de108df7(p) {
  let segment = (BigInt((BigInt(u64(p)) - BigInt(u64(1)))) & BigInt((~u64((BigInt((BigInt(1n) << BigInt(i32((3 + i32((3 + i32((13 + 3))))))))) - BigInt(u64(1)))))));
  return ((i64(segment) <= i64(0)) ? null : segment);
}

// C/C++ source: source/mimalloc/src/segment-map.c:423
export function _mi_ptr_cookie__header_79715d0a0046(p) {
  let _mi_heap_main;
  ;
  return u64((BigInt(u64(p)) ^ BigInt(_mi_heap_main.cookie)));
}
