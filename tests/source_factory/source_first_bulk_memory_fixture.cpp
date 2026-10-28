#include <stdint.h>
extern "C" int native_copy(uint8_t *d, const uint8_t *s, unsigned n) { __builtin_memcpy(d,s,n); return 11; }
extern "C" int native_move(uint8_t *d, const uint8_t *s, unsigned n) { __builtin_memmove(d,s,n); return 12; }
extern "C" int native_fill(uint8_t *d, int b, unsigned n) { __builtin_memset(d,b,n); return 13; }
extern "C" int native_compare(const uint8_t *a, const uint8_t *b, unsigned n) { return __builtin_memcmp(a,b,n); }
extern "C" int native_bits(unsigned v) { return __builtin_parity(v)*100 + __builtin_ffs(v); }
extern "C" int native_bits64(uint64_t v) { return __builtin_parityll(v)*100 + __builtin_ffsll(v); }
extern "C" int native_typedef_decls(int n) { struct Marker { unsigned q; }; typedef int Small; enum Pick { ONE=1 }; return n+sizeof(Marker)+sizeof(Small)+ONE; }
