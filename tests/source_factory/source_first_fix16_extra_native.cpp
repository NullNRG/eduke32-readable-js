#include "fix16.h"
#include <cstdint>
#include <cstdio>
int main() {
 uint32_t s=0x5f8e5a17;
 auto next=[&](){s^=s<<13;s^=s>>17;s^=s<<5;return (int32_t)s;};
 for(int i=0;i<1000;i++){
   int32_t a=next(),b=next(); uint8_t f8=(uint8_t)next();uint16_t f16=(uint16_t)next();uint32_t f32=(uint32_t)next();
   std::printf("%d,%d,%u,%u,%u,%d,%d,%d\n",a,b,(unsigned)f8,(unsigned)f16,f32,fix16_lerp8(a,b,f8),fix16_lerp16(a,b,f16),fix16_lerp32(a,b,f32));
 }
}
