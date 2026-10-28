#include <xmmintrin.h>
extern int vector_offset(void);
int vector_round(float input) {
    __m128 lane = _mm_set_ss(input);
    return _mm_cvtss_si32(lane);
}
int vector_total(float value) {return vector_round(value) + vector_offset();}
