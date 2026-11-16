#include <stdint.h>
extern "C" int pointerWalk(int shift) {
    uint8_t data[8] = {4, 7, 10, 13, 16, 19, 22, 25};
    uint8_t *p = &data[2];
    p += 3;
    p -= 2;
    uint8_t *q = &data[3];
    if (p != q || p - data != 3 || p < &data[2]) return -999;
    int first = *p;
    uint8_t *previous = p++;
    p--;
    *p = (uint8_t)(first + (shift & 15));
    return (int)*previous + (int)p[-1] + (int)*(p + 2) + (int)(p == q);
}
extern "C" int pointerAliasing(int shift) {
    uint8_t values[4] = {8,16,24,32};
    uint8_t* a = &values[1];
    uint8_t* b = a;
    b++;
    *b = (uint8_t)(shift & 255);
    b--;
    return (int)*a + (int)*(a+1) + (int)(a == b);
}

extern "C" int scriptWordRelocation(int shift) {
    int64_t values[4] = {8, 16, 24, 32};
    int64_t *base = &values[1];
    int64_t step = (shift & 3) - 1;
    int64_t *slot = step + base;
    *slot = 50 + shift;
    int64_t *end = int64_t{3} + base;
    return int(*slot + (slot - base) + ((end == values + 4) ? 1000 : 0));
}
