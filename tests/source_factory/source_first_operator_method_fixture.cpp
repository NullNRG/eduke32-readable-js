#include <cstdint>
struct Counter {
    int32_t value;
    Counter(int32_t x):value(x) {}
    Counter& operator+=(int32_t x) { value+=x;return *this; }
    int32_t operator+(int32_t x) const { return value+x; }
};
extern "C" int member_ops(int x){ Counter a(x); a+=5; return a+7; }
struct Unsafe {
    int32_t *p;
    Unsafe& operator+=(int32_t amount) { *p += amount; return *this; }
};
extern "C" int unsafe_class(int32_t* address){ Unsafe a{address}; a+=3; return *address; }
