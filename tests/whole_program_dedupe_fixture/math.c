#include "calc.h"
Pair split_pair(uint64_t numerator, uint64_t divisor) {
    Pair result={numerator/divisor,numerator%divisor};
    return result;
}
Vec2 shift_pair(float value) {
    Vec2 result={value,value+1.25f};
    return result;
}
