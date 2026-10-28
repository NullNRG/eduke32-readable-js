#include "fix16.h"
#include <cstdint>
#include <cstdio>
int main() {
    uint32_t state=0x1234ABCDu;
    auto next=[&](){state ^=state <<13; state ^=state >>17; state ^=state <<5;return static_cast<int32_t>(state);};
    int32_t fixed[][2]={{0,0},{1,1},{INT32_MAX,1},{INT32_MIN,-1},{100,-100},{INT32_MIN,INT32_MAX},{INT32_MAX,INT32_MAX}};
    auto dump=[](int32_t a,int32_t b){
      printf("%d,%d,%d,%d,%d,%d,%d,%d,%d\n",a,b,fix16_add(a,b),fix16_sub(a,b),fix16_sadd(a,b),fix16_ssub(a,b),fix16_mul(a,b),fix16_smul(a,b),fix16_lerp32(a,b,1));
    };
    for(auto &p:fixed)dump(p[0],p[1]);
    for(int i=0;i<1000;i++)dump(next(),next());
}
