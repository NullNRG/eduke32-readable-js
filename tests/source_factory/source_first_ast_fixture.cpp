#include <cstdint>
struct Counter {
    int value;
    Counter(int initial) : value(initial) {}
    int add(int n) { value += n; return value; }
    int scale(int n) { for (int i = 0; i < n; ++i) value += 2; return value; }
};
int positive(int number) { if (number < 0) return 0; return number; }
int countUntil(int n) { int total = 0; for(int i=0;i<n;++i) total += i; return total; }
