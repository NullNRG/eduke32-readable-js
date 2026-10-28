#include "calc.h"
#include <stdatomic.h>
uint64_t calculate(uint64_t numerator,uint64_t divisor) {
    Pair p=split_pair(numerator,divisor);
    atomic_thread_fence(memory_order_seq_cst);
    return p.quotient*100+p.remainder;
}
int64_t wide_arithmetic(uint64_t high,uint64_t low) {
    __uint128_t x=((__uint128_t)high<<64)|low;
    __uint128_t y=(x*3u) ^((__uint128_t)123456789u<<64);
    return (int64_t)(y>>64);
}
float vector_sum(float x) {
    Vec2 pair=shift_pair(x);
    return pair[0]+pair[1];
}
