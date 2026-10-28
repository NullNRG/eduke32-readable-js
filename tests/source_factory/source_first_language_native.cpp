#include <cstdint>
#include <cstdio>
unsigned int swapBytes(unsigned int);
unsigned long long swapWide(unsigned long long);
int leadingZeros(uint64_t);
int trailingZeros(unsigned);
int countSet(unsigned);
int classifyValue(int);
int sizeofScalar();
int main(){
 uint64_t state=0x4e224cc11767ULL;
 for(int i=0;i<1000;i++) {
    state ^= state << 13;state ^= state >> 7;state ^= state << 17;
    uint64_t n = state; uint32_t u=(uint32_t)n;
    std::printf("%llu,%u,%u,%llu,%d,%d,%d,%d,%d\n",(unsigned long long)n, u, swapBytes(u),
       (unsigned long long)swapWide(n), leadingZeros((uint64_t)(n|1)),
       trailingZeros(u|1),countSet(u),classifyValue((int)(i%7)-3),sizeofScalar());
 }
}
