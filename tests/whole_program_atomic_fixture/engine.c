#include <stdatomic.h>
_Atomic unsigned int counter = 10u;
_Atomic unsigned long long ticks = 0xffffffffffffffffULL;
int plus(int amount) {
  unsigned old=atomic_fetch_add_explicit(&counter, (unsigned)amount, memory_order_seq_cst);
  return (int)old;
}
unsigned current(void) { return atomic_load_explicit(&counter, memory_order_acquire); }
void reset(unsigned x) { atomic_store_explicit(&counter, x, memory_order_release); }
unsigned long long big_step(void) {return atomic_fetch_add_explicit(&ticks, 2ULL, memory_order_relaxed);}
float invert(float v) {return -v;}
int exchange_if(unsigned expected, unsigned replacement) {
  return atomic_compare_exchange_strong_explicit(&counter, &expected, replacement,
     memory_order_seq_cst, memory_order_seq_cst) ? (int)expected : -100;
}
