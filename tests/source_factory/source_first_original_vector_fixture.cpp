#include "vec.h"

extern "C" int vector_integer(int x)
{
    vec2_t a{x, x - 7}, b{3, -2};
    auto sum = a + b;
    auto diff = a - b;
    auto product = a * b;
    return sum.x + sum.y + diff.x + diff.y + product.x + product.y;
}

extern "C" float vector_float(int x)
{
    vec2f_t a{(float)x, (float)x * 0.5f}, b{0.5f, -2.0f};
    auto sum = a + b;
    auto product = a * b;
    return sum.x + sum.y + product.x + product.y;
}

extern "C" long long vector_wide(int x)
{
    vec2<long long> a{9007199254740993LL + x, -9007199254740990LL + x}, b{3, -2};
    auto sum = a + b;
    auto product = a * b;
    return sum.x * 2 + product.y;
}

extern "C" unsigned int vector_short(int x)
{
    vec2_u16_t a{(uint16_t)x, (uint16_t)(x - 7)}, b{11, 3};
    auto sum = a + b;
    auto product = a * b;
    return (unsigned int)sum.x + sum.y + product.x + product.y;
}
