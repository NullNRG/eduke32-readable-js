#include <cstdint>

extern "C" int const_alias_identity(int *p, int x) {
    int const *readonly = p;
    int *writable = const_cast<int *>(readonly);
    // Identity, not a newly allocated buffer or copy.
    return (writable == p) ? (x + 7) : -1;
}
extern "C" int zero_initialized_scalar(int x) {
    int a{};
    unsigned int b{};
    bool enabled{};
    return a + (int)b + (int)enabled + x;
}
extern "C" int initialized_fields(int x) {
    struct Settings { int threshold = 42; };
    // CXXDefaultInitExpr may be emitted by Clang for the member initializer.
    Settings s{};
    return s.threshold + x;
}
