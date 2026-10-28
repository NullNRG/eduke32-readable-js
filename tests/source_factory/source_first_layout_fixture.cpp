#include <cstdint>
struct alignas(16) Packet { uint8_t a; uint32_t count; };
struct Packed { char a; short b; int c; };
extern "C" int packetSize(){return sizeof(Packet);}
extern "C" int packetAlign(){return alignof(Packet);}
extern "C" int packedSize(){return sizeof(Packed);}
extern "C" int packedAlign(){return alignof(Packed);}
