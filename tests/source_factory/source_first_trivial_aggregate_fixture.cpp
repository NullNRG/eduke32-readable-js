#include <cstdint>
struct ByteSpan { unsigned char bytes[16]; };
struct HostEntry { ByteSpan host; unsigned short port; unsigned short family; };
static const ByteSpan anyhost = {{1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16}};
extern "C" int by_value_host(int seed) {
    HostEntry original = {anyhost, (unsigned short)seed, 0};
    HostEntry copied = original;
    copied.host.bytes[0] = (unsigned char)(seed & 255);
    copied.host.bytes[15] = 99;
    return original.host.bytes[0]*100 + original.host.bytes[15] + copied.host.bytes[0] + copied.host.bytes[15] + copied.port;
}
extern "C" int copy_twice(int seed) {
    HostEntry first = {anyhost, (unsigned short)seed, 1};
    HostEntry second = first;
    HostEntry third = second;
    second.host.bytes[1] = 89;
    third.host.bytes[2] = 87;
    return first.host.bytes[1]*1000 + second.host.bytes[1]*100 + third.host.bytes[2] + third.family;
}
// Copying records with raw pointers is NOT a safe deep-copy transformation.
struct PointerRecord { int *pointer; int number; };
extern "C" int pointer_alias_must_block(int seed) {
    int number = seed;
    PointerRecord p = {&number, 4};
    PointerRecord q = p;
    *q.pointer += q.number;
    return number;
}
// Nontrivial copy construction is never equivalent to copying record fields.
struct Counted { int n; Counted(int x):n(x){} Counted(const Counted& v):n(v.n+17){} };
extern "C" int custom_copy_must_block(int seed) { Counted a(seed); Counted b = a; return b.n; }
