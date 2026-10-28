#include <cstdint>
static int *refs[5] = {};
static unsigned long long clocks[5] = {0ull, 17ull, 4294967297ull, 1099511627809ull};
static unsigned short signs[5] = {0, 65535, 12345};
extern "C" int ref_probe(int index) { return refs[index % 5] == nullptr ? index : -999; }
extern "C" unsigned long long count_probe(int index) { return clocks[index%5]; }
extern "C" int sign_probe(int index) { return signs[index%5]; }
