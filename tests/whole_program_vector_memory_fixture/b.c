extern float vector_pair_sum(const float *values);
extern void vector_pair_write(float *values,float left,float right);
float vector_pair_run(float x) {
    float data[2];
    vector_pair_write(data,x,3.5f);
    return vector_pair_sum(data);
}
