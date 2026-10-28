typedef float two_float __attribute__((vector_size(8)));
float vector_pair_sum(const float *values) {
    two_float v=*(const two_float*)values;
    return v[0]+v[1];
}
void vector_pair_write(float *values, float left, float right) {
    two_float v={left,right};
    *(two_float*)values=v;
}
