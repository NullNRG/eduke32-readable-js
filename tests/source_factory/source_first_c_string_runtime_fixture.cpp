#include <string.h>
extern "C" unsigned long check_strlen(const char* s) { return strlen(s); }
extern "C" int check_strcmp(const char* a,const char* b) { return strcmp(a,b); }
extern "C" int check_strncmp(const char* a,const char* b,unsigned long n) { return strncmp(a,b,n); }
extern "C" void check_strcpy(char* out,const char* s) { strcpy(out,s); }
extern "C" void check_strncpy(char* out,const char* s,unsigned long n) { strncpy(out,s,n); }
