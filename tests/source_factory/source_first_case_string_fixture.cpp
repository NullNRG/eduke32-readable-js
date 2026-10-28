#include <strings.h>
extern "C" int compare_ascii(const char *a,const char *b) { return strcasecmp(a,b); }
extern "C" int compare_ascii_n(const char *a,const char *b,unsigned long n) { return strncasecmp(a,b,n); }
