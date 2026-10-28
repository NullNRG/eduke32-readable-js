#include <cstdint>
struct Number {
    int32_t value;
    Number(int32_t n):value(n) {}
    operator int() const { return value; }
};
extern "C" int conversion_probe(int x) { Number n(x); return static_cast<int>(n) + 7; }
