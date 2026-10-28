// A backward goto re-enters a source expression that constructs an object;
// Clang proves the destructor trivial, so there is no cleanup to synthesize.
struct Counter { int value; Counter(int n) : value(n * 3) {} };
extern "C" int trivial_ctor_loop(int n) {
    int sum = 0;
again:
    sum += Counter(n).value;
    if (--n > 0) goto again;
    return sum;
}
// A goto after a nontrivially destructible local may not elide its cleanup.
int destroy_count = 0;
struct Destructor { int value; Destructor(int n) : value(n) {} ~Destructor(){ ++destroy_count; } };
extern "C" int nontrivial_ctor_loop(int n) {
    int sum = 0;
again:
    { Destructor d(n); sum += d.value; }
    if (--n > 0) goto again;
    return sum;
}
extern "C" int shadowed_loop(int n) {
    int sum=0;
again:
    for(int i=0; i<n; ++i) sum += i;
    { int i=n*2; sum += i; }
    if (--n > 0) goto again;
    return sum;
}
