#include <stdarg.h>
int va_total(int count, ...) {
    va_list list; va_start(list, count);
    int result=0;
    for (int i=0;i<count;i++) result+=va_arg(list,int);
    va_end(list); return result;
}
int va_read_next(va_list cursor) { return va_arg(cursor,int); }
int va_copy_check(int count, ...) {
    va_list list; va_start(list, count);
    va_list copy; va_copy(copy,list);
    int original=va_read_next(list);
    int repeat=va_read_next(copy);
    va_end(copy); va_end(list);
    return original==repeat ? original : -888;
}
