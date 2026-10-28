#include <cstdarg>
extern "C" int va_cpp_total(int n, ...) {
    va_list cursor;
    va_start(cursor,n);
    int result=0;
    for(int i=0;i<n;i++) result+=va_arg(cursor,int);
    va_end(cursor);
    return result;
}
extern "C" int va_cpp_copy(int n, ...) {
    va_list first;va_start(first,n);
    va_list second;va_copy(second,first);
    int a=va_arg(first,int);
    int b=va_arg(second,int);
    va_end(second);va_end(first);
    return a==b?a:-12345;
}
