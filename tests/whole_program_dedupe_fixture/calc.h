#ifndef CALC_H
#define CALC_H
#include <stdint.h>
typedef struct { uint64_t quotient, remainder; } Pair;
typedef float Vec2 __attribute__((vector_size(8)));
Pair split_pair(uint64_t numerator, uint64_t divisor);
Vec2 shift_pair(float value);
uint64_t calculate(uint64_t numerator, uint64_t divisor);
int64_t wide_arithmetic(uint64_t high, uint64_t low);
float vector_sum(float x);
#endif
