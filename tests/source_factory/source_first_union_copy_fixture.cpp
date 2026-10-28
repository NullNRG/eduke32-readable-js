#include <cstdint>
struct View16 { union { uint8_t bytes[16]; uint16_t half[8]; uint32_t words[4]; } storage; };
extern "C" View16 roundtrip_union(View16 original) { View16 copied=original; return copied; }
struct BadUnion { union { int* pointer; uint64_t bits; } storage; };
extern "C" BadUnion pointer_union_must_block(BadUnion original) { BadUnion result=original; return result; }
