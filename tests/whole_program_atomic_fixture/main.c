extern int plus(int);
extern unsigned current(void);
extern void reset(unsigned);
extern unsigned long long big_step(void);
extern float invert(float);
extern int exchange_if(unsigned,unsigned);
int atomic_main(void) {
 reset(0xffffffffu);
 int old=plus(3);
 unsigned n=current();
 return old==-1 && n==2 && big_step()==~0ULL && big_step()==1ULL && exchange_if(2,17)==2 && current()==17 && exchange_if(3,99)==-100 && current()==17 && invert(1.25f)==-1.25f ? 123 : -1;
}
