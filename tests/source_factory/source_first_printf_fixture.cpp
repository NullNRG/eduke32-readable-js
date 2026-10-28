#include <cstdio>
extern "C" int fmt_signed(char *out, int a, unsigned int b) {
    return sprintf(out, "[%+08d] [%#06x] [%-7u]", a, b, b);
}
extern "C" int fmt_width(char *out, int a, int w, int p) {
    return snprintf(out, 160, "[%*.*d][%llX]", w, p, a, 0xABCDEF0123456789ULL);
}
extern "C" int fmt_str(char *out, unsigned long cap, char const* text) {
    return snprintf(out, cap, "file:%-12.6s end:%%", text);
}
extern "C" int fmt_oct(char *out, unsigned int a) {
    return sprintf(out, "%#o,%#x,%.0d", a, a, 0);
}
