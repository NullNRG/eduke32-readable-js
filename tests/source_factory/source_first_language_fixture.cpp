#include <cstdint>
unsigned int swapBytes(unsigned int value) { return __builtin_bswap32(value); }
unsigned long long swapWide(unsigned long long value) { return __builtin_bswap64(value); }
#ifdef _WIN32
// Native Windows oracle uses an explicit 64-bit type for the captured Linux
// unsigned-long operation. Source AST extraction still uses the original LP64 branch.
int leadingZeros(unsigned long long x) { return __builtin_clzll(x); }
#else
int leadingZeros(unsigned long x) { return __builtin_clzl(x); }
#endif
int trailingZeros(unsigned x) { return __builtin_ctz(x); }
int countSet(unsigned x) { return __builtin_popcount(x); }
int classifyValue(int code) {
  switch (code) {
    case 0: case 1: return 7;
    case 2: return 11;
    default: return -2;
  }
}
#ifdef _WIN32
int sizeofScalar() { return sizeof(long long) + sizeof(int) + sizeof(char); }
#else
int sizeofScalar() { return sizeof(long) + sizeof(int) + sizeof(char); }
#endif
